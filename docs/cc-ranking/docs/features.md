# Current Features and Architecture

Keep this document updated when implementation details change. Record current behavior here, not historical debate.

## Data Collection

`cc_ranking.fetch` fetches:

```text
https://www.ff14.co.kr/ranking/CrystallineConflict
```

The official page currently returns server-rendered HTML containing about 100 ranking rows. The parser extracts:

- season number
- source time text, for example `2026-05-02 15:00～16:00 기준`
- rank
- character name
- server name
- tier code/label
- wins
- win delta
- movement direction/value

Snapshots are stored in SQLite. Duplicate source time within a season updates the existing snapshot rather than adding a duplicate.

Before saving, `cc_ranking.fetch` compares the parsed ranking rows with the stored snapshot for the same season/source time and prints `changed=true` or `changed=false`. With `--change-exit-code`, it exits with status `10` when the fetched data changed and `0` when it did not.

## Scheduled Polling

`scripts/poll_kst_until_changed.sh` is the cron entry point for the normal daily collection window:

```cron
0 15 * * * /home/kastre/workspace/cc-ranking/scripts/poll_kst_until_changed.sh
```

The script uses KST regardless of the server timezone. It polls every 10 minutes from 15:00 through 18:00 KST. When a ranking change is detected, it runs `cc_ranking.export_static`, executes `scripts/on_ranking_changed.sh`, and exits. A different hook script can be passed as the first argument.

When run from an interactive terminal, the poll script prints status messages to stdout and `data/fetch.log`. Under cron, use `data/fetch.log` for status.

## SQLite

Database path:

```text
data/cc_ranking.sqlite3
```

Tables:

- `snapshots`
- `ranking_entries`

The character key format is:

```text
server::character
```

It is casefolded in Python.

## Static Export

`cc_ranking.export_static` exports SQLite data into:

```text
web/static/data/manifest.json
web/static/data/season-<season>/data.json
```

The frontend first calls the configured backend API. If it fails, it falls back to static JSON.
Static JSON fallback requests add a per-page-load cache-busting query string and use `cache: "no-store"` so newly exported files are not hidden by browser or GitHub Pages caching.

`manifest.json` points at the latest season file. The season file includes:

- `snapshots`
- `entries_by_snapshot`
- `characters`
- `history_by_key`

## Frontend Config

`web/config.js`:

```js
window.CC_API_BASE = window.CC_API_BASE || "";
window.CC_STATIC_DATA_BASE = window.CC_STATIC_DATA_BASE || "static/data";
```

For GitHub Pages plus external backend:

```js
window.CC_API_BASE = "https://api.example.com";
```

If backend is unavailable, `CC_STATIC_DATA_BASE` is used.

## User Page

`web/index.html` has:

- title and season badge
- source date and total stored entry count
- persisted cyclic theme button with Dark, Light, Crystal, and Rose themes
- unified snapshot control containing date select and previous/next buttons, plus a search field that flexes to fill the remaining desktop control row
- current #1 leader strip with consecutive #1 day count directly above the ranking table
- ranking search that filters the current ranking table and expands to full width in vertical/mobile layouts
- ranking table
- large graph panel for the selected ranking row

There are no public collection controls.

Theme choice is a browser-local preference. The frontend stores it in `localStorage` under `ccRankingTheme` and falls back to cookies when `localStorage` is unavailable. The theme control is a single icon button that cycles through the available themes.

`styles.css`, `config.js`, and `app.js` are loaded with version query strings in `web/index.html` so browser caches are bypassed after frontend changes. Bump those query strings when changing the frontend.

The two main dashboard panels use a left/right layout in landscape mode and stack vertically when the viewport is portrait-oriented. On desktop, the right detail panel is dedicated to a large rank graph.

## Row Selection Behavior

Clicking a ranking row:

- selects the character
- refreshes right panel data
- refreshes the large graph without moving the whole page

This intentionally avoids `scrollIntoView()` because it moved the whole page in earlier iterations.

## Graph Behavior

The canvas renders:

- preview grid/line when no character is selected
- grid and a point when only one snapshot exists
- line chart when two or more snapshots exist
- sampled date labels along the bottom of the chart
- tier-change markers when a character's recorded tier label differs from the previous snapshot

The user explicitly asked to remove the visible message about only one snapshot being available.

## UI Interaction Blocking

The frontend intentionally disables:

- context menu
- drag start
- text selection

CSS also sets:

```css
user-select: none;
-webkit-user-drag: none;
```
