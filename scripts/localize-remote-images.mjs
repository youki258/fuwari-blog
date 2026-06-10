import { mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const siteRoot = path.resolve(__dirname, "..");
const postsDir = path.join(siteRoot, "src", "content", "posts");
const reportPath = path.join(siteRoot, "docs", "remote-image-localization-report.md");

const markdownImagePattern = /!\[([^\]]*)]\((<?https?:\/\/[^)\s>]+>?)(\s+(?:"[^"]*"|'[^']*'))?\)/g;
const requestTimeoutMs = 30_000;
const maxAttempts = 3;
const allowedUrlExtensions = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif", ".avif", ".bmp", ".svg"]);
const mimeExtensions = new Map([
	["image/png", ".png"],
	["image/jpeg", ".jpg"],
	["image/jpg", ".jpg"],
	["image/webp", ".webp"],
	["image/gif", ".gif"],
	["image/avif", ".avif"],
	["image/bmp", ".bmp"],
	["image/svg+xml", ".svg"],
]);

function toPosix(filePath) {
	return filePath.replaceAll("\\", "/");
}

function relativeToSite(filePath) {
	return toPosix(path.relative(siteRoot, filePath));
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

function stripAngleBrackets(value) {
	const trimmed = value.trim();
	if (trimmed.startsWith("<") && trimmed.endsWith(">")) return trimmed.slice(1, -1);
	return trimmed;
}

function extensionFromUrl(url) {
	try {
		const ext = path.extname(new URL(url).pathname).toLowerCase();
		return allowedUrlExtensions.has(ext) ? ext : null;
	} catch {
		return null;
	}
}

function normalizedContentType(value) {
	return String(value || "")
		.split(";")[0]
		.trim()
		.toLowerCase();
}

function extensionFromContentType(contentType) {
	return mimeExtensions.get(normalizedContentType(contentType)) || null;
}

function extensionFromSignature(buffer) {
	if (buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from("89504e470d0a1a0a", "hex"))) return ".png";
	if (buffer.length >= 3 && buffer.subarray(0, 3).equals(Buffer.from("ffd8ff", "hex"))) return ".jpg";
	if (buffer.length >= 6) {
		const header = buffer.subarray(0, 6).toString("ascii");
		if (header === "GIF87a" || header === "GIF89a") return ".gif";
	}
	if (
		buffer.length >= 12 &&
		buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
		buffer.subarray(8, 12).toString("ascii") === "WEBP"
	) {
		return ".webp";
	}
	if (buffer.length >= 12 && buffer.subarray(4, 8).toString("ascii") === "ftyp") {
		const brand = buffer.subarray(8, 12).toString("ascii");
		if (brand === "avif" || brand === "avis") return ".avif";
	}
	if (buffer.length >= 2 && buffer.subarray(0, 2).toString("ascii") === "BM") return ".bmp";

	const prefix = buffer.subarray(0, 512).toString("utf8").trimStart().toLowerCase();
	if (prefix.startsWith("<svg") || prefix.startsWith("<?xml")) return ".svg";
	return null;
}

function looksLikeHtml(buffer) {
	const prefix = buffer.subarray(0, 512).toString("utf8").trimStart().toLowerCase();
	return prefix.startsWith("<!doctype html") || prefix.startsWith("<html") || prefix.includes("<title>");
}

function inferExtension(url, contentType, buffer) {
	return extensionFromUrl(url) || extensionFromContentType(contentType) || extensionFromSignature(buffer) || ".bin";
}

function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchImage(url) {
	let lastError = null;

	for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
		const controller = new AbortController();
		const timeout = setTimeout(() => controller.abort(), requestTimeoutMs);

		try {
			const response = await fetch(url, {
				redirect: "follow",
				signal: controller.signal,
				headers: {
					accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
					"user-agent":
						"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125 Safari/537.36",
				},
			});

			if (!response.ok) {
				throw new Error(`HTTP ${response.status}`);
			}

			const contentType = normalizedContentType(response.headers.get("content-type"));
			const buffer = Buffer.from(await response.arrayBuffer());
			const signatureExtension = extensionFromSignature(buffer);

			if (buffer.length === 0) throw new Error("empty response body");
			if (looksLikeHtml(buffer)) throw new Error(`received HTML instead of image (${contentType || "no content-type"})`);
			if (!contentType.startsWith("image/") && !signatureExtension) {
				throw new Error(`unsupported content-type: ${contentType || "missing"}`);
			}
			if (contentType.startsWith("image/") && !signatureExtension && contentType !== "image/svg+xml") {
				throw new Error(`image content failed signature check: ${contentType}`);
			}

			return { buffer, contentType, extension: inferExtension(url, contentType, buffer) };
		} catch (error) {
			lastError = error;
			if (attempt < maxAttempts) await sleep(500 * attempt);
		} finally {
			clearTimeout(timeout);
		}
	}

	throw lastError;
}

function isFenceLine(line) {
	return line.match(/^(\s*)(`{3,}|~{3,})/);
}

function isInsideInlineCode(line, index) {
	const before = line.slice(0, index);
	const after = line.slice(index);
	const tickCount = (before.match(/`/g) || []).length;
	return tickCount % 2 === 1 && after.includes("`");
}

function imageFileName(index, extension) {
	return `remote-${String(index).padStart(2, "0")}${extension}`;
}

async function localizeUrl({ url, postDir, postState, dryRun }) {
	if (postState.urls.has(url)) return { ...postState.urls.get(url), reusedInMarkdown: true };

	const index = postState.urls.size + 1;
	const downloaded = await fetchImage(url);
	const fileName = imageFileName(index, downloaded.extension);
	const destination = path.join(postDir, fileName);

	if (!dryRun) {
		await mkdir(postDir, { recursive: true });
		await writeFile(destination, downloaded.buffer);
	}

	const item = {
		fileName,
		url,
		bytes: downloaded.buffer.length,
		contentType: downloaded.contentType || "unknown",
		reusedInMarkdown: false,
	};
	postState.urls.set(url, item);
	return item;
}

