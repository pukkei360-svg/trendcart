#!/usr/bin/env python3
"""Price pass: fetch /dp/<ASIN> for every product with USD currency preference.

- Uses session cookie jar + i18n-prefs=USD + lc-main=en_US
- Updates scripts/amazon/<key>.json with USD price, listPrice, rating, reviews, brand
- Resumable: skips entries that already have a non-null price (unless --force)
- Slow (6s delay) to stay under Amazon's bot radar
"""
import glob
import json
import os
import random
import re
import subprocess
import sys
import time

AMZ_DIR = "/home/z/my-project/scripts/amazon"
JAR = "/tmp/amz_cookies.txt"
UAS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv/127.0) Gecko/20100101 Firefox/127.0",
]


def ensure_usd_cookies():
    """Make sure i18n-prefs=USD + lc-main=en_US are in the jar."""
    txt = open(JAR).read() if os.path.exists(JAR) else ""
    add = []
    if "i18n-prefs" not in txt:
        add.append(".amazon.com\tTRUE\t/\tTRUE\t0\ti18n-prefs\tUSD")
    if "lc-main" not in txt:
        add.append(".amazon.com\tTRUE\t/\tTRUE\t0\tlc-main\ten_US")
    if add:
        with open(JAR, "a") as f:
            for line in add:
                f.write(line + "\n")
    # drop the curl "by=libcurl!" marker lines if present (harmless but noisy)
    lines = [l for l in txt.splitlines() if l.strip() and not l.startswith("# HttpOnly") and "libcurl" not in l]
    lines += add
    with open(JAR, "w") as f:
        f.write("\n".join(lines) + "\n")


def curl_page(url: str, retries: int = 4) -> str | None:
    for attempt in range(retries):
        tmp = f"/tmp/pp_{random.randint(0, 99999)}.html"
        r = subprocess.run(
            ["curl", "-s", "--compressed", "--max-time", "30",
             "-A", random.choice(UAS),
             "-b", JAR, "-c", JAR,
             "-H", "Accept: text/html,application/xhtml+xml",
             "-H", "Accept-Language: en-US,en;q=0.9",
             "-w", "%{http_code}", "-o", tmp, url],
            capture_output=True, text=True, timeout=45,
        )
        code = r.stdout.strip()
        try:
            html = open(tmp, encoding="utf-8", errors="ignore").read()
        except Exception:
            html = ""
        if os.path.exists(tmp):
            os.remove(tmp)
        if code == "200" and len(html) > 30000 and "captcha" not in html.lower()[:3000]:
            return html
        wait = 10 + attempt * 12
        print(f"    block (code={code}, len={len(html)}), wait {wait}s", flush=True)
        time.sleep(wait)
    return None


def parse_price(html: str) -> dict:
    out = {"price": None, "listPrice": None, "currency": "USD", "savingsPct": None}
    # 1) authoritative buybox price: apex priceToPay aok-offscreen span
    m = re.search(
        r'apex-pricetopay-accessibility-label[^>]*>\s*\$([\d,]+\.\d{2})'
        r'(?:\s+with\s+(\d+)\s+percent\s+savings)?', html)
    if m:
        out["price"] = float(m.group(1).replace(",", ""))
        if m.group(2):
            out["savingsPct"] = int(m.group(2))
    # 2) hidden input displayString (OffersX form)
    if out["price"] is None:
        m = re.search(r'customerVisiblePrice\]\[displayString\]"\s+value="([^"]+)"', html)
        if m:
            pm = re.search(r"([\d,]+\.\d{2})", m.group(1))
            if pm:
                out["price"] = float(pm.group(1).replace(",", ""))
    # 3) data-components JSON (escaped)
    if out["price"] is None:
        un = html.replace("&quot;", '"')
        m = re.search(r'"displayString":"([^"]*?)([\d,]+\.\d{2})"', un)
        if m:
            out["price"] = float(m.group(2).replace(",", ""))
            prefix = m.group(1).strip().replace("\xa0", "")
            if prefix and "$" not in prefix:
                out["currency"] = prefix
    # list price: anchored to the basisprice element only (avoids carousel garbage)
    m = re.search(r'basisprice-offscreen-label">List Price:\s*\$([\d,]+\.\d{2})', html)
    if m:
        lp = float(m.group(1).replace(",", ""))
        if lp > (out["price"] or 0):
            out["listPrice"] = lp
    return out


def parse_meta(html: str) -> dict:
    out = {}
    m = re.search(r'id="productTitle"[^>]*>\s*([^<]+)', html)
    out["title"] = m.group(1).strip() if m else None
    m = re.search(r'id="bylineInfo"[^>]*>\s*(?:Visit the\s+)?([^<]+?)(?:\s*Store)?\s*</', html)
    out["brand"] = m.group(1).strip() if m else None
    # rating: anchor to the averageCustomerReviews section (main product, not carousels)
    seg = html
    i = html.find('id="averageCustomerReviews"')
    if i < 0:
        i = html.find('id="acrPopover"')
    if i >= 0:
        seg = html[i:i + 3000]
    m = re.search(r"(\d\.\d) out of 5", seg) or re.search(r'(\d\.\d) out of 5', html)
    out["rating"] = float(m.group(1)) if m else None
    # reviews: anchor to the reviews-link element (formats: "1,281 ratings" or "(28,781)")
    m = re.search(r'id="acrCustomerReviewText"[^>]*>\s*\(?\s*([\d,]+)\s*\)?', html)
    if not m:
        m = re.search(r'id="acrCustomerReviewLink".{0,200}?([\d,]+) ratings', html, re.S)
    if not m and i >= 0:
        m = re.search(r"([\d,]+) ratings", seg)
    out["reviews"] = int(m.group(1).replace(",", "")) if m else None
    return out


def main() -> int:
    force = "--force" in sys.argv
    only = [a for a in sys.argv[1:] if not a.startswith("--")]
    ensure_usd_cookies()
    files = sorted(glob.glob(os.path.join(AMZ_DIR, "*.json")))
    if only:
        files = [f for f in files if os.path.splitext(os.path.basename(f))[0] in only]
    fails = []
    for i, f in enumerate(files, 1):
        d = json.load(open(f))
        key = d["key"]
        if d.get("price") is not None and not force:
            if d.get("currency") in (None, "USD"):
                print(f"[{i}/{len(files)}] {key}: has ${d['price']}", flush=True)
                continue
        print(f"[{i}/{len(files)}] {key}: fetching {d['asin']}...", flush=True)
        html = curl_page(f"https://www.amazon.com/dp/{d['asin']}")
        if not html:
            fails.append(key)
            print("    FAIL", flush=True)
            continue
        price = parse_price(html)
        meta = parse_meta(html)
        if price["price"] is not None:
            d.update({k: v for k, v in price.items() if v is not None or k in ("price", "listPrice")})
        for k, v in meta.items():
            if v is not None:
                d[k] = v
        json.dump(d, open(f, "w"), indent=1)
        cur = price.get("currency") or "?"
        print(f"    {cur} {price['price']} (list {price['listPrice']}) | {meta.get('rating')}★ | {meta.get('reviews')} | {meta.get('brand','')}", flush=True)
        time.sleep(6)
    print("=" * 50)
    print("FAILS:", ", ".join(fails) if fails else "none")
    return 0


if __name__ == "__main__":
    sys.exit(main())
