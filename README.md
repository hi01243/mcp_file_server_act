\# MCP Workspace Server



A sandboxed file-server built on the Model Context Protocol (MCP). An AI agent (Claude) connects to it over HTTPS and works on files inside one folder, `workspace/`, using 9 tools. Built for the CS 3A/3B midterm.



\## Stack



\- Node.js + TypeScript (run with `tsx`)

\- Official MCP SDK, Streamable HTTP at `/mcp`

\- zod for tool input validation

\- ngrok (static domain) for the HTTPS tunnel

\- pm2 to keep the server and the tunnel running

\- git, with a separate repo inside `workspace/` for the agent's work



\## Project layout



```

src/server.ts          MCP server and the 9 tools

src/sandbox.ts         safe() path check

test/sandbox.test.ts   sandbox tests (8)

ecosystem.config.cjs   pm2 config for the server and ngrok

workspace/             the agent's sandbox (its own git repo)

evidence/              folder is commited

.env                   MCP\_TOKEN (never committed)

```
`workspace/` is the agent's own git repo and is not included here. Its handoff files and git log are copied into `evidence/`.


\## Setup



1\. `npm install`

2\. Create `.env` with `MCP\_TOKEN=<a long random string>`

3\. Install ngrok and add your authtoken

4\. Start everything: `pm2 start ecosystem.config.cjs`

5\. Check with `pm2 status` (both `mcp` and `ngrok` should be online)

6\. After a reboot on Windows: `pm2 resurrect` (after `pm2 save`) or run step 4 again



Connect a client to `https://<your-domain>/mcp` with the token, either as a Bearer header or as `?token=`. Opening the URL in a browser shows "Cannot GET /mcp". That is normal, because the route only accepts POST.



\## Tools



| Tool          | What it does                                                        |
|---------------|---------------------------------------------------------------------|
| `list_files`  | List files and folders                                              |
| `read_file`   | Read a text file                                                    |
| `write_file`  | Create or overwrite a file (200 KB limit)                           |
| `str_replace` | Replace one exact piece of text; fails on zero or multiple matches  |
| `delete_file` | Delete a file (files only, not folders)                             |
| `search_files`| Search text inside files                                            |
| `git_status`  | Show repo status                                                    |
| `git_diff`    | Show uncommitted changes                                            |
| `git_commit`  | Stage everything and commit with a fixed identity                   |



\## Security



\- Every path goes through `safe()`, which resolves symlinks and rejects anything outside `workspace/`.

\- Writes and deletes inside `.git/` are blocked.

\- Writes are capped at 200 KB, and git output at 20 KB.

\- Git commands use `execFile` with an argument list and no shell, so there is no command injection.

\- Requests need the token. The token is never stored in the repo.

\- There is no tool that runs code.



\## Handoff protocol



Agents in separate sessions share state through files in `workspace/`:



\- `AGENTS.md`: the task and the rules

\- `PROJECT\_STATE.md`: what is done and what is next

\- `PLAN\_LOG.md`: the plan before each piece of work

\- `CHECKPOINTS.md`: one line per finished part

\- `DECISIONS.md`: design choices and why



\## Tests



`npm test` runs the sandbox tests. The agent's flashcard app has its own tests: `node workspace/flashcards/test.js`.



\## Demo task



The agent built a Flashcard CLI across two sessions. Session 1 built `add` and `list`. Session 2, in a fresh chat, read the handoff files and built `quiz` and the tests. See `evidence/` for the transcripts, logs and test output.



\## Notes



\- This repo uses the `master` branch. The agent's repo in `workspace/` uses `main`.

\- Never put the real token in screenshots, the README or the report.

