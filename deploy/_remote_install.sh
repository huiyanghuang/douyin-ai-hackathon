#!/usr/bin/env bash
# 远端执行用，幂等。Debian 12。
# 注意：这台机器还跑着 SQTP (8787) 和第一届黑客松 (8000)，本服务用 8001。
# 域名走 Cloudflare 代理，源站只跑 HTTP；HTTPS 由 CF 边缘负责，不在源站签证书。
set -euxo pipefail

APP_DIR=/opt/douyin-ai-hackathon
DOMAIN=douyinhackathon.xinguangtreehole.com
REPO=https://github.com/huiyanghuang/douyin-ai-hackathon.git
BRANCH=main
GEMINI_KEY=AIzaSyBfL5MxLtht8NcVayzNg8AtKhORrxMeeXU
PORT=8001

export DEBIAN_FRONTEND=noninteractive

# 1. 系统依赖（nginx 已装；只补 python + git）
apt-get update
apt-get install -y python3 python3-venv python3-pip git curl

# 2. 拉/更新代码
if [ ! -d "$APP_DIR/.git" ]; then
    git clone -b "$BRANCH" "$REPO" "$APP_DIR"
else
    git -C "$APP_DIR" remote set-url origin "$REPO"
    git -C "$APP_DIR" fetch origin "$BRANCH"
    git -C "$APP_DIR" checkout "$BRANCH"
    git -C "$APP_DIR" reset --hard "origin/$BRANCH"
fi

# 3. venv + Python 依赖
if [ ! -d "$APP_DIR/.venv" ]; then
    python3 -m venv "$APP_DIR/.venv"
fi
"$APP_DIR/.venv/bin/pip" install --upgrade pip
"$APP_DIR/.venv/bin/pip" install -r "$APP_DIR/backend/requirements.txt"

# 4. 上传目录
mkdir -p /var/lib/douyin-uploads
chmod 755 /var/lib/douyin-uploads

# 5. systemd service（覆盖写）
cat >/etc/systemd/system/douyin-backend.service <<EOF
[Unit]
Description=Douyin Hackathon Backend (FastAPI on :$PORT)
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=$APP_DIR
Environment=GEMINI_API_KEY=$GEMINI_KEY
Environment=UPLOAD_DIR=/var/lib/douyin-uploads
ExecStart=$APP_DIR/.venv/bin/python -m uvicorn backend.main:app --host 127.0.0.1 --port $PORT --workers 1
Restart=always
RestartSec=3
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF
systemctl daemon-reload
systemctl enable douyin-backend
systemctl restart douyin-backend

# 6. nginx：前端在 $APP_DIR 根目录，/api/* 反代到 $PORT，SSE 友好
cat >/etc/nginx/sites-available/douyin-hackathon <<NGINX
server {
    listen 80;
    server_name $DOMAIN;

    client_max_body_size 120M;

    root $APP_DIR;
    index index.html;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:$PORT;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;

        proxy_buffering off;
        proxy_cache off;
        proxy_read_timeout 300s;
        proxy_send_timeout 300s;
        proxy_set_header Connection '';
        chunked_transfer_encoding off;
    }

    location = /healthz {
        proxy_pass http://127.0.0.1:$PORT/healthz;
    }
}
NGINX

ln -sf /etc/nginx/sites-available/douyin-hackathon /etc/nginx/sites-enabled/douyin-hackathon
nginx -t
systemctl reload nginx

# 7. 自检（5s 让服务起来）
sleep 5
set +e
echo "--- service status ---"
systemctl status douyin-backend --no-pager | head -20
echo "--- local backend (:$PORT) ---"
curl -fsS http://127.0.0.1:$PORT/healthz; echo
echo "--- through nginx (Host header) ---"
curl -fsS -H "Host: $DOMAIN" http://127.0.0.1/healthz; echo
echo "--- through nginx (root) ---"
curl -fsS -I -H "Host: $DOMAIN" http://127.0.0.1/ | head -5
echo "--- done ---"
