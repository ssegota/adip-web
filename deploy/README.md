# Deploy na adip.hr

Svaki `git push` na `main` automatski deploya stranicu (GitHub Actions → `.github/workflows/deploy.yml`).
Ručno: GitHub → Actions → "Deploy na adip.hr" → Run workflow.

## Kako radi
Hosting nema shell pristup, pa deploy ide preko FTPS-a (`lin173.mojsite.com`).
1. FTP-Deploy-Action šalje promijenjene datoteke u `/home/adip/repositories/adip-web` (root Node/Passenger aplikacije).
   Stanje prati u `.ftp-deploy-sync-state.json` na serveru; datoteke obrisane iz gita briše i sa servera.
2. Upload `tmp/restart.txt` → Passenger restarta Node app.
3. Provjeri da https://adip.hr/ vraća 200.
4. Ako se promijenio `package.json`: cPanel → Setup Node.js App → Run NPM Install (ručno).

**Ne dira** mape koje puni admin panel
(`data/`, `galerija/`, `galerija-slika/`, `aktivnosti-slike/`, `radovi-files/`, `downloads-files/`) — vidi `exclude` u workflowu.
Želiš li promijeniti nešto u tim mapama, napravi to kroz admin panel ili ručno preko cPanela.

## Povlačenje novog sadržaja sa servera
Admin panel dodaje slike/PDF-ove/JSON direktno na server. Da ih imaš i u gitu:

    ADIP_FTP_PASS='...' deploy/pull-from-server.sh
    git add -A && git commit -m "sync: sadržaj sa servera" && git push

## GitHub secrets (Settings → Secrets → Actions)
- `FTP_HOST` = `lin173.mojsite.com`
- `FTP_USER` = `adip`
- `FTP_PASSWORD` = cPanel lozinka (promijeniš li je, ažuriraj i ovaj secret)
