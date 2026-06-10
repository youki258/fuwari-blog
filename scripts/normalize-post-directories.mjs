import { mkdir, readdir, readFile, rename, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createSlug, postsDir, safeJoin } from "./import-vault-drafts.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const siteRoot = path.resolve(__dirname, "..");
const reportPath = path.join(siteRoot, "docs", "post-directory-map.md");
const docsToRewrite = [
	path.join(siteRoot, "docs", "llm-review-batches.md"),
	path.join(siteRoot, "docs", "remote-image-localization-report.md"),
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

async function walkPostIndexes(dir) {
	if (!(await exists(dir))) return [];

	const entries = await readdir(dir, { withFileTypes: true });
	const files = [];
	for (const entry of entries) {
		const absolute = path.join(dir, entry.name);
		if (entry.isDirectory()) {
			files.push(...(await walkPostIndexes(absolute)));
		} else if (entry.isFile() && entry.name.toLowerCase() === "index.md") {
			files.push(absolute);
		}
	}
	return files;
}

function sourcePathFromPost(markdown) {
	return markdown.match(/<!--\s*source:\s*([^>]+?)\s*-->/)?.[1]?.trim() || "";
}

function titleFromPost(markdown) {
	return markdown.match(/^title:\s*"([^"]+)"/m)?.[1]?.trim() || "";
}

function markdownEscape(value) {
	return String(value).replaceAll("|", "\\|");
}

function replaceAllLiteral(text, search, replacement) {
	return text.split(search).join(replacement);
}

async function pruneEmptyDirectories(dir) {
	if (!(await exists(dir))) return false;

	let entries = await readdir(dir, { withFileTypes: true });
	for (const entry of entries) {
		if (entry.isDirectory()) {
			await pruneEmptyDirectories(path.join(dir, entry.name));
		}
	}

	entries = await readdir(dir, { withFileTypes: true });
	if (dir !== postsDir && entries.length === 0) {
		await rm(dir, { recursive: false });
		return true;
	}
	return false;
}

function renderMap(rows, moves) {
	const lines = [
		"# Post Directory Map",
		"",
		`Generated: ${new Date().toISOString()}`,
		"",
		"## Summary",
		"",
		`- Posts: ${rows.length}`,
		`- Directory moves: ${moves.length}`,
		"",
		"## Map",
		"",
		"| Preview URL | Local file | Source note | Title |",
		"| --- | --- | --- | --- |",
		...rows.map(
			(row) =>
				`| \`/posts/${row.targetSlug}/\` | \`src/content/posts/${row.targetSlug}/index.md\` | \`${markdownEscape(row.source)}\` | ${markdownEscape(row.title)} |`,
		),
		"",
	];
	return `${lines.join("\n")}\n`;
}

async function rewriteDocs(rows) {
	for (const docPath of docsToRewrite) {
		if (!(await exists(docPath))) continue;

		let text = await readFile(docPath, "utf8");
		let changed = false;
		for (const row of rows) {
			if (row.currentSlug === row.targetSlug) continue;
			const oldFile = `src/content/posts/${row.currentSlug}/index.md`;
			const newFile = `src/content/posts/${row.targetSlug}/index.md`;
			const oldDir = `src/content/posts/${row.currentSlug}/`;
			const newDir = `src/content/posts/${row.targetSlug}/`;
			const next = replaceAllLiteral(replaceAllLiteral(text, oldFile, newFile), oldDir, newDir);
			if (next !== text) {
				text = next;
				changed = true;
			}
		}
		if (changed) await writeFile(docPath, text, "utf8");
	}
}

async function normalizePostDirectories({ dryRun = false } = {}) {
	const files = await walkPostIndexes(postsDir);
	const rows = [];

	for (const file of files) {
		const markdown = await readFile(file, "utf8");
		const source = sourcePathFromPost(markdown);
		if (!source) continue;

		rows.push({
			currentDir: path.dirname(file),
			currentSlug: toPosix(path.relative(postsDir, path.dirname(file))),
			source,
			title: titleFromPost(markdown),
		});
	}

	const usedSlugs = new Set();
	rows.sort((a, b) => a.source.localeCompare(b.source));
	for (const row of rows) {
		row.targetSlug = createSlug(row.source, usedSlugs);
		row.targetDir = safeJoin(postsDir, row.targetSlug);
	}

	const moves = rows.filter((row) => row.currentSlug !== row.targetSlug);
	for (const row of moves) {
		if ((await exists(row.targetDir)) && path.resolve(row.targetDir) !== path.resolve(row.currentDir)) {
			throw new Error(`target already exists: ${toPosix(path.relative(siteRoot, row.targetDir))}`);
		}
	}

	if (!dryRun) {
		for (const row of moves) {
			await mkdir(path.dirname(row.targetDir), { recursive: true });
			await rename(row.currentDir, row.targetDir);
		}
		await pruneEmptyDirectories(postsDir);
		await rewriteDocs(rows);
		await mkdir(path.dirname(reportPath), { recursive: true });
		await writeFile(reportPath, renderMap(rows, moves), "utf8");
	}

	return { rows, moves };
}

async function main(argv = process.argv.slice(2)) {
	const dryRun = argv.includes("--dry-run");
	const result = await normalizePostDirectories({ dryRun });
	console.log(`Posts indexed: ${result.rows.length}`);
	console.log(`Directory moves: ${result.moves.length}`);
	for (const move of result.moves.slice(0, 20)) {
		console.log(`${move.currentSlug} -> ${move.targetSlug}`);
	}
	if (result.moves.length > 20) console.log(`... ${result.moves.length - 20} more`);
}

export { normalizePostDirectories };

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
	main().catch((error) => {
		console.error(error.message);
		process.exitCode = 1;
	});
}
