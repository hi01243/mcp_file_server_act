import express from "express";
import fs from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { ROOT, safe } from "./sandbox.js";

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] });

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
      description: "Create or overwrite a text file in the workspace.",
      inputSchema: { path: z.string(), content: z.string() },
    },
    async ({ path: p, content }) => {
      const target = await safe(p);
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
      const original = await fs.readFile(target, "utf8");
      const count = original.split(old_str).length - 1;
      if (count === 0) throw new Error(`old_str not found in ${p}`);
      if (count > 1)
        throw new Error(`old_str matches ${count} places in ${p}; include more context so it matches exactly once`);
      await fs.writeFile(target, original.replace(old_str, () => new_str), "utf8");
      return text(`Replaced 1 occurrence in ${p}`);
    }
  );

  server.registerTool(
    "delete_file",
    {
      description: "Delete a single file from the workspace. Cannot delete folders.",
      inputSchema: { path: z.string() },
    },
    async ({ path: p }) => {
      const target = await safe(p);
      const info = await fs.stat(target);
      if (!info.isFile()) throw new Error(`${p} is not a file`);
      await fs.unlink(target);
      return text(`Deleted ${p}`);
    }
  );
  return server;
}

const app = express();
app.use(express.json());

app.post("/mcp", async (req, res) => {
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