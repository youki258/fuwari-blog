import { copyFile, mkdir, readdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import crypto from "node:crypto";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const siteRoot = path.resolve(__dirname, "..");
const manifestPath = path.join(siteRoot, "export-manifest.json");
const postsDir = path.join(siteRoot, "src", "content", "posts");
const reportPath = path.join(siteRoot, "docs", "vault-import-report.md");

const allowedImageExtensions = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif"]);
const defaultExcludedRoots = [".git", ".obsidian", ".trash", ".vscode", "public-notes", "密码", "密钥", "学校邮箱"];
const defaultPersonalSegments = ["日记", "模板", "模版", "网络工程专业职业规划报告"];
const defaultPersonalNamePatterns = ["日报", "周报", "计划", "汇报", "职业规划"];
const defaultBlockedExtensions = [".pem", ".key", ".p12", ".pfx", ".env", ".zip", ".7z", ".rar", ".docx", ".pptx", ".pdf"];

const credentialPatterns = [
	{ name: "private key block", pattern: /-----BEGIN [A-Z ]*PRIVATE KEY-----/ },
	{ name: "aws access key", pattern: /\bAKIA[0-9A-Z]{16}\b/ },
	{ name: "openai-like api key", pattern: /\bsk-[A-Za-z0-9_-]{20,}\b/ },
	{
		name: "quoted secret assignment",
		pattern: /\b(?:api[_-]?key|access[_-]?key|secret|token|password|passwd|pwd)\b\s*[:=]\s*["'`][^"'`\r\n]{6,}["'`]/i,
	},
	{
		name: "quoted chinese secret assignment",
		pattern: /(?:密码|密钥|令牌)\s*[:=：]\s*["'`][^"'`\r\n]{6,}["'`]/,
	},
	{ name: "email address", pattern: /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/ },
];

const topCategoryMap = new Map([
	["blog", "课程笔记"],
	["博客备选笔记", "技术随笔"],
	["数据结构课设", "项目笔记"],
	["数据结构", "数据结构"],
	["操作系统", "操作系统"],
	["码蹄杯", "算法练习"],
	["25暑假", "学习记录"],
	["26寒假学习", "学习记录"],
	["CTF", "CTF"],
	["ICT", "网络技术"],
	["深度学习", "深度学习"],
	["git使用", "Git"],
	["新建文件夹", "项目笔记"],
]);

const segmentSlugMap = new Map([
	["blog", "blog"],
	["笔记", "notes"],
	["blog记录", "blog-records"],
	["网页计划", "website-plan"],
	["项目结构", "project-structure"],
	["博客备选笔记", "blog-notes"],
	["校园网", "campus-network"],
	["cli", "cli"],
	["数据结构课设", "data-structure-project"],
	["保存", "saved"],
	["报告", "report"],
	["md", "md"],
	["存档", "archive"],
	["数据结构", "data-structure"],
	["操作系统", "operating-system"],
	["码蹄杯", "matiji"],
	["25暑假", "summer-2025"],
	["26寒假学习", "winter-2026"],
	["日记系统开发", "diary-system"],
	["CTF", "ctf"],
	["pwn", "pwn"],
	["ICT", "ict"],
	["网络管理员", "network-admin"],
	["深度学习", "deep-learning"],
	["git使用", "git"],
	["新建文件夹", "misc"],
	["鸢尾花", "iris"],
	["1.html 笔记", "01-html"],
	["2.js基础", "02-js-basics"],
	["3.js监听", "03-js-events"],
	["4.vue", "04-vue"],
	["5.maven", "05-maven"],
	["6.单元测试", "06-unit-testing"],
	["7.SpringBoot", "07-spring-boot"],
	["8.MySQL", "08-mysql"],
	["9.JDBC&Mybatis", "09-jdbc-mybatis"],
	["10.Restful&Apifox&增删改查", "10-restful-apifox-crud"],
	["11.日志", "11-logging"],
	["12.多表关系", "12-table-relations"],
	["13.事务管理", "13-transaction-management"],
	["14.文件上传&异常处理", "14-file-upload-exception-handling"],
	["15.登录认证", "15-login-auth"],
	["16.vue工程化&ELementPlus", "16-vue-engineering-element-plus"],
	["17.", "17"],
	["密码", "password"],
	["日记", "diary"],
	["学校邮箱", "school-email"],
	["学生邮箱申请", "student-email-application"],
	["模版", "templates"],
	["模板", "templates"],
	["拉曼光谱", "raman-spectroscopy"],
	["网络工程专业职业规划报告", "network-engineering-career-plan"],
	["日报", "daily-report"],
	["周报", "weekly-report"],
	["汇报", "work-report"],
	["128计划", "128-plan"],
	["2.7计划", "02-07-plan"],
	["后端", "backend"],
	["记录", "records"],
	["问题", "issues"],
	["个人博客后端MyBatis数据库设计与开发文档", "backend-mybatis-design"],
	["个人博客后端开发详细文档", "backend-development"],
	["个人博客前端开发文档", "frontend-development"],
	["个人博客前端页面设计与组件开发详细文档", "frontend-ui-components"],
	["个人博客项目前后端连接指南", "frontend-backend-integration"],
	["个人博客详细开发规划_新版", "development-plan-new"],
	["个人博客详细开发规划", "development-plan"],
	["网络244 2024083418 舒钟渭    网页计划书终", "web-plan-final"],
	["网页计划书", "web-plan"],
	["网页计划书2.0", "web-plan-2-0"],
	["网页计划书2.1", "web-plan-2-1"],
	["网页计划书3.0", "web-plan-3-0"],
	["初识k8s", "intro-to-k8s"],
	["代理相关", "proxy-notes"],
	["卡通风格的前端", "cartoon-frontend"],
	["让虚拟机直接使用主机的clash", "vm-use-host-clash"],
	["记一次linux root密码忘记改密码的过程", "linux-root-password-recovery"],
	["为什么校园网会频繁切换 IP，且我完全没有感知？", "campus-network-ip-switching"],
	["11.27", "11-27"],
	["虚拟机网络配置", "vm-network-config"],
	["axios小技巧", "axios-tips"],
	["cli工具实践指南", "cli-practice-guide"],
	["Cloudflare 如何实现一个 IP 承载数千网站？边缘应用", "cloudflare-ip-edge-apps"],
	["ECC深度使用实战手册", "ecc-practice-manual"],
	["GFW识别 CDN相关", "gfw-cdn-notes"],
	["LLM使用（关闭思考）", "llm-disable-thinking"],
	["MCP配置快速参考", "mcp-config-quick-reference"],
	["uu有品账单导出", "uuyp-bill-export"],
	["VMware虚拟机Linux固定IP配置（解决网卡未托管_无网问题）", "vmware-linux-static-ip"],
	["VSCode + SSH + Docker 完整配置流程", "vscode-ssh-docker"],
	["word排版", "word-layout"],
	["初识CTF", "intro"],
	["各种配置", "configs"],
	["工具", "tools"],
	["中国CTF现状", "china-ctf-status"],
	["ctf的ai使用", "ai-for-ctf"],
	["区域赛1", "regional-contest-01"],
	["10.13", "10-13"],
	["11.16", "11-16"],
	["总报告", "final-report"],
	["题目", "topic"],
	["发现的问题分析", "issue-analysis"],
	["关键信息", "key-info"],
	["第4-5章_详细设计与编码调试分析_扩充版", "chapters-04-05-design-debug-expanded"],
	["笔记1", "notes-01"],
	["提示词", "prompts"],
	["练习", "practice"],
	["详细设计与编码调试分析_中文版", "design-debug-cn"],
	["详细设计与编码调试分析_中文版_示例格式版", "design-debug-cn-example"],
	["详细设计与编码调试分析_中文版_示例格式版_重写_20251226", "20251226-design-debug-cn-example-rewrite"],
	["详细设计与编码调试分析_差异与修订建议_20251226", "20251226-design-debug-diff-suggestions"],
	["总报告_对齐现状版_20251226", "20251226-final-report-aligned"],
	["全过程流程图_20251229", "20251229-full-flowchart"],
	["项目结构与运行时序调用链_20251229", "20251229-runtime-call-chain"],
	["操作整理_新增步进与界面美化", "operation-notes-step-ui"],
	["最终报告", "final-report"],
	["课程设计报告_排序算法性能比较与动画演示系统", "sorting-animation-course-design-report"],
	["project_summary", "project-summary"],
	["记录1", "record-01"],
	["算法", "algorithms"],
	["算法（ai优化", "algorithms-ai-optimized"],
	["注意", "notes"],
	["链表", "linked-list"],
	["链表2", "linked-list-02"],
	["链表3", "linked-list-03"],
	["知识点", "knowledge-points"],
	["计算机网络", "computer-network"],
	["1选择器", "01-selector"],
	["2knn", "02-knn"],
	["3", "03"],
	["一、核心需求拆解（你要的能力）", "core-requirements"],
	["我的核心需求和参考的网站", "requirements-and-references"],
	["VMware workstation下载", "vmware-workstation-download"],
	["数通", "datacom"],
	["1", "01"],
	["2", "02"],
	["4", "04"],
	["5", "05"],
]);

function toPosix(filePath) {
	return filePath.replaceAll("\\", "/");
}

function normalizePolicyPath(value) {
	return toPosix(path.normalize(String(value).replaceAll("\\", "/"))).replace(/\/$/, "");
}

function pathSegments(relativePath) {
	return normalizePolicyPath(relativePath).split("/").filter(Boolean);
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

function buildImportPolicy(manifest) {
	const sensitive = manifest.sensitive || {};
	const importConfig = manifest.import || {};
	const privateEntryPaths = (manifest.entries || [])
		.filter((entry) => entry.status === "private" && entry.source)
		.map((entry) => entry.source);

	const excludedRoots = [...new Set([...(importConfig.excludeRoots || []), ...defaultExcludedRoots])].map(
		normalizePolicyPath,
	);
	const privatePaths = [...new Set([...(sensitive.privatePaths || []), ...privateEntryPaths])].map(normalizePolicyPath);
	const personalSegments = [...new Set([...(importConfig.personalSegments || []), ...defaultPersonalSegments])];
	const personalNamePatterns = [...new Set([...(importConfig.personalNamePatterns || []), ...defaultPersonalNamePatterns])];
	const blockedExtensions = new Set([...(sensitive.blockedExtensions || []), ...defaultBlockedExtensions].map((ext) => ext.toLowerCase()));

	return { excludedRoots, privatePaths, personalSegments, personalNamePatterns, blockedExtensions };
}

function findCredentialHit(text) {
	for (const item of credentialPatterns) {
		if (item.pattern.test(text)) return item.name;
	}
	return null;
}

function decideSource(relativePath, text, policy) {
	const normalized = normalizePolicyPath(relativePath);
	const segments = pathSegments(normalized);
	const extension = path.extname(normalized).toLowerCase();
	const basename = path.basename(normalized);
	const lowerBasename = basename.toLowerCase();

	if (extension !== ".md") return { status: "excluded", reason: "not a Markdown file" };
	if (policy.blockedExtensions.has(extension) || lowerBasename === ".env" || lowerBasename.startsWith(".env.")) {
		return { status: "excluded", reason: "blocked extension" };
	}
	for (const root of policy.excludedRoots) {
		if (segments[0] === root || isPathUnder(normalized, root)) {
			return { status: "excluded", reason: `excluded root: ${root}` };
		}
	}
	for (const privatePath of policy.privatePaths) {
		if (isPathUnder(normalized, privatePath)) {
			return { status: "excluded", reason: `private path: ${privatePath}` };
		}
	}
	for (const segment of segments) {
		if (policy.personalSegments.includes(segment)) {
			return { status: "excluded", reason: `personal segment: ${segment}` };
		}
	}
	for (const item of policy.personalNamePatterns) {
		if (basename.includes(item)) {
			return { status: "excluded", reason: `personal note name: ${item}` };
		}
	}

	const credentialHit = findCredentialHit(text);
	if (credentialHit) return { status: "excluded", reason: `credential or personal info: ${credentialHit}` };

	return { status: "import", reason: "passed import policy" };
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

function shortHash(value) {
	return crypto.createHash("sha1").update(value).digest("hex").slice(0, 8);
}

function asciiSlug(value) {
	return String(value)
		.normalize("NFKD")
		.replace(/[\u0300-\u036f]/g, "")
		.toLowerCase()
		.replace(/&/g, " and ")
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "")
		.replace(/-{2,}/g, "-");
}

function stripGeneratedHash(value) {
	return String(value).replace(/-[0-9a-f]{8,}$/i, "");
}

function slugSegment(segment, relativePath) {
	const cleaned = stripGeneratedHash(segment.trim());
	const mapped = segmentSlugMap.get(cleaned);
	if (mapped) return mapped;

	const slug = asciiSlug(cleaned);
	if (slug) return slug.slice(0, 60).replace(/-+$/g, "");
	return `note-${shortHash(`${relativePath}:${cleaned}`).slice(0, 6)}`;
}

function isValidNestedSlug(slug) {
	return /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\/[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)*$/.test(slug);
}

function createSlug(relativePath, usedSlugs = new Set()) {
	const normalized = normalizePolicyPath(relativePath);
	const extension = path.extname(normalized);
	const withoutExtension = extension ? normalized.slice(0, -extension.length) : normalized;
	const segments = pathSegments(withoutExtension).map((segment) => slugSegment(segment, normalized));
	let slug = segments.join("/");
	if (!slug || !isValidNestedSlug(slug)) slug = `note/${shortHash(normalized)}`;

	const base = slug;
	let counter = 2;
	while (usedSlugs.has(slug)) {
		slug = `${base}-${counter}`;
		counter += 1;
	}
	usedSlugs.add(slug);
	return slug;
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

function assertAllowedVaultAsset(absolutePath, vaultRoot, sourceAbs) {
	assertInside(vaultRoot, absolutePath, "Image reference");
	assertInside(path.dirname(sourceAbs), absolutePath, "Image reference");
	const extension = path.extname(absolutePath).toLowerCase();
	if (!allowedImageExtensions.has(extension)) {
		throw new Error(`unsupported image extension: ${toPosix(path.relative(vaultRoot, absolutePath))}`);
	}
}

function getLocalImagePath(rawTarget, sourceAbs, vaultRoot) {
	const target = splitImageTarget(rawTarget);
	if (isRemoteAsset(target)) return null;

	const sourceImageAbs = path.resolve(path.dirname(sourceAbs), decodePath(target));
	assertAllowedVaultAsset(sourceImageAbs, vaultRoot, sourceAbs);
	return sourceImageAbs;
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

async function rewriteImages(markdown, sourceAbs, slug, vaultRoot, postDir, imageWarnings = []) {
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
		const target = rawTarget.replace(/--/g, "- -");
		const detail = reason.replace(/--/g, "- -");
		return `<!-- skipped image: ${target} (${detail}) -->`;
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

function inferTitle(relativePath) {
	const basename = path.basename(relativePath, path.extname(relativePath)).trim();
	return basename || "未整理笔记";
}

function inferCategory(relativePath) {
	const top = pathSegments(relativePath)[0] || "";
	return topCategoryMap.get(top) || "待整理";
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

function frontmatterFor({ relativePath, sourceStat, body }) {
	const date = sourceStat.mtime.toISOString().slice(0, 10);
	const title = inferTitle(relativePath);
	return [
		"---",
		`title: ${yamlScalar(title)}`,
		`published: ${date}`,
		`updated: ${date}`,
		`description: ${yamlScalar(excerpt(body) || "待整理草稿。")}`,
		`tags: ${yamlArray(["待整理"])}`,
		`category: ${yamlScalar(inferCategory(relativePath))}`,
		"draft: true",
		"---",
		"",
		`<!-- source: ${toPosix(relativePath)} -->`,
		"",
	].join("\n");
}

async function importOne({ sourceAbs, relativePath, slug, vaultRoot, force }) {
	const sourceStat = await stat(sourceAbs);
	const postDir = safeJoin(postsDir, slug);
	const destination = safeJoin(postDir, "index.md");

	if (!force && (await exists(destination))) {
		return { status: "skipped", reason: "destination exists", slug, source: relativePath };
	}

	if (force && (await exists(postDir))) {
		await rm(postDir, { recursive: true, force: true });
	}

	const raw = await readFile(sourceAbs, "utf8");
	const body = stripLeadingFrontmatter(raw).trimStart();
	const imageWarnings = [];
	const withImages = await rewriteImages(body, sourceAbs, slug, vaultRoot, postDir, imageWarnings);
	const frontmatter = frontmatterFor({ relativePath, sourceStat, body });
	await mkdir(postDir, { recursive: true });
	await writeFile(destination, `${frontmatter}${withImages.trim()}\n`, "utf8");
	return { status: "imported", reason: "imported as draft", slug, source: relativePath, imageWarnings };
}

function parseArgs(argv) {
	return {
		clean: argv.includes("--clean"),
		dryRun: argv.includes("--dry-run"),
		force: argv.includes("--force") || argv.includes("--clean"),
	};
}

function renderReport({ imported, skipped, excluded, failed }) {
	const now = new Date().toISOString();
	const imageWarnings = imported.flatMap((item) =>
		(item.imageWarnings || []).map((warning) => ({ source: item.source, slug: item.slug, warning })),
	);
	const lines = [
		"# Vault Import Report",
		"",
		`Generated: ${now}`,
		"",
		"## Summary",
		"",
		`- Imported drafts: ${imported.length}`,
		`- Skipped existing drafts: ${skipped.length}`,
		`- Excluded sources: ${excluded.length}`,
		`- Failed sources: ${failed.length}`,
		`- Image warnings: ${imageWarnings.length}`,
		"",
		"## Imported Drafts",
		"",
		...imported.map((item) => `- \`${item.slug}\` <- \`${toPosix(item.source)}\``),
		"",
		"## Skipped Existing Drafts",
		"",
		...(skipped.length ? skipped.map((item) => `- \`${item.slug}\` <- \`${toPosix(item.source)}\` (${item.reason})`) : ["- None"]),
		"",
		"## Excluded Sources",
		"",
		...(excluded.length ? excluded.map((item) => `- \`${toPosix(item.source)}\` - ${item.reason}`) : ["- None"]),
		"",
		"## Failed Sources",
		"",
		...(failed.length ? failed.map((item) => `- \`${toPosix(item.source)}\` - ${item.reason}`) : ["- None"]),
		"",
		"## Image Warnings",
		"",
		...(imageWarnings.length
			? imageWarnings.map((item) => `- \`${item.slug}\` <- \`${toPosix(item.source)}\` - ${item.warning}`)
			: ["- None"]),
		"",
	];
	return `${lines.join("\n")}\n`;
}

async function importDrafts(options = {}) {
	const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
	const vaultRoot = getVaultRoot(manifest);
	const policy = buildImportPolicy(manifest);
	const usedSlugs = new Set();
	const args = { clean: false, dryRun: false, force: false, ...options };

	if (args.clean && !args.dryRun) {
		await rm(postsDir, { recursive: true, force: true });
		await mkdir(postsDir, { recursive: true });
	}

	const files = await walkMarkdown(vaultRoot);
	const imported = [];
	const skipped = [];
	const excluded = [];
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
		if (decision.status !== "import") {
			excluded.push({ source: relativePath, reason: decision.reason });
			continue;
		}

		const slug = createSlug(relativePath, usedSlugs);
		if (args.dryRun) {
			imported.push({ source: relativePath, slug, reason: "dry run" });
			continue;
		}

		try {
			const result = await importOne({ sourceAbs, relativePath, slug, vaultRoot, force: args.force });
			if (result.status === "imported") imported.push(result);
			else skipped.push(result);
		} catch (error) {
			failed.push({ source: relativePath, reason: error.message });
		}
	}

	const report = renderReport({ imported, skipped, excluded, failed });
	if (!args.dryRun) {
		await mkdir(path.dirname(reportPath), { recursive: true });
		await writeFile(reportPath, report, "utf8");
	}

	return { imported, skipped, excluded, failed, report };
}

async function main(argv = process.argv.slice(2)) {
	const args = parseArgs(argv);
	const result = await importDrafts(args);
	console.log(`Imported drafts: ${result.imported.length}`);
	console.log(`Skipped existing drafts: ${result.skipped.length}`);
	console.log(`Excluded sources: ${result.excluded.length}`);
	console.log(`Failed sources: ${result.failed.length}`);
	if (result.failed.length > 0) process.exitCode = 1;
}

export {
	buildImportPolicy,
	createSlug,
	decideSource,
	findCredentialHit,
	getLocalImagePath,
	getVaultRoot,
	importDrafts,
	postsDir,
	safeJoin,
};

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
	main().catch((error) => {
		console.error(error.message);
		process.exitCode = 1;
	});
}
