#!/usr/bin/env python3
"""Scrape monthly Persona 5 Royal walkthrough tables into normalized JSON."""

from __future__ import annotations

import argparse
import json
import re
import time
from dataclasses import asdict, dataclass
from pathlib import Path
from urllib.parse import urljoin

import requests
from bs4 import BeautifulSoup, Tag

DEFAULT_INDEX = "https://www.neoseeker.com/persona-5-royal/walkthrough"
MONTHS = ("April", "May", "June", "July", "August", "September", "October", "November", "December", "January", "February", "March")
ROYAL_RULES = {
    "Councillor": {"name": "Takuto Maruki", "rank": 9, "deadline": "11/17"},
    "Justice": {"name": "Goro Akechi", "rank": 8, "deadline": "11/17"},
    "Faith": {"name": "Kasumi Yoshizawa", "rank": 5, "deadline": "12/22"},
}


@dataclass
class Activity:
    title: str
    detail: str
    kind: str
    confidant: str | None = None
    social_stat: str | None = None
    dialogue: list[str] | None = None


@dataclass
class Day:
    date: str
    weekday: str | None
    afternoon: Activity
    evening: Activity
    source_url: str


def clean(node: Tag | str | None) -> str:
    if node is None:
        return ""
    value = node.get_text(" ", strip=True) if isinstance(node, Tag) else str(node)
    return re.sub(r"\s+", " ", value).strip()


def classify(text: str) -> Activity:
    lower = text.lower()
    confidants = {
        "maruki": "Councillor", "akechi": "Justice", "kasumi": "Faith",
        "ryuji": "Chariot", "ann": "Lovers", "takemi": "Death",
        "kawakami": "Temperance", "chihaya": "Fortune", "yusuke": "Emperor",
        "makoto": "Priestess", "futaba": "Hermit", "haru": "Empress",
        "sojiro": "Hierophant", "hifumi": "Star", "iwai": "Hanged Man",
        "shinya": "Tower", "ohya": "Devil", "yoshida": "Sun", "mishima": "Moon",
    }
    stats = ("knowledge", "guts", "proficiency", "kindness", "charm")
    found_confidant = next((arcana for name, arcana in confidants.items() if name in lower), None)
    found_stat = next((stat.title() for stat in stats if stat in lower), None)
    if found_confidant:
        kind, title = "confidant", f"{found_confidant} Confidant"
    elif found_stat:
        kind, title = "stat", f"Raise {found_stat}"
    elif "palace" in lower or "mementos" in lower:
        kind, title = "palace", "Metaverse objective"
    elif not text or "automatic" in lower or lower == "auto":
        kind, title = "free", "Automatic story"
    else:
        kind, title = "free", text[:72]
    answers = re.findall(r'[“\"]([^”\"]{2,90})[”\"]', text)
    return Activity(title, text or "No free action.", kind, found_confidant, found_stat, answers or None)


def parse_date(text: str, month_number: int) -> tuple[str, str | None] | None:
    match = re.search(r"(?:(\d{1,2})\s*/\s*)?(\d{1,2})(?:st|nd|rd|th)?", text)
    if not match:
        return None
    day = int(match.group(2))
    if not 1 <= day <= 31:
        return None
    weekdays = ("Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday")
    weekday = next((name for name in weekdays if name.lower() in text.lower()), None)
    return f"{month_number}/{day}", weekday


def find_month_url(index_soup: BeautifulSoup, base_url: str, month: str) -> str:
    for anchor in index_soup.find_all("a", href=True):
        if clean(anchor).lower() == month.lower() or month.lower() in anchor["href"].lower():
            return urljoin(base_url, anchor["href"])
    return urljoin(base_url, month)


def parse_month(html: str, url: str, month_number: int) -> list[Day]:
    soup = BeautifulSoup(html, "html.parser")
    results: list[Day] = []
    for row in soup.select("table tr"):
        cells = row.find_all(["th", "td"], recursive=False)
        if len(cells) < 2:
            continue
        parsed = parse_date(clean(cells[0]), month_number)
        if not parsed:
            continue
        date, weekday = parsed
        results.append(Day(date, weekday, classify(clean(cells[1])), classify(clean(cells[2]) if len(cells) > 2 else "Automatic story"), url))
    return results


def scrape(index_url: str, delay: float) -> list[Day]:
    session = requests.Session()
    session.headers["User-Agent"] = "TakeYourTimeCalendar/1.0 (personal walkthrough parser)"
    response = session.get(index_url, timeout=30)
    response.raise_for_status()
    index_soup = BeautifulSoup(response.text, "html.parser")
    output: list[Day] = []
    for offset, month in enumerate(MONTHS):
        month_number = ((3 + offset) % 12) + 1
        url = find_month_url(index_soup, index_url, month)
        page = session.get(url, timeout=30)
        page.raise_for_status()
        output.extend(parse_month(page.text, url, month_number))
        time.sleep(delay)
    return output


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--url", default=DEFAULT_INDEX)
    parser.add_argument("--output", type=Path, default=Path("data/walkthrough.json"))
    parser.add_argument("--delay", type=float, default=1.0)
    args = parser.parse_args()
    days = scrape(args.url, args.delay)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    payload = {"source": args.url, "royal_targets": ROYAL_RULES, "days": [asdict(day) for day in days]}
    args.output.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Wrote {len(days)} days to {args.output}")


if __name__ == "__main__":
    main()
