# VPS Remaining Value (VPS 剩余价值计算器)

一个用于计算 各类订阅服务剩余价值的 Web 工具，支持动态汇率转换并可生成 SVG 分享图

![main](./resource/1.png)

## SVG 预览

| ![main](./resource/1.svg) | ![main](./resource/2.svg) | ![main](./resource/2-1.svg) | ![main](./resource/3.svg) | ![main](./resource/3-1.svg) |
|-----------------------|-----------------------|---------------------------|---------------------------|---------------------------|


## Markdown文本 预览

[Markdown文本](./resource/preview.md)

## 本地运行

```bash
npm install
npm run start
```

服务默认运行在 http://localhost:45867

## 环境变量

| 变量 | 必填 | 说明                                     |
| --- | --- |----------------------------------------|
| `SECRET_KEY` | 是 | 签名密钥，用于请求令牌签发与校验                       |
| `TIMEZONE` | 否 | 计算日期与日志所用时区，填写 IANA 时区名（如 `Asia/Shanghai`），不填默认 `Asia/Shanghai` |

## Docker 部署

```bash
docker build -t vps-remaining-value:latest .
docker run -d -p 45867:45867 -e SECRET_KEY="YourCustomSecretKeyHere" -e TIMEZONE=Asia/Shanghai --restart always --name vps-remaining-value vps-remaining-value:latest
```

```bash
docker run -d -p 45867:45867 -e SECRET_KEY="YourCustomSecretKeyHere" -e TIMEZONE=Asia/Shanghai --restart always --name vps-remaining-value ghcr.io/youngyannick/vps-remaining-value:latest
```
