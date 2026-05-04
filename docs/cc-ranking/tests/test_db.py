from pathlib import Path
import tempfile
import unittest

from cc_ranking.db import connect, save_snapshot, snapshot_has_changes
from cc_ranking.parser import ParsedRanking, RankingEntry


class SnapshotChangeTest(unittest.TestCase):
    def test_snapshot_has_changes_tracks_same_source_time_content(self):
        parsed = _parsed(wins=10)

        with tempfile.TemporaryDirectory() as tmpdir:
            db_path = Path(tmpdir) / "ranking.sqlite3"
            with connect(db_path) as conn:
                self.assertTrue(snapshot_has_changes(conn, parsed))
                save_snapshot(conn, parsed, "https://example.test/ranking")
                self.assertFalse(snapshot_has_changes(conn, parsed))
                self.assertTrue(snapshot_has_changes(conn, _parsed(wins=11)))


def _parsed(wins: int) -> ParsedRanking:
    return ParsedRanking(
        season=20,
        source_time_text="2026-05-02 15:00～16:00 기준",
        entries=[
            RankingEntry(
                rank=1,
                character_name="캐리머신곽득구",
                server_name="초코보",
                tier_code="tier5",
                tier_label="Diamond",
                points_text=None,
                wins=wins,
                win_delta=1,
                movement_direction="up",
                movement_value=1,
            )
        ],
    )


if __name__ == "__main__":
    unittest.main()
