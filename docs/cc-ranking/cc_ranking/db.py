from __future__ import annotations

from contextlib import contextmanager
from datetime import datetime, timezone
import sqlite3
from pathlib import Path
from typing import Iterator

from .parser import ParsedRanking, RankingEntry


SCHEMA = """
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS snapshots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    season INTEGER,
    source_time_text TEXT,
    source_url TEXT NOT NULL,
    scraped_at TEXT NOT NULL,
    entry_count INTEGER NOT NULL,
    UNIQUE(season, source_time_text)
);

CREATE TABLE IF NOT EXISTS ranking_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    snapshot_id INTEGER NOT NULL REFERENCES snapshots(id) ON DELETE CASCADE,
    season INTEGER,
    rank INTEGER NOT NULL,
    character_name TEXT NOT NULL,
    server_name TEXT NOT NULL,
    character_key TEXT NOT NULL,
    tier_code TEXT,
    tier_label TEXT,
    points_text TEXT,
    wins INTEGER,
    win_delta INTEGER,
    movement_direction TEXT,
    movement_value INTEGER,
    UNIQUE(snapshot_id, character_key)
);

CREATE INDEX IF NOT EXISTS idx_entries_character ON ranking_entries(character_key, snapshot_id);
CREATE INDEX IF NOT EXISTS idx_entries_snapshot_rank ON ranking_entries(snapshot_id, rank);
CREATE INDEX IF NOT EXISTS idx_snapshots_season ON snapshots(season, id);
"""


@contextmanager
def connect(db_path: Path | str) -> Iterator[sqlite3.Connection]:
    path = Path(db_path)
    path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(path)
    conn.row_factory = sqlite3.Row
    try:
        conn.execute("PRAGMA foreign_keys = ON")
        yield conn
        conn.commit()
    finally:
        conn.close()


def init_db(conn: sqlite3.Connection) -> None:
    conn.executescript(SCHEMA)


