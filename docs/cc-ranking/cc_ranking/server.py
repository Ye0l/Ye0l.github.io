from __future__ import annotations

import argparse
from html import escape
import json
from pathlib import Path
import re
from urllib.parse import parse_qs, quote, urlparse
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

from .db import (
    character_history,
    connect,
    latest_entry_by_key,
    latest_entry_by_name,
    latest_snapshot,
    get_snapshot,
    list_characters,
    list_latest_entries,
    list_snapshot_entries,
    snapshot_summary,
)
from .fetch import DEFAULT_DB


ROOT = Path(__file__).resolve().parent.parent
WEB_ROOT = ROOT / "web"


class AppHandler(SimpleHTTPRequestHandler):
    db_path = DEFAULT_DB

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(WEB_ROOT), **kwargs)

    def do_GET(self) -> None:
        parsed = urlparse(self.path)
        if parsed.path == "/api/v1/graph.svg":
            return self._send_graph(parse_qs(parsed.query))
        if not parsed.path.startswith("/api/"):
            return super().do_GET()

        try:
            payload = self._api_response(parsed.path, parse_qs(parsed.query))
            self._send_json(payload)
        except Exception as exc:
            self.send_response(500)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(json.dumps({"error": str(exc)}, ensure_ascii=False).encode("utf-8"))

    def _api_response(self, path: str, query: dict[str, list[str]]) -> dict[str, object]:
        with connect(self.db_path) as conn:
            if path == "/api/latest":
                snapshot = latest_snapshot(conn)
                return {
                    "snapshot": dict(snapshot) if snapshot else None,
                    "entries": [dict(row) for row in list_latest_entries(conn)],
                }
            if path == "/api/snapshot":
                snapshot_id = _bounded_int(query.get("id", ["0"])[0], 1, 10**12)
                snapshot = get_snapshot(conn, snapshot_id)
                return {
                    "snapshot": dict(snapshot) if snapshot else None,
                    "entries": [dict(row) for row in list_snapshot_entries(conn, snapshot_id)] if snapshot else [],
                }
            if path == "/api/characters":
                term = query.get("q", [""])[0]
                return {"characters": [dict(row) for row in list_characters(conn, term)]}
            if path == "/api/history":
                key = query.get("key", [""])[0]
                if not key:
                    return {"history": []}
                return {"history": [dict(row) for row in character_history(conn, key)]}
            if path == "/api/snapshots":
                return {"snapshots": [dict(row) for row in snapshot_summary(conn)]}
            if path == "/api/v1/top":
                limit = _bounded_int(query.get("limit", ["10"])[0], 1, 100)
                snapshot_id = query.get("snapshot_id", [""])[0]
                snapshot = get_snapshot(conn, _bounded_int(snapshot_id, 1, 10**12)) if snapshot_id else latest_snapshot(conn)
                entries = list_snapshot_entries(conn, snapshot["id"], limit) if snapshot else []
                return {
                    "snapshot": dict(snapshot) if snapshot else None,
                    "entries": [_public_entry(row) for row in entries],
                }
            if path == "/api/v1/character":
                entry, history = self._character_payload(conn, query)
                return {
                    "character": _public_entry(entry) if entry else None,
                    "history": [_public_history(row) for row in history],
                    "summary": _history_summary(history),
                    "graph_url": f"/api/v1/graph.svg?key={quote(entry['character_key'])}" if entry else None,
                    "discord_embed": _discord_embed(entry, history) if entry else None,
                }
            if path == "/api/v1/search":
                term = query.get("q", [""])[0]
                return {"characters": [dict(row) for row in list_characters(conn, term, limit=10)]}
            if path == "/api/v1/snapshots":
                return {"snapshots": [dict(row) for row in snapshot_summary(conn)]}
        self.send_error(404)
        return {}

    def _character_payload(self, conn, query: dict[str, list[str]]):
        key = query.get("key", [""])[0]
        name = query.get("name", [""])[0]
        server = query.get("server", [""])[0] or None
        entry = latest_entry_by_key(conn, key) if key else latest_entry_by_name(conn, name, server) if name else None
        history = character_history(conn, entry["character_key"]) if entry else []
        return entry, history

    def _send_graph(self, query: dict[str, list[str]]) -> None:
        with connect(self.db_path) as conn:
            entry, history = self._character_payload(conn, query)
        body = _rank_svg(entry, history).encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "image/svg+xml; charset=utf-8")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _send_json(self, payload: dict[str, object]) -> None:
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self) -> None:
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()


