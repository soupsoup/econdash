#!/usr/bin/env bash
# Nightly dump of America Econ's database (americaecon-db-backup.timer, as postgres).
# Keeps 14 days in /var/backups/americaecon.
set -euo pipefail
dir=/var/backups/americaecon
out="$dir/americaecon-$(date +%Y%m%d-%H%M).dump"
pg_dump --format=custom --file="$out.tmp" americaecon
mv "$out.tmp" "$out"; chmod 640 "$out"
find "$dir" -name 'americaecon-*.dump' -mtime +14 -delete
echo "Backed up $(du -h "$out" | cut -f1) to $out"
