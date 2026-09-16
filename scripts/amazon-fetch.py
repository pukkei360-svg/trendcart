#!/usr/bin/env python3
"""Fetch REAL Amazon product data for TrendCart's 30 products. v2

Improvements over v1:
- price from data-components displayString (buybox-equivalent on degraded pages)
- list price from "List Price:" label or a-text-price strikethrough
- tiny-page (<30KB) detection => Amazon bot-wall, retry with backoff
- cookie jar + UA rotation to reduce blocking
- must-not keywords (renewed/used/refurbished/knockoff patterns)
- saves raw HTML per key for debugging (scripts/amazon/html/<key>.html)
- --refetch-prices mode: re-fetch product page when price is missing
"""
import json
import os
import random
import re
import subprocess
import sys
import time
import urllib.parse

OUT_DIR = "/home/z/my-project/scripts/amazon"
HTML_DIR = os.path.join(OUT_DIR, "html")
os.makedirs(OUT_DIR, exist_ok=True)
os.makedirs(HTML_DIR, exist_ok=True)

UAS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv/127.0) Gecko/20100101 Firefox/127.0",
]
COOKIES = "/tmp/amz_cookies.txt"

# key -> (amazon search query, must-have words, must-not words)
PRODUCTS = {
    # Electronics (6)
    "sony-xm5": ("Sony WH-1000XM5 wireless noise canceling headphones black", ["sony", "wh-1000xm5"], ["renewed", "used", "refurbished"]),
    "airpods-pro-2": ("Apple AirPods Pro 2 USB-C wireless earbuds", ["airpods", "pro"], ["renewed", "used", "refurbished", "case only"]),
    "soundcore-space-one": ("Soundcore by Anker Space One wireless headphones black", ["space one"], ["renewed", "used", "refurbished"]),
    "jbl-flip-6": ("JBL Flip 6 portable bluetooth speaker", ["jbl", "flip 6"], ["renewed", "used", "refurbished", "speaker stand", "flip 5", "flip 7"]),
    "anker-737": ("Anker 737 Power Bank PowerCore 24K 24000mAh 140W", ["anker", "737"], ["renewed", "used", "refurbished", "case", "cable"]),
    "apple-watch-se": ("Apple Watch SE 2nd Generation GPS 40mm Midnight Aluminum Sport Band", ["apple watch se"], ["renewed", "used", "refurbished", "band", "case", "compatible", "screen protector", "cover"]),
    # Home & Kitchen (4)
    "instant-pot-duo": ("Instant Pot Duo 7-in-1 electric pressure cooker 6 quart", ["instant pot", "duo"], ["renewed", "used", "refurbished", "lid", "seal"]),
    "ninja-af101": ("Ninja AF101 air fryer 4 quart", ["ninja", "af101"], ["renewed", "used", "refurbished", "liner", "basket", "chefman"]),
    "keurig-kmini": ("Keurig K-Mini single serve coffee maker black", ["keurig", "k-mini"], ["renewed", "used", "refurbished", "pods", "descaler"]),
    "levoit-core-300": ("Levoit Core 300 HEPA air purifier white", ["levoit", "core 300"], ["renewed", "used", "refurbished", "filter"]),
    # Beauty (4)
    "cerave-cream": ("CeraVe Moisturizing Cream 19 ounce", ["cerave", "moisturizing cream"], ["healing", "pump replacement"]),
    "cosrx-snail": ("COSRX Advanced Snail 96 Mucin Power Essence 3.38 oz", ["cosrx", "mucin power essence"], ["set", "duo", "2 pcs", "booster", "mist", "kit"]),
    "revlon-one-step": ("Revlon One-Step Volumizer original hair dryer brush 2.8 inch", ["revlon", "one-step"], ["plus", "2.4", "brush head only"]),
    "sol-de-janeiro": ("Sol de Janeiro Brazilian Bum Bum Cream 240ml", ["sol de janeiro", "bum bum"], ["perfume", "mist", "set"]),
    # Fitness (4)
    "bowflex-552": ("Bowflex SelectTech 552 adjustable dumbbells pair", ["bowflex", "552"], ["renewed", "used", "stand", "single"]),
    "fit-simplify-bands": ("Fit Simplify resistance loop exercise bands set of 5", ["fit simplify", "resistance"], []),
    "gaiam-yoga-mat": ("Gaiam Essentials thick yoga mat with carrying strap", ["gaiam", "yoga mat"], ["towel", "strap only"]),
    "stanley-quencher": ("Stanley Quencher H2.0 FlowState 40 oz tumbler black", ["stanley", "quencher"], ["lid", "straw", "boot", "handle", "template"]),
    # Fashion (4)
    "crocs-classic": ("Crocs Classic Clogs unisex black", ["crocs", "classic"], ["jibbitz", "charms", "renewed", "kids"]),
    "casio-f91w": ("Casio F91W-1 men's digital watch black resin strap", ["casio", "f91w"], ["band", "strap", "battery"]),
    "champion-hoodie": ("Champion Powerblend fleece pullover hoodie men", ["champion", "hoodie"], ["zip", "women"]),
    "levis-505": ("Levi's Men's 505 Regular Fit jeans", ["levi's", "505"], ["belt", "shorts", "jacket", "shoes"]),
    # Gaming (4)
    "logitech-g502": ("Logitech G502 HERO wired gaming mouse black", ["logitech", "g502"], ["renewed", "used", "refurbished", "mousepad"]),
    "redragon-k552": ("Redragon K552 mechanical gaming keyboard", ["redragon", "k552"], ["keycap", "switch", "wrist"]),
    "arctis-nova-7": ("SteelSeries Arctis Nova 7 wireless gaming headset", ["arctis", "nova 7"], ["renewed", "used", "refurbished", "ear cushion", "mic cover"]),
    "xbox-controller": ("Xbox Wireless Gaming Controller Robot White", ["xbox", "controller"], ["renewed", "used", "refurbished", "skin", "grip", "case", "charging", "elite", "adapter", "2 pack"]),
    # Pet (2)
    "furminator": ("FURminator deShedding tool for dogs medium long hair", ["furminator"], ["renewed", "used", "head only"]),
    "veken-fountain": ("Wonder Creature cat water fountain stainless steel 84oz", ["fountain"], ["filter", "cleaning", "flower"]),
    # Office (2)
    "mx-master-3s": ("Logitech MX Master 3S wireless performance mouse graphite", ["mx master"], ["renewed", "used", "refurbished", "receiver", "pad"]),
    "nulaxy-stand": ("Nulaxy laptop stand adjustable aluminum", ["nulaxy", "laptop stand"], []),
}

