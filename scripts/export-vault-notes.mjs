import { copyFile, mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const siteRoot = path.resolve(__dirname, "..");
const manifestPath = path.join(siteRoot, "export-manifest.json");
const postsDir = path.join(siteRoot, "src", "content", "posts");

const defaultPrivatePaths = [".git"];
const allowedImageExtensions = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif"]);

function toPosix(filePath) {
  return filePath.replaceAll("\\", "/");
}

function normalizePolicyPath(value) {
  return toPosix(path.normalize(String(value).replaceAll("\\", "/"))).replace(/\/$/, "");
}

function assertInside(root, absolutePath, label) {
  const relative = path.relative(root, absolutePath);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(`${label} escapes expected root: ${absolutePath}`);
  }
}

function safeJoin(root, ...segments) {
  const absolute = path.join(root, ...segments);
  assertInside(root, absolute, "Generated path");
  return absolute;
}

function getVaultRoot(manifest) {
  return path.resolve(process.env.VAULT_ROOT || manifest.sourceVault);
}

function isPathUnder(relativePath, privatePath) {
  const normalized = normalizePolicyPath(relativePath);
  const forbidden = normalizePolicyPath(privatePath);
  return normalized === forbidden || normalized.startsWith(`${forbidden}/`);
}

function buildPolicy(manifest) {
  const sensitive = manifest.sensitive || {};
  const privateEntryPaths = (manifest.entries || [])
    .filter((entry) => entry.status === "private" && entry.source)
    .map((entry) => entry.source);
  const privatePaths = [...new Set([...(sensitive.privatePaths || []), ...privateEntryPaths, ...defaultPrivatePaths])].map(
    normalizePolicyPath
  );
  const blockedExtensions = new Set((sensitive.blockedExtensions || []).map((ext) => ext.toLowerCase()));

  for (const privatePath of privatePaths) {
    if (!privatePath || privatePath === "." || privatePath === "/") {
      throw new Error(`Invalid private path policy: ${privatePath}`);
    }
  }

  return { privatePaths, blockedExtensions };
}

function assertSafeSlug(slug) {
  if (typeof slug !== "string" || !/^[a-z0-9](?:[a-z0-9-]{0,96}[a-z0-9])?$/.test(slug)) {
    throw new Error(`Invalid slug "${slug}". Use lowercase letters, numbers, and hyphens only.`);
  }
}

function assertAllowedVaultPath(absolutePath, vaultRoot, policy, context) {
  assertInside(vaultRoot, absolutePath, context);
  const relative = toPosix(path.relative(vaultRoot, absolutePath));
  const extension = path.extname(relative).toLowerCase();
  const basename = path.basename(relative).toLowerCase();

  if (policy.blockedExtensions.has(extension) || basename === ".env" || basename.startsWith(".env.")) {
    throw new Error(`Blocked extension in ${context}: ${relative}`);
  }

  for (const privatePath of policy.privatePaths) {
    if (isPathUnder(relative, privatePath)) {
      throw new Error(`${context} points at private path: ${relative}`);
    }
  }
}

function getPublishSource(entry, manifest, policy) {
  assertSafeSlug(entry.slug);
  const vaultRoot = getVaultRoot(manifest);
  const sourceAbs = path.resolve(vaultRoot, entry.source);
  assertAllowedVaultPath(sourceAbs, vaultRoot, policy, "Manifest publish entry");

  if (path.extname(sourceAbs).toLowerCase() !== ".md") {
    throw new Error(`Only Markdown sources can be published: ${entry.source}`);
  }

  return sourceAbs;
}

function validateManifest(manifest, policy) {
  if (!manifest || !Array.isArray(manifest.entries)) {
    throw new Error("Manifest must define entries array.");
  }

  const slugs = new Set();
  for (const entry of manifest.entries) {
    if (!["publish", "review", "private"].includes(entry.status)) {
      throw new Error(`Invalid manifest status for ${entry.source}: ${entry.status}`);
    }

    if (entry.status !== "publish") {
      if (entry.source && !entry.reason) throw new Error(`Non-publish entry missing reason: ${entry.source}`);
      continue;
    }

    for (const key of ["source", "slug", "title", "category", "date"]) {
      if (!entry[key]) throw new Error(`Publish entry missing ${key}: ${entry.source}`);
    }

    if (slugs.has(entry.slug)) throw new Error(`Duplicate publish slug: ${entry.slug}`);
    slugs.add(entry.slug);
    getPublishSource(entry, manifest, policy);
  }
}

function yamlScalar(value) {
  return JSON.stringify(String(value ?? ""));
}

function yamlArray(values = []) {
  return `[${values.map((value) => yamlScalar(value)).join(", ")}]`;
}

function yamlDate(value, label) {
  const date = String(value ?? "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error(`Invalid ${label} date "${date}". Use YYYY-MM-DD.`);
  }
  return date;
}

function stripLeadingFrontmatter(markdown) {
  if (!markdown.startsWith("---")) return markdown;
  const match = markdown.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/);
  return match ? markdown.slice(match[0].length) : markdown;
}

