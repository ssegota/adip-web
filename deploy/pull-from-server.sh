#!/usr/bin/env bash
# Povlači sadržaj koji je admin panel dodao na serveru (slike, PDF-ovi, data/*.json)
# u lokalni repo, da ga možeš commitati. Ne briše ništa lokalno.
# Upotreba:  ADIP_FTP_PASS='...' deploy/pull-from-server.sh
set -euo pipefail
cd "$(dirname "$0")/.."
: "${ADIP_FTP_PASS:?Postavi ADIP_FTP_PASS (cPanel lozinka)}"
for d in data galerija galerija-slika aktivnosti-slike radovi-files downloads-files; do
  wget -q -r -N -nH --cut-dirs=2 --secure-protocol=auto \
    --user=adip --password="$ADIP_FTP_PASS" \
    "ftps://lin173.mojsite.com/repositories/adip-web/$d/"
done
git status --short
