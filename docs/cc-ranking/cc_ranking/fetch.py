from __future__ import annotations

import argparse
from pathlib import Path
import sys
from urllib.request import Request, urlopen

from .db import connect, save_snapshot, snapshot_has_changes
from .parser import parse_ranking_html


DEFAULT_URL = "https://www.ff14.co.kr/ranking/CrystallineConflict"
DEFAULT_DB = Path("data/cc_ranking.sqlite3")


def fetch_html(url: str = DEFAULT_URL, timeout: int = 30) -> str:
    request = Request(
        url,
        headers={
            "User-Agent": "cc-ranking-tracker/0.1 (+local trend archive)",
            "Accept": "text/html,application/xhtml+xml",
        },
    )
    with urlopen(request, timeout=timeout) as response:
        charset = response.headers.get_content_charset() or "utf-8"
        return response.read().decode(charset, errors="replace")


def fetch_and_store(db_path: Path, url: str = DEFAULT_URL) -> tuple[int, int, str | None, bool]:
    html = fetch_html(url)
    parsed = parse_ranking_html(html)
    if not parsed.entries:
        raise RuntimeError("No ranking entries were parsed from the FF14 ranking page.")
    with connect(db_path) as conn:
        changed = snapshot_has_changes(conn, parsed)
        snapshot_id = save_snapshot(conn, parsed, source_url=url)
    return snapshot_id, len(parsed.entries), parsed.source_time_text, changed


def main() -> None:
    parser = argparse.ArgumentParser(description="Fetch FF14 Crystalline Conflict ranking into sqlite.")
    parser.add_argument("--db", type=Path, default=DEFAULT_DB)
    parser.add_argument("--url", default=DEFAULT_URL)
    parser.add_argument(
        "--change-exit-code",
        action="store_true",
        help="Exit with status 10 when fetched data changed, 0 when unchanged.",
    )
    args = parser.parse_args()

    snapshot_id, count, source_time, changed = fetch_and_store(args.db, args.url)
    print(f"saved snapshot={snapshot_id} entries={count} source_time={source_time} changed={str(changed).lower()}")
    if args.change_exit_code and changed:
        sys.exit(10)


if __name__ == "__main__":
    main()
