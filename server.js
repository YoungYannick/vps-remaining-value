const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const TIMEZONE = process.env.TIMEZONE || 'Asia/Shanghai';
let logFmt;
try {
    logFmt = new Intl.DateTimeFormat('sv-SE', { timeZone: TIMEZONE, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
} catch (e) {
    console.error(`[${new Date().toLocaleString('sv-SE')}] [启动失败] 无效的 TIMEZONE: ${TIMEZONE}`);
    process.exit(1);
}
const dateFmt = new Intl.DateTimeFormat('en-CA', { timeZone: TIMEZONE, year: 'numeric', month: '2-digit', day: '2-digit' });
const stamp = () => logFmt.format(new Date());
const log = (msg) => console.log(`[${stamp()}] ${msg}`);
const warn = (msg) => console.warn(`[${stamp()}] ${msg}`);
const logErr = (msg) => console.error(`[${stamp()}] ${msg}`);

const SECRET_KEY = process.env.SECRET_KEY;
if (!SECRET_KEY) {
    logErr('[启动失败] 未配置 SECRET_KEY，请在 .env 或环境变量中设置');
    process.exit(1);
}

let logoBase64 = '';
try {
    let logoStr = fs.readFileSync(path.join(__dirname, 'public', 'images', 'logo.svg'), 'utf-8');
    logoStr = logoStr.replace(/#000000|#000\b|black/gi, '#D4AF37');
    logoBase64 = `data:image/svg+xml;base64,${Buffer.from(logoStr).toString('base64')}`;
} catch (e) {
    logErr(`Logo 加载失败: ${e.message}`);
}

const app = express();
app.set('trust proxy', true);
let ratesCache = null;
let ratesCacheTime = 0;
const SUPPORTED_CURRENCIES = ['AUD', 'CAD', 'CHF', 'CNY', 'EUR', 'GBP', 'HKD', 'INR', 'JPY', 'KRW', 'NZD', 'RUB', 'SGD', 'TWD', 'USD'];
const FALLBACK_RATES = {
    "AUD": 1.44,
    "CAD": 1.42,
    "CHF": 0.808,
    "CNY": 6.78,
    "EUR": 0.876,
    "GBP": 0.75,
    "HKD": 7.84,
    "INR": 95.44,
    "JPY": 161.80,
    "KRW": 1502.98,
    "NZD": 1.73,
    "RUB": 76.40,
    "SGD": 1.29,
    "TWD": 32.08,
    "USD": 1
};
async function fetchOnce(url) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
                'Accept': 'application/json, text/plain, */*',
                'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8'
            },
            signal: controller.signal
        });
        if (!response.ok) {
            warn(`[汇率源] HTTP ${response.status}: ${url}`);
            return null;
        }
        return await response.json();
    } catch (e) {
        const code = e.cause && e.cause.code ? ` (${e.cause.code})` : '';
        warn(`[汇率源] 请求失败: ${url}${code}`);
        return null;
    } finally {
        clearTimeout(timeoutId);
    }
}
function normalizeRates(data) {
    if (Array.isArray(data)) {
        const rates = {};
        for (const item of data) {
            if (!item || typeof item.quote !== 'string' || typeof item.rate !== 'number') continue;
            const cur = item.quote.toUpperCase();
            if (SUPPORTED_CURRENCIES.includes(cur)) rates[cur] = item.rate;
        }
        rates.USD = 1;
        return Object.keys(rates).length >= 10 ? rates : null;
    }
    if (data.rates) return data.rates;
    if (data.conversion_rates) return data.conversion_rates;
    if (data.usd && typeof data.usd === 'object') {
        const rates = {};
        for (const cur of SUPPORTED_CURRENCIES) {
            const v = data.usd[cur.toLowerCase()];
            if (typeof v === 'number') rates[cur] = v;
        }
        return Object.keys(rates).length >= 15 ? rates : null;
    }
    return null;
}
async function fetchRatesFromApis() {
    const sources = [
        { url: 'https://api.exchangerate.fun/latest?base=USD', name: 'ExchangeRate.fun', ttl: 3600000 },
        {
            url: 'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json',
            fallbackUrls: [
                'https://fastly.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json',
                'https://latest.currency-api.pages.dev/v1/currencies/usd.json'
            ],
            name: 'Currency-API',
            ttl: 7200000
        },
        { url: 'https://api.frankfurter.dev/v2/rates?base=usd', name: 'Frankfurter', ttl: 7200000 },
        { url: 'https://api.exchangerate-api.com/v4/latest/USD', name: 'ExchangeRate-API V4', ttl: 300000 }
    ];
    for (const api of sources) {
        let data = null;
        for (const url of [api.url, ...(api.fallbackUrls || [])]) {
            data = await fetchOnce(url);
            if (data) break;
        }
        if (!data) continue;
        const rates = normalizeRates(data);
        if (rates) {
            ratesCache = { source: api.name, rates, cachedAt: Date.now() };
            ratesCacheTime = Date.now() + api.ttl;
            return ratesCache;
        }
    }
    return null;
}
let refreshPromise = null;
function refreshRates() {
    if (!refreshPromise) {
        refreshPromise = fetchRatesFromApis().finally(() => { refreshPromise = null; });
    }
    return refreshPromise;
}
const getClientIp = (req) => {
    const cf = req.headers['cf-connecting-ip'];
    if (cf) return cf.split(',')[0].trim();
    const xff = req.headers['x-forwarded-for'];
    if (xff) return xff.split(',')[0].trim();
    return req.ip || req.socket.remoteAddress || '';
};
const formatCacheAge = (cachedAt) => {
    const ageSec = Math.floor((Date.now() - cachedAt) / 1000);
    if (ageSec < 60) return `${ageSec}秒`;
    const mins = Math.floor(ageSec / 60);
    if (mins < 60) return `${mins}分${ageSec % 60}秒`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}小时${mins % 60}分`;
    return `${Math.floor(hours / 24)}天${hours % 24}小时`;
};
const isValidHost = (urlStr, expectedHost) => {
    try {
        if (!urlStr) return false;
        return new URL(urlStr).host === expectedHost;
    } catch (e) {
        return false;
    }
};
app.use((req, res, next) => {
    res.on('finish', () => {
        const urlPath = req.originalUrl.split('?')[0];
        const ext = path.extname(urlPath);
        const skipExtensions = ['.css', '.js', '.ico'];
        const isStatic = skipExtensions.includes(ext) || urlPath === '/favicon.ico';
        if (!isStatic) {
            const ip = getClientIp(req);
            log(`[${ip}] [${req.method}] [${res.statusCode}] ${req.originalUrl}`);
        }
    });
    next();
});
app.use(cookieParser(SECRET_KEY));
app.use((req, res, next) => {
    if (req.path === '/' || req.path === '/index.html' || req.path.startsWith('/vrv') || req.path.startsWith('/v2/')) {
        const t = Date.now().toString();
        const ip = getClientIp(req);
        const sign = crypto.createHmac('sha256', SECRET_KEY).update(t + ip).digest('hex');
        const b64Token = Buffer.from(`${t}.${sign}`).toString('base64');
        res.cookie('vps_token', b64Token, {
            httpOnly: true,
            path: '/',
            maxAge: 3600000,
            sameSite: 'strict',
            signed: true
        });
    }
    next();
});
// ra: 续费金额 | rc: 续费货币 | pd: 付款周期(天) | cm: 计算模式 | ed: 到期时间 | td: 交易时间
// dr: 交易折扣 | pa: 溢价金额 | ta: 交易金额 | tc: 交易货币 | eom: 起始日推算 | er: 汇率(rc->tc)
// push: PUSH费 | ps: PUSH费承担方 | pc: PUSH费货币 | per: PUSH汇率(pc->tc)
// bit14 为扩展标志(存在 bit16+ 字段时头部追加 2 字节 extMask)，bit15 为 f64 双精度标志
const SCHEMA = [
    { key: 'ra', type: 'float', bit: 0 },
    { key: 'rc', type: 'dict', bit: 1, dict: {'AUD': 1, 'CAD': 2, 'CHF': 3, 'CNY': 4, 'EUR': 5, 'GBP': 6, 'HKD': 7, 'INR': 8, 'JPY': 9, 'KRW': 10, 'NZD': 11, 'RUB': 12, 'SGD': 13, 'TWD': 14, 'USD': 15} },
    { key: 'pd', type: 'u16', bit: 2 },
    { key: 'cm', type: 'dict', bit: 3, dict: {'real': 1, 'fixed': 2} },
    { key: 'ed', type: 'date', bit: 4 },
    { key: 'td', type: 'date', bit: 5 },
    { key: 'dr', type: 'float', bit: 6 },
    { key: 'pa', type: 'float', bit: 7 },
    { key: 'ta', type: 'float', bit: 8 },
    { key: 'tc', type: 'dict', bit: 9, dict: {'AUD': 1, 'CAD': 2, 'CHF': 3, 'CNY': 4, 'EUR': 5, 'GBP': 6, 'HKD': 7, 'INR': 8, 'JPY': 9, 'KRW': 10, 'NZD': 11, 'RUB': 12, 'SGD': 13, 'TWD': 14, 'USD': 15} },
    { key: 'eom', type: 'dict', bit: 10, dict: {'exact': 1, 'eom': 2} },
    { key: 'er', type: 'float', bit: 11 },
    { key: 'push', type: 'float', bit: 12 },
    { key: 'ps', type: 'dict', bit: 13, dict: {'seller': 1, 'buyer': 2} },
    { key: 'pc', type: 'dict', bit: 16, dict: {'AUD': 1, 'CAD': 2, 'CHF': 3, 'CNY': 4, 'EUR': 5, 'GBP': 6, 'HKD': 7, 'INR': 8, 'JPY': 9, 'KRW': 10, 'NZD': 11, 'RUB': 12, 'SGD': 13, 'TWD': 14, 'USD': 15} },
    { key: 'per', type: 'float', bit: 17 }
];
const daysToDate = (days) => new Date(days * 86400000).toISOString().split('T')[0];
const validCurrency = (c, def) => SUPPORTED_CURRENCIES.includes(c) ? c : def;
const validDate = (s) => {
    if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
    const [y, m, d] = s.split('-').map(Number);
    if (y < 2000 || y > 3000) return null;
    const dt = new Date(Date.UTC(y, m - 1, d));
    if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) return null;
    return s;
};
const validRate = (v) => {
    const n = parseFloat(v);
    return (isFinite(n) && n > 0) ? n : null;
};
const formatRate = (n) => {
    if (!isFinite(n) || n <= 0) return '--';
    const digits = n >= 1000 ? 2 : n >= 100 ? 3 : n >= 1 ? 4 : n >= 0.1 ? 5 : 6;
    const s = n.toFixed(digits);
    return s.includes('.') ? s.replace(/0+$/, '').replace(/\.$/, '') : s;
};
const roundNum = (n, digits = 6) => Number(n.toFixed(digits));
const getNowDateStr = () => dateFmt.format(new Date());
function decodeBase64Params(base64UrlStr) {
    if (!base64UrlStr) return {};
    let b64 = base64UrlStr.replace(/-/g, '+').replace(/_/g, '/');
    while (b64.length % 4) b64 += '=';
    try {
        const binaryStr = Buffer.from(b64, 'base64').toString('binary');
        const buffer = new ArrayBuffer(binaryStr.length);
        const uint8Array = new Uint8Array(buffer);
        for (let i = 0; i < binaryStr.length; i++) {
            uint8Array[i] = binaryStr.charCodeAt(i);
        }
        const view = new DataView(buffer);
        const maskLo = view.getUint16(0);
        const hasF64Mask = (maskLo & 0x8000) !== 0;
        const hasExtMask = (maskLo & 0x4000) !== 0;
        let f64Mask = 0;
        let extMask = 0;
        let offset = 2;
        let isLegacyF32 = false;
        if (hasF64Mask) {
            f64Mask = view.getUint16(offset);
            offset += 2;
        }
        if (hasExtMask) {
            extMask = view.getUint16(offset);
            offset += 2;
        }
        const mask = (maskLo & 0x3FFF) | ((extMask & 0x7FFF) << 16);
        const extF64 = (extMask & 0x8000) !== 0;
        if (!hasF64Mask) {
            if (extF64) {
                isLegacyF32 = true;
            } else {
                const expectedF64Len = SCHEMA.reduce((acc, s) => acc + ((mask & (1 << s.bit)) ? (s.type === 'float' ? 8 : s.type === 'dict' ? 1 : 2) : 0), 2) + (hasExtMask ? 2 : 0);
                isLegacyF32 = buffer.byteLength !== expectedF64Len;
            }
        }
        const outParams = {};
        for (let i = 0; i < SCHEMA.length; i++) {
            const schemaDef = SCHEMA[i];
            if ((mask & (1 << schemaDef.bit)) !== 0) {
                if (schemaDef.type === 'float') {
                    const isF64 = schemaDef.bit >= 16 ? extF64 : (hasF64Mask ? ((f64Mask & (1 << schemaDef.bit)) !== 0) : !isLegacyF32);
                    if (isF64) {
                        outParams[schemaDef.key] = Number(view.getFloat64(offset).toPrecision(15)).toString();
                        offset += 8;
                    } else {
                        outParams[schemaDef.key] = Number(view.getFloat32(offset).toPrecision(7)).toString();
                        offset += 4;
                    }
                } else if (schemaDef.type === 'u16') {
                    outParams[schemaDef.key] = view.getUint16(offset).toString();
                    offset += 2;
                } else if (schemaDef.type === 'date') {
                    outParams[schemaDef.key] = daysToDate(view.getUint16(offset));
                    offset += 2;
                } else if (schemaDef.type === 'dict') {
                    const dictVal = view.getUint8(offset);
                    const reverseDict = Object.fromEntries(Object.entries(schemaDef.dict).map(([k, v]) => [v, k]));
                    outParams[schemaDef.key] = reverseDict[dictVal] || '';
                    offset += 1;
                }
            }
        }
        return outParams;
    } catch (e) {
        return {};
    }
}
const CURRENCY_BY_CODE = Object.fromEntries(Object.entries(SCHEMA.find(s => s.key === 'rc').dict).map(([k, v]) => [v, k]));
function decodeBase64ParamsV2(base64UrlStr) {
    if (!base64UrlStr) return {};
    let b64 = base64UrlStr.replace(/-/g, '+').replace(/_/g, '/');
    while (b64.length % 4) b64 += '=';
    try {
        const binaryStr = Buffer.from(b64, 'base64').toString('binary');
        const buffer = new ArrayBuffer(binaryStr.length);
        const uint8Array = new Uint8Array(buffer);
        for (let i = 0; i < binaryStr.length; i++) uint8Array[i] = binaryStr.charCodeAt(i);
        const view = new DataView(buffer);
        const maskLo = view.getUint16(0);
        const hasF64Mask = (maskLo & 0x8000) !== 0;
        const hasExtMask = (maskLo & 0x4000) !== 0;
        let f64Mask = 0;
        let extMask = 0;
        let offset = 2;
        if (hasF64Mask) { f64Mask = view.getUint16(offset); offset += 2; }
        if (hasExtMask) { extMask = view.getUint16(offset); offset += 2; }
        const mask = (maskLo & 0x3FFF) | ((extMask & 0x7FFF) << 16);
        const extF64 = (extMask & 0x8000) !== 0;
        const out = {};
        for (const def of SCHEMA) {
            if (def.key === 'tc') continue;
            const present = (mask & (1 << def.bit)) !== 0;
            if (def.key === 'cm') { if (present) out.cm = 'fixed'; continue; }
            if (def.key === 'eom') { if (present) out.eom = 'eom'; continue; }
            if (def.key === 'ps') { if (present) out.ps = 'buyer'; continue; }
            if (def.key === 'rc') {
                if (present) {
                    const pair = view.getUint8(offset); offset += 1;
                    const rcCode = pair & 0x0F;
                    const tcCode = (pair >> 4) & 0x0F;
                    if (rcCode) out.rc = CURRENCY_BY_CODE[rcCode];
                    if (tcCode) out.tc = CURRENCY_BY_CODE[tcCode];
                }
                continue;
            }
            if (def.key === 'pc') {
                if (present) {
                    const code = view.getUint8(offset) & 0x0F; offset += 1;
                    if (code) out.pc = CURRENCY_BY_CODE[code];
                }
                continue;
            }
            if (!present) continue;
            if (def.type === 'float') {
                const isF64 = def.bit >= 16 ? extF64 : ((f64Mask & (1 << def.bit)) !== 0);
                if (isF64) {
                    out[def.key] = Number(view.getFloat64(offset).toPrecision(15)).toString();
                    offset += 8;
                } else {
                    out[def.key] = Number(view.getFloat32(offset).toPrecision(7)).toString();
                    offset += 4;
                }
            } else if (def.type === 'u16') {
                out[def.key] = view.getUint16(offset).toString();
                offset += 2;
            } else if (def.type === 'date') {
                out[def.key] = daysToDate(view.getUint16(offset));
                offset += 2;
            }
        }
        const rcEff = out.rc || 'USD';
        const pcEff = out.pc || 'CNY';
        if (out.er && !out.per && rcEff === pcEff) out.per = out.er;
        return out;
    } catch (e) {
        return {};
    }
}
const indexTemplate = fs.readFileSync(path.join(__dirname, 'public', 'index.html'), 'utf-8');
function getSiteUrl(req) {
    const host = req.get('host') || '';
    if (!/^[a-zA-Z0-9.\-:]+$/.test(host)) return '';
    return `${req.protocol}://${host}`;
}
app.get('/', (req, res) => {
    res.send(indexTemplate.replace(/\{\{siteUrl\}\}/g, getSiteUrl(req)).replace(/\{\{timezone\}\}/g, JSON.stringify(TIMEZONE)));
});
app.get('/robots.txt', (req, res) => {
    res.type('text/plain');
    res.send(`User-agent: *\nAllow: /\nDisallow: /api/\n\nSitemap: ${getSiteUrl(req)}/sitemap.xml`);
});
app.get('/sitemap.xml', (req, res) => {
    res.type('application/xml');
    res.send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url>\n    <loc>${getSiteUrl(req)}/</loc>\n    <changefreq>monthly</changefreq>\n    <priority>1.0</priority>\n  </url>\n</urlset>`);
});
app.use(express.static(path.join(__dirname, 'public')));
app.get('/api/rates', async (req, res) => {
    const host = req.get('host');
    const refererValid = isValidHost(req.headers.referer, host);
    const originValid = isValidHost(req.headers.origin, host);
    if (!refererValid && !originValid) return res.status(403).json({ error: "Invalid Origin" });
    const encodedToken = req.signedCookies.vps_token;
    if (!encodedToken) return res.status(403).json({ error: "Forbidden" });
    const token = Buffer.from(encodedToken, 'base64').toString('utf-8');
    const [t, sign] = token.split('.');
    if (!t || !sign) return res.status(403).json({ error: "Forbidden" });
    if (Date.now() - parseInt(t) > 3600000) return res.status(403).json({ error: "Expired" });
    const ip = getClientIp(req);
    const expectedSign = crypto.createHmac('sha256', SECRET_KEY).update(t + ip).digest('hex');
    if (sign !== expectedSign) return res.status(403).json({ error: "Invalid" });
    if (ratesCache && Date.now() < ratesCacheTime) {
        return res.json({
            source: `${ratesCache.source} (缓存于 ${formatCacheAge(ratesCache.cachedAt)}前)`,
            rates: ratesCache.rates
        });
    }
    if (ratesCache) {
        const pending = refreshRates();
        if (req.query.wait) {
            const result = await pending;
            if (result) return res.json({ source: result.source, rates: result.rates });
            return res.json({
                source: `${ratesCache.source} (更新失败，使用 ${formatCacheAge(ratesCache.cachedAt)}前的缓存)`,
                rates: ratesCache.rates
            });
        }
        return res.json({
            source: `${ratesCache.source} (后台更新中，缓存于 ${formatCacheAge(ratesCache.cachedAt)}前)`,
            rates: ratesCache.rates,
            stale: true
        });
    }
    const result = await fetchRatesFromApis();
    if (result) {
        return res.json({ source: result.source, rates: result.rates });
    }
    if (ratesCache) {
        return res.json({
            source: `${ratesCache.source} (更新失败，使用 ${formatCacheAge(ratesCache.cachedAt)}前的缓存)`,
            rates: ratesCache.rates
        });
    }
    ratesCache = { source: '离线备用汇率', rates: FALLBACK_RATES, cachedAt: Date.now() };
    ratesCacheTime = Date.now() + 300000;
    return res.json({
        source: ratesCache.source,
        rates: ratesCache.rates
    });
});
app.get(/^\/(?:svg2\/([A-Za-z0-9_-]+)|svg|svg([A-Za-z0-9_-]+))$/, (req, res) => {
    let params = req.query;
    if (req.params[0]) {
        params = decodeBase64ParamsV2(req.params[0]);
    } else if (req.params[1]) {
        params = decodeBase64Params(req.params[1]);
    }
    const ra = parseFloat(params.ra) || 0;
    const rc = validCurrency(params.rc, 'USD');
    const pd = parseInt(params.pd) || 365;
    const ed = validDate(params.ed);
    const td = validDate(params.td) || getNowDateStr();
    const tc = validCurrency(params.tc, 'CNY');
    const er = validRate(params.er) ?? (rc === tc ? 1 : null);
    const ta = (params.ta !== undefined && params.ta !== '') ? parseFloat(params.ta) : null;
    const cm = params.cm || 'real';
    const eom = params.eom || 'exact';
    const push = (params.push !== undefined && params.push !== '') ? parseFloat(params.push) : 0;
    const ps = params.ps || 'seller';
    const pc = validCurrency(params.pc, 'CNY');
    const per = validRate(params.per) ?? (pc === tc ? 1 : 0);
    const pushTc = (push > 0 && isFinite(push)) ? push * per : 0;
    if (!ed) {
        res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
        return res.send(`<svg xmlns="http://www.w3.org/2000/svg" width="1100" height="530" viewBox="50 50 1100 530" style="margin: auto; position: absolute; top: 0; left: 0; right: 0; bottom: 0;"><rect x="50" y="50" width="1100" height="530" rx="20" fill="#0d0d12"/><text x="600" y="315" fill="#ebd288" font-size="24" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif"></text></svg>`);
    }
    const endMs = new Date(ed).getTime();
    const transMs = new Date(td).getTime();
    const remainMs = Math.max(0, endMs - transMs);
    const remainDays = Math.ceil(remainMs / (1000 * 60 * 60 * 24));
    let totalCycleDays = pd;
    if (cm === 'real') {
        const d = new Date(ed + 'T00:00:00Z');
        const day = d.getUTCDate();
        if (pd === 30) d.setUTCMonth(d.getUTCMonth() - 1);
        else if (pd === 90) d.setUTCMonth(d.getUTCMonth() - 3);
        else if (pd === 180) d.setUTCMonth(d.getUTCMonth() - 6);
        else if (pd === 365) d.setUTCFullYear(d.getUTCFullYear() - 1);
        else if (pd === 730) d.setUTCFullYear(d.getUTCFullYear() - 2);
        else if (pd === 1095) d.setUTCFullYear(d.getUTCFullYear() - 3);
        else if (pd === 1825) d.setUTCFullYear(d.getUTCFullYear() - 5);
        else d.setUTCDate(d.getUTCDate() - pd);
        if ((pd === 30 || pd === 90 || pd === 180) && d.getUTCDate() !== day) {
            d.setUTCDate(0);
        }
        if (eom === 'eom' && (pd === 30 || pd === 90 || pd === 180)) {
            d.setUTCFullYear(d.getUTCFullYear(), d.getUTCMonth() + 1, 0);
        }
        totalCycleDays = Math.round((endMs - d.getTime()) / (1000 * 60 * 60 * 24));
    }
    const remainingValueBase = (ra / totalCycleDays) * remainDays;
    const remainingValueTarget = er !== null ? remainingValueBase * er : null;
    let taVal = ta;
    if (taVal === null && remainingValueTarget !== null) {
        const paParam = (params.pa !== undefined && params.pa !== '') ? parseFloat(params.pa) : NaN;
        if (!isNaN(paParam)) {
            taVal = remainingValueTarget + paParam + (pushTc > 0 && ps === 'buyer' ? pushTc : 0);
        } else {
            let drParam = (params.dr !== undefined && params.dr !== '') ? parseFloat(params.dr) : NaN;
            if (!isNaN(drParam)) {
                if (drParam > 1 && drParam <= 10) drParam = drParam / 10;
                else if (drParam > 10) drParam = drParam / 100;
                taVal = remainingValueTarget * drParam + (pushTc > 0 && ps === 'buyer' ? pushTc : 0);
            }
        }
    }
    let showPremium = taVal !== null && remainingValueTarget !== null;
    let premiumAmount = 0;
    let premiumRate = 0;
    if (showPremium) {
        premiumAmount = taVal - pushTc - remainingValueTarget;
        if (remainingValueTarget > 0) {
            premiumRate = (premiumAmount / remainingValueTarget) * 100;
        }
    }
    let cycleText = '';
    if (pd === 30) cycleText = '/月';
    else if (pd === 90) cycleText = '/季';
    else if (pd === 180) cycleText = '/半年';
    else if (pd === 365) cycleText = '/年';
    else if (pd === 730) cycleText = '/两年';
    else if (pd === 1095) cycleText = '/三年';
    else if (pd === 1825) cycleText = '/五年';
    else cycleText = `/${pd}天`;

    const pct = Math.max(0, (remainDays / totalCycleDays) * 100);
    const barPct = Math.min(100, pct);
    const barWidth = roundNum(10.2 * barPct);
    const barEnd = roundNum(90 + barWidth);
    const rightX = showPremium ? 833 : 650;
    let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1150" height="580" viewBox="25 25 1150 580" style="margin: auto; position: absolute; top: 0; left: 0; right: 0; bottom: 0;">
<defs>
<linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
<stop offset="0%" stop-color="#16161a"/>
<stop offset="100%" stop-color="#0a0a0d"/>
</linearGradient>
<linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
<stop offset="0%" stop-color="#FFD700"/>
<stop offset="100%" stop-color="#D4AF37"/>
</linearGradient>
<linearGradient id="shimmer" x1="0%" y1="0%" x2="100%" y2="0%">
<stop offset="0%" stop-color="#8C6A12" stop-opacity="0"/>
<stop offset="50%" stop-color="#8C6A12" stop-opacity="0.75"/>
<stop offset="100%" stop-color="#8C6A12" stop-opacity="0"/>
</linearGradient>
<linearGradient id="textShine" x1="-20%" y1="0%" x2="0%" y2="0%">
<stop offset="0%" stop-color="#D4AF37"/>
<stop offset="50%" stop-color="#FFFFFF"/>
<stop offset="100%" stop-color="#D4AF37"/>
<animate attributeName="x1" values="-100%; 200%; 200%" dur="5s" repeatCount="indefinite"/>
<animate attributeName="x2" values="0%; 300%; 300%" dur="5s" repeatCount="indefinite"/>
</linearGradient>
<filter id="glow">
<feGaussianBlur stdDeviation="3" result="blur"/>
<feMerge>
<feMergeNode in="blur"/>
<feMergeNode in="SourceGraphic"/>
</feMerge>
</filter>
<clipPath id="roundCorner">
<rect x="25" y="25" width="1150" height="580" rx="24" ry="24"/>
</clipPath>
<style>
.f { font-family: system-ui, -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
.anim { animation: fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
.d1 { animation-delay: 0.1s; opacity: 0; }
.d2 { animation-delay: 0.2s; opacity: 0; }
.d3 { animation-delay: 0.3s; opacity: 0; }
</style>
</defs>
<g clip-path="url(#roundCorner)">
<rect x="25" y="25" width="1150" height="580" fill="url(#bg)"/>
<rect x="50" y="50" width="1100" height="530" rx="20" fill="none" stroke="url(#g)" stroke-width="1.5" opacity="0.15"/>
<g class="f" fill="#FFFFFF">
<image x="90" y="72" width="48" height="48" href="${logoBase64}"/>
<text x="152" y="110" font-size="28" font-weight="700" fill="url(#textShine)" letter-spacing="1">${showPremium ? 'VPS Trade Value' : 'VPS Remaining Value'}</text>
<g opacity="0.4">
<path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" transform="translate(854, 68)" fill="#FFFFFF"/>
<text x="1110" y="81" font-size="14" fill="#FFFFFF" text-anchor="end">YoungYannick/vps-remaining-value</text>
</g>
 <text x="1110" y="110" font-size="15" opacity="0.4" text-anchor="end">${er !== null ? `汇率: 1 ${rc} ${rc === tc ? '=' : '≈'} ${formatRate(er)} ${tc}` : '汇率: 不可用'}${pushTc > 0 && pc !== tc && pc !== rc ? ` · 1 ${pc} ≈ ${formatRate(per)} ${tc}` : ''} | ${showPremium ? '交易日期' : '计算日期'}: ${td}</text>
<line x1="50" y1="145" x2="1150" y2="145" stroke="#FFFFFF" opacity="0.08"/>
<g class="anim d1">
<text x="90" y="280" font-size="16" fill="#FFFFFF" opacity="0.6">剩余价值 (${tc})</text>
<text x="90" y="350" font-size="60" font-weight="700" fill="url(#g)">${remainingValueTarget !== null ? remainingValueTarget.toFixed(3) : '--'}</text>
</g>`;

    if (showPremium) {
        const color = premiumAmount > 0 ? '#ff5a5a' : '#4ade80';
        const sign = premiumAmount > 0 ? '⤴ ' : (premiumAmount < 0 ? '⤵ ' : '');
        const premiumLabel = premiumAmount >= 0 ? '溢价' : '折价';
        const y1From = premiumAmount > 0 ? '100%' : '-100%';
        const y1To = premiumAmount > 0 ? '-100%' : '100%';
        const y2From = premiumAmount > 0 ? '200%' : '0%';
        const y2To = premiumAmount > 0 ? '0%' : '200%';
        svg += `<defs>
<linearGradient id="symWave" x1="0%" y1="0%" x2="0%" y2="100%">
<stop offset="0%" stop-color="${color}" stop-opacity="0.3"/>
<stop offset="50%" stop-color="${color}" stop-opacity="1"/>
<stop offset="100%" stop-color="${color}" stop-opacity="0.3"/>
<animate attributeName="y1" from="${y1From}" to="${y1To}" dur="2.5s" repeatCount="indefinite"/>
<animate attributeName="y2" from="${y2From}" to="${y2To}" dur="2.5s" repeatCount="indefinite"/>
</linearGradient>
</defs>
<line x1="416" y1="190" x2="416" y2="435" stroke="#FFFFFF" opacity="0.08"/>
 <g class="anim d2">
<text x="456" y="210" font-size="16" opacity="0.6">交易金额 (${tc})${pushTc > 0 && ps === 'buyer' ? ` <tspan fill="#FFD700" font-weight="700">含PUSH费</tspan>` : ''}</text>
<text x="456" y="280" font-size="60" font-weight="700" fill="url(#g)">${taVal.toFixed(3)}</text>
<text x="456" y="310" font-size="14" opacity="0.4">${premiumLabel}金额 (${tc})</text>
<text x="456" y="340" font-size="22" font-weight="600" fill="${color}" dominant-baseline="central"><tspan fill="url(#symWave)">${sign}</tspan> ${Math.abs(premiumAmount).toFixed(3)}</text>
<text x="456" y="390" font-size="14" opacity="0.4">${premiumLabel}幅度</text>
<text x="456" y="420" font-size="22" font-weight="600" fill="${color}" dominant-baseline="central"><tspan fill="url(#symWave)">${sign}</tspan> ${Math.abs(premiumRate).toFixed(3)}%</text>
${pushTc > 0 ? `<text x="456" y="452" font-size="13" opacity="0.6">PUSH费 ${push} ${pc}${pc !== tc ? ` ≈ ${pushTc.toFixed(3)} ${tc}` : ''} · <tspan fill="#FFD700" font-weight="700">${ps === 'buyer' ? '买家承担' : '卖家承担'}</tspan></text>` : ''}
</g>`;
    }
    svg += `<line x1="${rightX - 40}" y1="190" x2="${rightX - 40}" y2="435" stroke="#FFFFFF" opacity="0.08"/>
<g class="anim d3">
<text x="${rightX}" y="205" font-size="14" opacity="0.4">续费金额</text>
<text x="${rightX}" y="240" font-size="22" font-weight="600" dominant-baseline="central">${ra.toFixed(3)} ${rc}${cycleText}</text>
${rc !== tc && er !== null ? `<text x="${rightX}" y="270" font-size="14" opacity="0.6">≈ ${(ra * er).toFixed(3)} ${tc}${cycleText}</text>` : ''}
<text x="${rightX}" y="310" font-size="14" opacity="0.4">剩余天数</text>
<text x="${rightX}" y="340" font-size="22" font-weight="600" dominant-baseline="central">${remainDays} / ${totalCycleDays} 天</text>
<text x="${rightX}" y="390" font-size="14" opacity="0.4">到期时间</text>
<text x="${rightX}" y="420" font-size="22" font-weight="600" dominant-baseline="central">${ed}</text>
</g>
<line x1="50" y1="480" x2="1150" y2="480" stroke="#FFFFFF" opacity="0.08"/>
<text x="90" y="525" font-size="16" opacity="0.6">剩余比例</text>
<text x="1110" y="525" font-size="16" font-weight="700" fill="url(#g)" text-anchor="end" dominant-baseline="central">${pct.toFixed(3)}%</text>
<rect x="90" y="545" width="1020" height="8" rx="4" fill="#202026"/>
<rect x="90" y="545" width="${barWidth}" height="8" rx="4" fill="url(#g)">
<animate attributeName="width" from="0" to="${barWidth}" dur="1.2s" fill="freeze" calcMode="spline" keyTimes="0; 1" keySplines="0.16 1 0.3 1"/>
</rect>
<clipPath id="barClip">
<rect x="90" y="545" width="${barWidth}" height="8" rx="4"/>
</clipPath>
<g clip-path="url(#barClip)">
<rect x="-110" y="545" width="200" height="8" fill="url(#shimmer)">
<animate attributeName="x" from="-110" to="${barEnd}" dur="3.5s" begin="1.5s" repeatCount="indefinite"/>
</rect>
</g>
</g>
</g> </svg>`;
    res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');
    res.send(svg);
});
app.get(/^\/vrv([A-Za-z0-9_-]+)$/, (req, res) => {
    const b64 = req.params[0];
    const params = decodeBase64Params(b64);
    const qs = new URLSearchParams(params).toString();
    res.redirect(`/?${qs}`);
});
app.get(/^\/v2\/([A-Za-z0-9_-]+)$/, (req, res) => {
    const params = decodeBase64ParamsV2(req.params[0]);
    res.redirect(`/?${new URLSearchParams(params).toString()}`);
});
app.get('/favicon.ico', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'images', 'favicon.ico'));
});
app.use((req, res) => {
    res.status(404).end();
});
app.listen(45867, () => {
    log('Server is running at http://localhost:45867');
    log(`TIMEZONE: ${TIMEZONE}`);
});