def main() -> None:
    parser = argparse.ArgumentParser(description="Run local FF14 CC ranking dashboard.")
    parser.add_argument("--db", type=Path, default=DEFAULT_DB)
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=8000)
    args = parser.parse_args()

    AppHandler.db_path = args.db
    server = ThreadingHTTPServer((args.host, args.port), AppHandler)
    print(f"serving http://{args.host}:{args.port} using db={args.db}")
    server.serve_forever()


def _bounded_int(value: str, minimum: int, maximum: int) -> int:
    try:
        return max(minimum, min(maximum, int(value)))
    except ValueError:
        return minimum


def _public_entry(row) -> dict[str, object]:
    return {
        "rank": row["rank"],
        "character_name": row["character_name"],
        "server_name": row["server_name"],
        "character_key": row["character_key"],
        "tier": row["tier_label"],
        "points": row["points_text"],
        "wins": row["wins"],
        "win_delta": row["win_delta"],
        "movement": {
            "direction": row["movement_direction"],
            "value": row["movement_value"],
            "text": _movement_text(row),
        },
        "source_time": row["source_time_text"] if "source_time_text" in row.keys() else None,
        "scraped_at": row["scraped_at"] if "scraped_at" in row.keys() else None,
    }


def _public_history(row) -> dict[str, object]:
    return {
        "snapshot_id": row["snapshot_id"],
        "season": row["season"],
        "source_time": row["source_time_text"],
        "scraped_at": row["scraped_at"],
        "rank": row["rank"],
        "tier": row["tier_label"],
        "points": row["points_text"],
        "wins": row["wins"],
        "win_delta": row["win_delta"],
        "movement": {
            "direction": row["movement_direction"],
            "value": row["movement_value"],
            "text": _movement_text(row),
        },
    }


def _movement_text(row) -> str:
    direction = row["movement_direction"]
    value = row["movement_value"]
    if direction == "new":
        return "NEW"
    if direction == "up" and value is not None:
        return f"+{value}"
    if direction == "down" and value is not None:
        return f"-{value}"
    return "-"


def _history_summary(history) -> dict[str, object]:
    if not history:
        return {"samples": 0}
    ranks = [row["rank"] for row in history]
    wins = [row["wins"] for row in history if row["wins"] is not None]
    return {
        "samples": len(history),
        "first_rank": ranks[0],
        "latest_rank": ranks[-1],
        "best_rank": min(ranks),
        "worst_rank": max(ranks),
        "rank_delta": ranks[0] - ranks[-1],
        "latest_wins": wins[-1] if wins else None,
        "win_delta_total": (wins[-1] - wins[0]) if len(wins) >= 2 else 0,
    }


def _discord_embed(entry, history) -> dict[str, object]:
    summary = _history_summary(history)
    title = f"#{entry['rank']} {entry['character_name']}@{entry['server_name']}"
    return {
        "title": title,
        "description": f"{entry['tier_label'] or '-'} · {entry['wins'] if entry['wins'] is not None else '-'}승 · 변동 {_movement_text(entry)}",
        "color": 0x58D5C9,
        "fields": [
            {"name": "최고 순위", "value": f"#{summary.get('best_rank', '-')}", "inline": True},
            {"name": "최저 순위", "value": f"#{summary.get('worst_rank', '-')}", "inline": True},
            {"name": "누적 기록", "value": f"{summary.get('samples', 0)}회", "inline": True},
        ],
        "footer": {"text": entry["source_time_text"] or entry["scraped_at"] or ""},
    }


