import express from "express";
import fs from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { ROOT, safe } from "./sandbox.js";
import crypto from "node:crypto";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { Request, Response, NextFunction } from "express";

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] });

// ---- Write guards and search limits ----
const MAX_WRITE_BYTES = 200_000;
const MAX_SEARCH_FILE_BYTES = 1_000_000;
const SKIP_DIRS = new Set([".git", "node_modules"]);

function assertWritable(target: string) {
  const rel = path.relative(ROOT, target);
  const parts = rel.split(path.sep).map((s) => s.toLowerCase());
  if (parts.includes(".git")) throw new Error("Writing inside .git/ is not allowed");
}

function assertSize(content: string) {
  const bytes = Buffer.byteLength(content, "utf8");
  if (bytes > MAX_WRITE_BYTES)
    throw new Error(`Content is ${bytes} bytes; the limit is ${MAX_WRITE_BYTES} bytes`);
}

async function walk(dir: string, out: string[]) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    if (e.isSymbolicLink()) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (!SKIP_DIRS.has(e.name.toLowerCase())) await walk(full, out);
    } else if (e.isFile()) {
      out.push(full);
    }
  }
}

// ---- Git helper: runs git without a shell, only inside the workspace ----
const execFileAsync = promisify(execFile);
const GIT_IDENTITY = ["-c", "user.name=mcp-agent", "-c", "user.email=agent@mcp.local"];

async function git(args: string[]): Promise<string> {
  try {
    const { stdout, stderr } = await execFileAsync(
      "git",
      [...GIT_IDENTITY, "--no-pager", ...args],
      { cwd: ROOT, timeout: 15000, maxBuffer: 1_000_000 }
    );
    return (stdout + stderr).trim();
  } catch (err: any) {
    throw new Error(`git failed: ${String(err.stderr || err.message || "").trim()}`);
  }
}

const clip = (s: string, n = 20000) => (s.length > n ? s.slice(0, n) + "\n...(truncated)" : s);

