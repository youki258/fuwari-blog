import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const siteRoot = path.resolve(__dirname, "..");
const scanRoots = [path.join(siteRoot, "src", "content", "posts"), path.join(siteRoot, "dist")];

// Patterns that should block a release: real credentials / keys.
const fatalPatterns = [
  { name: "private key", pattern: /-----BEGIN [A-Z ]*PRIVATE KEY-----/ },
  { name: "aws access key", pattern: /\bAKIA[0-9A-Z]{16}\b/ },
  { name: "openai-like api key", pattern: /\bsk-[A-Za-z0-9_-]{20,}\b/ },
  { name: "literal password assignment", pattern: /(password|passwd|pwd|密码)\s*[:=]\s*["'][^"']{6,}["']/i }
];

// Patterns that warrant review but do not block: PII / sensitive terms.
const warningPatterns = [
  { name: "Chinese sensitive term", pattern: /密码|密钥|阿里云/g },
  { name: "token/secret term", pattern: /\b(token|secret|pem)\b/gi },
  { name: "email", pattern: /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g },
  { name: "phone-like number", pattern: /(?<!\d)1[3-9]\d{9}(?!\d)/g },
  { name: "IP address", pattern: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g }
];

function toPosix(filePath) {
  return filePath.replaceAll("\\", "/");
}

async function exists(filePath) {
  try {
    await stat(filePath);
    return true;
  } catch {
    return false;
  }
}

async function walk(dir) {
  if (!(await exists(dir))) return [];
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const absolute = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walk(absolute)));
    } else if (entry.isFile()) {
      files.push(absolute);
    }
  }
  return files;
}

async function checkContent(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (![".md", ".html", ".js", ".css", ".json", ".xml", ".txt"].includes(ext)) {
    return { failures: [], warnings: [] };
  }

  const text = await readFile(filePath, "utf8");
  const relative = toPosix(path.relative(siteRoot, filePath));
  const failures = [];
  const warnings = [];

  for (const item of fatalPatterns) {
    if (item.pattern.test(text)) failures.push(`${item.name}: ${relative}`);
  }
  for (const item of warningPatterns) {
    const matches = [...text.matchAll(item.pattern)];
    if (matches.length > 0) warnings.push(`${item.name}: ${relative} (${matches.length})`);
  }
  return { failures, warnings };
}

async function main() {
  const files = [];
  for (const root of scanRoots) files.push(...(await walk(root)));

  const failures = [];
  const warnings = [];

  for (const file of files) {
    const content = await checkContent(file);
    failures.push(...content.failures);
    warnings.push(...content.warnings);
  }

  if (warnings.length > 0) {
    console.warn("Review warnings:");
    for (const warning of warnings) console.warn(`- ${warning}`);
  }

  if (failures.length > 0) {
    console.error("Privacy scan failed:");
    for (const failure of failures) console.error(`- ${failure}`);
    process.exitCode = 1;
    return;
  }

  console.log(`Privacy scan passed for ${files.length} files.`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
