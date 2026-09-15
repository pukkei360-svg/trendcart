#!/usr/bin/env bash
# Fetch product images for TrendCart seed data via z-ai image-search.
# Runs queries in parallel batches; writes JSON results to scripts/images/<key>.json
set -u

OUT_DIR="/home/z/my-project/scripts/images"
mkdir -p "$OUT_DIR"

fetch() {
  local key="$1"; shift
  local query="$1"; shift
  local count="${1:-2}"
  if [ -s "$OUT_DIR/$key.json" ]; then
    echo "[skip] $key (already exists)"
    return 0
  fi
  echo "[start] $key"
  z-ai image-search -q "$query" --count "$count" --gl us --no-rank -o "$OUT_DIR/$key.json" >/dev/null 2>&1 \
    && echo "[done] $key" || echo "[FAIL] $key"
}

export -f fetch
export OUT_DIR

# key|query|count  (one concept per call)
JOBS=(
  "earbuds|white wireless bluetooth earbuds with charging case product photo|3"
  "speaker|portable bluetooth speaker product photo|2"
  "smartwatch|black smartwatch fitness tracker on wrist product photo|2"
  "charger|compact GaN USB-C fast wall charger product photo|2"
  "powerbank|slim black power bank portable charger for smartphone|2"
  "airfryer|modern digital air fryer kitchen appliance|2"
  "chopper|vegetable chopper kitchen gadget with container|2"
  "robotvacuum|robot vacuum cleaner on hardwood floor|2"
  "frother|portable electric milk frother for coffee|2"
  "containers|glass meal prep storage containers with lids|2"
  "sunsetlamp|sunset projection lamp warm ambient light|2"
  "hotairbrush|hot air styling brush hair dryer brush|2"
  "serum|vitamin C facial serum dropper bottle skincare|2"
  "guasha|jade roller and gua sha facial massage tools|2"
  "brushset|professional makeup brush set with case|2"
  "resbands|colorful resistance bands set for home workout|2"
  "dumbbell|adjustable dumbbell hand weights home gym|2"
  "yogamat|rolled up yoga mat for exercise|2"
  "sunglasses|stylish polarized sunglasses product photo|2"
  "crossbody|small leather crossbody bag for women|2"
  "sneakers|minimalist white sneakers product photo|2"
  "wristwatch|minimalist analog wristwatch product photo|2"
  "headset|wireless gaming headset with microphone RGB|2"
  "gamemouse|ergonomic RGB gaming mouse product photo|2"
  "keyboard|mechanical keyboard with rainbow backlit keys|2"
  "petbrush|self cleaning pet grooming brush for dogs cats|2"
  "petfountain|cat water fountain automatic pet dispenser|2"
  "laptopstand|aluminum adjustable laptop stand for desk|2"
  "deskorganizer|wooden desk organizer with compartments office|2"
)

run_batch() {
  while [ "$#" -gt 0 ]; do
    IFS='|' read -r key query count <<< "$1"
    fetch "$key" "$query" "$count" &
    shift
  done
  wait
}

# split into batches to limit concurrency
BATCH_SIZE=3
batch=()
for job in "${JOBS[@]}"; do
  batch+=("$job")
  if [ "${#batch[@]}" -eq "$BATCH_SIZE" ]; then
    run_batch "${batch[@]}"
    batch=()
  fi
done
run_batch "${batch[@]}"

echo "---- SUMMARY ----"
ls -la "$OUT_DIR" | tail -n +2 | awk '{print $NF, $5}'
