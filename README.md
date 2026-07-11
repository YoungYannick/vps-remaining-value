# VPS Remaining Value (VPS 剩余价值计算器)

一个用于计算 各类订阅服务剩余价值的 Web 工具，支持动态汇率转换并可生成 SVG 分享图

![main](./resource/3.png)

## SVG 预览

| ![main](./resource/1.svg) | ![main](./resource/2.svg) |
|-----------------------|-----------------------|

## 本地运行

```bash
npm install
npm run start
```

服务默认运行在 http://localhost:45867

## Docker 部署

```bash
docker build -t vps-remaining-value:latest .
docker run -d -p 45867:45867 -e SECRET_KEY="YourCustomSecretKeyHere" -e V6_API_KEY="YourExchangeRateV6KeyHere" --restart always --name vps-remaining-value vps-remaining-value:latest
```

```bash
docker run -d -p 45867:45867 -e SECRET_KEY="YourCustomSecretKeyHere" -e V6_API_KEY="YourExchangeRateV6KeyHere" --restart always --name vps-remaining-value ghcr.io/youngyannick/vps-remaining-value:latest
```
