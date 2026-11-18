#!/usr/bin/env bash
# One command to bring the whole preview back up in a fresh sandbox:
#   bash scripts/dev-sandbox.sh
# Installs MongoDB if missing, starts it, restores the .env, seeds sample data,
# and opens a public Cloudflare tunnel so the site can be opened from any browser.
set -u

MONGO_DIR="$HOME/mongodb"
DATA_DIR="$HOME/mongo-data"
APP_DIR="/app"
PORT="${PORT:-3000}"

echo "==> 1/5 MongoDB binary"
if [ ! -x "$MONGO_DIR/bin/mongod" ]; then
  mkdir -p "$MONGO_DIR"
  curl -sfL -m 300 -o "$MONGO_DIR/m.tgz" \
    https://fastdl.mongodb.org/linux/mongodb-linux-x86_64-debian12-7.0.14.tgz
  tar xzf "$MONGO_DIR/m.tgz" -C "$MONGO_DIR" --strip-components=1
  rm -f "$MONGO_DIR/m.tgz"
  echo "    installed"
else
  echo "    already installed"
fi

echo "==> 2/5 Start MongoDB"
mkdir -p "$DATA_DIR"
pgrep mongod >/dev/null 2>&1 || \
  "$MONGO_DIR/bin/mongod" --dbpath "$DATA_DIR" --bind_ip 127.0.0.1 --port 27017 \
    --fork --logpath "$HOME/mongo.log" >/dev/null
sleep 2
pgrep mongod >/dev/null && echo "    running" || { echo "    FAILED"; exit 1; }

echo "==> 3/5 Environment file"
cd "$APP_DIR" || exit 1
if ! grep -q MONGODB_URI .env 2>/dev/null; then
  SECRET=$(node -e "console.log(require('crypto').randomBytes(48).toString('hex'))")
  cat > .env <<EOF
# To use MongoDB Atlas instead, paste its connection string here and restart.
MONGODB_URI="mongodb://127.0.0.1:27017/iseries"
MONGODB_DB=iseries
ADMIN_PASSWORD="1234"
AUTH_SECRET=$SECRET
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/app_db
EOF
  cp .env .env.local
  echo "    created"
else
  echo "    already present"
fi

echo "==> 4/5 Sample data"
COUNT=$(node -e "
const {MongoClient}=require('mongodb');
(async()=>{try{const c=await new MongoClient('mongodb://127.0.0.1:27017/iseries',{serverSelectionTimeoutMS:5000}).connect();
console.log(await c.db().collection('orders').countDocuments());await c.close();}catch(e){console.log(0)}})();")
if [ "$COUNT" = "0" ]; then
  DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/app_db \
  MONGODB_URI=mongodb://127.0.0.1:27017/iseries \
  node scripts/migrate-pg-to-mongo.mjs --reset >/dev/null 2>&1 && echo "    restored from backup" || echo "    starting empty"
else
  echo "    $COUNT orders already present"
fi

echo "==> 5/5 Public tunnel"
if ! pgrep cloudflared >/dev/null 2>&1; then
  [ -x /tmp/cloudflared ] || {
    curl -sfL -m 180 -o /tmp/cloudflared \
      https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64
    chmod +x /tmp/cloudflared
  }
  rm -f /tmp/cf.log
  nohup /tmp/cloudflared tunnel --url "http://localhost:$PORT" --no-autoupdate >/tmp/cf.log 2>&1 &
  for _ in $(seq 1 20); do
    sleep 2
    URL=$(grep -oE "https://[a-z0-9-]+\.trycloudflare\.com" /tmp/cf.log | head -1)
    [ -n "${URL:-}" ] && break
  done
else
  URL=$(grep -oE "https://[a-z0-9-]+\.trycloudflare\.com" /tmp/cf.log 2>/dev/null | head -1)
fi

echo
echo "============================================================"
echo "  Public link : ${URL:-(tunnel not ready, check /tmp/cf.log)}"
echo "  Admin panel : ${URL:-}/admin     password: 1234"
echo "============================================================"
echo "Now run:  npm run build && npm start   (or use the platform's start)"