function normalizeCodeFences(markdown) {
  return markdown.replace(/^(\s*(?:[-*+]\s*)?)```([A-Za-z][A-Za-z0-9_+#-]*)\s*$/gm, (_, prefix, language) => {
    const normalized = language.toLowerCase();
    if (normalized === "c++") return `${prefix}\`\`\`cpp`;
    if (normalized === "c#") return `${prefix}\`\`\`csharp`;
    return `${prefix}\`\`\`${normalized}`;
  });
}

function excerpt(markdown) {
  return markdown
    .replace(/!\[[^\]]*]\([^)]*\)/g, "")
    .replace(/```[\s\S]*?```/g, "")
    .replace(/[#>*_`~\-[\]()]/g, "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .join(" ")
    .slice(0, 120);
}

function splitImageTarget(target) {
  let value = target.trim();
  if (value.startsWith("<") && value.includes(">")) {
    value = value.slice(1, value.indexOf(">"));
  } else {
    const titleMatch = value.match(/^(.+?)(\s+["'][^"']+["'])$/);
    if (titleMatch) value = titleMatch[1].trim();
  }
  return value;
}

function decodePath(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function isRemoteAsset(value) {
  return /^(https?:|data:|mailto:|#)/i.test(value);
}

function getLocalImagePath(rawTarget, sourceAbs, manifest, policy) {
  const target = splitImageTarget(rawTarget);
  if (isRemoteAsset(target)) return null;

  const vaultRoot = getVaultRoot(manifest);
  const sourceImageAbs = path.resolve(path.dirname(sourceAbs), decodePath(target));
  assertAllowedVaultPath(sourceImageAbs, vaultRoot, policy, "Image reference");
  assertInside(path.dirname(sourceAbs), sourceImageAbs, "Image reference");

  const extension = path.extname(sourceImageAbs).toLowerCase();
  if (!allowedImageExtensions.has(extension)) {
    const relative = toPosix(path.relative(vaultRoot, sourceImageAbs));
    throw new Error(`Unsupported local image extension: ${relative}`);
  }

  return sourceImageAbs;
}

async function rewriteImages(markdown, sourceAbs, slug, manifest, policy) {
  const matches = [...markdown.matchAll(/!\[([^\]]*)]\(([^)\r\n]+)\)/g)];
  let rewritten = markdown;
  let offset = 0;
  let index = 0;

  for (const match of matches) {
    const sourceImageAbs = getLocalImagePath(match[2], sourceAbs, manifest, policy);
    if (!sourceImageAbs) continue;

    try {
      await stat(sourceImageAbs);
    } catch {
      throw new Error(`Missing local image "${match[2]}" referenced by ${sourceAbs}`);
    }

    index += 1;
    const publicName = `${String(index).padStart(2, "0")}${path.extname(sourceImageAbs).toLowerCase()}`;
    const destinationDir = safeJoin(postsDir, slug);
    const destinationAbs = safeJoin(destinationDir, publicName);
    await mkdir(destinationDir, { recursive: true });
    await copyFile(sourceImageAbs, destinationAbs);

    const replacement = `![${match[1]}](./${publicName})`;
    const start = match.index + offset;
    rewritten = rewritten.slice(0, start) + replacement + rewritten.slice(start + match[0].length);
    offset += replacement.length - match[0].length;
  }

  return rewritten;
}

async function main() {
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  const policy = buildPolicy(manifest);
  validateManifest(manifest, policy);

  await rm(postsDir, { recursive: true, force: true });
  await mkdir(postsDir, { recursive: true });

  const exported = [];

  for (const entry of manifest.entries.filter((item) => item.status === "publish")) {
    const sourceAbs = getPublishSource(entry, manifest, policy);
    const sourceStat = await stat(sourceAbs);
    if (!sourceStat.isFile()) throw new Error(`Publish source is not a file: ${entry.source}`);

    const raw = await readFile(sourceAbs, "utf8");
    const body = normalizeCodeFences(stripLeadingFrontmatter(raw)).trimStart();
    const withImages = await rewriteImages(body, sourceAbs, entry.slug, manifest, policy);
    const updated = entry.updated || sourceStat.mtime.toISOString().slice(0, 10);
    const postDir = safeJoin(postsDir, entry.slug);
    await mkdir(postDir, { recursive: true });

    const frontmatter = [
      "---",
      `title: ${yamlScalar(entry.title)}`,
      `published: ${yamlDate(entry.date, "published")}`,
      `updated: ${yamlDate(updated, "updated")}`,
      `description: ${yamlScalar(entry.description || excerpt(body))}`,
      `tags: ${yamlArray(entry.tags || [])}`,
      `category: ${yamlScalar(entry.category)}`,
      "draft: false",
      "---",
      ""
    ].join("\n");

    await writeFile(safeJoin(postDir, "index.md"), `${frontmatter}${withImages.trim()}\n`, "utf8");
    exported.push(entry.source);
  }

  console.log(`Exported ${exported.length} public notes to Fuwari:`);
  for (const source of exported) console.log(`- ${source}`);
}

export {
  buildPolicy,
  getLocalImagePath,
  getPublishSource,
  getVaultRoot,
  postsDir,
  safeJoin,
  validateManifest
};

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
