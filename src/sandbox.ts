import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

// The workspace folder, found relative to this file (so it works from anywhere)
const here = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = await fs.realpath(
  process.env.WORKSPACE_ROOT ?? path.resolve(here, "..", "workspace")
);

// Resolve a path even if the file doesn't exist yet
async function realpathLoose(abs: string): Promise<string> {
  try {
    return await fs.realpath(abs);
  } catch {
    const parent = path.dirname(abs);
    if (parent === abs) throw new Error("Invalid path");
    return path.join(await realpathLoose(parent), path.basename(abs));
  }
}

// THE DOORMAN: every tool must call this before touching any file
export async function safe(p: string): Promise<string> {
  const abs = path.resolve(ROOT, p);
  const real = await realpathLoose(abs);
  const inside = real === ROOT || real.startsWith(ROOT + path.sep);
  if (!inside) throw new Error(`Path escapes workspace: ${p}`);
  return real;
}