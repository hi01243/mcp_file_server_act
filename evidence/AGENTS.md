# Agent instructions

At the start of every session:
1. Read PROJECT_STATE.md, then the last entries of PLAN_LOG.md and CHECKPOINTS.md.
2. Read DECISIONS.md before changing anything that was already decided.

While working:
- Add a line to PLAN_LOG.md before each major step.
- After a milestone, write a checkpoint to CHECKPOINTS.md and commit.
- Record every design choice and its reason in DECISIONS.md.

At the end of every session:
- Update PROJECT_STATE.md: goal, what is done, what is next, open problems.

## Current Task: Flashcard CLI

Build a small command-line flashcard app in Node.js (plain JavaScript, no extra packages).

Files live in `flashcards/`:
- `flashcards/cards.json` stores the cards as a list of `{ "front": "...", "back": "..." }`
- `flashcards/cli.js` is the entry point
- `flashcards/README.md` explains how to use it

### Session 1 (build the base)
- `node flashcards/cli.js add "front" "back"` saves a new card
- `node flashcards/cli.js list` shows all cards, numbered
- Create the cards file if it does not exist yet
- Write `flashcards/README.md` with usage examples
- Add 3 sample cards and test both commands by reading the files back

### Session 2 (extend it)
- `node flashcards/cli.js quiz` picks a random card, shows the front, reads the answer, and says correct or wrong (ignore upper/lower case)
- Add a small test file `flashcards/test.js` that checks add, list and the answer check
- Update the README with the `quiz` command

### Rules for every session
1. Read `AGENTS.md`, `PROJECT_STATE.md`, `PLAN_LOG.md`, `CHECKPOINTS.md` and `DECISIONS.md` first.
2. Write your plan in `PLAN_LOG.md` before changing any code.
3. Make small edits with `str_replace` when possible.
4. After each finished part, add a line to `CHECKPOINTS.md` and run `git_commit`.
5. At the end, update `PROJECT_STATE.md` with what is done and what is next.
6. Log any design choice in `DECISIONS.md`.