# manual ASIN overrides decided after curation (key -> ASIN)
OVERRIDES = {
    "anker-737": "B0DQ8CD3CN",     # official Anker 737 (verified: [Anker] 17,588 ratings)
    "apple-watch-se": "B0DGVNQXJM",  # official Apple listing (verified: [Apple])
    "xbox-controller": "B08K4HLCPR",  # official Robot White controller (4.6*, 11,555)
    "veken-fountain": "B07ZHZTWSH",  # Wonder Creature fountain (4.4*, 57k agg)
}


def curl(url: str, retries: int = 5) -> str | None:
    """Fetch a URL; treat <30KB Amazon responses as bot-wall and retry."""
    for attempt in range(retries):
        ua = random.choice(UAS)
        page = f"/tmp/amz_fetch_{random.randint(0, 99999)}.html"
        r = subprocess.run(
            ["curl", "-s", "--compressed", "--max-time", "30",
             "-A", ua,
             "-b", COOKIES, "-c", COOKIES,
             "-H", "Accept: text/html,application/xhtml+xml",
             "-H", "Accept-Language: en-US,en;q=0.9",
             "-w", "%{http_code}", "-o", page, url],
            capture_output=True, text=True, timeout=45,
        )
        code = r.stdout.strip()
        try:
            html = open(page, encoding="utf-8", errors="ignore").read()
        except Exception:
            html = ""
        os.path.exists(page) and os.remove(page)
        if code == "200" and len(html) > 30000 and "captcha" not in html.lower()[:3000]:
            return html
        wait = 8 + attempt * 10
        print(f"    block/short page (code={code}, len={len(html)}), retry in {wait}s", flush=True)
        time.sleep(wait)
    return None


def parse_search(html: str) -> list[dict]:
    results = []
    for b in re.split(r'data-asin="', html)[1:]:
        m = re.match(r'([A-Z0-9]{10})"', b)
        if not m:
            continue
        asin = m.group(1)
        t = re.search(r"<h2[^>]*>.*?<span>([^<]+)</span>", b, re.S)
        title = t.group(1).strip() if t else ""
        rating = re.search(r"(\d\.\d) out of 5", b)
        reviews = re.search(r"([\d,]+) ratings", b)
        if not title:
            continue
        if any(r["asin"] == asin for r in results):
            continue
        results.append({
            "asin": asin,
            "title": title,
            "rating": float(rating.group(1)) if rating else None,
            "reviews": int(reviews.group(1).replace(",", "")) if reviews else 0,
        })
    return results


def score(candidate: dict, query: str, must: list[str], must_not: list[str]) -> int:
    title = candidate["title"].lower()
    if any(w not in title for w in must):
        return -1
    if any(w in title for w in must_not):
        return -1
    words = [w for w in re.split(r"\s+", query.lower()) if len(w) > 2]
    coverage = sum(1 for w in words if w in title)
    return coverage * 1000 + min(candidate["reviews"], 60000)


