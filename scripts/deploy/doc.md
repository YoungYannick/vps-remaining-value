# NPM 维护页配置

本配置仅适用于 NPM；如需使用原生 Nginx、Caddy 或其他反向代理工具，请自行调整配置

## 作用

- 后端返回 500/502/503/504 时，`/svg` 分享图返回 `maintenance-vps.svg`，状态改为 200
- 其他请求的 5xx 返回 `maintenance-vps.html`，保留 503，并带 `Retry-After: 30`
- 错误页只允许 Nginx 内部跳转访问，外部直接访问返回 404

## 文件位置

- Nginx 容器内路径：`/data/nginx/custom/pages/maintenance-vps.svg`、`/data/nginx/custom/pages/maintenance-vps.html`
- 文件来源：本目录的 `maintenance-vps.svg`（由 `gen-maintenance-svg.js` 生成）、`maintenance-vps.html`

```bash
# 查看 /data 对应的宿主机目录
docker inspect npm --format '{{range .Mounts}}{{.Source}} -> {{.Destination}}{{"\n"}}{{end}}'
```

假设 `/data` 映射到 `/home/docker/npm/data`，则放到：

```text
/home/docker/npm/data/nginx/custom/pages/maintenance-vps.svg
/home/docker/npm/data/nginx/custom/pages/maintenance-vps.html
```

## NPM 配置位置

- NPM 管理界面 → Hosts → Proxy Hosts → 对应域名 → Edit → **Advanced**
- 粘贴到 **Custom Nginx Configuration**

```nginx
proxy_intercept_errors on;
error_page 500 502 503 504 =503 /maintenance-vps.html;

location ^~ /svg {
    proxy_intercept_errors on;
    error_page 500 502 503 504 =200 /maintenance-vps.svg;
    include conf.d/include/proxy.conf;
}

location = /maintenance-vps.svg {
    internal;
    root /data/nginx/custom/pages;
    default_type image/svg+xml;

    add_header Cache-Control "no-store, no-cache, must-revalidate" always;
}

location = /maintenance-vps.html {
    root /data/nginx/custom/pages;
    internal;

    add_header Cache-Control "no-store, no-cache, must-revalidate" always;
    add_header Pragma "no-cache" always;
    add_header Retry-After 30 always;
}
```

## HTML 压缩（可选）

```bash
npx --yes html-minifier-terser@7 maintenance-vps.html -o maintenance-vps.min.html --collapse-whitespace --remove-comments --remove-attribute-quotes --minify-css true --minify-js true --use-short-doctype
```

## 生效与验证

```bash
# 检查语法
docker exec npm nginx -t

# 手动重载（正常保存 Advanced 后会自动重载）
docker exec npm nginx -s reload
```