def _rank_svg(entry, history) -> str:
    width = 900
    height = 420
    if not entry:
        return _empty_svg(width, height, "Character not found")
    title = f"{entry['character_name']} @ {entry['server_name']}"
    if len(history) < 2:
        return _empty_svg(width, height, f"{title} - trend needs at least 2 snapshots")

    padding_x = 70
    padding_y = 76
    ranks = [row["rank"] for row in history]
    min_rank = min(ranks)
    max_rank = max(ranks)
    spread = max(1, max_rank - min_rank)
    plot_w = width - padding_x * 2
    plot_h = height - padding_y - 70

    points = []
    for index, row in enumerate(history):
        x = padding_x + (plot_w * index / max(1, len(history) - 1))
        y = padding_y + ((row["rank"] - min_rank) / spread) * plot_h
        points.append((x, y, row))

    polyline = " ".join(f"{x:.1f},{y:.1f}" for x, y, _ in points)
    circles = "\n".join(
        f'<circle cx="{x:.1f}" cy="{y:.1f}" r="6" fill="#66e3d3"><title>#{row["rank"]} {escape(row["source_time_text"] or "")}</title></circle>'
        for x, y, row in points
    )
    labels = "\n".join(
        f'<text x="{x:.1f}" y="{y - 12:.1f}" text-anchor="middle" fill="#dbeafe" font-size="18">#{row["rank"]}</text>'
        for x, y, row in points[-6:]
    )
    tier_changes = "\n".join(
        _tier_change_svg(x, y, row, index)
        for index, (x, y, row) in enumerate(points)
        if index > 0 and _normalize_tier(row["tier_label"]) != _normalize_tier(points[index - 1][2]["tier_label"])
    )
    date_labels = "\n".join(
        f'<text x="{x:.1f}" y="{height - 36}" text-anchor="{anchor}" fill="#94a3b8" font-family="Arial, sans-serif" font-size="16">{escape(_graph_date(row["source_time_text"] or row["scraped_at"] or ""))}</text>'
        for x, _, row, anchor in _date_label_points(points)
    )
    grid = "\n".join(
        f'<line x1="{padding_x}" y1="{padding_y + plot_h * i / 4:.1f}" x2="{width - padding_x}" y2="{padding_y + plot_h * i / 4:.1f}" stroke="#26364f" stroke-width="1" />'
        for i in range(5)
    )
    return f"""<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}">
  <rect width="100%" height="100%" fill="#0b1020"/>
  <rect x="22" y="22" width="{width - 44}" height="{height - 44}" rx="22" fill="#111a2e" stroke="#26364f"/>
  <text x="52" y="62" fill="#f8fafc" font-family="Arial, sans-serif" font-size="30" font-weight="700">{escape(title)}</text>
  <text x="52" y="96" fill="#94a3b8" font-family="Arial, sans-serif" font-size="18">latest #{entry['rank']} · best #{min_rank} · worst #{max_rank} · {len(history)} snapshots</text>
  {grid}
  <polyline points="{polyline}" fill="none" stroke="#66e3d3" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
  {circles}
  {tier_changes}
  {labels}
  {date_labels}
</svg>"""


def _tier_change_svg(x: float, y: float, row, index: int) -> str:
    label = escape(row["tier_label"] or "Tier changed")
    label_y = max(118, min(y - 24 - (index % 2) * 20, 338))
    return f"""<path d="M {x:.1f} {y - 10:.1f} L {x + 9:.1f} {y:.1f} L {x:.1f} {y + 10:.1f} L {x - 9:.1f} {y:.1f} Z" fill="#ff8fb3"/>
  <line x1="{x:.1f}" y1="{y:.1f}" x2="{x:.1f}" y2="{label_y + 5:.1f}" stroke="#ff8fb3" stroke-opacity="0.42"/>
  <text x="{x:.1f}" y="{label_y:.1f}" text-anchor="middle" fill="#ffd4df" font-family="Arial, sans-serif" font-size="15" font-weight="700">{label}</text>"""


def _date_label_points(points: list[tuple[float, float, object]]) -> list[tuple[float, float, object, str]]:
    if len(points) <= 4:
        indexes = list(range(len(points)))
    else:
        indexes = sorted({0, len(points) - 1, (len(points) - 1) // 3, ((len(points) - 1) * 2) // 3})
    anchors = []
    for index in indexes:
        if index == 0:
            anchor = "start"
        elif index == len(points) - 1:
            anchor = "end"
        else:
            anchor = "middle"
        x, y, row = points[index]
        anchors.append((x, y, row, anchor))
    return anchors


def _graph_date(value: str) -> str:
    text = str(value or "-")
    match = re.search(r"\d{4}[-/.]\d{1,2}[-/.]\d{1,2}", text)
    if match:
        return match.group(0).replace("/", "-").replace(".", "-")
    return text.split()[0] if text.split() else "-"


def _normalize_tier(value: object) -> str:
    return str(value or "").strip().lower()


def _empty_svg(width: int, height: int, message: str) -> str:
    return f"""<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}">
  <rect width="100%" height="100%" fill="#0b1020"/>
  <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#94a3b8" font-family="Arial, sans-serif" font-size="24">{escape(message)}</text>
</svg>"""


if __name__ == "__main__":
    main()
