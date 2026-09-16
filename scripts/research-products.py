#!/usr/bin/env python3
"""Research real Amazon products for TrendCart.

Runs `z-ai function -n web_search` sequentially for each candidate product,
saves raw results to scripts/research/<key>.json for curation.
Resumable: skips keys already fetched.
"""
import json
import os
import subprocess
import sys
import time

OUT_DIR = "/home/z/my-project/scripts/research"
os.makedirs(OUT_DIR, exist_ok=True)

# key -> search query (product name + amazon to bias toward product pages)
PRODUCTS = {
    # Electronics (6)
    "sony-xm5": "Sony WH-1000XM5 wireless noise canceling headphones buy",
    "airpods-pro-2": "Apple AirPods Pro 2nd generation USB-C buy",
    "soundcore-space-one": "Soundcore by Anker Space One wireless headphones buy",
    "jbl-flip-6": "JBL Flip 6 portable bluetooth speaker buy",
    "anker-737": "Anker 737 Power Bank PowerCore 24K 24000mAh buy",
    "apple-watch-se": "Apple Watch SE 2nd generation buy",
    # Home & Kitchen (4)
    "instant-pot-duo": "Instant Pot Duo 7-in-1 electric pressure cooker 6 quart buy",
    "ninja-af101": "Ninja AF101 air fryer 4 quart buy",
    "keurig-kmini": "Keurig K-Mini single serve coffee maker buy",
    "levoit-core-300": "Levoit Core 300 air purifier buy",
    # Beauty (4)
    "cerave-cream": "CeraVe Moisturizing Cream 19 ounce buy",
    "cosrx-snail": "COSRX Advanced Snail 96 Mucin Power Essence buy",
    "revlon-one-step": "Revlon One-Step Volumizer hair dryer brush buy",
    "sol-de-janeiro": "Sol de Janeiro Brazilian Bum Bum Cream buy",
    # Fitness (4)
    "bowflex-552": "Bowflex SelectTech 552 adjustable dumbbells pair buy",
    "fit-simplify-bands": "Fit Simplify resistance bands set exercise loops buy",
    "gaiam-yoga-mat": "Gaiam Essentials thick yoga mat buy",
    "stanley-quencher": "Stanley Quencher H2.0 40 oz tumbler buy",
    # Fashion (4)
    "crocs-classic": "Crocs Classic Clogs unisex buy",
    "casio-f91w": "Casio F91W-1 classic digital watch buy",
    "champion-hoodie": "Champion Powerblend fleece pullover hoodie buy",
    "levis-505": "Levi's 505 regular fit jeans men buy",
    # Gaming (4)
    "logitech-g502": "Logitech G502 HERO wired gaming mouse buy",
    "redragon-k552": "Redragon K552 mechanical gaming keyboard buy",
    "arctis-nova-7": "SteelSeries Arctis Nova 7 wireless gaming headset buy",
    "xbox-controller": "Xbox wireless controller carbon black buy",
    # Pet (2)
    "furminator": "FURminator deShedding tool for dogs buy",
    "veken-fountain": "Veken cat water fountain pet fountain buy",
    # Office (2)
    "mx-master-3s": "Logitech MX Master 3S wireless performance mouse buy",
    "nulaxy-stand": "Nulaxy laptop stand adjustable aluminum buy",
}


def valid(path: str) -> bool:
    try:
        with open(path) as f:
            d = json.load(f)
        return isinstance(d, list) and len(d) > 0
    except Exception:
        return False


def fetch(key: str, query: str) -> bool:
    out = os.path.join(OUT_DIR, f"{key}.json")
    if valid(out):
        print(f"[skip] {key}")
        return True
    args = json.dumps({"query": query, "num": 10})
    for attempt in range(3):
        try:
            r = subprocess.run(
                ["z-ai", "function", "-n", "web_search", "-a", args],
                capture_output=True, text=True, timeout=90,
            )
            if r.returncode != 0:
                raise RuntimeError(f"exit {r.returncode}: {r.stderr[:200]}")
            # stdout may contain non-JSON banner lines; find the JSON array
            txt = r.stdout.strip()
            start = txt.find("[")
            if start == -1:
                raise RuntimeError("no JSON array in output")
            data = json.loads(txt[start:])
            if not isinstance(data, list) or not data:
                raise RuntimeError("empty results")
            with open(out, "w") as f:
                json.dump(data, f, indent=1)
            print(f"[ok]   {key} ({len(data)} results)")
            return True
        except Exception as e:
            wait = 3 * (attempt + 1)
            print(f"[retry {attempt+1}] {key}: {e} — waiting {wait}s", flush=True)
            time.sleep(wait)
    return False


def main() -> int:
    failed = []
    for i, (key, query) in enumerate(PRODUCTS.items()):
        if not fetch(key, query):
            failed.append(key)
        time.sleep(1.2)
    print(f"\nDone. {len(PRODUCTS) - len(failed)}/{len(PRODUCTS)} fetched.")
    if failed:
        print("FAILED:", ", ".join(failed))
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
