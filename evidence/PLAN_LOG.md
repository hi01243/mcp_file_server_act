# PLAN LOG

## Session 1 (2026-10-11)
Read AGENTS.md, PROJECT_STATE.md (empty), PLAN_LOG.md (empty), CHECKPOINTS.md (empty), DECISIONS.md (decisions 1-4 are about the MCP server, not this task).

Plan:
1. Write `flashcards/cli.js` with `add` and `list` (plain Node.js, no packages), creating `flashcards/cards.json` if missing.
2. Write `flashcards/README.md` with usage examples.
3. Add 3 sample cards to `flashcards/cards.json` and verify by reading the files back.
4. Checkpoint after each part, log design choices, update PROJECT_STATE.md.

Limits noticed: this session has only file tools (read/write/list/str_replace/delete). There is no `git_commit` tool and no way to run `node`, so commits cannot be made and the CLI cannot be executed. Verification is done by reading files back and tracing the code by hand.

Not in scope: Session 2 (quiz, test.js).

## Session 2 (2026-10-11)
Read AGENTS.md, PROJECT_STATE.md, PLAN_LOG.md, CHECKPOINTS.md, DECISIONS.md (decisions 1-9), cli.js, README.md, cards.json.

Limits noticed (same as Session 1): only file tools (read/write/list/str_replace/delete). No `git_commit` tool and no way to run `node`. So the first-thing items in PROJECT_STATE (commit, run the CLI) cannot be done this session. Code is verified by reading and tracing by hand only.

Plan:
1. Make the cards file path overridable (env var FLASHCARDS_FILE, default stays `__dirname/cards.json`) so tests never touch the real cards.json. Small str_replace edit.
2. Add `normalizeAnswer`, `checkAnswer(given, expected)` (case-insensitive, trims, collapses spaces) and `pickRandomCard(cards, rng)` to cli.js and export them.
3. Add `quiz` command (reads one answer from stdin with readline, says correct or wrong, shows the right answer when wrong). Update usage text.
4. Write `flashcards/test.js` (plain `assert`, temp cards file) for add, list and the answer check (plus pickRandomCard).
5. Update README with `quiz` and replace the "Coming next" section.
6. Checkpoint after each part, log decisions, update PROJECT_STATE.md.
