#!/usr/bin/env python3
"""Set Amazon delivery location to a US zip via glow address-change.
1) fetch a product page, extract glow CSRF token
2) POST /portal-migration/hz/glow/address-change with the token (header + form)
3) verify: g502 buybox price appears + location line changes
"""
import re
import subprocess
import sys
import time

JAR = "/tmp/amz_cookies.txt"
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"
ZIP = sys.argv[1] if len(sys.argv) > 1 else "10001"


def curl(args):
    r = subprocess.run(args, capture_output=True, text=True, timeout=60)
    return r.stdout


# Step 1: any product page -> glow token
page = curl(["curl", "-s", "--compressed", "--max-time", "30", "-A", UA,
             "-b", JAR, "-c", JAR, "-H", "Accept: text/html",
             "-H", "Accept-Language: en-US,en;q=0.9",
             "https://www.amazon.com/dp/B07GBZ4Q68"])
print("page len:", len(page))
m = re.search(r'ajaxHeaders&quot;:\{&quot;anti-csrftoken-a2z&quot;:&quot;([^&]+)&quot;', page) or \
    re.search(r'ajaxHeaders":\{"anti-csrftoken-a2z":"([^"]+)"', page)
if not m:
    m = re.search(r'name="anti-csrftoken-a2z"\s+value="([^"]+)"', page)
if not m:
    print("no token found")
    sys.exit(1)
token = m.group(1)
print("token:", token[:25] + "...")

# Step 2: POST address change (token in header AND form for good measure)
data = ("locationType=LOCATION_INPUT&zipCode=" + ZIP +
        "&storeContext=generic&deviceType=desktop&pageType=Detail&actionSource=glow" +
        "&anti-csrftoken-a2z=" + token + "&shouldSetAsDefault=true&deviceStorageSet=1")
resp = curl(["curl", "-s", "--compressed", "--max-time", "30", "-X", "POST",
             "-A", UA, "-b", JAR, "-c", JAR,
             "-H", "Accept: */*", "-H", "Accept-Language: en-US,en;q=0.9",
             "-H", "Referer: https://www.amazon.com/",
             "-H", "Content-Type: application/x-www-form-urlencoded; charset=UTF-8",
             "-H", "anti-csrftoken-a2z: " + token,
             "-H", "x-requested-with: XMLHttpRequest",
             "--data", data,
             "https://www.amazon.com/portal-migration/hz/glow/address-change?deviceType=desktop&pageType=Detail&storeContext=generic&actionSource=glow"])
print("address-change resp len:", len(resp), "| head:", resp[:200].replace("\n", " "))

# Step 3: verify
time.sleep(2)
page2 = curl(["curl", "-s", "--compressed", "--max-time", "30", "-A", UA,
              "-b", JAR, "-c", JAR, "-H", "Accept: text/html",
              "-H", "Accept-Language: en-US,en;q=0.9",
              "https://www.amazon.com/dp/B07GBZ4Q68"])
m = re.search(r'id="glow-ingress-line2"[^>]*>\s*([^<]+)', page2)
print("location now:", m.group(1).strip() if m else "?")
m = re.search(r'apex-pricetopay-accessibility-label[^>]*>\s*\$([\d,]+\.\d{2})', page2)
print("G502 price:", "$" + m.group(1) if m else "STILL NONE")
open('/tmp/g502_2.html', 'w').write(page2)
