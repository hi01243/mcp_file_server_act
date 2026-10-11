# DECISIONS

Record each design choice and why. Check this file before changing something already decided.

## Decision 1: Reject any path outside the workspace root
- Reason: stops the agent from reading or writing other files on the computer (path escapes, symlinks)
- Date: 2026-10-11

## Decision 2: str_replace fails on zero or multiple matches
- Reason: prevents silent wrong edits, the agent must be specific
- Date: 2026-10-11

## Decision 3: delete_file only deletes files, not folders
- Reason: limits the damage from a mistake
- Date: 2026-10-11

## Decision 4: Token auth through MCP_TOKEN (Bearer or ?token=)
- Reason: the public URL is reachable by anyone, so the server needs a password. ?token= is used because some clients have no header field. Tradeoff: tokens in URLs can appear in logs.
- Date: 2026-10-11

## Decision 5: cards.json path is resolved from `__dirname`, not the working directory
- Reason: the app works no matter where `node flashcards/cli.js` is started from, and always uses the same cards file
- Date: 2026-10-11

## Decision 6: add requires exactly two non-empty arguments (trimmed)
- Reason: catches the common mistake of forgetting quotes, which would otherwise silently save a wrong or truncated card
- Date: 2026-10-11

## Decision 7: cli.js exports its functions and only runs main() when executed directly
- Reason: lets Session 2's `test.js` import add/list logic without spawning processes
- Date: 2026-10-11

## Decision 8: Invalid cards.json stops with an error and is never overwritten
- Reason: protects the user's cards from being wiped by a corrupted or hand-edited file
- Date: 2026-10-11

## Decision 9: list output format is `N. front -> back`
- Reason: simple, readable, numbered from 1 as AGENTS.md asks
- Date: 2026-10-11

## Decision 10: Cards path can be overridden with the FLASHCARDS_FILE environment variable
- Reason: tests must not overwrite the real cards.json. The default is still `__dirname/cards.json`, so Decision 5 holds. The variable is read on every call (not once at load) so a test can set it at any time.
- Date: 2026-10-11

## Decision 11: Answers are compared after trim, collapsing runs of spaces, and lower-casing
- Reason: AGENTS.md asks to ignore upper/lower case; trimming and collapsing spaces avoids marking "  Paris " wrong because of a typing slip. Punctuation and spelling are still compared exactly.
- Date: 2026-10-11

## Decision 12: pickRandomCard takes an optional random function (default Math.random)
- Reason: lets test.js check the pick deterministically. The index is clamped so a random value of exactly 1 can never go out of range.
- Date: 2026-10-11

## Decision 13: main() is async and quiz reads one line with readline
- Reason: reading an answer is asynchronous. Plain readline from Node's standard library keeps the "no extra packages" rule. If input ends with no answer, quiz prints "No answer given." and exits 1.
- Date: 2026-10-11

## Decision 14: A wrong answer exits with code 0
- Reason: a wrong answer is a normal quiz result, not a program error. Exit code 1 is kept for real problems (bad usage, invalid cards file, no answer given).
- Date: 2026-10-11

## Decision 15: test.js uses Node's built-in assert and a small own runner
- Reason: no packages allowed. Needs Node 14.14+ because of fs.rmSync, so the README requirement was raised from 14 to 14.14.
- Date: 2026-10-11
