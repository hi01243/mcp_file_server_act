# Report: MCP Workspace Server

## 1. Stack and why

| Choice | Why |
|---|---|
| Node.js + TypeScript (`tsx`) | The official MCP SDK is written for it, and `tsx` runs TypeScript without a build step. |
| Streamable HTTP | A remote client can connect over HTTPS, which a local-only transport can't do. |
| zod | Every tool input is validated before it runs. |
| ngrok with a static domain | A fixed HTTPS URL, so the connector doesn't break after a restart. |
| pm2 | Keeps the server and the tunnel alive and restarts them if they crash. |
| git (separate repo in `workspace/`) | The agent gets real checkpoints, and the agent's history is separate from the project's code. |

## 2. Tool design

There are 9 tools, grouped by purpose:

- **Read:** `list_files`, `read_file`, `search_files`
- **Write:** `write_file`, `str_replace`, `delete_file`
- **Version control:** `git_status`, `git_diff`, `git_commit`

Design choices:
- `str_replace` fails on zero matches or more than one match, so the agent can't make an ambiguous edit. It also costs fewer tokens than rewriting a whole file.
- `delete_file` only deletes files, never folders, which limits the damage of a mistake.
- Git tools cap their output at 20 KB so one large diff can't flood the agent's context.
- `git_commit` uses a fixed identity, so commits are consistent.
- Error messages say what went wrong, so the agent can fix it without guessing.
- Two sessions were enough to show the handoff protocol working: the second agent continued from `PROJECT_STATE.md` without being re-told the task.

## 3. Security tradeoffs

| Risk | What I did | Tradeoff |
|---|---|---|
| Path escape | `safe()` resolves symlinks and rejects anything outside `workspace/`. 8 of 8 tests pass. | Agents can't use files outside the sandbox, even harmless ones. |
| Damaging the git history | Writes and deletes inside `.git/` are blocked. | The agent can't repair its repo by hand. |
| Huge writes | 200 KB limit per write. | Large files must be split. |
| Command injection | Git runs with `execFile` and an argument list, no shell. | Only the fixed git commands are possible. |
| Code execution | No tool runs code. | Safer, but the agent can't test its own work. See section 4. |
| Unauthorized access | A token is required on every request. | A token in a URL can end up in logs, the ngrok inspector and browser history. A Bearer header is safer when the client supports it. |
| Leaked secrets | `.env`, `workspace/` and `node_modules/` are git-ignored. `evidence/` is committed, so every file in it is checked and tokens are replaced with `REDACTED` before committing. | Needs care every time evidence is exported. |

## 4. Problems found and fixed

1. **Top-level await error.** The server failed to start with a CommonJS error. Fixed with `"type": "module"` in `package.json`.
2. **DNS failure.** My default DNS would not resolve the ngrok domain, but 8.8.8.8 worked. Fixed by switching DNS to 8.8.8.8 and 1.1.1.1.
3. **pm2 on Windows.** There is no auto-start after a reboot, so the README documents `pm2 resurrect`.
4. **Stale tool list.** The first agent session did not see the git tools, because the client had cached the old list. Reconnecting the connector fixes it.
5. **`require is not defined`.** The agent wrote CommonJS test code, but the project's `"type": "module"` applied to its files too. The agent could not catch this because it can't run code. I fixed it by adding a `package.json` with `"type": "commonjs"` inside `workspace/`.

Problem 5 shows the main tradeoff: a no-execution design is safer, but the human has to run the tests and report back. A possible improvement is a restricted `run_tests` tool that can only run one fixed command inside the sandbox.

## 5. Results

- Task: a Flashcard CLI (`add`, `list`, `quiz`, tests) built across 2 sessions.
- The agent logged its plan, wrote 4+ checkpoints and recorded decisions in `DECISIONS.md`.
- All tests pass, and the real `cards.json` is unchanged after testing.
- Evidence: `evidence/session1-transcript.txt`, `session2-transcript.txt`, `pm2-mcp.log`, `test-output.txt`, `workspace-git-log.txt`.

## 6. What I would improve

- `if_version` locking, so two sessions can't overwrite each other's edits.
- A `search_code` tool and a repo map to reduce how many files the agent has to read.
- Bearer-only authentication, with the `?token=` fallback removed.
- A restricted test-runner tool.