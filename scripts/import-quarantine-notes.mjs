import { copyFile, mkdir, readdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import {
	buildImportPolicy,
	createSlug,
	decideSource,
	getLocalImagePath,
	getVaultRoot,
	postsDir,
	safeJoin,
} from "./import-vault-drafts.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const siteRoot = path.resolve(__dirname, "..");
const manifestPath = path.join(siteRoot, "export-manifest.json");
const quarantineDir = path.join(postsDir, "quarantine");
const reportPath = path.join(siteRoot, "docs", "quarantine-import-report.md");

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

async function walkMarkdown(dir) {
	const entries = await readdir(dir, { withFileTypes: true });
	const files = [];
	for (const entry of entries) {
		const absolute = path.join(dir, entry.name);
		if (entry.isDirectory()) {
			files.push(...(await walkMarkdown(absolute)));
		} else if (entry.isFile() && entry.name.toLowerCase().endsWith(".md")) {
			files.push(absolute);
		}
	}
	return files;
}

function yamlScalar(value) {
	return JSON.stringify(String(value ?? ""));
}

function yamlArray(values = []) {
	return `[${values.map((value) => yamlScalar(value)).join(", ")}]`;
}

function stripLeadingFrontmatter(markdown) {
	if (!markdown.startsWith("---")) return markdown;
	const match = markdown.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/);
	return match ? markdown.slice(match[0].length) : markdown;
}

function isInsideMarkdownCode(markdown, index) {
	const before = markdown.slice(0, index);
	const fenceCount = (before.match(/^```/gm) || []).length;
	if (fenceCount % 2 === 1) return true;

	const lineStart = before.lastIndexOf("\n") + 1;
	const lineEnd = markdown.indexOf("\n", index);
	const beforeLine = markdown.slice(lineStart, index);
	const afterLine = markdown.slice(index, lineEnd === -1 ? markdown.length : lineEnd);
	const beforeTicks = (beforeLine.match(/`/g) || []).length;
	return beforeTicks % 2 === 1 && afterLine.includes("`");
}

function safeComment(value) {
	return String(value ?? "").replace(/--/g, "- -").replace(/\r?\n/g, " ");
}

function inferTitle(relativePath) {
	const basename = path.basename(relativePath, path.extname(relativePath)).trim();
	return basename || "未整理隔离笔记";
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
		.slice(0, 80);
}

function frontmatterFor({ relativePath, sourceStat, body, reason }) {
	const date = sourceStat.mtime.toISOString().slice(0, 10);
	return [
		"---",
		`title: ${yamlScalar(inferTitle(relativePath))}`,
		`published: ${date}`,
		`updated: ${date}`,
		`description: ${yamlScalar(excerpt(body) || `隔离导入草稿，原因：${reason}。`)}`,
		`tags: ${yamlArray(["隔离导入", "需复核"])}`,
		`category: ${yamlScalar("隔离草稿")}`,
		"draft: true",
		"---",
		"",
		`<!-- quarantine-source: ${safeComment(toPosix(relativePath))} -->`,
		`<!-- quarantine-reason: ${safeComment(reason)} -->`,
		"",
	].join("\n");
}

async function rewriteImages(markdown, sourceAbs, vaultRoot, postDir, imageWarnings = []) {
	const matches = [...markdown.matchAll(/!\[([^\]]*)]\(([^)\r\n]+)\)/g)];
	let rewritten = markdown;
	let offset = 0;
	let index = 0;

	function replaceMatch(match, replacement) {
		const start = match.index + offset;
		rewritten = rewritten.slice(0, start) + replacement + rewritten.slice(start + match[0].length);
		offset += replacement.length - match[0].length;
	}

	function skippedImageComment(rawTarget, reason) {
		return `<!-- skipped image: ${safeComment(rawTarget)} (${safeComment(reason)}) -->`;
	}

	for (const match of matches) {
		if (isInsideMarkdownCode(markdown, match.index)) continue;

		let sourceImageAbs = null;
		try {
			sourceImageAbs = getLocalImagePath(match[2], sourceAbs, vaultRoot);
		} catch (error) {
			imageWarnings.push(`${match[2]} (${error.message})`);
			replaceMatch(match, skippedImageComment(match[2], error.message));
			continue;
		}
		if (!sourceImageAbs) continue;

		if (!(await exists(sourceImageAbs))) {
			imageWarnings.push(`${match[2]} (missing local image)`);
			replaceMatch(match, skippedImageComment(match[2], "missing local image"));
			continue;
		}

		index += 1;
		const publicName = `${String(index).padStart(2, "0")}${path.extname(sourceImageAbs).toLowerCase()}`;
		const destinationAbs = safeJoin(postDir, publicName);
		await mkdir(postDir, { recursive: true });
		await copyFile(sourceImageAbs, destinationAbs);
		replaceMatch(match, `![${match[1]}](./${publicName})`);
	}

	return rewritten;
}