function buildServer() {
  const server = new McpServer({ name: "workspace", version: "1.0.0" });

  server.registerTool(
    "list_files",
    {
      description: "List files and folders inside a workspace directory.",
      inputSchema: { path: z.string().default(".") },
    },
    async ({ path: p }) => {
      const dir = await safe(p);
      const entries = await fs.readdir(dir, { withFileTypes: true });
      const lines = entries.map((e) => (e.isDirectory() ? e.name + "/" : e.name));
      return text(lines.join("\n") || "(empty)");
    }
  );

  server.registerTool(
    "read_file",
    {
      description: "Read a text file from the workspace.",
      inputSchema: { path: z.string() },
    },
    async ({ path: p }) => text(await fs.readFile(await safe(p), "utf8"))
  );

  server.registerTool(
    "write_file",
    {
      description: "Create or overwrite a text file in the workspace. Max 200 KB. Cannot write inside .git/.",
      inputSchema: { path: z.string(), content: z.string() },
    },
    async ({ path: p, content }) => {
      const target = await safe(p);
      assertWritable(target);
      assertSize(content);
      await fs.mkdir(path.dirname(target), { recursive: true });
      await fs.writeFile(target, content, "utf8");
      return text(`Wrote ${content.length} characters to ${p}`);
    }
  );

  server.registerTool(
    "str_replace",
    {
      description:
        "Replace one exact piece of text in a file with new text. Fails if the old text is not found, or if it appears more than once (add more surrounding text to make it unique).",
      inputSchema: {
        path: z.string(),
        old_str: z.string().min(1),
        new_str: z.string(),
      },
    },
    async ({ path: p, old_str, new_str }) => {
      const target = await safe(p);
      assertWritable(target);
      const original = await fs.readFile(target, "utf8");
      const count = original.split(old_str).length - 1;
      if (count === 0) throw new Error(`old_str not found in ${p}`);
      if (count > 1)
        throw new Error(`old_str matches ${count} places in ${p}; include more context so it matches exactly once`);
      const updated = original.replace(old_str, () => new_str);
      assertSize(updated);
      await fs.writeFile(target, updated, "utf8");
      return text(`Replaced 1 occurrence in ${p}`);
    }
  );

  server.registerTool(
    "delete_file",
    {
      description: "Delete a single file from the workspace. Cannot delete folders or anything inside .git/.",
      inputSchema: { path: z.string() },
    },
    async ({ path: p }) => {
      const target = await safe(p);
      assertWritable(target);
      const info = await fs.stat(target);
      if (!info.isFile()) throw new Error(`${p} is not a file`);
      await fs.unlink(target);
      return text(`Deleted ${p}`);
    }
  );

  server.registerTool(
    "search_files",
    {
      description:
        "Search for text inside files (case-insensitive). Returns matching lines as path:line: text. Skips .git, node_modules, symlinks, binary and very large files.",
      inputSchema: {
        query: z.string().min(1),
        path: z.string().default("."),
        max_results: z.number().int().min(1).max(200).default(50),
      },
    },
    async ({ query, path: p, max_results }) => {
      const start = await safe(p);
      const files: string[] = [];
      await walk(start, files);
      const needle = query.toLowerCase();
      const hits: string[] = [];
      for (const file of files) {
        if (hits.length >= max_results) break;
        const info = await fs.stat(file);
        if (info.size > MAX_SEARCH_FILE_BYTES) continue;
        const content = await fs.readFile(file, "utf8");
        if (content.includes("\u0000")) continue;
        const lines = content.split(/\r?\n/);
        for (let i = 0; i < lines.length && hits.length < max_results; i++) {
          if (lines[i].toLowerCase().includes(needle)) {
            hits.push(`${path.relative(ROOT, file)}:${i + 1}: ${lines[i].trim().slice(0, 200)}`);
          }
        }
      }
      return text(hits.length ? hits.join("\n") : "No matches");
    }
  );

  server.registerTool(
    "git_status",
    {
      description: "Show the git status of the workspace (branch and changed files).",
      inputSchema: {},
    },
    async () => text(await git(["status", "--short", "--branch"]))
  );

  server.registerTool(
    "git_diff",
    {
      description:
        "Show uncommitted changes. Optionally limit to one file path, or set staged=true for staged changes. New untracked files do not appear in a diff, use git_status for those.",
      inputSchema: {
        path: z.string().optional(),
        staged: z.boolean().default(false),
      },
    },
    async ({ path: p, staged }) => {
      const args = ["diff"];
      if (staged) args.push("--staged");
      if (p) {
        const abs = await safe(p);
        args.push("--", path.relative(ROOT, abs));
      }
      const out = await git(args);
      return text(out ? clip(out) : "(no changes)");
    }
  );

  server.registerTool(
    "git_commit",
    {
      description: "Stage all changes in the workspace and commit them with a message (max 200 characters).",
      inputSchema: { message: z.string().min(1).max(200) },
    },
    async ({ message }) => {
      await git(["add", "-A"]);
      const pending = await git(["status", "--porcelain"]);
      if (!pending) return text("Nothing to commit");
      await git(["commit", "-m", message]);
      const id = await git(["rev-parse", "--short", "HEAD"]);
      return text(`Committed ${id}: ${message}`);
    }
  );

  return server;
}

const TOKEN = process.env.MCP_TOKEN;
if (!TOKEN) {
  console.error("MCP_TOKEN is not set. Refusing to start.");
  process.exit(1);
}

function auth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization ?? "";
  const supplied = header.startsWith("Bearer ")
    ? header.slice(7)
    : String(req.query.token ?? "");
  const a = Buffer.from(supplied);
  const b = Buffer.from(TOKEN!);
  if (a.length === b.length && crypto.timingSafeEqual(a, b)) return next();
  res.status(401).json({ error: "unauthorized" });
}

const app = express();
app.use(express.json());

app.post("/mcp", auth, async (req, res) => {
  const server = buildServer();
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
  res.on("close", () => {
    transport.close();
    server.close();
  });
  await server.connect(transport);
  await transport.handleRequest(req, res, req.body);
});

app.listen(3000, () => console.log(`MCP server running at http://localhost:3000/mcp\nWorkspace: ${ROOT}`));

