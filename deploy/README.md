# Deploy na adip.hr

Svaki `git push` na `main` automatski deploya stranicu (GitHub Actions → `.github/workflows/deploy.yml`).
Ručno: GitHub → Actions → "Deploy na adip.hr" → Run workflow.

## Kako radi
1. `rsync` preko SSH-a šalje datoteke u `/home/adip/repositories/adip-web` (to je root Node/Passenger aplikacije).
2. Ako se promijenio `package.json`, pokreće `npm install` u CloudLinux nodevenvu.
3. `touch tmp/restart.txt` → Passenger restarta Node app.
4. Provjeri da https://adip.hr/ vraća 200.

**Ne briše** datoteke na serveru i **ne dira** mape koje puni admin panel
(`data/`, `galerija/`, `galerija-slika/`, `aktivnosti-slike/`, `radovi-files/`, `downloads-files/`) — vidi `rsync-exclude.txt`.
Želiš li promijeniti nešto u tim mapama, napravi to kroz admin panel ili ručno preko cPanela.

## Povlačenje novog sadržaja sa servera
Admin panel dodaje slike/PDF-ove/JSON direktno na server. Da ih imaš i u gitu:

    deploy/pull-from-server.sh
    git add -A && git commit -m "sync: sadržaj sa servera" && git push

## GitHub secrets (Settings → Secrets → Actions)
- `DEPLOY_HOST` = `adip.hr`
- `DEPLOY_USER` = `adip`
- `DEPLOY_SSH_KEY` = privatni ključ (`~/Documents/ADIP/adip_deploy`)
- `DEPLOY_KNOWN_HOSTS` = `~/Documents/ADIP/adip_known_hosts`

Javni ključ (`adip_deploy.pub`) mora biti autoriziran u cPanel → SSH Access → Manage SSH Keys.
