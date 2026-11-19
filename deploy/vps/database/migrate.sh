#!/usr/bin/env bash
# Copies America Econ's database and post images from Supabase to the VPS.
# Run as root after setup.sh:
#
#   read -rsp "Supabase session pooler URL: " SOURCE_URL; echo; export SOURCE_URL
#   bash deploy/vps/database/migrate.sh
#
# Copies the public schema with its policies and grants, rewrites saved image
# links to https://americaecon.com, and copies every Storage file. Never
# writes to Supabase.
#
# Rerunning rebuilds the local copy from scratch, so it refuses once the
# functions run on it (FORCE=1 overrides; that discards everything since).
set -euo pipefail

: "${SOURCE_URL:?Set SOURCE_URL to the Supabase session pooler connection string}"
DB=americaecon
BACKUPS=/var/backups/americaecon
OLD_URL="${OLD_URL:-https://vvzbsctlsvxdscozzspa.supabase.co}"
PUBLIC_URL=https://americaecon.com
STORAGE_ROOT=/var/lib/americaecon-storage
if [ "$(systemctl is-active americaecon 2>/dev/null)" = active ] && [ "${FORCE:-0}" != 1 ]; then
  echo "americaecon is running on the local database. Rerunning would discard everything written since."
  exit 1
fi

as_pg() { sudo -u postgres "$@"; }
local_sql() { as_pg psql -X -q -v ON_ERROR_STOP=1 -At -d "$DB" "$@"; }
src_sql() { psql -X -q -v ON_ERROR_STOP=1 -At "$SOURCE_URL" "$@"; }

install -d -m 750 -o postgres -g postgres "$BACKUPS"
dump="$BACKUPS/supabase-$(date +%Y%m%d-%H%M%S).dump"
echo "1/5 Dumping Supabase (public) ..."
pg_dump --format=custom --schema=public --file="$dump" "$SOURCE_URL"
chown postgres:postgres "$dump"; chmod 640 "$dump"
echo "    $dump ($(du -h "$dump" | cut -f1))"

echo "2/5 Rebuilding the local '$DB' database ..."
as_pg psql -X -q -v ON_ERROR_STOP=1 -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$DB' AND pid <> pg_backend_pid()" >/dev/null
as_pg psql -X -q -v ON_ERROR_STOP=1 -c "DROP DATABASE IF EXISTS $DB" -c "CREATE DATABASE $DB"
as_pg psql -X -q -v ON_ERROR_STOP=1 -c "ALTER DATABASE $DB SET search_path = \"\$user\", public, extensions"

# Grants in the dump name Supabase's own roles (supabase_admin, ...). Create
# any that don't exist yet, without login, so the grants restore.
for role in $(pg_restore --schema-only --file=- "$dump" | grep -oE '(TO|FROM) [a-z_][a-z0-9_]*' | awk '{print $2}' | sort -u); do
  case "$role" in public|current_user|session_user|pg_*) continue ;; esac
  as_pg psql -X -q -c "DO \$\$ BEGIN CREATE ROLE \"$role\" NOLOGIN; EXCEPTION WHEN duplicate_object THEN NULL; END \$\$"
done

