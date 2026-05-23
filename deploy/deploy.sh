#!/usr/bin/env bash
# 一次性部署脚本（Ubuntu）。第一次跑会装依赖+申请 HTTPS；之后每次发版只需要 `git pull && systemctl restart douyin-backend`。
set -euo pipefail

APP_DIR=/opt/douyin-ai-hackathon
DOMAIN=douyinhackathon.xinguangtreehole.com
REPO=https://github.com/huiyanghuang/douyin-ai-hackathon.git
BRANCH=huangxinjun

if [ ! -d "$APP_DIR/.git" ]; then
  git clone -b "$BRANCH" "$REPO" "$APP_DIR"
else
  git -C "$APP_DIR" fetch origin "$BRANCH"
  git -C "$APP_DIR" checkout "$BRANCH"
  git -C "$APP_DIR" reset --hard "origin/$BRANCH"
fi

apt-get update
apt-get install -y python3.11 python3.11-venv python3-pip nginx certbot python3-certbot-nginx

if [ ! -d "$APP_DIR/.venv" ]; then
  python3.11 -m venv "$APP_DIR/.venv"
fi
"$APP_DIR/.venv/bin/pip" install --upgrade pip
"$APP_DIR/.venv/bin/pip" install -r "$APP_DIR/backend/requirements.txt"

mkdir -p /var/lib/douyin-uploads
chmod 755 /var/lib/douyin-uploads

cp "$APP_DIR/deploy/douyin-backend.service" /etc/systemd/system/douyin-backend.service
systemctl daemon-reload
systemctl enable douyin-backend
systemctl restart douyin-backend

cp "$APP_DIR/deploy/nginx.conf" "/etc/nginx/sites-available/$DOMAIN"
ln -sf "/etc/nginx/sites-available/$DOMAIN" "/etc/nginx/sites-enabled/$DOMAIN"
nginx -t && systemctl reload nginx

if [ ! -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
  certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos -m admin@xinguangtreehole.com
fi

systemctl status douyin-backend --no-pager
