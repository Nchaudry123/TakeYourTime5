#!/usr/bin/env python3
"""Validate Royal deadlines and prioritize unfinished progression in free slots."""

import argparse
import json
from datetime import datetime
from pathlib import Path

ROYAL = {"Councillor": (9, "11/17"), "Justice": (8, "11/17"), "Faith": (5, "12/22")}
OTHER_CONFIDANTS = ("Chariot", "Lovers", "Death", "Temperance", "Fortune", "Emperor", "Priestess", "Hermit", "Empress", "Hierophant", "Star", "Hanged Man", "Tower", "Devil", "Sun", "Moon")
SOCIAL_STATS = ("Knowledge", "Guts", "Proficiency", "Kindness", "Charm")


def ordinal(date: str) -> int:
    month, day = map(int, date.split("/"))
    return datetime(2023 if month >= 4 else 2024, month, day).toordinal()


def optimize(payload: dict, starting_ranks: dict[str, int] | None = None) -> dict:
    ranks = {name: 0 for name in (*ROYAL, *OTHER_CONFIDANTS)}
    ranks.update(starting_ranks or {})
    days = sorted(payload["days"], key=lambda item: ordinal(item["date"]))
    for day in days:
        today = ordinal(day["date"])
        for slot_name in ("afternoon", "evening"):
            slot = day[slot_name]
            arcana = slot.get("confidant")
            if arcana in ranks and ranks[arcana] < ROYAL[arcana][0]:
                ranks[arcana] += 1
            if slot.get("kind") != "free":
                continue
            urgent = []
            for candidate, (target, deadline) in ROYAL.items():
                remaining = target - ranks[candidate]
                days_left = ordinal(deadline) - today
                if remaining > 0 and days_left >= 0:
                    urgent.append((days_left / remaining, days_left, candidate))
            if urgent:
                _, _, candidate = min(urgent)
                slot.update(kind="confidant", confidant=candidate, title=f"Royal priority — {candidate}", detail=f"Use this flexible slot for {candidate} when available; deadline {ROYAL[candidate][1]}.")
                ranks[candidate] += 1
            elif any(ranks[name] < 10 for name in OTHER_CONFIDANTS):
                candidate = min(OTHER_CONFIDANTS, key=lambda name: (ranks[name], name))
                slot.update(kind="confidant", confidant=candidate, title=f"Confidant priority — {candidate}", detail=f"Use this flexible slot for the lowest-ranked available Confidant, currently {candidate}.")
                ranks[candidate] += 1
            else:
                stat = SOCIAL_STATS[(today + (slot_name == "evening")) % len(SOCIAL_STATS)]
                slot.update(kind="stat", social_stat=stat, title=f"Raise {stat}", detail=f"Use the open slot on the lowest unfinished Social Stat, preferring {stat}.")
    failures = [f"{name} needs Rank {target} by {deadline}, projected {ranks[name]}" for name, (target, deadline) in ROYAL.items() if ranks[name] < target]
    if failures:
        raise ValueError("Royal deadline validation failed: " + "; ".join(failures))
    payload["optimizer"] = {
        "royal_deadlines_valid": True,
        "projected_ranks": ranks,
        "all_other_confidants_projected_max": all(ranks[name] >= 10 for name in OTHER_CONFIDANTS),
        "strategy": "Royal deadline slack first, then lowest Confidant rank, then lowest Social Stat",
    }
    return payload


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("input", type=Path)
    parser.add_argument("--output", type=Path, default=Path("data/optimized_schedule.json"))
    args = parser.parse_args()
    optimized = optimize(json.loads(args.input.read_text(encoding="utf-8")))
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(optimized, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Validated Royal deadlines and wrote {args.output}")


if __name__ == "__main__":
    main()
