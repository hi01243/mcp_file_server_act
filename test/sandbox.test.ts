import test, { after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

// Build a throwaway workspace in a temp folder, with a "secret" outside it
const tmp = await fs.mkdtemp(path.join(os.tmpdir(), "mcp-test-"));
const root = path.join(tmp, "workspace");
const evil = path.join(tmp, "workspace-evil"); // sibling with a similar name
await fs.mkdir(root);
await fs.mkdir(evil);
await fs.writeFile(path.join(root, "ok.txt"), "ok");
await fs.writeFile(path.join(tmp, "secret.txt"), "secret");
await fs.writeFile(path.join(evil, "x.txt"), "x");

process.env.WORKSPACE_ROOT = root;
const { safe, ROOT } = await import("../src/sandbox.js");

after(async () => {
  await fs.rm(tmp, { recursive: true, force: true });
});

const blocked = /escapes workspace/;

test("allows an existing file inside the workspace", async () => {
  assert.equal(await safe("ok.txt"), path.join(ROOT, "ok.txt"));
});

test("allows a new file that does not exist yet", async () => {
  assert.equal(await safe("notes/new.txt"), path.join(ROOT, "notes", "new.txt"));
});

test("allows the workspace root itself", async () => {
  assert.equal(await safe("."), ROOT);
});

test("blocks ../ traversal", async () => {
  await assert.rejects(() => safe("../secret.txt"), blocked);
});

test("blocks sneaky traversal in the middle of a path", async () => {
  await assert.rejects(() => safe("a/../../secret.txt"), blocked);
});

test("blocks an absolute path outside the workspace", async () => {
  await assert.rejects(() => safe(path.join(tmp, "secret.txt")), blocked);
});

test("blocks a sibling folder with a similar name", async () => {
  await assert.rejects(() => safe("../workspace-evil/x.txt"), blocked);
});

test("blocks a symlink/junction that points outside", async () => {
  await fs.symlink(tmp, path.join(root, "link"), "junction");
  await assert.rejects(() => safe("link/secret.txt"), blocked);
});