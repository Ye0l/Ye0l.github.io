from __future__ import annotations

from dataclasses import dataclass
from html.parser import HTMLParser
import re
from typing import Any


TIER_LABELS = {
    "tier1": "Bronze",
    "tier2": "Silver",
    "tier3": "Gold",
    "tier4": "Platinum",
    "tier5": "Diamond",
    "tier6": "Crystal",
    "tier7": "Omega",
    "tier8": "Ultima",
}


@dataclass(frozen=True)
class RankingEntry:
    rank: int
    character_name: str
    server_name: str
    tier_code: str | None
    tier_label: str | None
    points_text: str | None
    wins: int | None
    win_delta: int | None
    movement_direction: str | None
    movement_value: int | None


@dataclass(frozen=True)
class ParsedRanking:
    season: int | None
    source_time_text: str | None
    entries: list[RankingEntry]


class _RankingHTMLParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.season: int | None = None
        self.source_time_text: str | None = None
        self.entries: list[RankingEntry] = []

        self._tag_stack: list[tuple[str, set[str]]] = []
        self._in_time = False
        self._time_parts: list[str] = []
        self._current: dict[str, Any] | None = None
        self._section_stack: list[str] = []
        self._capture: str | None = None
        self._capture_parts: list[str] = []
        self._pending_movement_direction: str | None = None

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        classes = _classes(attrs)
        self._tag_stack.append((tag, classes))

        if self.season is None:
            for class_name in classes:
                match = re.fullmatch(r"snum(\d+)", class_name)
                if match:
                    self.season = int(match.group(1))

        if "time" in classes and self._inside_class("cc-list-head"):
            self._in_time = True
            self._time_parts = []

        if "cc-list-box" in classes:
            self._current = {
                "rank": None,
                "character_name": None,
                "server_name": None,
                "tier_code": None,
                "points_text": None,
                "wins": None,
                "win_delta": None,
                "movement_direction": None,
                "movement_value": None,
            }
            self._section_stack = []
            self._pending_movement_direction = None
            return

        if self._current is None:
            return

        if tag == "span":
            if "up" in classes:
                self._pending_movement_direction = "up"
            elif "down" in classes:
                self._pending_movement_direction = "down"
            elif "new" in classes:
                self._current["movement_direction"] = "new"
                self._current["movement_value"] = None

        section = _entry_section(classes)
        if section:
            self._section_stack.append(section)
            if section == "tier":
                tier_code = next((c for c in classes if re.fullmatch(r"tier\d+", c)), None)
                if tier_code:
                    self._current["tier_code"] = tier_code

        if tag == "span" and self._current_section() == "tier":
            tier_code = next((c for c in classes if re.fullmatch(r"tier\d+", c)), None)
            if tier_code:
                self._current["tier_code"] = tier_code

        if "num" in classes:
            self._start_capture("rank")
        elif "prev_num" in classes:
            self._start_capture("movement")
        elif tag == "h3" and self._current_section() == "name":
            self._start_capture("character_name")
        elif tag == "span" and self._current_section() == "name":
            self._start_capture("server_name")
        elif tag == "p" and self._current_section() == "win":
            self._start_capture("wins")
        elif tag == "span" and self._current_section() == "win":
            self._start_capture("win_delta")
        elif self._current_section() == "point" and tag in {"p", "span"}:
            self._start_capture("points_text")

    def handle_data(self, data: str) -> None:
        if self._in_time:
            self._time_parts.append(data)
        if self._capture is not None:
            self._capture_parts.append(data)

    def handle_endtag(self, tag: str) -> None:
        if self._capture is not None:
            capture_tag = self._capture.split(":", 1)[0]
            if capture_tag == tag:
                field = self._capture.split(":", 1)[1]
                self._finish_capture(field)

        if self._in_time and self._tag_stack and self._tag_stack[-1][0] == tag:
            _, classes = self._tag_stack[-1]
            if "time" in classes:
                self._in_time = False
                self.source_time_text = _clean_text(" ".join(self._time_parts)) or None

        if self._current is not None and self._tag_stack and self._tag_stack[-1][0] == tag:
            _, classes = self._tag_stack[-1]
            section = _entry_section(classes)
            if section and self._section_stack and self._section_stack[-1] == section:
                self._section_stack.pop()
            if "cc-list-box" in classes:
                entry = self._build_entry()
                if entry is not None:
                    self.entries.append(entry)
                self._current = None
                self._section_stack = []

        if self._tag_stack:
            self._tag_stack.pop()

    def _inside_class(self, class_name: str) -> bool:
        return any(class_name in classes for _, classes in self._tag_stack)

    def _current_section(self) -> str | None:
        return self._section_stack[-1] if self._section_stack else None

    def _start_capture(self, field: str) -> None:
        if not self._tag_stack:
            return
        tag = self._tag_stack[-1][0]
        self._capture = f"{tag}:{field}"
        self._capture_parts = []

    def _finish_capture(self, field: str) -> None:
        if self._current is None:
            return
        text = _clean_text(" ".join(self._capture_parts))
        self._capture = None
        self._capture_parts = []
        if not text:
            return

        if field == "rank":
            self._current["rank"] = _to_int(text)
        elif field == "movement":
            value = _to_int(text)
            if self._current.get("movement_direction") != "new" and value is not None:
                self._current["movement_direction"] = self._pending_movement_direction
                self._current["movement_value"] = abs(value)
        elif field == "wins":
            self._current["wins"] = _to_int(text)
        elif field == "win_delta":
            self._current["win_delta"] = _to_int(text)
        else:
            self._current[field] = text

    def _build_entry(self) -> RankingEntry | None:
        if self._current is None:
            return None
        rank = self._current.get("rank")
        character_name = self._current.get("character_name")
        server_name = self._current.get("server_name")
        if not isinstance(rank, int) or not character_name or not server_name:
            return None
        tier_code = self._current.get("tier_code")
        return RankingEntry(
            rank=rank,
            character_name=character_name,
            server_name=server_name,
            tier_code=tier_code,
            tier_label=TIER_LABELS.get(tier_code),
            points_text=self._current.get("points_text"),
            wins=self._current.get("wins"),
            win_delta=self._current.get("win_delta"),
            movement_direction=self._current.get("movement_direction"),
            movement_value=self._current.get("movement_value"),
        )


def parse_ranking_html(html: str) -> ParsedRanking:
    parser = _RankingHTMLParser()
    parser.feed(html)
    parser.close()
    return ParsedRanking(
        season=parser.season,
        source_time_text=parser.source_time_text,
        entries=parser.entries,
    )


def _classes(attrs: list[tuple[str, str | None]]) -> set[str]:
    class_attr = next((value for key, value in attrs if key == "class"), None)
    return set(class_attr.split()) if class_attr else set()


def _entry_section(classes: set[str]) -> str | None:
    if "prev_num" in classes:
        return "movement"
    if "name" in classes:
        return "name"
    if "tier" in classes:
        return "tier"
    if "point" in classes:
        return "point"
    if "win" in classes:
        return "win"
    return None


def _clean_text(value: str) -> str:
    return re.sub(r"\s+", " ", value).strip()


def _to_int(value: str) -> int | None:
    match = re.search(r"[+-]?\d+", value.replace(",", ""))
    return int(match.group(0)) if match else None

