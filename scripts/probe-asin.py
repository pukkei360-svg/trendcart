#!/usr/bin/env python3
"""Probe an Amazon ASIN: print title, brand, price, rating, reviews.
Usage: python3 probe-asin.py B0XXXXXXX [B0YYYYYYY ...]
"""
import json
import random
import re
import subprocess
import sys
import time

JAR = "/tmp/amz_cookies.txt"
UAS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
]

def fetch(url, retries=3):
    for attempt in range(retries):
        tmp = f"/tmp/probe_{random.randint(0, 9999)}.html"
        r = subprocess.run(
            ["curl", "-s", "--compressed", "--max-time", "25",
             "-A", random.choice(UAS), "-b", JAR, "-c", JAR,
             "-H", "Accept: text/html", "-H", "Accept-Language: en-US,en;q=0.9",
             "-w", "%{http_code}", "-o", tmp, url],
            capture_output=True, text=True, timeout=40)
        code = r.stdout.strip()
        try:
            html = open(tmp, encoding="utf-8", errors="ignore").read()
        except Exception:
            html = ""
        import os
        if os.path.exists(tmp):
            os.remove(tmp)
        if code == "200" and len(html) > 30000:
            return html
        time.sleep(6 + attempt * 6)
    return None

def parse(html):
    out = {}
    m = re.search(r'id="productTitle"[^>]*>\s*([^<]+)', html)
    out["title"] = m.group(1).strip() if m else "?"
    m = re.search(r'id="bylineInfo"[^>]*>\s*(?:Visit the\s+)?([^<]+?)(?:\s*Store)?\s*</', html)
    out["brand"] = m.group(1).strip() if m else "?"
    un = html.replace("&quot;", '"')
    m = re.search(r'"displayString":"([^"]{1,25})"', un)
    out["price"] = m.group(1) if m else None
    m = re.search(r"(\d\.\d) out of 5", html)
    out["rating"] = m.group(1) if m else None
    m = re.search(r"([\d,]+) ratings", html)
    out["reviews"] = m.group(1) if m else None
    return out

for asin in sys.argv[1:]:
    html = fetch(f"https://www.amazon.com/dp/{asin}")
    if not html:
        print(f"{asin}: BLOCKED/404")
        continue
    d = parse(html)
    print(f"{asin}: [{d['brand']}] {d['title'][:75]}")
    print(f"        price={d['price']} rating={d['rating']} reviews={d['reviews']}")
    time.sleep(4)