def parse_product(html: str) -> dict:
    out = {"price": None, "listPrice": None}
    m = re.search(r'id="productTitle"[^>]*>\s*([^<]+)', html)
    out["title"] = m.group(1).strip() if m else ""
    m = re.search(r'id="bylineInfo"[^>]*>\s*(?:Visit the\s+)?([^<]+?)(?:\s*Store)?\s*</', html)
    out["brand"] = m.group(1).strip() if m else ""

    # price: first data-components displayString (selected variant price)
    # NOTE: attribute JSON is HTML-escaped (&quot;) -> unescape before matching
    unescaped = html.replace("&quot;", '"').replace("&amp;", "&")
    m = re.search(r'"displayString":"\$([\d,]+\.\d{2})"', unescaped)
    if not m:
        m = re.search(r'"wholeValue":"(\d+)","fractionalValue":"(\d+)"', unescaped)
        if m:
            out["price"] = float(f"{m.group(1)}.{m.group(2)}")
    else:
        out["price"] = float(m.group(1).replace(",", ""))

    # list price: "List Price:" label nearby offscreen, or a-text-price strikethrough
    i = unescaped.find("List Price")
    if i > 0:
        m = re.search(r"\$([\d,]+\.\d{2})", unescaped[i:i + 500])
        if m:
            lp = float(m.group(1).replace(",", ""))
            if lp > (out["price"] or 0):
                out["listPrice"] = lp
    if out["listPrice"] is None:
        m = re.search(r'a-text-price[^>]*>\s*<span class="a-offscreen">\$([\d,]+\.\d{2})', unescaped)
        if m:
            lp = float(m.group(1).replace(",", ""))
            if lp > (out["price"] or 0):
                out["listPrice"] = lp

    m = re.search(r"(\d\.\d) out of 5", html)
    out["rating"] = float(m.group(1)) if m else None
    m = re.search(r"([\d,]+) ratings", html)
    out["reviews"] = int(m.group(1).replace(",", "")) if m else None
    return out


def done(path: str) -> bool:
    try:
        d = json.load(open(path))
        return bool(d.get("asin")) and d.get("price") is not None
    except Exception:
        return False


def main() -> int:
    refetch_prices = "--refetch-prices" in sys.argv
    only = [a for a in sys.argv[1:] if not a.startswith("--")]
    failures = []
    items = PRODUCTS.items()
    if only:
        items = ((k, v) for k, v in items if k in only)
    total = len(PRODUCTS) if not only else len(only)
    for i, (key, (query, must, must_not)) in enumerate(items, 1):
        out_path = os.path.join(OUT_DIR, f"{key}.json")
        existing = {}
        if done(out_path):
            print(f"[{i}/{total}] {key}: done (have price)", flush=True)
            continue
        if os.path.exists(out_path):
            try:
                existing = json.load(open(out_path))
            except Exception:
                existing = {}
        # reuse existing ASIN; only refetch product page for price
        if existing.get("asin") and not refetch_prices and existing.get("title"):
            print(f"[{i}/{total}] {key}: refetching product page for price (asin {existing['asin']})", flush=True)
            phtml = curl(f"https://www.amazon.com/dp/{existing['asin']}")
            if phtml:
                open(os.path.join(HTML_DIR, f"{key}.html"), "w").write(phtml)
                prod = parse_product(phtml)
                if not prod.get("title"):
                    prod["title"] = existing["title"]
                existing.update({k: v for k, v in prod.items() if v is not None})
                json.dump(existing, open(out_path, "w"), indent=1)
                print(f"        ✓ price ${existing.get('price')} | {existing.get('rating')}★ | {existing.get('reviews')} ratings", flush=True)
                time.sleep(2.5)
                continue
            failures.append(key)
            time.sleep(2)
            continue

        print(f"[{i}/{total}] {key}: searching...", flush=True)
        url = "https://www.amazon.com/s?k=" + urllib.parse.quote(query)
        html = curl(url)
        if not html:
            failures.append(key)
            print("        SEARCH FAILED", flush=True)
            time.sleep(3)
            continue
        open(os.path.join(HTML_DIR, f"{key}_search.html"), "w").write(html)
        cands = parse_search(html)[:6]
        if key in OVERRIDES:
            asin = OVERRIDES[key]
            print(f"        override asin {asin}")
        else:
            if not cands:
                failures.append(key)
                print("        NO RESULTS", flush=True)
                time.sleep(3)
                continue
            best = max(cands, key=lambda c: score(c, query, must, must_not))
            if score(best, query, must, must_not) < 0:
                print(f"        !! no must-match; using top result: {cands[0]['title'][:70]}", flush=True)
            asin = best["asin"]
        time.sleep(2.5)

        print(f"        ASIN {asin}, fetching product page...", flush=True)
        phtml = curl(f"https://www.amazon.com/dp/{asin}")
        if not phtml:
            failures.append(key)
            print("        PRODUCT PAGE FAILED", flush=True)
            time.sleep(3)
            continue
        open(os.path.join(HTML_DIR, f"{key}.html"), "w").write(phtml)
        prod = parse_product(phtml)
        data = {"key": key, "query": query, "asin": asin,
                "url": f"https://www.amazon.com/dp/{asin}", **prod, "candidates": cands}
        json.dump(data, open(out_path, "w"), indent=1)
        print(f"        ✓ {prod['title'][:65]} | ${prod.get('price')} | {prod.get('rating')}★ | {prod.get('reviews')} ratings", flush=True)
        time.sleep(2.5)

    print("=" * 60)
    if failures:
        print("FAILURES:", ", ".join(failures))
        return 1
    print("ALL DONE")
    return 0


if __name__ == "__main__":
    sys.exit(main())
