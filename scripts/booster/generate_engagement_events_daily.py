#!/usr/bin/env python3
"""
Generate daily-resolution booster engagement events for the Engagement Drop Timeline demo.

Writes NDJSON bulk format with _id prefix evt-daily-* to avoid collisions with weekly events.
"""

from __future__ import annotations

import json
import random
from datetime import datetime, timedelta
from pathlib import Path

DONOR_IDS = [f"ALUM-{10000 + i}" for i in range(200)]
AT_RISK_DONORS = DONOR_IDS[:10]
DEMO_DONOR_ID = "ALUM-10001"
INFLECTION_DATE = datetime(2025, 9, 1)
START_DATE = datetime(2024, 3, 1)
END_DATE = datetime(2025, 12, 1)

NAMED_EVENTS = [
    {"date": datetime(2024, 4, 12), "label": "Spring Gala", "category": "attendance"},
    {"date": datetime(2024, 8, 31), "label": "Season Kickoff Dinner", "category": "attendance"},
    {"date": datetime(2024, 9, 7), "label": "Home Opener (Football)", "category": "attendance"},
    {"date": datetime(2024, 10, 5), "label": "Homecoming Game", "category": "attendance"},
    {"date": datetime(2024, 11, 3), "label": "Annual Fund Gala", "category": "attendance"},
    {"date": datetime(2025, 1, 18), "label": "Bowl Game Watch Party", "category": "attendance"},
    {"date": datetime(2025, 3, 15), "label": "Spring Gala", "category": "attendance"},
    {"date": datetime(2025, 5, 10), "label": "Alumni Weekend", "category": "attendance"},
    {"date": datetime(2025, 9, 20), "label": "Home Opener (Football)", "category": "attendance"},
    {"date": datetime(2025, 10, 4), "label": "Homecoming Game", "category": "attendance"},
    {"date": datetime(2025, 11, 8), "label": "Annual Fund Gala", "category": "attendance"},
]

EMAIL_CAMPAIGNS = [
    {"date": datetime(2024, 3, 15), "label": "Spring Giving Appeal", "category": "email"},
    {"date": datetime(2024, 5, 1), "label": "End of Year Update", "category": "email"},
    {"date": datetime(2024, 8, 15), "label": "Season Preview", "category": "email"},
    {"date": datetime(2024, 9, 20), "label": "First Game Recap", "category": "email"},
    {"date": datetime(2024, 10, 15), "label": "Homecoming Invite", "category": "email"},
    {"date": datetime(2024, 11, 1), "label": "Annual Fund Ask", "category": "email"},
    {"date": datetime(2024, 12, 10), "label": "Year-End Impact Report", "category": "email"},
    {"date": datetime(2025, 2, 1), "label": "Spring Gala Invite", "category": "email"},
    {"date": datetime(2025, 4, 10), "label": "Spring Giving Appeal", "category": "email"},
    {"date": datetime(2025, 6, 1), "label": "Summer Impact Update", "category": "email"},
    {"date": datetime(2025, 8, 15), "label": "Season Preview", "category": "email"},
    {"date": datetime(2025, 9, 5), "label": "Home Opener Invite", "category": "email"},
    {"date": datetime(2025, 10, 1), "label": "Homecoming Invite", "category": "email"},
    {"date": datetime(2025, 11, 1), "label": "Annual Fund Ask", "category": "email"},
]


def is_after_inflection(date: datetime, donor_id: str) -> bool:
    return donor_id in AT_RISK_DONORS and date >= INFLECTION_DATE


def rolling_baseline(signal_history: list[float], window: int = 30) -> float:
    if not signal_history:
        return 0.5
    return round(sum(signal_history[-window:]) / min(len(signal_history), window), 3)


