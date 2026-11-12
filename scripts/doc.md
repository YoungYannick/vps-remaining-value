# NPM 维护页配置

本配置仅适用于 NPM；如需使用原生 Nginx、Caddy 或其他反向代理工具，请自行调整配置

## 作用

- 后端返回 500/502/503/504 时，`/svg` 分享图请求改为返回维护图
- 响应状态改为 200，避免分享图链接被浏览器或平台判定为失败
- 维护图只允许 Nginx 内部跳转访问，外部直接访问返回 404

## 文件位置

- Nginx 容器内路径：`/data/nginx/custom/pages/error.svg`
- 文件来源：本目录的 `error.svg`（由 `gen-error-svg.js` 生成）

```bash
# 查看 /data 对应的宿主机目录
docker inspect npm --format '{{range .Mounts}}{{.Source}} -> {{.Destination}}{{"\n"}}{{end}}'

# 假设 /data 映射到 /home/docker/npm/data，则放到：
/home/docker/npm/data/nginx/custom/pages/error.svg
```

## NPM 配置位置

- NPM 管理界面 → Hosts → Proxy Hosts → 对应域名 → Edit → **Advanced**
- 粘贴到 **Custom Nginx Configuration**

```nginx
location ^~ /svg {
    proxy_intercept_errors on;
    error_page 500 502 503 504 =200 /error.svg;
    include conf.d/include/proxy.conf;
}

location = /error.svg {
    internal;
    root /data/nginx/custom/pages;
    default_type image/svg+xml;
}
```

## 生效与验证

```bash
# 检查语法
docker exec npm nginx -t

# 手动重载（正常保存 Advanced 后会自动重载）
docker exec npm nginx -s reload
```