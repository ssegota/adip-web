#!/usr/bin/env bash
# Generira thumbnailove (kraća stranica 400 px, JPEG) za sve slike u galeriji i aktivnostima.
# Rezultat: <mapa>/thumbs/<ime>.jpg - isti format koji stvara upload u pregledniku.
# Postojeći thumbnailovi se preskaču; pokreni ponovno nakon ručnog dodavanja slika.
# Potreban ImageMagick (convert ili magick).
set -euo pipefail
cd "$(dirname "$0")/.."

IM=$(command -v magick || command -v convert || true)
if [ -z "$IM" ]; then
    echo "ImageMagick nije instaliran." >&2
    exit 1
fi

made=0
while IFS= read -r -d '' f; do
    dir=$(dirname "$f")
    base=$(basename "$f")
    out="$dir/thumbs/${base%.*}.jpg"
    [ -f "$out" ] && continue
    mkdir -p "$dir/thumbs"
    if "$IM" "${f}[0]" -auto-orient -thumbnail '400x400^>' -strip -quality 80 "$out" 2>/dev/null; then
        made=$((made + 1))
    else
        echo "Preskočeno (ne mogu pročitati): $f" >&2
    fi
done < <(find galerija aktivnosti-slike -type f -not -path '*/thumbs/*' \
    \( -iname '*.jpg' -o -iname '*.jpeg' -o -iname '*.png' -o -iname '*.webp' -o -iname '*.gif' \) -print0)

echo "Novih thumbnailova: $made"
