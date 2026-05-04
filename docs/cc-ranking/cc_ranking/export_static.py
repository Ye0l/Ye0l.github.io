from __future__ import annotations

import argparse
import json
from pathlib import Path
import sqlite3
from typing import Any

from .db import character_history, connect, list_snapshot_entries, snapshot_summary
from .fetch import DEFAULT_DB


DEFAULT_OUTPUT = Path("web/static/data")


def export_static_data(db_path: Path, output_dir: Path) -> None:
    output_dir.mkdir(parents=True, exist_ok=True)
    with connect(db_path) as conn:
        snapshots = [dict(row) for row in snapshot_summary(conn)]
        seasons = sorted({snapshot["season"] for snapshot in snapshots if snapshot["season"] is not None})
        season_exports = []
        for season in seasons:
            season_snapshots = [snapshot for snapshot in snapshots if snapshot["season"] == season]
            payload = _season_payload(conn, season_snapshots)
            season_dir = output_dir / f"season-{season}"
            season_dir.mkdir(parents=True, exist_ok=True)
            _write_json(season_dir / "data.json", payload)
            season_exports.append(
                {
                    "season": season,
                    "path": f"season-{season}/data.json",
                    "snapshot_count": len(season_snapshots),
                    "latest_snapshot_id": max(snapshot["id"] for snapshot in season_snapshots),
                }
            )

        manifest = {
            "version": 1,
            "latest_season": seasons[-1] if seasons else None,
            "seasons": season_exports,
        }
        _write_json(output_dir / "manifest.json", manifest)


def _season_payload(conn: sqlite3.Connection, snapshots: list[dict[str, Any]]) -> dict[str, Any]:
    entries_by_snapshot: dict[str, list[dict[str, Any]]] = {}
    for snapshot in snapshots:
        entries_by_snapshot[str(snapshot["id"])] = [dict(row) for row in list_snapshot_entries(conn, snapshot["id"])]

    characters = _character_summaries(conn, [snapshot["id"] for snapshot in snapshots])
    history_by_key = {
        character["character_key"]: [dict(row) for row in character_history(conn, character["character_key"])]
        for character in characters
    }
    return {
        "snapshots": snapshots,
        "entries_by_snapshot": entries_by_snapshot,
        "characters": characters,
        "history_by_key": history_by_key,
    }


def _character_summaries(conn: sqlite3.Connection, snapshot_ids: list[int]) -> list[dict[str, Any]]:
    if not snapshot_ids:
        return []
    placeholders = ",".join("?" for _ in snapshot_ids)
    rows = conn.execute(
        f"""
        SELECT
            character_key,
            character_name,
            server_name,
            COUNT(*) AS samples,
            MIN(rank) AS best_rank,
            MAX(rank) AS worst_rank,
            MAX(snapshot_id) AS latest_snapshot_id
        FROM ranking_entries
        WHERE snapshot_id IN ({placeholders})
        GROUP BY character_key
        ORDER BY latest_snapshot_id DESC, best_rank ASC
        """,
        snapshot_ids,
    ).fetchall()
    return [dict(row) for row in rows]


def _write_json(path: Path, payload: dict[str, Any]) -> None:
    path.write_text(json.dumps(payload, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")


def main() -> None:
    parser = argparse.ArgumentParser(description="Export sqlite ranking data as static JSON fallback files.")
    parser.add_argument("--db", type=Path, default=DEFAULT_DB)
    parser.add_argument("--out", type=Path, default=DEFAULT_OUTPUT)
    args = parser.parse_args()
    export_static_data(args.db, args.out)
    print(f"exported static data to {args.out}")


if __name__ == "__main__":
    main()
