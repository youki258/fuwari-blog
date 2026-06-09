import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import {
  buildPolicy,
  getLocalImagePath,
  getPublishSource,
  getVaultRoot,
  postsDir,
  safeJoin,
  validateManifest
} from "./export-vault-notes.mjs";

const manifest = JSON.parse(await readFile(new URL("../export-manifest.json", import.meta.url), "utf8"));
const policy = buildPolicy(manifest);
const validPublishEntry = manifest.entries.find((entry) => entry.status === "publish");
const vaultRoot = getVaultRoot(manifest);

assert.ok(validPublishEntry, "manifest should contain at least one publish entry");
assert.doesNotThrow(() => validateManifest(manifest, policy));
assert.ok(policy.privatePaths.includes(".vscode"), "private manifest entries and sensitive paths should shape policy");

assert.throws(
  () => validateManifest({ ...manifest, entries: [{ ...validPublishEntry, slug: "../evil" }] }, policy),
  /Invalid slug/
);

assert.throws(
  () => validateManifest({ ...manifest, entries: [{ ...validPublishEntry, source: "密钥/evil.md" }] }, policy),
  /private path/
);

assert.throws(() => getPublishSource({ ...validPublishEntry, source: "blog/笔记/demo.zip" }, manifest, policy), /Blocked extension/);

const noteAbs = path.resolve(vaultRoot, "blog/笔记/10.Restful&Apifox&增删改查.md");
assert.doesNotThrow(() => getLocalImagePath("10.Restful&Apifox.assets/17470516791332.png", noteAbs, manifest, policy));
assert.throws(() => getLocalImagePath("../../日记/photo.png", noteAbs, manifest, policy), /private path/);
assert.throws(() => getLocalImagePath("../8.MySQL.assets/photo.png", noteAbs, manifest, policy), /escapes expected root/);
assert.throws(() => getLocalImagePath("inline.svg", noteAbs, manifest, policy), /Unsupported local image extension/);
assert.throws(() => safeJoin(postsDir, "../evil.md"), /escapes expected root/);

console.log("Guard tests passed.");
