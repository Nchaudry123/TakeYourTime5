import unittest

from scrape_walkthrough import classify, parse_month


class PipelineTests(unittest.TestCase):
    def test_classifies_royal_confidant(self):
        item = classify("Visit Maruki and reach Councillor Rank 3")
        self.assertEqual(item.kind, "confidant")
        self.assertEqual(item.confidant, "Councillor")

    def test_parses_month_table(self):
        html = "<table><tr><td>4/18 Tuesday</td><td>Visit Takemi</td><td>Study for Knowledge</td></tr></table>"
        result = parse_month(html, "https://example.test/april", 4)
        self.assertEqual(result[0].date, "4/18")
        self.assertEqual(result[0].afternoon.confidant, "Death")
        self.assertEqual(result[0].evening.social_stat, "Knowledge")


if __name__ == "__main__":
    unittest.main()
