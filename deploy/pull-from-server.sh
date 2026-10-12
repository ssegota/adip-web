#!/usr/bin/env bash
# Povlači sadržaj koji je admin panel dodao na serveru (slike, PDF-ovi, data/*.json)
# u lokalni repo, da ga možeš commitati. Ne briše ništa lokalno.
# Treba SSH pristup: ključ ~/Documents/ADIP/adip_deploy (vidi README_DEPLOY.md).
set -euo pipefail
cd "$(dirname "$0")/.."
KEY="${ADIP_KEY:-$HOME/Documents/ADIP/adip_deploy}"
for d in data galerija galerija-slika aktivnosti-slike radovi-files downloads-files; do
  rsync -rlptz --itemize-changes -e "ssh -i $KEY -o IdentitiesOnly=yes" \
    "adip@adip.hr:/home/adip/repositories/adip-web/$d/" "./$d/"
done
git status --short
