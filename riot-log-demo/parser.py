"""Summarize normalized client and Windows JSONL events around a launch failure."""

import argparse
import json
import re
from datetime import datetime, timedelta, timezone
from pathlib import Path

SAMPLE_INCIDENT = "2026-11-20T21:03:00+07:00"
SAMPLE_CLIENT = ['{"time":"2026-11-20T21:03:00+07:00","event":"launch_failed"}']
SAMPLE_WINDOWS = [
    '{"time":"2026-11-20T21:02:00+07:00","event":"service_stopped","service":"vgc"}'
]
TIMESTAMP = re.compile(r"[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(?:Z|[+-](?:[01][0-9]|2[0-3]):[0-5][0-9])")


def utc_time(value):
    if not isinstance(value, str) or not TIMESTAMP.fullmatch(value):
        raise ValueError("expected an ISO 8601 timestamp with seconds and a timezone")
    return datetime.fromisoformat(value.replace("Z", "+00:00")).astimezone(timezone.utc)


def utc_text(instant):
    return instant.isoformat(timespec="milliseconds").replace("+00:00", "Z")


def make_report(sources, incident, sample=False):
    events = []
    unreadable = 0
    for source, lines in sources:
        for number, line in enumerate(lines, start=1):
            if not line.strip():
                continue
            try:
                record = json.loads(line)
                if not isinstance(record, dict):
                    raise ValueError("expected a JSON object")
                when = utc_time(record.get("time"))
            except (ValueError, OverflowError):
                unreadable += 1
                continue

            if not timedelta(0) <= incident - when <= timedelta(minutes=2):
                continue
            event = record.get("event")
            if source == "client":
                recognized = event == "launch_failed"
            else:
                recognized = event == "service_stopped" and record.get("service") == "vgc"
            if recognized:
                events.append({"source": source, "line": number, "utc": utc_text(when), "event": event})
            else:
                unreadable += 1

    events.sort(key=lambda row: row["utc"])
    return {"sample": sample, "incident_utc": utc_text(incident),
            "unreadable_lines": unreadable, "events": events}


def main():
    cli = argparse.ArgumentParser(description=__doc__)
    cli.add_argument("--client", type=Path, help="normalized client JSONL file")
    cli.add_argument("--windows", type=Path, help="normalized Windows JSONL file")
    cli.add_argument("--incident", help="incident timestamp, e.g. " + SAMPLE_INCIDENT)
    args = cli.parse_args()

    if args.client is None and args.windows is None and args.incident is None:
        sources = [("client", SAMPLE_CLIENT), ("windows", SAMPLE_WINDOWS)]
        report = make_report(sources, utc_time(SAMPLE_INCIDENT), sample=True)
    else:
        if not (args.client and args.windows and args.incident):
            cli.error("supply --client, --windows and --incident together")
        try:
            incident = utc_time(args.incident)
            with args.client.open(encoding="utf-8-sig") as client, args.windows.open(encoding="utf-8-sig") as windows:
                report = make_report([("client", client), ("windows", windows)], incident)
        except (OSError, ValueError, OverflowError) as error:
            cli.error(str(error))

    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
