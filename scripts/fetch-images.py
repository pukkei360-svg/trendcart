#!/usr/bin/env python3
"""Sequential, rate-limit-aware image fetcher for TrendCart seed data.

- Runs `z-ai image-search` one at a time, parses stdout JSON (the -o flag proved
  unreliable under load), validates it, and saves to scripts/images/<key>.json.
- Retries on 429 / failure with backoff. Resumable: skips keys whose JSON is
  already valid.
- Writes progress to scripts/images/fetch-status.json for external polling.
"""
import json
import os
import re
import subprocess
import sys
import time

OUT_DIR = "/home/z/my-project/scripts/images"
STATUS_FILE = os.path.join(OUT_DIR, "fetch-status.json")
os.makedirs(OUT_DIR, exist_ok=True)

JOBS = {
    "earbuds": ("white wireless bluetooth earbuds with charging case product photo", 3),
    "speaker": ("portable bluetooth speaker product photo", 2),
    "smartwatch": ("black smartwatch fitness tracker product photo", 2),
    "charger": ("compact USB-C fast wall charger product photo", 2),
    "powerbank": ("slim black power bank portable charger for smartphone", 2),
    "airfryer": ("modern digital air fryer kitchen appliance", 2),
    "chopper": ("vegetable chopper kitchen gadget with container", 2),
    "robotvacuum": ("robot vacuum cleaner on hardwood floor", 2),
    "frother": ("portable electric milk frother for coffee", 2),
    "containers": ("glass meal prep storage containers with lids", 2),
    "sunsetlamp": ("sunset projection lamp warm ambient light", 2),
    "hotairbrush": ("hot air styling brush hair dryer brush", 2),
    "serum": ("vitamin C facial serum dropper bottle skincare", 2),
    "guasha": ("jade roller and gua sha facial massage tools", 2),
    "brushset": ("professional makeup brush set with case", 2),
    "resbands": ("colorful resistance bands set for home workout", 2),
    "dumbbell": ("adjustable dumbbell hand weights home gym", 2),
    "yogamat": ("rolled up yoga mat for exercise", 2),
    "sunglasses": ("stylish polarized sunglasses product photo", 2),
    "crossbody": ("small leather crossbody bag for women", 2),
    "sneakers": ("minimalist white sneakers product photo", 2),
    "wristwatch": ("minimalist analog wristwatch product photo", 2),
    "headset": ("wireless gaming headset with microphone RGB", 2),
    "gamemouse": ("ergonomic RGB gaming mouse product photo", 2),
    "keyboard": ("mechanical keyboard with rainbow backlit keys", 2),
    "petbrush": ("self cleaning pet grooming brush for dogs and cats", 2),
    "petfountain": ("cat water fountain automatic pet dispenser", 2),
    "laptopstand": ("aluminum adjustable laptop stand for desk", 2),
    "deskorganizer": ("wooden desk organizer with compartments office", 2),
}

def valid(path: str) -> bool:
    try:
        with open(path) as f:
            d = json.load(f)
        return bool(d.get("success")) and len(d.get("results") or []) > 0
    except Exception:
        return False

def write_status(status: dict):
    tmp = STATUS_FILE + ".tmp"
    with open(tmp, "w") as f:
        json.dump(status, f, indent=2)
    os.replace(tmp, STATUS_FILE)

def fetch_one(key: str, query: str, count: int, attempt: int = 1) -> bool:
    path = os.path.join(OUT_DIR, f"{key}.json")
    if valid(path):
        return True
    try:
        proc = subprocess.run(
            ["z-ai", "image-search", "-q", query, "--count", str(count),
             "--gl", "us", "--no-rank"],
            capture_output=True, text=True, timeout=150,
        )
        out = proc.stdout or ""
        m = re.search(r"\{.*\}", out, re.S)
        if proc.returncode == 0 and m:
            data = json.loads(m.group(0))
            if data.get("success") and data.get("results"):
                tmp = path + ".tmp"
                with open(tmp, "w") as f:
                    json.dump(data, f, indent=2)
                os.replace(tmp, path)
                return True
    except Exception as e:
        print(f"[{key}] attempt {attempt} error: {e}", flush=True)
    return False

def main():
    status = {k: ("done" if valid(os.path.join(OUT_DIR, f"{k}.json")) else "pending")
              for k in JOBS}
    write_status(status)
    for key, (query, count) in JOBS.items():
        if status[key] == "done":
            continue
        ok = False
        for attempt in (1, 2, 3, 4):
            ok = fetch_one(key, query, count, attempt)
            if ok:
                break
            wait = 20 * attempt
            print(f"[{key}] attempt {attempt} failed, retrying in {wait}s", flush=True)
            time.sleep(wait)
        status[key] = "done" if ok else "failed"
        write_status(status)
        print(f"[{key}] -> {status[key]}", flush=True)
        # spacing to stay under the rate limit
        time.sleep(12)
    done = sum(1 for v in status.values() if v == "done")
    print(f"FINISHED: {done}/{len(JOBS)} fetched", flush=True)

if __name__ == "__main__":
    sys.exit(main())
