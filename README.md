# VPS Remaining Value (VPS 剩余价值计算器)

一个用于计算 各类订阅服务剩余价值的 Web 工具，支持动态汇率转换并可生成 SVG 分享图

![main](./resource/1.png)

---

## 预览
### SVG
| ![main](./resource/1.svg) | ![main](./resource/2.svg) | ![main](./resource/2-1.svg) | ![main](./resource/3.svg) | ![main](./resource/3-1.svg) |
|-----------------------|-----------------------|---------------------------|---------------------------|---------------------------|

### [Markdown文本](./resource/preview.md)

---

## 分享链接压缩 （v0.3.x / v0.2.x）
分享链接当前使用 V2 编码（`/v2/<base64>`），旧版 V1 链接（`/vrv<base64>`）仍可正常解析

V2 与 V1 的差异：
- `cm` / `eom` / `ps` 只使用存在位表示 `fixed` / `eom` / `buyer`，不再单独占用 1 字节
- `rc` / `tc` 合并为 1 字节（低 4 位 rc、高 4 位 tc），`pc` 使用 1 字节低 4 位
- 版本通过链接路径区分，不额外占用参数字节

不同场景下的长度对比（完整链接以 `http://localhost:45867` 为例，域名不同时整体长度同步变化）：

| 场景 | V1 base64 | V2 base64 | 缩减 | V1 完整链接 | V2 完整链接 | 缩减 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 最简（无汇率） | 16 | 16 | 0 | 42 | 42 | 0 |
| 含汇率 | 22 | 22 | 0 | 48 | 48 | 0 |
| 交易金额 | 27 | 27 | 0 | 53 | 53 | 0 |
| 溢价金额 | 27 | 27 | 0 | 53 | 53 | 0 |
| 非默认币种 | 24 | 23 | 1 | 50 | 49 | 1 |
| fixed + eom | 24 | 22 | 2 | 50 | 48 | 2 |
| PUSH（买家承担） | 38 | 36 | 2 | 64 | 62 | 2 |
| PUSH（卖家承担） | 36 | 36 | 0 | 62 | 62 | 0 |
| 高精度 PUSH 汇率 | 48 | 47 | 1 | 74 | 73 | 1 |
| 全字段 | 48 | 43 | 5 | 74 | 69 | 5 |

没有使用默认值以外的 `cm` / `eom` / `ps` 或非默认币种时，V1 与 V2 长度相同；启用这些字段后 V2 逐字节减少，全字段场景可缩短 5 个字符
~~忙活半天，没多大变化🤡~~

---

## 本地运行

```bash
npm install
npm run start
```

服务默认运行在 http://localhost:45867

---

## 环境变量

| 变量 | 必填 | 说明                                     |
| --- | --- |----------------------------------------|
| `SECRET_KEY` | 是 | 签名密钥，用于请求令牌签发与校验                       |
| `TIMEZONE` | 否 | 计算日期与日志所用时区，填写 IANA 时区名（如 `Asia/Shanghai`），不填默认 `Asia/Shanghai` |

---

## Docker 部署

```bash
docker build -t vps-remaining-value:latest .
docker run -d -p 45867:45867 -e SECRET_KEY="YourCustomSecretKeyHere" -e TIMEZONE=Asia/Shanghai --restart always --name vps-remaining-value vps-remaining-value:latest
```

```bash
docker run -d -p 45867:45867 -e SECRET_KEY="YourCustomSecretKeyHere" -e TIMEZONE=Asia/Shanghai --restart always --name vps-remaining-value ghcr.io/youngyannick/vps-remaining-value:latest
```