def generate_events() -> list[dict]:
    events: list[dict] = []

    for donor_id in DONOR_IDS:
        at_risk = donor_id in AT_RISK_DONORS
        baseline_open_rate = random.uniform(0.55, 0.90)
        baseline_login_daily = random.uniform(0.2, 0.8)
        signal_history: list[float] = []

        current = START_DATE
        while current < END_DATE:
            gone_quiet = is_after_inflection(current, donor_id)
            logins = 0 if gone_quiet else (1 if random.random() < baseline_login_daily else 0)
            baseline = rolling_baseline(signal_history)
            signal_history.append(float(logins))

            events.append({
                "donor_id": donor_id,
                "event_type": "portal_login",
                "event_category": "login",
                "event_label": "Portal Login",
                "event_date": current.strftime("%Y-%m-%dT00:00:00Z"),
                "signal_value": logins,
                "baseline_value": baseline,
                "delta_from_baseline": round(logins - baseline, 3),
                "campaign": None,
                "fiscal_year": f"FY{current.year}",
            })
            current += timedelta(days=1)

        for campaign in EMAIL_CAMPAIGNS:
            if campaign["date"] < START_DATE or campaign["date"] > END_DATE:
                continue
            gone_quiet = is_after_inflection(campaign["date"], donor_id)
            opened = 0 if gone_quiet else (1 if random.random() < baseline_open_rate else 0)
            events.append({
                "donor_id": donor_id,
                "event_type": "email_open",
                "event_category": "email",
                "event_label": campaign["label"],
                "event_date": campaign["date"].strftime("%Y-%m-%dT09:00:00Z"),
                "signal_value": opened,
                "baseline_value": round(baseline_open_rate, 3),
                "delta_from_baseline": round(opened - baseline_open_rate, 3),
                "campaign": campaign["label"],
                "fiscal_year": f"FY{campaign['date'].year}",
            })

        for evt in NAMED_EVENTS:
            if evt["date"] < START_DATE or evt["date"] > END_DATE:
                continue
            gone_quiet = is_after_inflection(evt["date"], donor_id)
            attended = 0 if gone_quiet else (1 if random.random() < 0.75 else 0)
            events.append({
                "donor_id": donor_id,
                "event_type": "event_attendance",
                "event_category": "attendance",
                "event_label": evt["label"],
                "event_date": evt["date"].strftime("%Y-%m-%dT18:00:00Z"),
                "signal_value": attended,
                "baseline_value": 0.75,
                "delta_from_baseline": round(attended - 0.75, 3),
                "campaign": evt["label"],
                "fiscal_year": f"FY{evt['date'].year}",
            })

        for year in [2024, 2025]:
            gift_date = datetime(year, random.randint(10, 11), random.randint(1, 20))
            if at_risk and gift_date >= INFLECTION_DATE:
                continue
            if gift_date > END_DATE:
                continue
            amount = random.randint(25000, 75000) if at_risk else random.randint(1000, 50000)
            if donor_id == DEMO_DONOR_ID and year == 2024:
                gift_date = datetime(2024, 11, 3)
                amount = 50000
            events.append({
                "donor_id": donor_id,
                "event_type": "gift_made",
                "event_category": "gift",
                "event_label": f"Annual Fund Gift {year}",
                "event_date": gift_date.strftime("%Y-%m-%dT12:00:00Z"),
                "signal_value": amount,
                "baseline_value": 0,
                "delta_from_baseline": 0,
                "campaign": "annual-fund-ask",
                "fiscal_year": f"FY{year}",
            })

    return events


def write_ndjson(events: list[dict], output_path: Path) -> None:
    with output_path.open("w", encoding="utf-8") as handle:
        for index, event in enumerate(events):
            handle.write(json.dumps({"index": {"_id": f"evt-daily-{index}"}}) + "\n")
            handle.write(json.dumps(event) + "\n")


def main() -> None:
    random.seed(42)
    events = generate_events()
    output_path = Path(__file__).resolve().parent / "engagement_events_daily.ndjson"
    write_ndjson(events, output_path)
    demo_after = [
        e for e in events
        if e["donor_id"] == DEMO_DONOR_ID
        and e["event_type"] in ("portal_login", "email_open", "event_attendance")
        and e["event_date"][:10] >= INFLECTION_DATE.strftime("%Y-%m-%d")
    ]
    print(f"Generated {len(events):,} daily engagement events -> {output_path}")
    print(f"Demo donor {DEMO_DONOR_ID} post-inflection signal events: {len(demo_after)} (expect near-zero)")


if __name__ == "__main__":
    main()