async function importOne({ sourceAbs, relativePath, slug, vaultRoot, reason, force }) {
	const sourceStat = await stat(sourceAbs);
	const postDir = safeJoin(quarantineDir, slug);
	const destination = safeJoin(postDir, "index.md");

	if (!force && (await exists(destination))) {
		return { status: "skipped", reason: "destination exists", slug, source: relativePath, excludeReason: reason };
	}

	if (force && (await exists(postDir))) {
		await rm(postDir, { recursive: true, force: true });
	}

	const raw = await readFile(sourceAbs, "utf8");
	const body = stripLeadingFrontmatter(raw).trimStart();
	const imageWarnings = [];
	const withImages = await rewriteImages(body, sourceAbs, vaultRoot, postDir, imageWarnings);
	const frontmatter = frontmatterFor({ relativePath, sourceStat, body, reason });
	await mkdir(postDir, { recursive: true });
	await writeFile(destination, `${frontmatter}${withImages.trim()}\n`, "utf8");
	return {
		status: "imported",
		reason: "imported as quarantine draft",
		slug,
		source: relativePath,
		excludeReason: reason,
		imageWarnings,
	};
}

function parseArgs(argv) {
	return {
		clean: argv.includes("--clean"),
		dryRun: argv.includes("--dry-run"),
		force: argv.includes("--force") || argv.includes("--clean"),
	};
}

function renderReport({ imported, skipped, ignored, failed }) {
	const now = new Date().toISOString();
	const imageWarnings = imported.flatMap((item) =>
		(item.imageWarnings || []).map((warning) => ({ source: item.source, slug: item.slug, warning })),
	);
	const lines = [
		"# Quarantine Import Report",
		"",
		`Generated: ${now}`,
		"",
		"## Summary",
		"",
		`- Imported quarantine drafts: ${imported.length}`,
		`- Skipped existing quarantine drafts: ${skipped.length}`,
		`- Ignored normal importable drafts: ${ignored.length}`,
		`- Failed quarantine drafts: ${failed.length}`,
		`- Image warnings: ${imageWarnings.length}`,
		"",
		"## Notes",
		"",
		"- These files were excluded by the normal public import policy.",
		"- They are imported under `src/content/posts/quarantine/` as `draft: true` for local review only.",
		"- The quarantine directory is gitignored by default.",
		"",
		"## Imported Quarantine Drafts",
		"",
		...(imported.length
			? imported.map((item) => `- \`quarantine/${item.slug}\` <- \`${toPosix(item.source)}\` (${item.excludeReason})`)
			: ["- None"]),
		"",
		"## Skipped Existing Quarantine Drafts",
		"",
		...(skipped.length
			? skipped.map((item) => `- \`quarantine/${item.slug}\` <- \`${toPosix(item.source)}\` (${item.reason})`)
			: ["- None"]),
		"",
		"## Failed Quarantine Drafts",
		"",
		...(failed.length ? failed.map((item) => `- \`${toPosix(item.source)}\` - ${item.reason}`) : ["- None"]),
		"",
		"## Image Warnings",
		"",
		...(imageWarnings.length
			? imageWarnings.map((item) => `- \`quarantine/${item.slug}\` <- \`${toPosix(item.source)}\` - ${item.warning}`)
			: ["- None"]),
		"",
	];
	return `${lines.join("\n")}\n`;
}

async function importQuarantine(options = {}) {
	const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
	const vaultRoot = getVaultRoot(manifest);
	const policy = buildImportPolicy(manifest);
	const usedSlugs = new Set();
	const args = { clean: false, dryRun: false, force: false, ...options };

	if (args.clean && !args.dryRun) {
		await rm(quarantineDir, { recursive: true, force: true });
		await mkdir(quarantineDir, { recursive: true });
	}

	const files = await walkMarkdown(vaultRoot);
	const imported = [];
	const skipped = [];
	const ignored = [];
	const failed = [];

	for (const sourceAbs of files.sort((a, b) => toPosix(a).localeCompare(toPosix(b)))) {
		const relativePath = toPosix(path.relative(vaultRoot, sourceAbs));
		let raw = "";
		try {
			raw = await readFile(sourceAbs, "utf8");
		} catch (error) {
			failed.push({ source: relativePath, reason: `read failed: ${error.message}` });
			continue;
		}

		const decision = decideSource(relativePath, raw, policy);
		if (decision.status === "import") {
			ignored.push({ source: relativePath, reason: decision.reason });
			continue;
		}

		const slug = createSlug(relativePath, usedSlugs);
		if (args.dryRun) {
			imported.push({ source: relativePath, slug, excludeReason: decision.reason, reason: "dry run" });
			continue;
		}

		try {
			const result = await importOne({
				sourceAbs,
				relativePath,
				slug,
				vaultRoot,
				reason: decision.reason,
				force: args.force,
			});
			if (result.status === "imported") imported.push(result);
			else skipped.push(result);
		} catch (error) {
			failed.push({ source: relativePath, reason: error.message });
		}
	}

	const report = renderReport({ imported, skipped, ignored, failed });
	if (!args.dryRun) {
		await mkdir(path.dirname(reportPath), { recursive: true });
		await writeFile(reportPath, report, "utf8");
	}

	return { imported, skipped, ignored, failed, report };
}

async function main(argv = process.argv.slice(2)) {
	const args = parseArgs(argv);
	const result = await importQuarantine(args);
	console.log(`Imported quarantine drafts: ${result.imported.length}`);
	console.log(`Skipped existing quarantine drafts: ${result.skipped.length}`);
	console.log(`Ignored normal importable drafts: ${result.ignored.length}`);
	console.log(`Failed quarantine drafts: ${result.failed.length}`);
	if (result.failed.length > 0) process.exitCode = 1;
}

export { importQuarantine };

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
	main().catch((error) => {
		console.error(error.message);
		process.exitCode = 1;
	});
}
