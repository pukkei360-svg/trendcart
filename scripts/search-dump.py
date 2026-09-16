#!/usr/bin/env python3
"""Search Amazon and dump top result ASINs + titles for manual curation."""
import random
import re
import subprocess
import sys
import time
import urllib.parse

JAR = "/tmp/amz_cookies.txt"
UAS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
]

def fetch(url, retries=4):
    for attempt in range(retries):
        tmp = f"/tmp/search_dump_{random.randint(0, 9999)}.html"
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
        if code == "200" and len(html) > 30000 and "captcha" not in html.lower()[:3000]:
            return html
        wait = 8 + attempt * 8
        print(f"  retry in {wait}s (code={code} len={len(html)})", flush=True)
        time.sleep(wait)
    return None

query = sys.argv[1]
url = "https://www.amazon.com/s?k=" + urllib.parse.quote(query)
print(f"SEARCH: {query}")
html = fetch(url)
if not html:
    print("BLOCKED")
    sys.exit(1)

seen = set()
for b in re.split(r'data-asin="', html)[1:]:
    m = re.match(r'([A-Z0-9]{10})"', b)
    if not m:
        continue
    asin = m.group(1)
    if asin in seen:
        continue
    seen.add(asin)
    t = re.search(r"<h2[^>]*>.*?<span>([^<]+)</span>", b, re.S)
    title = t.group(1).strip() if t else ""
    rating = re.search(r"(\d\.\d) out of 5", b)
    reviews = re.search(r"([\d,]+) ratings", b)
    if title:
        print(f"{asin} | {rating.group(1) if rating else '-'} | {reviews.group(1) if reviews else '-':>8s} | {title[:85]}")
