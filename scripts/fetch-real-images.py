#!/usr/bin/env python3
"""Fetch real product images for TrendCart's 30 real Amazon products.

Saves to scripts/images/real/<key>.json (resumable). Sequential with spacing
to avoid 429s. Run in background; poll scripts/images/real/status.json.
"""
import json
import os
import re
import subprocess
import sys
import time

OUT_DIR = "/home/z/my-project/scripts/images/real"
STATUS_FILE = os.path.join(OUT_DIR, "status.json")
os.makedirs(OUT_DIR, exist_ok=True)

JOBS = {
    "sony-xm5": "Sony WH-1000XM5 black wireless noise canceling headphones product photo",
    "airpods-pro-2": "Apple AirPods Pro 2 white wireless earbuds with charging case product photo",
    "soundcore-space-one": "Soundcore Anker Space One black over-ear headphones product photo",
    "jbl-flip-6": "JBL Flip 6 portable bluetooth speaker black product photo",
    "anker-737": "Anker 737 power bank 24000mAh black portable charger product photo",
    "apple-watch-se": "Apple Watch SE midnight aluminum black sport band smartwatch product photo",
    "instant-pot-duo": "Instant Pot Duo 6 quart stainless steel electric pressure cooker product photo",
    "ninja-af101": "Ninja AF101 air fryer 4 quart black kitchen appliance product photo",
    "keurig-kmini": "Keurig K-Mini black single serve coffee maker product photo",
    "levoit-core-300": "Levoit Core 300 white air purifier product photo",
    "cerave-cream": "CeraVe Moisturizing Cream white tub product photo",
    "cosrx-snail": "COSRX Advanced Snail 96 Mucin Power Essence bottle product photo",
    "revlon-one-step": "Revlon One-Step Volumizer hair dryer brush black product photo",
    "sol-de-janeiro": "Sol de Janeiro Brazilian Bum Bum cream yellow jar product photo",
    "bowflex-552": "Bowflex SelectTech 552 adjustable dumbbells product photo",
    "fit-simplify-bands": "colorful resistance loop exercise bands set product photo",
    "gaiam-yoga-mat": "Gaiam thick yoga mat product photo",
    "stanley-quencher": "Stanley Quencher H2.0 40 oz tumbler black product photo",
    "crocs-classic": "black Crocs Classic Clogs product photo",
    "casio-f91w": "Casio F91W classic black digital wrist watch product photo",
    "champion-hoodie": "Champion grey pullover fleece hoodie product photo",
    "levis-505": "Levi's 505 regular fit blue jeans product photo",
    "logitech-g502": "Logitech G502 HERO black wired gaming mouse product photo",
    "redragon-k552": "Redragon K552 mechanical gaming keyboard product photo",
    "arctis-nova-7": "SteelSeries Arctis Nova 7 wireless gaming headset product photo",
    "xbox-controller": "Xbox wireless controller carbon black product photo",
    "furminator": "FURminator dog grooming deshedding brush tool product photo",
    "veken-fountain": "stainless steel cat water fountain automatic pet dispenser product photo",
    "mx-master-3s": "Logitech MX Master 3S graphite wireless mouse product photo",
    "nulaxy-stand": "Nulaxy adjustable aluminum laptop stand product photo",
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

def fetch_one(key: str, query: str) -> bool:
    path = os.path.join(OUT_DIR, f"{key}.json")
    if valid(path):
        return True
    try:
        proc = subprocess.run(
            ["z-ai", "image-search", "-q", query, "--count", "3",
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
        print(f"[{key}] error: {e}", flush=True)
    return False

def main():
    status = {k: ("done" if valid(os.path.join(OUT_DIR, f"{k}.json")) else "pending")
              for k in JOBS}
    write_status(status)
    for key, query in JOBS.items():
        if status[key] == "done":
            continue
        ok = False
        for attempt in (1, 2, 3, 4):
            ok = fetch_one(key, query)
            if ok:
                break
            wait = 20 * attempt
            print(f"[{key}] attempt {attempt} failed, retrying in {wait}s", flush=True)
            time.sleep(wait)
        status[key] = "done" if ok else "failed"
        write_status(status)
        print(f"[{key}] -> {status[key]}", flush=True)
        time.sleep(5)
    done = sum(1 for v in status.values() if v == "done")
    print(f"FINISHED: {done}/{len(JOBS)} fetched", flush=True)

if __name__ == "__main__":
    sys.exit(main())
