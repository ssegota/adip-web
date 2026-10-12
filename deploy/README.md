# Deploy na adip.hr

Svaki `git push` na `main` automatski deploya stranicu (GitHub Actions → `.github/workflows/deploy.yml`).
Ručno: GitHub → Actions → "Deploy na adip.hr" → Run workflow.

## Kako radi
Hosting nema shell pristup, a FTP je blokiran za GitHub IP-jeve, pa deploy ide preko **SFTP-a** (`deploy/sftp-deploy.sh`).
1. Pročita `tmp/.deployed-sha` sa servera (commit zadnjeg deploya).
2. Pošalje samo datoteke promijenjene u gitu od tog commita; obrisane u gitu briše i sa servera.
3. Upload `tmp/restart.txt` → Passenger restarta Node app; zapiše novi `tmp/.deployed-sha`.
4. Provjeri da https://adip.hr/ vraća 200.
5. Ako se promijenio `package.json`: cPanel → Setup Node.js App → Run NPM Install (ručno).

Ručni deploy s lokalnog računala (bez GitHuba):

    SSH_KEY=~/Documents/ADIP/adip_deploy SSH_TARGET=adip@adip.hr KNOWN_HOSTS=~/Documents/ADIP/adip_known_hosts deploy/sftp-deploy.sh

**Ne dira** mape koje puni admin panel
(`data/`, `galerija/`, `galerija-slika/`, `aktivnosti-slike/`, `radovi-files/`, `downloads-files/`) — vidi `exclude` u workflowu.
Želiš li promijeniti nešto u tim mapama, napravi to kroz admin panel ili ručno preko cPanela.

## Povlačenje novog sadržaja sa servera
Admin panel dodaje slike/PDF-ove/JSON direktno na server. Da ih imaš i u gitu:

    ADIP_FTP_PASS='...' deploy/pull-from-server.sh
    git add -A && git commit -m "sync: sadržaj sa servera" && git push

## GitHub secrets (Settings → Secrets → Actions)
- `DEPLOY_HOST` = `adip.hr`, `DEPLOY_USER` = `adip`
- `DEPLOY_SSH_KEY` = privatni ključ `~/Documents/ADIP/adip_deploy`
- `DEPLOY_KNOWN_HOSTS` = `~/Documents/ADIP/adip_known_hosts`

Javni ključ (`adip_deploy.pub`) je autoriziran u cPanel → SSH Access → Manage SSH Keys.
`pull-from-server.sh` koristi FTPS i radi samo s tvog računala (FTP lozinka = cPanel lozinka).