# Policies may call Supabase's auth.uid() / auth.role() / auth.jwt(). There is
# no Auth server here, so give them the same meaning PostgREST's JWT gives.
local_sql <<'SQL'
CREATE SCHEMA extensions;
GRANT USAGE ON SCHEMA extensions TO anon, authenticated, service_role;
CREATE SCHEMA auth;
GRANT USAGE ON SCHEMA auth TO anon, authenticated, service_role;
CREATE FUNCTION auth.jwt() RETURNS jsonb LANGUAGE sql STABLE AS $$
  SELECT coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb $$;
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(auth.jwt() ->> 'sub', '')::uuid $$;
CREATE FUNCTION auth.role() RETURNS text LANGUAGE sql STABLE AS $$ SELECT auth.jwt() ->> 'role' $$;
SQL
for ext in $(src_sql -c "SELECT e.extname || ':' || n.nspname FROM pg_extension e JOIN pg_namespace n ON n.oid = e.extnamespace
    WHERE n.nspname IN ('public', 'extensions') AND e.extname NOT IN ('plpgsql', 'pg_stat_statements', 'pg_graphql', 'supabase_vault', 'pgsodium', 'pgjwt', 'pg_net')"); do
  name=${ext%%:*}; schema=${ext#*:}
  if [ "$(local_sql -c "SELECT count(*) FROM pg_available_extensions WHERE name = '$name'")" = 1 ]; then
    local_sql -c "CREATE EXTENSION IF NOT EXISTS \"$name\" SCHEMA $schema"
    echo "    extension $name ($schema)"
  else
    echo "    extension $name isn't installed on this server; the restore will stop if the app needs it"
  fi
done

list=$(mktemp); chmod 644 "$list"
pg_restore --list "$dump" | grep -vE ' (PUBLICATION|PUBLICATION TABLE|SCHEMA - public|COMMENT - SCHEMA public) ' > "$list"
as_pg pg_restore --dbname="$DB" --no-owner --exit-on-error --single-transaction --use-list="$list" "$dump"
rm -f "$list"
local_sql -c "GRANT CONNECT ON DATABASE $DB TO americaecon_authenticator"

echo "3/5 Comparing row counts ..."
bad=0
for t in $(local_sql -c "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY 1"); do
  s=$(src_sql -c "SELECT count(*) FROM public.\"$t\""); d=$(local_sql -c "SELECT count(*) FROM public.\"$t\"")
  [ "$s" = "$d" ] || { bad=1; printf '    %-34s supabase %9s   vps %9s  MISMATCH\n' "$t" "$s" "$d"; }
  printf '    %-34s %9s rows\n' "$t" "$d"
done
[ "$bad" = 0 ] || { echo "Row counts differ; stopping. Supabase is untouched."; exit 1; }

echo "4/5 Rewriting saved image links ..."
local_sql -v old="$OLD_URL/storage/v1/object/public/" -v new="$PUBLIC_URL/storage/v1/object/public/" <<'SQL'
SET session_replication_role = replica;
SET migrate.old TO :'old';
SET migrate.new TO :'new';
DO $$
DECLARE c record; n bigint; total bigint := 0;
  o text := current_setting('migrate.old'); w text := current_setting('migrate.new');
BEGIN
  FOR c IN SELECT table_name, column_name FROM information_schema.columns
           WHERE table_schema = 'public' AND data_type IN ('text', 'character varying')
             AND table_name IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
    EXECUTE format('UPDATE public.%I SET %I = replace(%I, $1, $2) WHERE strpos(%I, $1) > 0', c.table_name, c.column_name, c.column_name, c.column_name) USING o, w;
    GET DIAGNOSTICS n = ROW_COUNT; total := total + n;
    IF n > 0 THEN RAISE NOTICE '    %.%: % rows', c.table_name, c.column_name, n; END IF;
  END LOOP;
  RAISE NOTICE '    % values rewritten', total;
END $$;
SQL

echo "5/5 Copying Storage files ..."
install -d -m 755 -o americaecon -g americaecon "$STORAGE_ROOT"
objects=$(mktemp)
src_sql -F $'\t' -c "SELECT o.bucket_id, o.name, coalesce((o.metadata->>'size')::bigint, -1) FROM storage.objects o ORDER BY 1, 2" > "$objects"
OLD_URL="$OLD_URL" STORAGE_ROOT="$STORAGE_ROOT" python3 - "$objects" <<'PY'
import os, sys, urllib.parse, urllib.request
base, root = os.environ['OLD_URL'], os.environ['STORAGE_ROOT']
rows = [l.rstrip('\n').split('\t') for l in open(sys.argv[1]) if l.strip()]
copied = skipped = 0; failed = []
for bucket, name, size in rows:
    size = int(size)
    target = os.path.realpath(os.path.join(root, bucket, name))
    if not target.startswith(os.path.realpath(os.path.join(root, bucket)) + os.sep):
        failed.append(f'{bucket}/{name} (unsafe name)'); continue
    if size >= 0 and os.path.exists(target) and os.path.getsize(target) == size:
        skipped += 1; continue
    url = f"{base}/storage/v1/object/public/{urllib.parse.quote(bucket)}/{urllib.parse.quote(name)}"
    try:
        data = urllib.request.urlopen(url, timeout=60).read()
        if size >= 0 and len(data) != size: raise ValueError(f'got {len(data)} bytes, expected {size}')
        os.makedirs(os.path.dirname(target), exist_ok=True)
        with open(target + '.part', 'wb') as f: f.write(data)
        os.replace(target + '.part', target); copied += 1
    except Exception as e:
        failed.append(f'{bucket}/{name} ({e})')
print(f"    {len(rows)} files: copied {copied}, already here {skipped}, failed {len(failed)}")
for f in failed[:20]: print('    FAILED', f)
PY
rm -f "$objects"
chown -R americaecon:americaecon "$STORAGE_ROOT"
systemctl reload americaecon-postgrest 2>/dev/null || systemctl restart americaecon-postgrest

echo
echo "Done. Local database '$DB' and $STORAGE_ROOT match Supabase as of this run."
echo "Next: deploy/vps/README.md step 4."
