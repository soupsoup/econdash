# americaecon.com on the VPS

Was: Netlify (site `econpulse`) + Supabase project `vvzbsctlsvxdscozzspa`.

| Piece | On the VPS |
|---|---|
| Site (Vite build) | nginx serves `/var/www/americaecon/.releases/current`; the deploy timer rebuilds from `main` |
| Netlify functions (`/api/*`) | `americaecon.service` runs `server/netlify-shim.mjs` on 127.0.0.1:4425 |
| Supabase REST (`/rest/v1`) | PostgREST, `americaecon-postgrest.service`, 127.0.0.1:54392, database `americaecon` |
| Supabase Storage (`post-images`) | `americaecon-storage.service`, 127.0.0.1:54393; files in `/var/lib/americaecon-storage`, served by nginx |
| Local gateway for the functions | nginx on 127.0.0.1:54390 |
| Backups | `americaecon-db-backup.timer`, 04:30, 14 days in `/var/backups/americaecon` |

The admin pages (`/admin`, `/create-post`, `/edit-post/…`) and every write (database, image uploads, the wire feed and its settings) ask for the admin password: user `admin`, set by `database/setup.sh`, stored in `/etc/nginx/americaecon.htpasswd`. On Netlify anyone could write. Reading the site needs nothing.

## Install (as root)

1. Clone and install:
   ```bash
   git clone https://github.com/soupsoup/econdash /var/www/americaecon
   /var/www/americaecon/deploy/vps/install.sh
   nano /etc/americaecon.env        # paste the API keys from Netlify
   bash /var/www/americaecon/deploy/vps/database/setup.sh   # asks for the admin password
   ```
2. Copy the data. Get the session pooler connection string from the Supabase project (Connect → Session pooler), with its database password:
   ```bash
   read -rsp "Supabase session pooler URL: " SOURCE_URL; echo; export SOURCE_URL
   bash /var/www/americaecon/deploy/vps/database/migrate.sh
   ```
3. Start everything and check it before DNS moves:
   ```bash
   systemctl start americaecon-postgrest americaecon-storage
   systemctl start americaecon-deploy && systemctl enable --now americaecon-deploy.timer americaecon-db-backup.timer
   curl -s -H 'Host: americaecon.com' http://127.0.0.1/ | grep -o '<title>.*</title>'
   curl -s -H 'Host: americaecon.com' 'http://127.0.0.1/rest/v1/posts?select=id&limit=3'
   ```
4. Point `americaecon.com` and `www` at 177.7.44.106 (A records), then:
   ```bash
   certbot --nginx -d americaecon.com -d www.americaecon.com
   ```
5. After a week or two: delete the Netlify site, then pause and delete the Supabase project.
