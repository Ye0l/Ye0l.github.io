# Project Notes for Future Agents

This repo tracks the Korean FF14 Crystalline Conflict ranking page, stores daily snapshots, and serves a user-facing rankings/trends UI.

Read this file first in future sessions. For more detail, see:

- `docs/features.md`: current behavior and architecture
- `docs/request-history.md`: user requests and design decisions made during the build
- `README.md`: normal usage commands

## Documentation Maintenance Rule

Keep these notes current whenever the project changes. This is part of the definition of done for future work.

- Update `docs/features.md` when behavior, architecture, APIs, data formats, deployment flow, or commands change.
- Update `docs/request-history.md` when the user gives new product/design preferences, rejects an approach, changes constraints, or asks for a behavior that future sessions should preserve.
- Update this `AGENTS.md` when a new high-level rule, workflow, or must-know constraint is introduced.
- If generated static data format changes, document the new shape in `docs/features.md`.
- If public/private surface area changes, explicitly document it here and in `docs/request-history.md`.

Do not leave these docs stale after implementing a user-facing or architectural change.

## Current Tech Shape

- Language/runtime: Python standard library backend, static HTML/CSS/JS frontend.
- Python env: use `.venv/bin/python`, not system `python3`, for project commands.
- Data store: SQLite at `data/cc_ranking.sqlite3`.
- Static fallback data: `web/static/data/manifest.json` and `web/static/data/season-*/data.json`.
- No package manager dependencies are currently required.

## Key Commands

```bash
.venv/bin/python -m cc_ranking.fetch
.venv/bin/python -m cc_ranking.export_static
.venv/bin/python -m cc_ranking.server --port 8000
.venv/bin/python -m unittest discover -s tests
node --check web/app.js
scripts/poll_kst_until_changed.sh
```

The expected daily flow is:

```bash
scripts/poll_kst_until_changed.sh
```

The poll script runs from 15:00 through 18:00 KST at 10-minute intervals. It stops when `cc_ranking.fetch --change-exit-code` reports changed data, exports static data, and runs `scripts/on_ranking_changed.sh` or a hook script passed as the first argument.

## Important Product Constraints

- Public frontend must not expose ranking collection/admin controls.
- Collection is server-side only via CLI/cron.
- Frontend is intended to be deployable to GitHub Pages.
- Backend can live on the user's own server.
- If backend API is unreachable, frontend must fall back to static JSON in `web/static/data/`.
- The UI is for users, not operators.
- Right-click, drag, and text selection are intentionally disabled in the UI.

## Current Public Pages

- `web/index.html`: user-facing rankings and trend UI.
- `web/api.html`: Discord/API reference page.

There is intentionally no `admin.html`.

## Backend API

The server exposes both internal UI endpoints and Discord-friendly `/api/v1/*` endpoints.

Important endpoints:

- `GET /api/latest`
- `GET /api/snapshot?id=1`
- `GET /api/snapshots`
- `GET /api/characters?q=...`
- `GET /api/history?key=...`
- `GET /api/v1/top?limit=10`
- `GET /api/v1/top?limit=10&snapshot_id=1`
- `GET /api/v1/snapshots`
- `GET /api/v1/search?q=...`
- `GET /api/v1/character?name=...&server=...`
- `GET /api/v1/graph.svg?name=...&server=...`

There is intentionally no public `POST /api/fetch`.

## Design State

The user has been iterating heavily on UI details. Preserve the current direction unless asked otherwise:

- Dark, compact, polished ranking dashboard.
- Title: `Crystalline Conflict Rankings`.
- Season shown as a separate `Season N` badge, not merged into title text.
- Date and total stored players shown under title as meta text.
- Current #1 shown in a horizontal leader strip with consecutive #1 day count, not as a generic stat card.
- Snapshot navigation uses one unified control containing the date-only select and previous/next buttons, with ranking search in the same desktop row.
- Ranking search filters the full ranking table and stretches full width in mobile/vertical layouts.
- The current #1 strip sits directly above the full ranking table.
- The right desktop pane is a large rank graph for the selected ranking row; the former user list panel is removed.
- Portrait-oriented viewports stack the ranking and graph panels vertically instead of using left/right columns.
- Always consider and verify mobile/vertical layout when changing public UI; flex sizing can behave differently when controls stack.
- Custom scrollbars are intentional.
- Graph area should still render useful grid/placeholder visuals when data is sparse.
- Do not add visible admin controls to public static frontend.

## Files to Know

- `cc_ranking/parser.py`: parses FF14 ranking HTML.
- `cc_ranking/db.py`: schema and query helpers.
- `cc_ranking/fetch.py`: fetch official page and save SQLite snapshot.
- `cc_ranking/export_static.py`: export SQLite data to static JSON fallback files.
- `cc_ranking/server.py`: static server and API.
- `scripts/poll_kst_until_changed.sh`: cron entry point for KST polling until changed data appears.
- `scripts/on_ranking_changed.sh`: default post-change hook called by the poll script.
- `web/app.js`: frontend API/static fallback, rendering, ranking search, and graph behavior.
- `web/styles.css`: current UI design.
- `web/config.js`: frontend API base and static data base config.
- `tests/test_parser.py`: parser regression test.

## Verification Baseline

Before finalizing code changes, run:

```bash
.venv/bin/python -m unittest discover -s tests
.venv/bin/python -m py_compile cc_ranking/server.py cc_ranking/db.py cc_ranking/fetch.py cc_ranking/export_static.py
node --check web/app.js
```

If changing static export behavior, run:

```bash
.venv/bin/python -m cc_ranking.export_static
```

## Coding Protocol

Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.
