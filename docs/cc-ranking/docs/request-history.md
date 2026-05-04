# Request and Decision History

This summarizes the user's requests so future sessions can preserve context.

Keep this document updated when the user adds a durable preference, rejects a previous implementation, or changes product constraints. Record why the project ended up with the current behavior.

## Initial Goal

The user wanted a project that parses:

```text
https://www.ff14.co.kr/ranking/CrystallineConflict
```

and stores daily data in a DB to analyze per-user ranking trends because the official page only shows the current ranking.

Implemented:

- Python parser
- SQLite persistence
- fetch CLI
- local web dashboard

## Python Environment

The user explicitly said:

> 파이썬으로 할 거면 venv만들어서 해.

Use `.venv/bin/python` for commands. A `.venv` exists.

## Discord Bot API

The user wanted API endpoints so a Discord bot can pull ranking data and show it, with graph support.

Implemented `/api/v1/*` endpoints and SVG graph endpoint. `discord_embed` payload is returned by `/api/v1/character`.

## Public Frontend vs Backend

The user wants:

- frontend on GitHub Pages
- backend on their own server
- frontend usable as static files

Implemented:

- `window.CC_API_BASE`
- CORS headers
- static JSON fallback

## Admin Removal

An admin page was initially added, but the user objected because public frontend users could see it.

Current decision:

- No `web/admin.html`
- No `web/admin.js`
- No visible collection controls on public frontend
- No public `POST /api/fetch`
- Collection happens only by server CLI/cron

## Static Fallback

The user requested:

> 서버 통신 안될때 로컬에서 데이터 참조하는것도 ... static에서 ... 시즌별 데이터 넣으면 되니까.

Implemented:

- `cc_ranking.export_static`
- `web/static/data/manifest.json`
- `web/static/data/season-<season>/data.json`
- frontend fallback from API to static JSON
- static fallback JSON requests bypass browser/GitHub Pages cache with a per-page-load query string

## KST Polling Cron

The user requested cron behavior that polls from 15:00 to 18:00 KST every 10 minutes, stops once ranking data changes, and then runs a separate shell script.

Implemented:

- `cc_ranking.fetch --change-exit-code`
- `scripts/poll_kst_until_changed.sh`
- `scripts/on_ranking_changed.sh`

The poll script exports static fallback data before running the hook.

## UI Iteration Notes

The user gave many precise design critiques. Important outcomes:

- "Crystalline Conflict Rankings" not "Ranking".
- Season appears as a separate badge.
- Date and total stored players are meta text below title.
- Current #1 is a leader strip, not a stat card.
- Removed generic stat cards for season/count/date/leader.
- Snapshot navigation buttons must be compact.
- Select box should not look awkward; arrow and padding are custom.
- Right panel should grow, but graph should not be the growing part.
- User list area grows; graph is fixed height.
- User cards must not stretch to fill the whole panel when there is only one search result.
- Custom scrollbars are required; default scrollbars looked bad.
- Avoid whole-page scroll when cross-linking left/right panels.
- No "snapshot count too low" explanatory text in the graph.
- Graphs should show dates and make tier-change points visible.
- The overall ranking panel should fit its table content and avoid ambiguous empty space at the bottom of the card.
- The right detail panel previously avoided viewport-based height, but the current direction is a desktop graph-focused panel with a larger graph.
- The user requested several themes in addition to the dark default, persisted locally in browser cache/cookie-like storage.
- The user rejected a theme select box and wanted one icon button that cycles themes in order.
- The user wanted the light theme polished for readable ranking highlights, season badge, and tier text.
- The user requested user favorites persisted locally and highlighted wherever favorited characters appear, then asked to remove the feature for now because the UI was too large and needs more thought.
- The user asked to append version query strings when loading frontend CSS/JS from HTML because browser cache kept stale frontend code after updates.
- The user asked for snapshot navigation order to be date/previous/next, and for that navigation row itself to be left-aligned.
- The user asked to combine the previous/next snapshot buttons into one control and keep the mobile layout clean, including the theme toggle placement.
- The user asked for snapshot select options to show date only because the exact source time is already shown in the header.
- The user asked to show how many consecutive days the current #1 has held rank 1, counting the current day as day 1.
- The user said the desktop right-side user trend/search panel overlaps too much with the full ranking table. Search should be promoted to the top and filter the full ranking table; the right panel should be a large graph only.
- The user asked to split horizontal and vertical UI with media queries: when the viewport is taller than it is wide, stack ranking and graph vertically. Desktop search should share the snapshot control row; mobile/vertical search should stretch full width. The current #1 strip should sit directly above the full ranking table.
- The user asked to visually merge previous, next, and snapshot date into one control, with search using flex-grow to fill the remaining control-row width.
- The user emphasized that mobile layout must always be checked when changing UI after the stacked search field became too tall due to desktop flex sizing.
- The user disliked the body/page scrollbar styling and asked for a simpler, less decorative design.
- The user noticed light theme Diamond and Crystal tier pills used the same color and wanted them visually distinct.

## Current Design Preferences

Preserve unless the user asks otherwise:

- dark dashboard as the default theme
- persisted cyclic icon-button theme switching
- no visible favorites UI for now; favorites need more design thought before returning
- compact controls
- polished but functional table UI
- colored rank badges
- tier pills
- NEW chips and subtle row highlight
- custom scrollbar
- disabled right-click/drag/select

## Known Current Data

At the time this document was written, local data has season 20 and one snapshot:

```text
2026-05-02 15:00～16:00 기준
```

With one snapshot, the graph cannot show a line trend yet but still renders the chart grid and point/placeholder.
