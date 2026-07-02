const htmlContent = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>VPS Remaining Value</title>
  <style>
    :root {
        --bg: #0d0d12;
        --panel: #16161a;
        --panel-border: #2c2c35;
        --text: #e2e2e5;
        --text-muted: #8b8b99;
        --gold: #ebd288;
        --gold-dim: #b89b4d;
        --gold-glow: rgba(235, 210, 136, 0.15);
        --font: system-ui, -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif;
    }
    body {
        margin: 0;
        padding: 0;
        background: var(--bg);
        background-image: radial-gradient(circle at 50% 0%, #1a1a24 0%, var(--bg) 60%);
        color: var(--text);
        font-family: var(--font);
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 100vh;
        box-sizing: border-box;
        overflow-x: hidden;
    }
    .layout-wrapper {
        width: 100%;
        max-width: 1400px;
        padding: 40px;
        box-sizing: border-box;
        animation: fadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .layout {
        display: flex;
        gap: 32px;
        width: 100%;
        align-items: stretch;
    }
    .panel {
        background: var(--panel);
        border: 1px solid var(--panel-border);
        padding: 32px;
        border-radius: 16px;
        flex: 1;
        min-width: 420px;
        box-shadow: 0 20px 40px rgba(0,0,0,0.4);
        display: flex;
        flex-direction: column;
    }
    .header {
        font-size: 22px;
        font-weight: 600;
        margin-bottom: 24px;
        color: var(--gold);
        letter-spacing: 0.5px;
        border-bottom: 1px solid var(--panel-border);
        padding-bottom: 16px;
        text-shadow: 0 0 20px var(--gold-glow);
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    .rate-preview {
        margin-bottom: 24px;
        background: rgba(235, 210, 136, 0.03);
        padding: 16px;
        border-radius: 12px;
        border: 1px solid rgba(235, 210, 136, 0.1);
    }
    .rate-preview label {
        color: var(--gold-dim);
        margin-bottom: 4px;
        display: block;
    }
    .rate-preview input {
        background: transparent;
        border: none;
        color: var(--gold);
        font-size: 16px;
        font-weight: 600;
        padding: 4px 0 0 0;
        pointer-events: none;
        box-shadow: none;
    }
    .form-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 20px;
        flex-grow: 1;
    }
    .display {
        flex: 1.5;
        min-width: 500px;
        display: flex;
        justify-content: center;
        align-items: center;
        border: 1px solid var(--panel-border);
        border-radius: 16px;
        background: #0a0a0d;
        box-shadow: inset 0 0 60px rgba(0,0,0,0.5);
        position: relative;
        overflow: hidden;
    }
    .placeholder-msg {
        color: var(--text-muted);
        font-size: 15px;
        text-align: center;
        padding: 30px;
        animation: pulse 2s infinite ease-in-out;
    }
    .display img {
        width: 100%;
        height: 100%;
        object-fit: contain;
        border-radius: 16px;
        animation: zoomIn 0.4s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .input-group {
        display: flex;
        flex-direction: column;
    }
    label {
        margin-bottom: 8px;
        font-size: 13px;
        color: var(--text-muted);
        font-weight: 500;
    }
    input, select {
        width: 100%;
        padding: 14px;
        background: #0a0a0d;
        border: 1px solid var(--panel-border);
        color: var(--text);
        border-radius: 8px;
        box-sizing: border-box;
        font-size: 14px;
        font-family: var(--font);
        transition: all 0.3s ease;
        appearance: none;
    }
    select {
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%238b8b99' viewBox='0 0 16 16'%3E%3Cpath d='M7.247 11.14 2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z'/%3E%3C/svg%3E");
        background-repeat: no-repeat;
        background-position: right 14px center;
        padding-right: 36px;
    }
    input:focus, select:focus {
        outline: none;
        border-color: var(--gold-dim);
        box-shadow: 0 0 0 3px var(--gold-glow);
    }
    .btn-group {
        margin-top: 32px;
        display: flex;
        gap: 16px;
        flex-wrap: wrap;
    }
    button {
        background: var(--gold);
        color: #000;
        border: none;
        padding: 14px 20px;
        border-radius: 8px;
        font-weight: 600;
        cursor: pointer;
        font-size: 14px;
        font-family: var(--font);
        flex: 1;
        min-width: 150px;
        transition: all 0.2s ease;
        box-shadow: 0 4px 12px var(--gold-glow);
    }
    button:hover {
        transform: translateY(-2px);
        background: #fdf0ba;
        box-shadow: 0 6px 16px rgba(235, 210, 136, 0.25);
    }
    button:active {
        transform: translateY(1px);
    }
    button.alt-btn {
        background: transparent;
        color: var(--gold);
        border: 1px solid var(--gold-dim);
        box-shadow: none;
    }
    button.alt-btn:hover {
        background: var(--gold-glow);
        border-color: var(--gold);
    }
    @keyframes fadeUp {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
    }
    @keyframes zoomIn {
        from { opacity: 0; transform: scale(0.98); }
        to { opacity: 1; transform: scale(1); }
    }
    @keyframes pulse {
        0%, 100% { opacity: 0.5; }
        50% { opacity: 1; }
    }
    @media (max-width: 1200px) {
        .layout { flex-direction: column; }
        .display { min-height: 400px; }
    }
    @media (max-width: 600px) {
        .form-grid { grid-template-columns: 1fr; }
        .layout-wrapper { padding: 20px; }
    }
    .github-link {
        color: var(--text-muted);
        text-decoration: none;
        font-size: 14px;
        font-weight: 400;
        display: flex;
        align-items: center;
        gap: 6px;
        text-shadow: none;
        letter-spacing: 0;
    }
    .rate-source {
        color: var(--text-muted);
        font-size: 12px;
        margin-top: 8px;
        text-align: right;
    }
    #preview {
        display: none;
    }
  </style>
</head>
<body>
<div class="layout-wrapper">
  <div class="layout">
    <div class="panel">
      <div class="header">
        <span>VPS Remaining Value</span>
        <a href="https://github.com/YoungYannick/vps-remaining-value" target="_blank" class="github-link">
          <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path></svg>
          GitHub
        </a>
      </div>
      <div class="rate-preview">
        <label>汇率预览</label>
        <input type="text" id="rate-display" readonly value="加载中...">
        <div id="rate-source" class="rate-source"></div>
      </div>
      <div class="form-grid">
        <div class="input-group">
          <label>续费金额</label>
          <input type="number" id="ra" step="0.01">
        </div>
        <div class="input-group">
          <label>续费货币</label>
          <select id="rc">
            <option value="USD" selected>美元 (USD)</option>
            <option value="CNY">人民币 (CNY)</option>
            <option value="EUR">欧元 (EUR)</option>
            <option value="GBP">英镑 (GBP)</option>
            <option value="HKD">港币 (HKD)</option>
            <option value="JPY">日元 (JPY)</option>
            <option value="TWD">新台币 (TWD)</option>
            <option value="AUD">澳元 (AUD)</option>
            <option value="CAD">加元 (CAD)</option>
            <option value="RUB">俄罗斯卢布 (RUB)</option>
            <option value="INR">印度卢比 (INR)</option>
          </select>
        </div>
        <div class="input-group">
          <label>付款周期</label>
          <select id="pd">
            <option value="30">月付 (30天)</option>
            <option value="90">季付 (90天)</option>
            <option value="180">半年付 (180天)</option>
            <option value="365" selected>年付 (365天)</option>
            <option value="730">两年付 (730天)</option>
            <option value="1095">三年付 (1095天)</option>
            <option value="1825">五年付 (1825天)</option>
          </select>
        </div>
        <div class="input-group">
          <label>到期时间</label>
          <input type="date" id="ed">
        </div>
        <div class="input-group">
          <label>交易时间</label>
          <input type="date" id="td">
        </div>
        <div class="input-group">
          <label>交易金额 (可选)</label>
          <input type="number" id="ta" step="0.01">
        </div>
        <div class="input-group">
          <label>交易货币</label>
          <select id="tc">
            <option value="CNY" selected>人民币 (CNY)</option>
            <option value="USD">美元 (USD)</option>
            <option value="EUR">欧元 (EUR)</option>
            <option value="GBP">英镑 (GBP)</option>
            <option value="HKD">港币 (HKD)</option>
            <option value="JPY">日元 (JPY)</option>
            <option value="TWD">新台币 (TWD)</option>
            <option value="AUD">澳元 (AUD)</option>
            <option value="CAD">加元 (CAD)</option>
            <option value="RUB">俄罗斯卢布 (RUB)</option>
            <option value="INR">印度卢比 (INR)</option>
          </select>
        </div>
      </div>
      <div class="btn-group">
        <button id="copy-md-btn" class="alt-btn">复制 Markdown</button>
        <button id="copy-link-btn" class="alt-btn">复制分享链接</button>
        <button id="download-btn" class="alt-btn">下载 SVG</button>
        <button id="refresh-rate-btn" class="alt-btn">刷新汇率</button>
        <button id="reset-btn" class="alt-btn">重置表单</button>
      </div>
    </div>
    <div class="display">
      <div id="status-msg" class="placeholder-msg">请填写完整的参数以生成预览</div>
       <img id="preview" src="">
    </div>
  </div>
</div>
<script>
const els = ['ra', 'rc', 'pd', 'ed', 'td', 'ta', 'tc'].reduce((acc, id) => {
    acc[id] = document.getElementById(id);
    return acc;
}, {});
const d = new Date();
const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
const bjTime = new Date(utc + (8 * 60 * 60 * 1000));
els.td.value = bjTime.toISOString().split('T')[0];
const tomorrow = new Date(bjTime.getTime() + (24 * 60 * 60 * 1000));
els.ed.value = tomorrow.toISOString().split('T')[0];
const img = document.getElementById('preview');
const statusMsg = document.getElementById('status-msg');
const rateDisplay = document.getElementById('rate-display');
let exchangeRates = {};
let currentRate = 1.0000;
async function fetchRates() {
    try {
        const res = await fetch('/api/rates');
        if (!res.ok) throw new Error('API Error');
        const data = await res.json();
        exchangeRates = data.rates;
        document.getElementById('rate-source').innerText = \`数据来源: \${data.source}\`;
        updateRateField();
    } catch (e) {
        document.getElementById('rate-source').innerText = '数据来源: 获取失败';
    }
}
function updateRateField() {
    const from = els.rc.value;
    const to = els.tc.value;
    if (exchangeRates[from] && exchangeRates[to]) {
        const rate = exchangeRates[to] / exchangeRates[from];
        currentRate = rate.toFixed(4);
        rateDisplay.value = \`1 \${from} = \${rate.toFixed(4)} \${to}\`;
    } else {
        currentRate = 1.0000;
        rateDisplay.value = \`1 \${from} = 1 \${to}\`;
    }
    update();
}
function getUrl() {
    const params = new URLSearchParams();
    for (const key in els) {
        if (els[key].value !== '') {
            params.append(key, els[key].value);
        }
    }
    params.append('er', typeof currentRate === 'number' ? currentRate.toFixed(4) : parseFloat(currentRate).toFixed(4));
    return \`/svg?\${params.toString()}\`;
}
function update() {
    if (!els.ra.value || !els.pd.value || !els.ed.value) {
        img.style.display = 'none';
        statusMsg.style.display = 'block';
        return;
    }
    statusMsg.style.display = 'none';
    img.style.display = 'block';
    img.src = getUrl();
}
Object.values(els).forEach(el => {
    el.addEventListener('input', update);
});
els.rc.addEventListener('change', updateRateField);
els.tc.addEventListener('change', updateRateField);
function tempText(btn, text) {
    const og = btn.innerText;
    btn.innerText = text;
    setTimeout(() => btn.innerText = og, 2000);
}
function fallbackCopyTextToClipboard(text) {
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text);
    } else {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.top = "-99999px";
        textArea.style.left = "-99999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
            document.execCommand('copy');
        } catch (err) {}
        document.body.removeChild(textArea);
    }
}
document.getElementById('copy-md-btn').addEventListener('click', (e) => {
    if (!els.ra.value || !els.pd.value || !els.ed.value) return;
    const fullUrl = window.location.origin + getUrl();
    const params = new URLSearchParams();
    for (const key in els) {
        if (els[key].value !== '') params.append(key, els[key].value);
    }
    params.append('er', typeof currentRate === 'number' ? currentRate.toFixed(4) : parseFloat(currentRate).toFixed(4));
    const shareUrl = window.location.origin + window.location.pathname + '?' + params.toString();
    fallbackCopyTextToClipboard(\`[![VPS Remaining Value](\${fullUrl})](\${shareUrl} "查看工具")\`);
    tempText(e.target, '已复制 Markdown');
});
document.getElementById('copy-link-btn').addEventListener('click', (e) => {
    if (!els.ra.value || !els.pd.value || !els.ed.value) return;
    const params = new URLSearchParams();
    for (const key in els) {
        if (els[key].value !== '') params.append(key, els[key].value);
    }
    params.append('er', typeof currentRate === 'number' ? currentRate.toFixed(4) : parseFloat(currentRate).toFixed(4));
    const fullUrl = window.location.origin + window.location.pathname + '?' + params.toString();
    fallbackCopyTextToClipboard(fullUrl);
    tempText(e.target, '已复制分享链接');
});
document.getElementById('download-btn').addEventListener('click', async (e) => {
    if (!els.ra.value || !els.pd.value || !els.ed.value) return;
    const res = await fetch(getUrl());
    const blob = await res.blob();
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = \`vps-remaining-value-\${els.td.value}.svg\`;
    a.click();
    URL.revokeObjectURL(a.href);
    tempText(e.target, '已下载 SVG');
});
const urlParams = new URLSearchParams(window.location.search);
let hasParams = false;
Object.keys(els).forEach(key => {
    if (urlParams.has(key)) {
        els[key].value = urlParams.get(key);
        hasParams = true;
    }
});
if (urlParams.has('er')) {
    currentRate = parseFloat(urlParams.get('er')).toFixed(4);
    const from = els.rc.value || 'USD';
    const to = els.tc.value || 'CNY';
    rateDisplay.value = \`1 \${from} = \${currentRate} \${to}\`;
    update();
} else {
    fetchRates();
}
document.getElementById('refresh-rate-btn').addEventListener('click', async (e) => {
    tempText(e.target, '正在刷新...');
    await fetchRates();
    const url = new URL(window.location.href);
    if (url.searchParams.has('er')) {
        url.searchParams.delete('er');
        window.history.replaceState({}, '', url.pathname + url.search);
    }
    tempText(e.target, '汇率已刷新');
});
document.getElementById('reset-btn').addEventListener('click', (e) => {
    els.ra.value = '';
    els.rc.value = 'USD';
    els.pd.value = '365';
    const d = new Date();
    const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
    const bjTime = new Date(utc + (8 * 60 * 60 * 1000));
    els.td.value = bjTime.toISOString().split('T')[0];
    const tomorrow = new Date(bjTime.getTime() + (24 * 60 * 60 * 1000));
    els.ed.value = tomorrow.toISOString().split('T')[0];
    els.ta.value = '';
    els.tc.value = 'CNY';
    window.history.replaceState({}, '', window.location.pathname);
    fetchRates();
    tempText(e.target, '已重置');
});
</script>
</body>
</html>`;

export default {
    async fetch(request, env) {
        const url = new URL(request.url);
        const { pathname, searchParams } = url;
        const clientIp = request.headers.get('cf-connecting-ip') || '';
        const generateSign = async (t, ip) => {
            const encoder = new TextEncoder();
            const keyData = encoder.encode(env.SECRET_KEY);
            const data = encoder.encode(t + ip);
            const cryptoKey = await crypto.subtle.importKey('raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
            const signature = await crypto.subtle.sign('HMAC', cryptoKey, data);
            return Array.from(new Uint8Array(signature)).map(b => b.toString(16).padStart(2, '0')).join('');
        };

        if (pathname === '/') {
            const t = Date.now().toString();
            const sign = await generateSign(t, clientIp);
            const b64Token = btoa(`${t}.${sign}`);
            return new Response(htmlContent, {
                headers: {
                    'Content-Type': 'text/html; charset=utf-8',
                    'Set-Cookie': `vps_token=${b64Token}; HttpOnly; Path=/; Max-Age=3600; SameSite=Strict`
                }
            });
        }

        if (pathname === '/api/rates') {
            const host = url.host;
            const referer = request.headers.get('referer') || '';
            const origin = request.headers.get('origin') || '';
            const isValidHost = (urlStr) => {
                try { return urlStr ? new URL(urlStr).host === host : false; } catch (e) { return false; }
            };
            if (!isValidHost(referer) && !isValidHost(origin)) return new Response(JSON.stringify({ error: "Invalid Origin" }), { status: 403 });
            const cookieHeader = request.headers.get('cookie') || '';
            const match = cookieHeader.match(/vps_token=([^;]+)/);
            if (!match) return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });
            let token = '';
            try { token = atob(match[1]); } catch(e) { return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 }); }
            const [t, sign] = token.split('.');
            if (!t || !sign) return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });
            if (Date.now() - parseInt(t) > 3600000) return new Response(JSON.stringify({ error: "Expired" }), { status: 403 });
            const expectedSign = await generateSign(t, clientIp);
            if (sign !== expectedSign) return new Response(JSON.stringify({ error: "Invalid" }), { status: 403 });
            const apis = [
                { url: 'https://api.exchangerate.fun/latest?base=USD', name: 'ExchangeRate.fun' },
                { url: `https://v6.exchangerate-api.com/v6/${env.V6_API_KEY}/latest/USD`, name: 'ExchangeRate-API V6' },
                { url: 'https://api.exchangerate-api.com/v4/latest/USD', name: 'ExchangeRate-API V4' }
            ];
            for (const api of apis) {
                try {
                    const res = await fetch(api.url);
                    if (!res.ok) continue;
                    const data = await res.json();
                    if (data.rates || data.conversion_rates) {
                        return new Response(JSON.stringify({ source: api.name, rates: data.rates || data.conversion_rates }), {
                            headers: { 'Content-Type': 'application/json' }
                        });
                    }
                } catch (e) {}
            }
            return new Response(JSON.stringify({ error: "Failed" }), { status: 500 });
        }

        if (pathname === '/svg') {
            const ra = parseFloat(searchParams.get('ra')) || 0;
            const rc = searchParams.get('rc') || 'USD';
            const pd = parseInt(searchParams.get('pd')) || 365;
            const ed = searchParams.get('ed');
            const td = searchParams.get('td') || new Date().toISOString().split('T')[0];
            const tc = searchParams.get('tc') || 'CNY';
            const er = parseFloat(searchParams.get('er')) || 1;
            const taParam = searchParams.get('ta');
            const ta = (taParam !== null && taParam !== '') ? parseFloat(taParam) : null;

            if (!ed) {
                return new Response(`<svg xmlns="http://www.w3.org/2000/svg" width="1100" height="530" viewBox="50 50 1100 530" style="margin: auto; position: absolute; top: 0; left: 0; right: 0; bottom: 0;"><rect x="50" y="50" width="1100" height="530" rx="20" fill="#0d0d12"/><text x="600" y="315" fill="#ebd288" font-size="24" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif"></text></svg>`, {
                    headers: { 'Content-Type': 'image/svg+xml; charset=utf-8', 'Cache-Control': 'no-cache' }
                });
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
<text x="${rightX}" y="270" font-size="14" opacity="0.6">≈ ${(ra * er).toFixed(3)} ${tc}${cycleText}</text>
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

            return new Response(svg, {
                headers: { 'Content-Type': 'image/svg+xml; charset=utf-8', 'Cache-Control': 'no-cache' }
            });
        }

        return new Response('Not Found', { status: 404 });
    }
}