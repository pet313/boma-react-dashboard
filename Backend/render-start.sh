#!/bin/bash
# KMC GRN — Render startup script
# CRITICAL: No set -e — each step handles errors individually
# CRITICAL: We do NOT cache config — config:cache bakes in env vars at cache time
#           and ignores live Render env vars after that. Always read live env.

echo "======================================"
echo " KMC GRN — Render Startup"
echo "======================================"

# ── 1. Validate required env vars ────────────────────────────────────────────
if [ -z "$APP_KEY" ]; then
  echo "FATAL: APP_KEY is not set in Render environment variables."
  echo "       Go to Render Dashboard -> Environment -> Add APP_KEY"
  exit 1
fi

if [ -z "$DATABASE_URL" ]; then
  echo "FATAL: DATABASE_URL is not set."
  echo "       Attach a PostgreSQL database to your Render service."
  exit 1
fi

echo "APP_KEY:          present"
echo "DATABASE_URL:     present"
echo "MAIL_MAILER:      ${MAIL_MAILER:-NOT SET}"
echo "MAIL_HOST:        ${MAIL_HOST:-NOT SET}"
echo "MAIL_USERNAME:    ${MAIL_USERNAME:-NOT SET}"
echo "MAIL_FROM:        ${MAIL_FROM_ADDRESS:-NOT SET}"

# Warn loudly if mail is not configured
if [ "${MAIL_MAILER}" != "smtp" ]; then
  echo ""
  echo "WARNING: MAIL_MAILER is '${MAIL_MAILER:-empty}' not 'smtp'."
  echo "         Emails will NOT be sent. Set MAIL_MAILER=smtp in Render."
  echo ""
fi

if [ -z "$MAIL_USERNAME" ] || [ -z "$MAIL_PASSWORD" ]; then
  echo "WARNING: MAIL_USERNAME or MAIL_PASSWORD is empty."
  echo "         Gmail SMTP will fail. Set both in Render environment."
fi

# ── 2. Remove ALL cached config/routes (stale cache = wrong env vars read) ───
echo "Removing stale caches..."
rm -f bootstrap/cache/config.php
rm -f bootstrap/cache/packages.php
rm -f bootstrap/cache/routes-v7.php
rm -f bootstrap/cache/services.php
rm -f bootstrap/cache/events.php

# Run artisan clears as backup
php artisan config:clear  --no-interaction 2>/dev/null || true
php artisan route:clear   --no-interaction 2>/dev/null || true
php artisan view:clear    --no-interaction 2>/dev/null || true
php artisan cache:clear   --no-interaction 2>/dev/null || true

# ── 3. Create required storage directories ────────────────────────────────────
echo "Creating storage directories..."
mkdir -p storage/app/grns
mkdir -p storage/framework/cache/data
mkdir -p storage/framework/sessions
mkdir -p storage/framework/views
mkdir -p storage/logs
mkdir -p bootstrap/cache
chmod -R 775 storage bootstrap/cache 2>/dev/null || true

# ── 4. Run migrations ─────────────────────────────────────────────────────────
echo "Running migrations..."
if php artisan migrate --force --no-interaction; then
  echo "Migrations complete."
else
  echo "WARNING: Migration had errors. Check logs above."
fi

# ── 5. Seed default users ─────────────────────────────────────────────────────
echo "Seeding default users..."
php artisan db:seed --force --no-interaction && echo "Seeding complete." || echo "Seeder had warnings (check logs)."

# ── 6. Run composer post-install scripts (package:discover etc.) ──────────────
echo "Running composer post-install scripts..."
COMPOSER_ALLOW_SUPERUSER=1 composer run-script post-autoload-dump --no-interaction 2>/dev/null || true

# ── 7. DO NOT cache config — this is intentional ─────────────────────────────
# config:cache bakes the current environment into a file.
# On Render, env vars can change between deploys.
# Without caching, Laravel reads env vars fresh on every request — correct.
echo "NOTE: Skipping config:cache intentionally — Render env vars read live."

# ── 8. Start Laravel ──────────────────────────────────────────────────────────
echo "======================================"
echo " Starting Laravel on port ${PORT:-10000}"
echo "======================================"
exec php artisan serve --host=0.0.0.0 --port="${PORT:-10000}"
