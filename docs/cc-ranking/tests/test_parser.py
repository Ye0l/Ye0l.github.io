import unittest

from cc_ranking.parser import parse_ranking_html


class ParserTest(unittest.TestCase):
    def test_parse_ranking_boxes(self):
        html = """
        <div class="wrap snum20">
          <div class="cc-list-head type1"><div class="time">2026-05-02 15:00～16:00 기준</div></div>
          <div class="cc-list-box">
            <div class="num">1</div>
            <div class="prev_num green"><div><span class="up"></span>24</div></div>
            <div class="name"><div><h3>캐리머신곽득구</h3><span><i></i>초코보</span></div></div>
            <div class="tier"><span class="tier5"></span></div>
            <div class="win"><div><p>34</p><span class="green">+13</span></div></div>
          </div>
          <div class="cc-list-box">
            <div class="num">2</div>
            <div class="prev_num gray"><div><span class="new"></span></div></div>
            <div class="name"><div><h3>Tairus</h3><span><i></i>카벙클</span></div></div>
            <div class="tier"><span class="tier6"></span></div>
            <div class="win"><div><p>31</p></div></div>
          </div>
        </div>
        """

        parsed = parse_ranking_html(html)

        self.assertEqual(parsed.season, 20)
        self.assertEqual(parsed.source_time_text, "2026-05-02 15:00～16:00 기준")
        self.assertEqual(len(parsed.entries), 2)
        self.assertEqual(parsed.entries[0].character_name, "캐리머신곽득구")
        self.assertEqual(parsed.entries[0].server_name, "초코보")
        self.assertEqual(parsed.entries[0].tier_label, "Diamond")
        self.assertEqual(parsed.entries[0].wins, 34)
        self.assertEqual(parsed.entries[0].win_delta, 13)
        self.assertEqual(parsed.entries[0].movement_direction, "up")
        self.assertEqual(parsed.entries[0].movement_value, 24)
        self.assertEqual(parsed.entries[1].movement_direction, "new")


if __name__ == "__main__":
    unittest.main()

