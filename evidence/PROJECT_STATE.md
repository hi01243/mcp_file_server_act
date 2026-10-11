# PROJECT STATE

## Goal
Build a small plain-JavaScript (Node.js, no packages) flashcard CLI in `flashcards/`. See AGENTS.md "Current Task: Flashcard CLI".

## Done
Session 1 (2026-10-11):
- `flashcards/cli.js`: `add "front" "back"` and `list` commands; creates `cards.json` if missing.
- `flashcards/cards.json`: 3 sample cards.
- `flashcards/README.md`: usage for add and list.

Session 2 (2026-10-11):
- `cli.js`: `quiz` command (random card, shows front, reads one answer, prints Correct! or Wrong + right answer, case-insensitive). New exports: `normalizeAnswer`, `checkAnswer`, `pickRandomCard`. Cards path overridable with `FLASHCARDS_FILE`. `main` is now async.
- `flashcards/test.js`: 11 tests for add, list, answer check and random pick, using a temp cards file so the real `cards.json` is untouched.
- `README.md`: `quiz`, Tests and `FLASHCARDS_FILE` sections added; "Coming next" removed; Node requirement raised to 14.14.
- Decisions 5-15 logged; checkpoints logged.
- Committed with git_commit (the tool was available again after the MCP server was restarted).

## Next
- Run `node flashcards/test.js` and fix any failure. All 11 tests were only traced by hand.
- Run `node flashcards/cli.js list`, then `node flashcards/cli.js quiz` (try a right answer, a wrong answer, a different case) in a real terminal.
- Any fix goes in as a small edit, then a checkpoint and a new commit.
- Then M5 remainder: transcripts, README, REPORT.md, demo rehearsal.

## Open problems
- NOTHING HAS EVER BEEN EXECUTED. Neither session could run `node`; all code in `flashcards/` was verified only by reading it back and tracing it by hand. Treat it as untested until the commands above pass.
- A test `add` run against the real cards.json appends a card; use `FLASHCARDS_FILE` for experiments.
- During Session 2 the MCP server went down for a while (generic tool errors) and was restarted by the user. Edits made just before the outage were re-checked afterwards: the README quiz/tests sections were saved; the Node version, PowerShell note and "Coming next" removal were redone after the restart.
