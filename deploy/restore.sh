#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════
#  Agentryx Dev Factory — Restore Script
#
#  Idempotent: safe to re-run. Symlinks configs from the repo into
#  /etc/ on the VM, then reloads systemd + nginx and enables services.
#
#  Usage:    sudo bash deploy/restore.sh
#  Run from: the root of the agentryx-factory repo.
# ═══════════════════════════════════════════════════════════════════

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEPLOY_DIR="$REPO_ROOT/deploy"

if [ "$EUID" -ne 0 ]; then
  echo "This script must run as root (use: sudo bash deploy/restore.sh)" >&2
  exit 1
fi

if [ ! -d "$DEPLOY_DIR/systemd" ]; then
  echo "Could not find deploy/ at $DEPLOY_DIR" >&2
  echo "Run this script from the root of the agentryx-factory repo." >&2
  exit 1
fi

log() { printf "  %s\n" "$*"; }
section() { printf "\n=== %s ===\n" "$*"; }

# ─── Step 1: Prerequisite check ──────────────────────────────────────
section "Prerequisites"
for cmd in nginx systemctl ttyd; do
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "ERROR: required command not found: $cmd" >&2
    exit 1
  fi
done
log "nginx, systemctl, ttyd present"

if ! id -u subhash.thakur.india >/dev/null 2>&1; then
  echo "ERROR: user 'subhash.thakur.india' does not exist on this host." >&2
  echo "Create it first, then re-run." >&2
  exit 1
fi
log "user 'subhash.thakur.india' present"

# ─── Step 2: Symlink systemd units ───────────────────────────────────
section "Systemd units"
mkdir -p /etc/systemd/system/ttyd.service.d

link_unit() {
  local src="$1" dest="$2"
  if [ -L "$dest" ] && [ "$(readlink -f "$dest")" = "$(readlink -f "$src")" ]; then
    log "already linked: $dest"
  else
    [ -e "$dest" ] && mv -f "$dest" "$dest.bak.$(date +%s)"
    ln -sf "$src" "$dest"
    log "linked: $dest → $src"
  fi
}

link_unit "$DEPLOY_DIR/systemd/factory-dashboard.service"        /etc/systemd/system/factory-dashboard.service
link_unit "$DEPLOY_DIR/systemd/factory-metrics.service"          /etc/systemd/system/factory-metrics.service
link_unit "$DEPLOY_DIR/systemd/factory-telemetry.service"        /etc/systemd/system/factory-telemetry.service
link_unit "$DEPLOY_DIR/systemd/factory-paperclip.service"        /etc/systemd/system/factory-paperclip.service
link_unit "$DEPLOY_DIR/systemd/ttyd.service.d/override.conf"     /etc/systemd/system/ttyd.service.d/override.conf

# ─── Step 3: Symlink /etc/default/ttyd ───────────────────────────────
section "ttyd defaults"
link_unit "$DEPLOY_DIR/ttyd/default" /etc/default/ttyd

# ─── Step 4: Symlink nginx vhosts ────────────────────────────────────
section "nginx vhosts"
link_unit "$DEPLOY_DIR/nginx/claw-code.agentryx.dev.conf" /etc/nginx/sites-available/claw-code.agentryx.dev
link_unit "$DEPLOY_DIR/nginx/dev-hub.agentryx.dev.conf"   /etc/nginx/sites-available/dev-hub.agentryx.dev

# Ensure sites-enabled symlinks exist
for site in claw-code.agentryx.dev dev-hub.agentryx.dev; do
  if [ ! -L "/etc/nginx/sites-enabled/$site" ]; then
    ln -sf "/etc/nginx/sites-available/$site" "/etc/nginx/sites-enabled/$site"
    log "enabled nginx site: $site"
  else
    log "nginx site already enabled: $site"
  fi
done

# ─── Step 5: Copy htpasswd (must be readable by nginx, not a symlink) ─
section "nginx htpasswd"
# htpasswd files are copied (not symlinked) so nginx's chroot / permission
# model works cleanly — file must be owned root:www-data, 640.
install -o root -g www-data -m 0640 "$DEPLOY_DIR/htpasswd/claw-code" /etc/nginx/.htpasswd-claw-code
log "installed /etc/nginx/.htpasswd-claw-code (root:www-data 0640)"

# ─── Step 6: nginx test + reload ─────────────────────────────────────
section "nginx test and reload"
nginx -t
systemctl reload nginx
log "nginx reloaded"

# ─── Step 7: systemd daemon-reload + enable + start ──────────────────
section "systemd"
systemctl daemon-reload
log "systemd daemon-reload done"

for svc in ttyd factory-dashboard factory-metrics factory-telemetry factory-paperclip; do
  if ! systemctl is-enabled --quiet "$svc" 2>/dev/null; then
    systemctl enable "$svc" 2>&1 | sed 's/^/  /'
  fi
  if ! systemctl is-active --quiet "$svc"; then
    systemctl start "$svc" 2>&1 | sed 's/^/  /'
    log "started $svc"
  else
    # Full restart (not reload-or-restart) — ttyd can't reload, and forcing
    # a stop+start sidesteps port-rebind races.
    systemctl stop "$svc" 2>&1 | sed 's/^/  /' || true
    # Belt + suspenders: kill any stray process for ttyd (known to survive stop)
    if [ "$svc" = "ttyd" ]; then pkill -9 -x ttyd 2>/dev/null || true; sleep 1; fi
    systemctl start "$svc" 2>&1 | sed 's/^/  /'
    log "restarted $svc"
  fi
done

# ─── Step 8: Summary ─────────────────────────────────────────────────
section "Status summary"
for svc in ttyd factory-dashboard factory-metrics factory-telemetry factory-paperclip; do
  printf "  %-30s %s (pid %s, restarts %s)\n" \
    "$svc" \
    "$(systemctl is-active "$svc")" \
    "$(systemctl show -p MainPID --value "$svc")" \
    "$(systemctl show -p NRestarts --value "$svc")"
done

printf "\nDone. Public URLs:\n"
printf "  https://dev-hub.agentryx.dev/        (dashboard — expect 200)\n"
printf "  https://claw-code.agentryx.dev/      (expect 401 without auth, 200 with)\n"