def save_snapshot(
    conn: sqlite3.Connection,
    parsed: ParsedRanking,
    source_url: str,
    scraped_at: str | None = None,
) -> int:
    init_db(conn)
    scraped_at = scraped_at or datetime.now(timezone.utc).isoformat(timespec="seconds")
    cursor = conn.execute(
        """
        INSERT INTO snapshots (season, source_time_text, source_url, scraped_at, entry_count)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(season, source_time_text) DO UPDATE SET
            source_url = excluded.source_url,
            scraped_at = excluded.scraped_at,
            entry_count = excluded.entry_count
        RETURNING id
        """,
        (parsed.season, parsed.source_time_text, source_url, scraped_at, len(parsed.entries)),
    )
    snapshot_id = int(cursor.fetchone()["id"])

    conn.execute("DELETE FROM ranking_entries WHERE snapshot_id = ?", (snapshot_id,))
    conn.executemany(
        """
        INSERT INTO ranking_entries (
            snapshot_id, season, rank, character_name, server_name, character_key,
            tier_code, tier_label, points_text, wins, win_delta, movement_direction, movement_value
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        [_entry_row(snapshot_id, parsed.season, entry) for entry in parsed.entries],
    )
    return snapshot_id


def snapshot_has_changes(conn: sqlite3.Connection, parsed: ParsedRanking) -> bool:
    init_db(conn)
    snapshot = _find_snapshot_by_source_time(conn, parsed.season, parsed.source_time_text)
    if snapshot is None:
        return True

    existing = conn.execute(
        """
        SELECT
            rank, character_name, server_name, character_key, tier_code, tier_label,
            points_text, wins, win_delta, movement_direction, movement_value
        FROM ranking_entries
        WHERE snapshot_id = ?
        """,
        (snapshot["id"],),
    ).fetchall()
    return _entry_signature_from_rows(existing) != _entry_signature_from_entries(parsed.entries)


def _find_snapshot_by_source_time(
    conn: sqlite3.Connection,
    season: int | None,
    source_time_text: str | None,
) -> sqlite3.Row | None:
    return conn.execute(
        """
        SELECT *
        FROM snapshots
        WHERE (season = ? OR (season IS NULL AND ? IS NULL))
          AND (source_time_text = ? OR (source_time_text IS NULL AND ? IS NULL))
        LIMIT 1
        """,
        (season, season, source_time_text, source_time_text),
    ).fetchone()


def _entry_signature_from_rows(rows: list[sqlite3.Row]) -> list[tuple[object, ...]]:
    return sorted(
        (
            row["rank"],
            row["character_name"],
            row["server_name"],
            row["character_key"],
            row["tier_code"],
            row["tier_label"],
            row["points_text"],
            row["wins"],
            row["win_delta"],
            row["movement_direction"],
            row["movement_value"],
        )
        for row in rows
    )


def _entry_signature_from_entries(entries: list[RankingEntry]) -> list[tuple[object, ...]]:
    return sorted(
        (
            entry.rank,
            entry.character_name,
            entry.server_name,
            character_key(entry.character_name, entry.server_name),
            entry.tier_code,
            entry.tier_label,
            entry.points_text,
            entry.wins,
            entry.win_delta,
            entry.movement_direction,
            entry.movement_value,
        )
        for entry in entries
    )


def _entry_row(snapshot_id: int, season: int | None, entry: RankingEntry) -> tuple[object, ...]:
    return (
        snapshot_id,
        season,
        entry.rank,
        entry.character_name,
        entry.server_name,
        character_key(entry.character_name, entry.server_name),
        entry.tier_code,
        entry.tier_label,
        entry.points_text,
        entry.wins,
        entry.win_delta,
        entry.movement_direction,
        entry.movement_value,
    )


def character_key(character_name: str, server_name: str) -> str:
    return f"{server_name.strip()}::{character_name.strip()}".casefold()


def latest_snapshot(conn: sqlite3.Connection) -> sqlite3.Row | None:
    return conn.execute("SELECT * FROM snapshots ORDER BY id DESC LIMIT 1").fetchone()


def get_snapshot(conn: sqlite3.Connection, snapshot_id: int) -> sqlite3.Row | None:
    return conn.execute("SELECT * FROM snapshots WHERE id = ?", (snapshot_id,)).fetchone()


def list_latest_entries(conn: sqlite3.Connection, limit: int = 100) -> list[sqlite3.Row]:
    snapshot = latest_snapshot(conn)
    if snapshot is None:
        return []
    return list_snapshot_entries(conn, snapshot["id"], limit)


def list_snapshot_entries(conn: sqlite3.Connection, snapshot_id: int, limit: int = 100) -> list[sqlite3.Row]:
    return conn.execute(
        """
        SELECT * FROM ranking_entries
        WHERE snapshot_id = ?
        ORDER BY rank ASC
        LIMIT ?
        """,
        (snapshot_id, limit),
    ).fetchall()


def latest_entry_by_key(conn: sqlite3.Connection, key: str) -> sqlite3.Row | None:
    return conn.execute(
        """
        SELECT e.*, s.source_time_text, s.scraped_at
        FROM ranking_entries e
        JOIN snapshots s ON s.id = e.snapshot_id
        WHERE e.character_key = ?
        ORDER BY e.snapshot_id DESC
        LIMIT 1
        """,
        (key,),
    ).fetchone()


def latest_entry_by_name(
    conn: sqlite3.Connection,
    character_name: str,
    server_name: str | None = None,
) -> sqlite3.Row | None:
    if server_name:
        return latest_entry_by_key(conn, character_key(character_name, server_name))
    return conn.execute(
        """
        SELECT e.*, s.source_time_text, s.scraped_at
        FROM ranking_entries e
        JOIN snapshots s ON s.id = e.snapshot_id
        WHERE e.character_name = ?
        ORDER BY e.snapshot_id DESC
        LIMIT 1
        """,
        (character_name,),
    ).fetchone()


def list_characters(conn: sqlite3.Connection, query: str | None = None, limit: int = 50) -> list[sqlite3.Row]:
    like = f"%{query.strip()}%" if query else "%"
    return conn.execute(
        """
        SELECT
            character_key,
            character_name,
            server_name,
            COUNT(*) AS samples,
            MIN(rank) AS best_rank,
            MAX(rank) AS worst_rank,
            MAX(snapshot_id) AS latest_snapshot_id
        FROM ranking_entries
        WHERE character_name LIKE ? OR server_name LIKE ?
        GROUP BY character_key
        ORDER BY latest_snapshot_id DESC, best_rank ASC
        LIMIT ?
        """,
        (like, like, limit),
    ).fetchall()


def character_history(conn: sqlite3.Connection, key: str) -> list[sqlite3.Row]:
    return conn.execute(
        """
        SELECT
            s.id AS snapshot_id,
            s.season,
            s.source_time_text,
            s.scraped_at,
            e.rank,
            e.character_name,
            e.server_name,
            e.tier_label,
            e.points_text,
            e.wins,
            e.win_delta,
            e.movement_direction,
            e.movement_value
        FROM ranking_entries e
        JOIN snapshots s ON s.id = e.snapshot_id
        WHERE e.character_key = ?
        ORDER BY s.id ASC
        """,
        (key,),
    ).fetchall()


def snapshot_summary(conn: sqlite3.Connection) -> list[sqlite3.Row]:
    return conn.execute(
        """
        SELECT id, season, source_time_text, scraped_at, entry_count
        FROM snapshots
        ORDER BY id DESC
        LIMIT 30
        """
    ).fetchall()
