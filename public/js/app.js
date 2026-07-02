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
        document.getElementById('rate-source').innerText = `数据来源: ${data.source}`;
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
        rateDisplay.value = `1 ${from} = ${rate.toFixed(4)} ${to}`;
    } else {
        currentRate = 1.0000;
        rateDisplay.value = `1 ${from} = 1 ${to}`;
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
    return `/svg?${params.toString()}`;
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
    fallbackCopyTextToClipboard(`[![VPS Remaining Value](${fullUrl})](${shareUrl} "查看工具")`);
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
    a.download = `vps-remaining-value-${els.td.value}.svg`;
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
    rateDisplay.value = `1 ${from} = ${currentRate} ${to}`;
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