async function rewriteLine(line, context) {
	let output = "";
	let lastIndex = 0;
	let changed = false;

	for (const match of line.matchAll(markdownImagePattern)) {
		if (isInsideInlineCode(line, match.index)) continue;

		const rawUrl = match[2];
		const url = stripAngleBrackets(rawUrl);
		const title = match[3] || "";
		output += line.slice(lastIndex, match.index);

		try {
			const localized = await localizeUrl({
				url,
				postDir: context.postDir,
				postState: context.postState,
				dryRun: context.dryRun,
			});
			output += `![${match[1]}](./${localized.fileName}${title})`;
			context.downloaded.push({ ...localized, source: context.relativeFile });
			changed = true;
		} catch (error) {
			output += match[0];
			context.failed.push({ source: context.relativeFile, url, reason: error.message });
		}

		lastIndex = match.index + match[0].length;
	}

	if (!changed && lastIndex === 0) return line;
	return output + line.slice(lastIndex);
}

async function rewriteMarkdownImages(markdown, context) {
	const lines = markdown.split(/(?<=\n)/);
	const rewritten = [];
	let inFence = false;
	let fenceChar = null;
	let fenceLength = 0;

	for (const line of lines) {
		const fence = isFenceLine(line);
		if (fence) {
			const marker = fence[2];
			const markerChar = marker[0];
			if (!inFence) {
				inFence = true;
				fenceChar = markerChar;
				fenceLength = marker.length;
			} else if (markerChar === fenceChar && marker.length >= fenceLength) {
				inFence = false;
				fenceChar = null;
				fenceLength = 0;
			}
			rewritten.push(line);
			continue;
		}

		if (inFence) {
			rewritten.push(line);
			continue;
		}

		rewritten.push(await rewriteLine(line, context));
	}

	return rewritten.join("");
}

function renderReport(result) {
	const lines = [
		"# Remote Image Localization Report",
		"",
		`Generated: ${new Date().toISOString()}`,
		"",
		"## Summary",
		"",
		`- Posts scanned: ${result.postsScanned}`,
		`- Posts changed: ${result.postsChanged.length}`,
		`- Image references localized: ${result.downloaded.length}`,
		`- Unique images downloaded: ${result.uniqueDownloads}`,
		`- Failed image references: ${result.failed.length}`,
		"",
		"## Changed Posts",
		"",
		...(result.postsChanged.length ? result.postsChanged.map((item) => `- \`${item}\``) : ["- None"]),
		"",
		"## Localized Images",
		"",
		...(result.downloaded.length
			? result.downloaded.map((item) => {
					const note = item.reusedInMarkdown ? " reused" : "";
					return `- \`${item.source}\` -> \`${item.fileName}\` (${item.bytes} bytes, ${item.contentType}${note}) <- ${item.url}`;
				})
			: ["- None"]),
		"",
		"## Failed Images",
		"",
		...(result.failed.length
			? result.failed.map((item) => `- \`${item.source}\` - ${item.reason}: ${item.url}`)
			: ["- None"]),
		"",
	];

	return `${lines.join("\n")}\n`;
}

async function localizeRemoteImages({ dryRun = false } = {}) {
	const files = await walkPostIndexes(postsDir);
	const result = {
		postsScanned: files.length,
		postsChanged: [],
		downloaded: [],
		failed: [],
		uniqueDownloads: 0,
	};

	for (const file of files.sort((a, b) => toPosix(a).localeCompare(toPosix(b)))) {
		const markdown = await readFile(file, "utf8");
		if (!markdownImagePattern.test(markdown)) {
			markdownImagePattern.lastIndex = 0;
			continue;
		}
		markdownImagePattern.lastIndex = 0;

		const postState = { urls: new Map() };
		const postDownloaded = [];
		const postFailed = [];
		const context = {
			postDir: path.dirname(file),
			relativeFile: relativeToSite(file),
			postState,
			downloaded: postDownloaded,
			failed: postFailed,
			dryRun,
		};
		const rewritten = await rewriteMarkdownImages(markdown, context);

		result.downloaded.push(...postDownloaded);
		result.failed.push(...postFailed);
		result.uniqueDownloads += postState.urls.size;

		if (rewritten !== markdown) {
			result.postsChanged.push(relativeToSite(file));
			if (!dryRun) await writeFile(file, rewritten, "utf8");
		}
	}

	const report = renderReport(result);
	if (!dryRun) {
		const hasReportableChange = result.postsChanged.length > 0 || result.failed.length > 0 || !(await exists(reportPath));
		if (hasReportableChange) {
			await mkdir(path.dirname(reportPath), { recursive: true });
			await writeFile(reportPath, report, "utf8");
		}
	}

	return { ...result, report };
}

async function main(argv = process.argv.slice(2)) {
	const dryRun = argv.includes("--dry-run");
	const result = await localizeRemoteImages({ dryRun });

	console.log(`Posts scanned: ${result.postsScanned}`);
	console.log(`Posts changed: ${result.postsChanged.length}`);
	console.log(`Image references localized: ${result.downloaded.length}`);
	console.log(`Unique images downloaded: ${result.uniqueDownloads}`);
	console.log(`Failed image references: ${result.failed.length}`);
	if (result.failed.length > 0) process.exitCode = 1;
}

export { localizeRemoteImages, postsDir, reportPath };

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
	main().catch((error) => {
		console.error(error.message);
		process.exitCode = 1;
	});
}
