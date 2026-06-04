#!/bin/bash
# ══════════════════════════════════════════════════════════════
# Classgrid Production Deploy Script
# ══════════════════════════════════════════════════════════════
# Usage: ./scripts/deploy.sh [staging|production]
# Must be run on the EC2 instance (or via SSH).
# ──────────────────────────────────────────────────────────────

set -e  # Exit on any error

ENV="${1:-production}"
APP_DIR="/home/ubuntu/classgrid/current"
LOG_DIR="/home/ubuntu/classgrid/logs"

echo "╔══════════════════════════════════════════════════╗"
echo "║     CLASSGRID DEPLOY — $ENV                     ║"
echo "╚══════════════════════════════════════════════════╝"

# ── 1. Pull latest code ──
echo "📥 Pulling latest code..."
cd "$APP_DIR"
git pull origin main

# ── 2. Install dependencies ──
echo "📦 Installing server dependencies..."
cd "$APP_DIR/server"
npm ci --production

echo "📦 Building client..."
cd "$APP_DIR/client"
npm ci
npm run build

# ── 3. Run database migrations (if any) ──
echo "🗄️  Running migrations..."
cd "$APP_DIR/server"
if [ -d "migrations" ]; then
    for migration in migrations/*.js; do
        [ -f "$migration" ] && echo "  Running $migration..." && node "$migration" || true
    done
fi

# ── 4. Create log directory ──
mkdir -p "$LOG_DIR"

# ── 5. Reload PM2 (zero-downtime) ──
echo "🔄 Reloading PM2 ($ENV mode)..."
cd "$APP_DIR/server"
pm2 reload ecosystem.config.cjs --env "$ENV" --update-env

# ── 6. Health check ──
echo "🏥 Running health check..."
sleep 3
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health)
if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Health check PASSED (HTTP $HTTP_CODE)"
else
    echo "❌ Health check FAILED (HTTP $HTTP_CODE)"
    echo "   Rolling back..."
    pm2 reload ecosystem.config.cjs --env "$ENV"
    exit 1
fi

# ── 7. Save PM2 state ──
pm2 save

echo ""
echo "╔══════════════════════════════════════════════════╗"
echo "║     ✅ DEPLOY COMPLETE — $ENV                   ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""
echo "🔍 Monitor: pm2 monit"
echo "📊 Logs:    pm2 logs classgrid --lines 50"
