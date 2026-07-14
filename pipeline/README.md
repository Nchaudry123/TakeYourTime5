# Walkthrough data pipeline

This pipeline turns a public, day-by-day Persona 5 Royal walkthrough into normalized JSON for the calendar.

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r pipeline/requirements.txt
python pipeline/scrape_walkthrough.py
python pipeline/optimize_schedule.py data/walkthrough.json
```

The scraper uses a descriptive user agent and a one-second delay between requests. Review the selected site's terms and robots policy before running it. Page markup changes over time, so extraction and classification are separate.

The optimizer reserves deadline slack for Councillor Rank 9 and Justice Rank 8 by November 17, then Faith Rank 5 by December 22. Remaining flexible slots go to the lowest-ranked unfinished Confidant before Social Stat cleanup. Its output includes an explicit `all_other_confidants_projected_max` validation flag. Scraped dialogue stays in a dedicated array so the frontend can display it without parsing prose.
