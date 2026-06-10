import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import {
  buildImportPolicy,
  createSlug,
  decideSource,
  findCredentialHit,
  getLocalImagePath,
  getVaultRoot,
  postsDir,
  safeJoin
} from "./import-vault-drafts.mjs";

const manifest = JSON.parse(await readFile(new URL("../export-manifest.json", import.meta.url), "utf8"));
const policy = buildImportPolicy(manifest);
const vaultRoot = getVaultRoot(manifest);

assert.equal(manifest.entries.some((entry) => entry.status === "publish"), false, "manifest should not keep legacy publish entries");
assert.ok(policy.excludedRoots.includes("public-notes"), "legacy public-notes output must not be imported");
assert.ok(policy.excludedRoots.includes("密钥"), "secret directories must be excluded");

assert.deepEqual(decideSource("public-notes/src/content/posts/demo.md", "hello", policy), {
  status: "excluded",
  reason: "excluded root: public-notes"
});
assert.deepEqual(decideSource("密钥/demo.md", "hello", policy), {
  status: "excluded",
  reason: "excluded root: 密钥"
});
assert.deepEqual(decideSource("学校邮箱/demo.md", "hello", policy), {
  status: "excluded",
  reason: "excluded root: 学校邮箱"
});
assert.deepEqual(decideSource("26寒假学习/日报.md", "hello", policy), {
  status: "excluded",
  reason: "personal note name: 日报"
});
assert.deepEqual(decideSource("blog/笔记/demo.md", "const jwt = request.getHeader('token')", policy), {
  status: "import",
  reason: "passed import policy"
});
assert.match(
  decideSource("blog/笔记/demo.md", 'OPENAI_API_KEY = "sk-abcdefghijklmnopqrstuvwxyz"', policy).reason,
  /credential or personal info/
);
assert.equal(findCredentialHit('password = "supersecret"'), "quoted secret assignment");

const slug = createSlug("blog/笔记/10.Restful&Apifox&增删改查.md", new Set());
assert.equal(slug, "blog/notes/10-restful-apifox-crud");
assert.match(slug, /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\/[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)*$/);
assert.equal(createSlug("blog/笔记/9.JDBC&Mybatis.md", new Set()), "blog/notes/09-jdbc-mybatis");

const noteAbs = path.resolve(vaultRoot, "blog/笔记/10.Restful&Apifox&增删改查.md");
assert.doesNotThrow(() => getLocalImagePath("10.Restful&Apifox.assets/17470516791332.png", noteAbs, vaultRoot));
assert.throws(() => getLocalImagePath("../../日记/photo.png", noteAbs, vaultRoot), /escapes expected root/);
assert.throws(() => getLocalImagePath("../8.MySQL.assets/photo.png", noteAbs, vaultRoot), /escapes expected root/);
assert.throws(() => getLocalImagePath("inline.svg", noteAbs, vaultRoot), /unsupported image extension/);
assert.throws(() => safeJoin(postsDir, "../evil.md"), /escapes expected root/);

console.log("Guard tests passed.");
