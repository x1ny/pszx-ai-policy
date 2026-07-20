#!/bin/sh
set -eu

export TZ=Asia/Shanghai
ln -sf /usr/share/zoneinfo/Asia/Shanghai /etc/localtime 2>/dev/null || true

API_URL="${API_URL:-http://localhost:5212}"
VELA_API_URL="${VELA_API_URL:-http://10.2.1.16:31119}"
API_URL="${API_URL%/}"
VELA_API_URL="${VELA_API_URL%/}"

echo "Starting Cloudreve frontend..."
echo "API_URL: ${API_URL}"
echo "VELA_API_URL: ${VELA_API_URL}"

sed -e "s|__API_URL__|${API_URL}|g" \
    -e "s|__VELA_API_URL__|${VELA_API_URL}|g" \
    /etc/nginx/nginx.conf.tmpl \
  > /usr/local/openresty/nginx/conf/nginx.conf

/usr/local/openresty/nginx/sbin/nginx -t
exec /usr/local/openresty/nginx/sbin/nginx -g 'daemon off;'
