#!/usr/bin/env bash
# Inkrementalni deploy preko SFTP-a (hosting nema shell, ali SFTP radi).
# Šalje samo datoteke promijenjene u gitu od zadnjeg deploya; SHA zadnjeg deploya
# čuva se na serveru u tmp/.deployed-sha. Mape koje puni admin panel se ne diraju.
# Env: SSH_KEY (putanja), SSH_TARGET (user@host), opcionalno KNOWN_HOSTS (putanja).
set -euo pipefail
cd "$(dirname "$0")/.."
APP=repositories/adip-web
SFTP=(sftp -q -i "$SSH_KEY" -o IdentitiesOnly=yes -o BatchMode=yes)
[ -n "${KNOWN_HOSTS:-}" ] && SFTP+=(-o "UserKnownHostsFile=$KNOWN_HOSTS")
EXCLUDE='^(\.github/|deploy/|tmp/|node_modules/|data/|galerija/|galerija-slika/|aktivnosti-slike/|radovi-files/|downloads-files/|deploy\.zip$|\.gitignore$)'

work=$(mktemp -d); trap 'rm -rf "$work"' EXIT
echo "get $APP/tmp/.deployed-sha $work/prev" | "${SFTP[@]}" -b - "$SSH_TARGET" >/dev/null 2>&1 || true
prev=$(cat "$work/prev" 2>/dev/null || true)
head=$(git rev-parse HEAD)
if [ -z "$prev" ] || ! git cat-file -e "$prev^{commit}" 2>/dev/null; then
  echo "Nema poznatog prethodnog deploya na serveru (tmp/.deployed-sha) - prekidam." >&2
  echo "Postavi ga ručno na commit koji odgovara stanju servera." >&2
  exit 1
fi
echo "Deploy $prev -> $head"

q(){ local s=${1//\\/\\\\}; printf '"%s"' "${s//\"/\\\"}"; }
batch="$work/batch"; : > "$batch"
declare -A dirs=()
n_put=0; n_rm=0
while IFS=$'\t' read -r st path; do
  [[ "$path" =~ $EXCLUDE ]] && continue
  if [ "$st" = D ]; then
    echo "-rm $(q "$APP/$path")" >> "$batch"; n_rm=$((n_rm+1))
  else
    d=$(dirname "$path")
    while [ "$d" != . ] && [ -z "${dirs[$d]:-}" ]; do dirs[$d]=1; d=$(dirname "$d"); done
    echo "put $(q "$path") $(q "$APP/$path")" >> "$batch"; n_put=$((n_put+1))
  fi
done < <(git -c core.quotePath=false diff --no-renames --name-status "$prev" "$head")

{ printf '%s\n' "${!dirs[@]}" | awk '{print length "\t" $0}' | sort -n | cut -f2- | while IFS= read -r d; do
    [ -n "$d" ] && echo "-mkdir $(q "$APP/$d")"; done; cat "$batch"; } > "$work/full"
date > "$work/restart.txt"; echo "$head" > "$work/sha"
cat >> "$work/full" <<B
-mkdir $APP/tmp
put $work/restart.txt $APP/tmp/restart.txt
put $work/sha $APP/tmp/.deployed-sha
B
echo "Upload: $n_put, brisanje: $n_rm"
"${SFTP[@]}" -b "$work/full" "$SSH_TARGET"
echo "Gotovo. Passenger restart zatražen (tmp/restart.txt)."
