#!/usr/bin/env bash
# One-time setup of America Econ's own database stack on the VPS (what it used
# Supabase for). Run as root after deploy/vps/install.sh. Safe to run again:
# keeps existing passwords and keys.
#
#   PostgreSQL 17 (already installed)  database `americaecon` (created by migrate.sh)
#   PostgREST v13      127.0.0.1:54392  the same /rest/v1 API, same policies and grants
#   storage-server.mjs 127.0.0.1:54393  /storage/v1 for post images (americaecon-storage.service)
#   nginx              /rest/v1 and /storage/v1 on americaecon.com (deploy/vps/nginx.conf);
#                      127.0.0.1:54390 for the functions and checks from the VPS
#   admin password     nginx asks for it before the admin pages and before any write
#                      (/etc/nginx/americaecon.htpasswd, user "admin")
#
# The site never used Supabase sign-in, so there is no Auth server.
set -euo pipefail

POSTGREST_VERSION="${POSTGREST_VERSION:-v13.0.6}"
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SECRETS=/etc/americaecon-db                 # root only
site=https://americaecon.com
as_pg() { sudo -u postgres psql -X -q -v ON_ERROR_STOP=1 -At "$@"; }
secret() { [ -f "$SECRETS/$1" ] || (umask 077; openssl rand -hex 24 > "$SECRETS/$1"); cat "$SECRETS/$1"; }

pg_lsclusters | grep -qE '^17 +main .* online' || { echo "PostgreSQL 17 isn't running."; exit 1; }
ENV=/etc/americaecon.env
[ -f "$ENV" ] || { echo "$ENV is missing; run deploy/vps/install.sh first."; exit 1; }

echo "Roles ..."
install -d -m 700 "$SECRETS"
rest_pw=$(secret authenticator.password)
as_pg <<SQL
DO \$\$ BEGIN CREATE ROLE anon NOLOGIN NOINHERIT; EXCEPTION WHEN duplicate_object THEN NULL; END \$\$;
DO \$\$ BEGIN CREATE ROLE authenticated NOLOGIN NOINHERIT; EXCEPTION WHEN duplicate_object THEN NULL; END \$\$;
DO \$\$ BEGIN CREATE ROLE service_role NOLOGIN NOINHERIT BYPASSRLS; EXCEPTION WHEN duplicate_object THEN NULL; END \$\$;
DO \$\$ BEGIN CREATE ROLE americaecon_authenticator LOGIN NOINHERIT; EXCEPTION WHEN duplicate_object THEN NULL; END \$\$;
ALTER ROLE americaecon_authenticator LOGIN PASSWORD '$rest_pw';
GRANT anon, authenticated, service_role TO americaecon_authenticator;
SQL

echo "Keys ..."
[ -f "$SECRETS/jwt.secret" ] || (umask 077; openssl rand -base64 48 | tr -d '\n=' | tr '+/' '-_' > "$SECRETS/jwt.secret")
mint() {
  JWT_SECRET=$(cat "$SECRETS/jwt.secret") ROLE="$1" node -e '
    const { createHmac } = require("node:crypto")
    const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url")
    const now = Math.floor(Date.now() / 1000)
    const body = `${b64({ alg: "HS256", typ: "JWT" })}.${b64({ role: process.env.ROLE, iss: "americaecon-vps", iat: now, exp: now + 10 * 365 * 86400 })}`
    process.stdout.write(`${body}.${createHmac("sha256", process.env.JWT_SECRET).update(body).digest("base64url")}`)'
}
[ -f "$SECRETS/anon.key" ] || (umask 077; mint anon > "$SECRETS/anon.key")
[ -f "$SECRETS/service.key" ] || (umask 077; mint service_role > "$SECRETS/service.key")
# The site reads VITE_* at build time; the functions read the rest.
setenv() { if grep -qE "^$1=" "$ENV"; then sed -i "s|^$1=.*|$1=$2|" "$ENV"; else echo "$1=$2" >> "$ENV"; fi; }
setenv VITE_SUPABASE_URL "$site"
setenv VITE_SUPABASE_ANON_KEY "$(cat "$SECRETS/anon.key")"
setenv SUPABASE_URL "http://127.0.0.1:54390"
setenv SUPABASE_ANON_KEY "$(cat "$SECRETS/anon.key")"
setenv SUPABASE_SERVICE_ROLE_KEY "$(cat "$SECRETS/service.key")"

echo "PostgREST $POSTGREST_VERSION ..."
if ! /usr/local/bin/postgrest --version 2>/dev/null | grep -q "${POSTGREST_VERSION#v}"; then
  tmp=$(mktemp -d)
  curl -fsSL -o "$tmp/p.tar.xz" "https://github.com/PostgREST/postgrest/releases/download/$POSTGREST_VERSION/postgrest-$POSTGREST_VERSION-linux-static-x86-64.tar.xz"
  tar -xJf "$tmp/p.tar.xz" -C "$tmp" && install -m 755 "$tmp/postgrest" /usr/local/bin/postgrest && rm -rf "$tmp"
fi
id postgrest >/dev/null 2>&1 || useradd --system --no-create-home --shell /usr/sbin/nologin postgrest
install -m 640 -o root -g postgrest /dev/null /etc/americaecon-postgrest.conf
cat > /etc/americaecon-postgrest.conf <<CONF
# Written by deploy/vps/database/setup.sh
db-uri = "postgres://americaecon_authenticator:$rest_pw@127.0.0.1:5432/americaecon"
db-schemas = "public"
db-anon-role = "anon"
db-extra-search-path = "public, extensions"
jwt-secret = "$(cat "$SECRETS/jwt.secret")"
db-max-rows = 5000
db-pool = 5
server-host = "127.0.0.1"
server-port = 54392
log-level = "warn"
CONF

echo "Image storage ..."
install -d -m 755 -o americaecon -g americaecon /var/lib/americaecon-storage
install -m 640 -o root -g americaecon /dev/null /etc/americaecon-storage.env
cat > /etc/americaecon-storage.env <<CONF
# Written by deploy/vps/database/setup.sh
STORAGE_ROOT=/var/lib/americaecon-storage
STORAGE_BUCKETS=post-images
STORAGE_SERVICE_KEY=$(cat "$SECRETS/anon.key")
CONF

echo "Admin password ..."
if [ ! -s /etc/nginx/americaecon.htpasswd ]; then
  read -rsp "Choose a password for the admin pages (user: admin): " pw; echo
  [ -n "$pw" ] || { echo "No password given; stopping."; exit 1; }
  printf 'admin:%s\n' "$(printf '%s' "$pw" | openssl passwd -apr1 -stdin)" > /etc/nginx/americaecon.htpasswd
  chown root:www-data /etc/nginx/americaecon.htpasswd; chmod 640 /etc/nginx/americaecon.htpasswd
fi

echo "Services, backups and nginx ..."
install -d -m 750 -o postgres -g postgres /var/backups/americaecon
cp "$HERE"/americaecon-postgrest.service "$HERE"/americaecon-storage.service "$HERE"/americaecon-db-backup.service "$HERE"/americaecon-db-backup.timer /etc/systemd/system/
systemctl daemon-reload
systemctl enable americaecon-postgrest americaecon-storage >/dev/null 2>&1
cp "$HERE/nginx-americaecon-db-gateway.conf" /etc/nginx/sites-available/americaecon-db-gateway
ln -sf /etc/nginx/sites-available/americaecon-db-gateway /etc/nginx/sites-enabled/americaecon-db-gateway
nginx -t && systemctl reload nginx

echo
echo "Set up. Next: copy the data (deploy/vps/README.md step 3)."
