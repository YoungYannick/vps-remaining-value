const express = require('express');
const path = require('path');
require('dotenv').config();
const app = express();
const crypto = require('crypto');
const cookieParser = require('cookie-parser');
const SECRET_KEY = process.env.SECRET_KEY;
const V6_API_KEY = process.env.V6_API_KEY;
let ratesCache = null;
let ratesCacheTime = 0;
const getClientIp = (req) => {
    const cf = req.headers['cf-connecting-ip'];
    if (cf) return cf.split(',')[0].trim();
    const xff = req.headers['x-forwarded-for'];
    if (xff) return xff.split(',')[0].trim();
    return req.ip || req.socket.remoteAddress || '';
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
    const start = Date.now();
    res.on('finish', () => {
        const ip = getClientIp(req);
        const d = new Date();
        const bjTime = new Date(d.getTime() + (d.getTimezoneOffset() * 60000) + 28800000).toISOString().replace('Z', '+08:00');
        console.log(`[${bjTime}] ${ip} ${req.method} ${req.originalUrl} ${res.statusCode} ${Date.now() - start}ms`);
    });
    next();
});
app.use(cookieParser(SECRET_KEY));
app.use((req, res, next) => {
    if (req.path === '/' || req.path === '/index.html') {
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
        const ageMs = Date.now() - ratesCache.cachedAt;
        const ageMins = Math.floor(ageMs / 60000);
        const ageSecs = Math.floor((ageMs % 60000) / 1000);
        const timeStr = ageMins > 0 ? `${ageMins}分${ageSecs}秒前` : `${ageSecs}秒前`;
        return res.json({
            source: `${ratesCache.source} (缓存于 ${timeStr})`,
            rates: ratesCache.rates
        });
    }
    const apis = [
        { url: 'https://api.exchangerate.fun/latest?base=USD', name: 'ExchangeRate.fun', ttl: 3600000 },
        { url: `https://v6.exchangerate-api.com/v6/${V6_API_KEY}/latest/USD`, name: 'ExchangeRate-API V6', ttl: 3600000 },
        { url: 'https://api.exchangerate-api.com/v4/latest/USD', name: 'ExchangeRate-API V4', ttl: 300000 }
    ];
    for (const api of apis) {
        for (let attempt = 0; attempt < 3; attempt++) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 5000);
                const response = await fetch(api.url, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
                        'Accept': 'application/json, text/plain, */*',
                        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
                        'Sec-Fetch-Dest': 'empty',
                        'Sec-Fetch-Mode': 'cors',
                        'Sec-Fetch-Site': 'cross-site'
                    },
                    signal: controller.signal
                });
                clearTimeout(timeoutId);
                if (!response.ok) throw new Error();
                const data = await response.json();
                if (data.rates || data.conversion_rates) {
                    ratesCache = {
                        source: api.name,
                        rates: data.rates || data.conversion_rates,
                        cachedAt: Date.now()
                    };
                    ratesCacheTime = Date.now() + api.ttl;
                    return res.json({
                        source: api.name,
                        rates: ratesCache.rates
                    });
                }
            } catch (e) {}
        }
    }
    res.status(500).json({ error: "Failed" });
});
app.get('/svg', (req, res) => {
    const ra = parseFloat(req.query.ra) || 0;
    const rc = req.query.rc || 'USD';
    const pd = parseInt(req.query.pd) || 365;
    const ed = req.query.ed;
    const td = req.query.td || new Date().toISOString().split('T')[0];
    const tc = req.query.tc || 'CNY';
    const er = parseFloat(req.query.er) || 1;
    const ta = (req.query.ta !== undefined && req.query.ta !== '') ? parseFloat(req.query.ta) : null;
    if (!ed) {
        res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
        return res.send(`<svg xmlns="http://www.w3.org/2000/svg" width="1100" height="530" viewBox="50 50 1100 530" style="margin: auto; position: absolute; top: 0; left: 0; right: 0; bottom: 0;"><rect x="50" y="50" width="1100" height="530" rx="20" fill="#0d0d12"/><text x="600" y="315" fill="#ebd288" font-size="24" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif"></text></svg>`);
    }
    const endMs = new Date(ed).getTime();
    const transMs = new Date(td).getTime();
    const remainMs = Math.max(0, endMs - transMs);
    const remainDays = Math.ceil(remainMs / (1000 * 60 * 60 * 24));
    const remainingValueBase = (ra / pd) * remainDays;
    const remainingValueTarget = remainingValueBase * er;
    let showPremium = ta !== null;
    let premiumAmount = 0;
    let premiumRate = 0;
    if (showPremium) {
        premiumAmount = ta - remainingValueTarget;
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

    const pct = Math.max(0, (remainDays / pd) * 100);
    const barPct = Math.min(100, pct);
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
<text x="90" y="110" font-size="28" font-weight="700" fill="url(#textShine)" letter-spacing="1">VPS Remaining Value</text>
<g opacity="0.4">
<path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" transform="translate(854, 68)" fill="#FFFFFF"/>
<text x="1110" y="81" font-size="14" fill="#FFFFFF" text-anchor="end">YoungYannick/vps-remaining-value</text>
</g>
<text x="1110" y="110" font-size="15" opacity="0.4" text-anchor="end">汇率: 1 ${rc} = ${er.toFixed(4)} ${tc}   |   交易日期: ${td}</text>
<line x1="50" y1="145" x2="1150" y2="145" stroke="#FFFFFF" opacity="0.08"/>
<g class="anim d1">
<text x="90" y="280" font-size="16" fill="#FFFFFF" opacity="0.6">剩余价值 (${tc})</text>
<text x="90" y="350" font-size="60" font-weight="700" fill="url(#g)">${remainingValueTarget.toFixed(3)}</text>
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
<text x="456" y="210" font-size="16" opacity="0.6">交易金额 (${tc})</text>
<text x="456" y="280" font-size="60" font-weight="700" fill="url(#g)">${ta.toFixed(3)}</text>
<text x="456" y="310" font-size="14" opacity="0.4">${premiumLabel}金额 (${tc})</text>
<text x="456" y="340" font-size="22" font-weight="600" fill="${color}" dominant-baseline="central"><tspan fill="url(#symWave)">${sign}</tspan> ${Math.abs(premiumAmount).toFixed(3)}</text>
<text x="456" y="390" font-size="14" opacity="0.4">${premiumLabel}幅度</text>
<text x="456" y="420" font-size="22" font-weight="600" fill="${color}" dominant-baseline="central"><tspan fill="url(#symWave)">${sign}</tspan> ${Math.abs(premiumRate).toFixed(3)}%</text>
</g>`;
    }
    svg += `<line x1="${rightX - 40}" y1="190" x2="${rightX - 40}" y2="435" stroke="#FFFFFF" opacity="0.08"/>
<g class="anim d3">
<text x="${rightX}" y="205" font-size="14" opacity="0.4">续费金额</text>
<text x="${rightX}" y="240" font-size="22" font-weight="600" dominant-baseline="central">${ra.toFixed(3)} ${rc}${cycleText}</text>
${rc !== tc ? `<text x="${rightX}" y="270" font-size="14" opacity="0.6">≈ ${(ra * er).toFixed(3)} ${tc}${cycleText}</text>` : ''}
<text x="${rightX}" y="310" font-size="14" opacity="0.4">剩余天数</text>
<text x="${rightX}" y="340" font-size="22" font-weight="600" dominant-baseline="central">${remainDays} / ${pd} 天</text>
<text x="${rightX}" y="390" font-size="14" opacity="0.4">到期时间</text>
<text x="${rightX}" y="420" font-size="22" font-weight="600" dominant-baseline="central">${ed}</text>
</g>
<line x1="50" y1="480" x2="1150" y2="480" stroke="#FFFFFF" opacity="0.08"/>
<text x="90" y="525" font-size="16" opacity="0.6">剩余比例</text>
<text x="1110" y="525" font-size="16" font-weight="700" fill="url(#g)" text-anchor="end" dominant-baseline="central">${pct.toFixed(3)}%</text>
<rect x="90" y="545" width="1020" height="8" rx="4" fill="#202026"/>
<rect x="90" y="545" width="${10.2 * barPct}" height="8" rx="4" fill="url(#g)">
<animate attributeName="width" from="0" to="${10.2 * barPct}" dur="1.2s" fill="freeze" calcMode="spline" keyTimes="0; 1" keySplines="0.16 1 0.3 1"/>
</rect>
<clipPath id="barClip">
<rect x="90" y="545" width="${10.2 * barPct}" height="8" rx="4"/>
</clipPath>
<g clip-path="url(#barClip)">
<rect x="-110" y="545" width="200" height="8" fill="url(#shimmer)">
<animate attributeName="x" from="-110" to="${90 + 10.2 * barPct}" dur="3.5s" begin="1.5s" repeatCount="indefinite"/>
</rect>
</g>
</g>
</g> </svg>`;
    res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');
    res.send(svg);
});
app.listen(45867, () => {
    console.log(`[${new Date().toISOString()}] Server is running at http://localhost:45867`);
});