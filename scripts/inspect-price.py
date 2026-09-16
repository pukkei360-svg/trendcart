#!/usr/bin/env python3
"""Inspect Amazon product page price markup (diagnostic)."""
import re
import sys

path = sys.argv[1] if len(sys.argv) > 1 else '/tmp/stanley_dp.html'
html = open(path, encoding='utf-8', errors='ignore').read()
print('len:', len(html))

# all offscreen spans
ms = list(re.finditer(r'a-offscreen">([^<]+)</span>', html))
print('offscreen spans:', len(ms))
for m in ms[:12]:
    s = max(0, m.start() - 2000)
    ctx = html[s:m.end()]
    # find the nearest feature_div / section id before the span
    ids = re.findall(r'id="([A-Za-z0-9_]*(?:[Pp]rice|apex|core|buybox)[A-Za-z0-9_]*)"', ctx)
    print('  ', repr(m.group(1)), '|| section ids:', ids[-2:] or 'NONE')

# priceToPay presence
for marker in ['priceToPay', 'priceAmount', 'displayPrice', 'buyingPrice']:
    i = html.find(marker)
    if i > 0:
        print(f'{marker} ctx:', repr(html[i:i+200]))
