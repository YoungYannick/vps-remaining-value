const els = ['ra', 'rc', 'pd', 'cm', 'ed', 'td', 'dr', 'pa', 'ta', 'tc', 'eom', 'push', 'ps', 'pc'].reduce((acc, id) => {
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
let lastTxField = 'ta';
let urlPushRate = null;

function getPushRate() {
    const pc = els.pc.value;
    const tc = els.tc.value;
    if (exchangeRates[pc] && exchangeRates[tc]) {
        return exchangeRates[tc] / exchangeRates[pc];
    }
    if (urlPushRate !== null) return urlPushRate;
    return 1;
}
function getPushAmountTc() {
    const v = parseFloat(els.push.value);
    if (isNaN(v) || v <= 0) return 0;
    return v * getPushRate();
}
function updateManualMark() {
    ['ta', 'pa', 'dr'].forEach(id => {
        els[id].closest('.input-group').classList.toggle('is-manual', lastTxField === id && els[id].value !== '');
    });
}
function updateActualMarks() {
    const paMark = document.getElementById('actual-pa');
    const drMark = document.getElementById('actual-dr');
    let paText = '';
    let drText = '';
    const pushTc = getPushAmountTc();
    if (pushTc > 0 && els.ps.value === 'seller' && (lastTxField === 'pa' || lastTxField === 'dr')) {
        const rv = calculateRV();
        if (rv > 0) {
            const paVal = parseFloat(els.pa.value);
            const drVal = parseFloat(els.dr.value);
            if (!isNaN(paVal)) paText = `实际 ${(paVal - pushTc).toFixed(3)}`;
            if (!isNaN(drVal)) drText = `实际 ${(drVal - pushTc / rv).toFixed(3)}`;
        }
    }
    paMark.innerText = paText;
    drMark.innerText = drText;
}
function syncTransactionFields() {
    const rv = calculateRV();
    if (rv <= 0) return;
    const pushTc = getPushAmountTc();
    const isBuyerPush = els.ps.value === 'buyer';

    if (lastTxField === 'dr' && els.dr.value !== '') {
        let drVal = parseFloat(els.dr.value);
        if (isNaN(drVal)) return;
        if (drVal > 1 && drVal <= 10) drVal = drVal / 10;
        else if (drVal > 10) drVal = drVal / 100;
        const baseTa = rv * drVal;
        els.ta.value = (isBuyerPush && pushTc > 0 ? baseTa + pushTc : baseTa).toFixed(3);
        els.pa.value = (baseTa - rv).toFixed(3);
    } else if (lastTxField === 'pa' && els.pa.value !== '') {
        const paVal = parseFloat(els.pa.value);
        if (isNaN(paVal)) return;
        const baseTa = rv + paVal;
        els.ta.value = Math.max(0, isBuyerPush && pushTc > 0 ? baseTa + pushTc : baseTa).toFixed(3);
        els.dr.value = (baseTa / rv).toFixed(3);
    } else if (lastTxField === 'ta' && els.ta.value !== '') {
        const taVal = parseFloat(els.ta.value);
        if (isNaN(taVal)) return;
        const baseTa = pushTc > 0 ? taVal - pushTc : taVal;
        els.dr.value = (baseTa / rv).toFixed(3);
        els.pa.value = (baseTa - rv).toFixed(3);
    }
}
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
const dateToDays = (dateStr) => Math.floor(new Date(dateStr).getTime() / 86400000);
function generateBase64Url(paramsObj) {
    let mask = 0;
    let f64Mask = 0;
    let totalBytes = 2;
    for (let i = 0; i < SCHEMA.length; i++) {
        const def = SCHEMA[i];
        const val = paramsObj[def.key];
        if (val !== undefined && val !== '') {
            mask |= (1 << def.bit);
            if (def.type === 'float') {
                if (def.bit < 16 && String(val).replace(/[^0-9]/g, '').length > 7) {
                    f64Mask |= (1 << def.bit);
                    totalBytes += 8;
                } else {
                    totalBytes += 4;
                }
            } else if (def.type === 'u16' || def.type === 'date') {
                totalBytes += 2;
            } else if (def.type === 'dict') {
                totalBytes += 1;
            }
        }
    }
    const hasF64Mask = f64Mask > 0;
    const extMask = mask >>> 16;
    const hasExtMask = extMask > 0;
    if (hasF64Mask) {
        mask |= 0x8000;
        totalBytes += 2;
    }
    if (hasExtMask) {
        mask |= 0x4000;
        totalBytes += 2;
    }
    const buffer = new ArrayBuffer(totalBytes);
    const view = new DataView(buffer);
    view.setUint16(0, mask & 0xFFFF);
    let offset = 2;
    if (hasF64Mask) {
        view.setUint16(offset, f64Mask);
        offset += 2;
    }
    if (hasExtMask) {
        view.setUint16(offset, extMask);
        offset += 2;
    }
    for (let i = 0; i < SCHEMA.length; i++) {
        const def = SCHEMA[i];
        if ((mask & (1 << def.bit)) !== 0) {
            const val = paramsObj[def.key];
            if (def.type === 'float') {
                if ((f64Mask & (1 << def.bit)) !== 0) {
                    view.setFloat64(offset, parseFloat(val));
                    offset += 8;
                } else {
                    view.setFloat32(offset, parseFloat(val));
                    offset += 4;
                }
            } else if (def.type === 'u16') {
                view.setUint16(offset, parseInt(val, 10));
                offset += 2;
            } else if (def.type === 'date') {
                view.setUint16(offset, dateToDays(val));
                offset += 2;
            } else if (def.type === 'dict') {
                view.setUint8(offset, def.dict[val] || 0);
                offset += 1;
            }
        }
    }
    const uint8Array = new Uint8Array(buffer);
    let binaryStr = '';
    for (let i = 0; i < uint8Array.byteLength; i++) {
        binaryStr += String.fromCharCode(uint8Array[i]);
    }
    return btoa(binaryStr).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function getUrlParamsObj() {
    const paramsObj = {};
    for (const key in els) {
        if (els[key].value !== '') {
            paramsObj[key] = els[key].value;
        }
    }
    paramsObj['er'] = typeof currentRate === 'number' ? currentRate.toFixed(4) : parseFloat(currentRate).toFixed(4);
    ['ta', 'pa', 'dr'].forEach(k => {
        if (k !== lastTxField || els[k].value === '') delete paramsObj[k];
    });
    if (paramsObj.rc === 'USD') delete paramsObj.rc;
    if (paramsObj.tc === 'CNY') delete paramsObj.tc;
    if (getPushAmountTc() > 0) {
        if (paramsObj.ps === 'seller') delete paramsObj.ps;
        if (paramsObj.pc === 'CNY') delete paramsObj.pc;
        if (els.pc.value === els.tc.value) {
            delete paramsObj.per;
        } else {
            paramsObj['per'] = getPushRate().toFixed(4);
        }
    } else {
        delete paramsObj.push;
        delete paramsObj.ps;
        delete paramsObj.pc;
        delete paramsObj.per;
    }
    if (paramsObj.eom === 'exact') {
        delete paramsObj.eom;
    }
    if (paramsObj.cm === 'real') {
        delete paramsObj.cm;
    }
    return paramsObj;
}
function getUrl() {
    const paramsObj = getUrlParamsObj();
    const b64 = generateBase64Url(paramsObj);
    return `/svg${b64}`;
}
const mdPreview = document.getElementById('md-preview');
const PD_TEXT = { 30: '月付', 90: '季付', 180: '半年付', 365: '年付', 730: '两年付', 1095: '三年付', 1825: '五年付' };
let mdReportSource = '';
function escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function renderInline(text) {
    return escapeHtml(text)
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
}
function splitTableRow(line) {
    return line.replace(/^\|/, '').replace(/\|$/, '').split('|').map(c => c.trim());
}
function renderTable(rows) {
    if (rows.length < 2) return '';
    const header = splitTableRow(rows[0]);
    const bodyRows = rows.slice(1)
        .filter(r => !/^\|[\s\-|]+\|?$/.test(r))
        .map(splitTableRow);
    let html = '<table>';
    if (header.length === 4 && header[1] === '' && header[3] === '') {
        html += `<thead><tr><th colspan="2">${renderInline(header[0])}</th><th colspan="2">${renderInline(header[2])}</th></tr></thead>`;
    } else if (header.length === 2 && header[1] === '') {
        html += `<thead><tr><th colspan="2">${renderInline(header[0])}</th></tr></thead>`;
    } else {
        html += `<thead><tr>${header.map(h => `<th>${renderInline(h)}</th>`).join('')}</tr></thead>`;
    }
    html += '<tbody>';
    for (const row of bodyRows) {
        html += `<tr>${row.map(c => `<td>${renderInline(c)}</td>`).join('')}</tr>`;
    }
    html += '</tbody></table>';
    return html;
}
function renderMarkdown(md) {
    if (!md) return '';
    const lines = md.split('\n');
    let html = '';
    let inList = false;
    let i = 0;
    const closeList = () => { if (inList) { html += '</ul>'; inList = false; } };
    while (i < lines.length) {
        const line = lines[i];
        if (line.startsWith('|')) {
            closeList();
            const rows = [];
            while (i < lines.length && lines[i].startsWith('|')) {
                rows.push(lines[i]);
                i++;
            }
            html += renderTable(rows);
            continue;
        }
        if (/^##\s+/.test(line)) {
            closeList();
            html += `<h2>${renderInline(line.replace(/^##\s+/, ''))}</h2>`;
        } else if (/^#\s+/.test(line)) {
            closeList();
            html += `<h1>${renderInline(line.replace(/^#\s+/, ''))}</h1>`;
        } else if (/^>\s+/.test(line)) {
            closeList();
            html += `<blockquote>${renderInline(line.replace(/^>\s+/, ''))}</blockquote>`;
        } else if (/^-\s+/.test(line)) {
            if (!inList) { html += '<ul>'; inList = true; }
            html += `<li>${renderInline(line.replace(/^-\s+/, ''))}</li>`;
        } else if (line.trim() !== '') {
            closeList();
            html += `<p>${renderInline(line)}</p>`;
        } else {
            closeList();
        }
        i++;
    }
    closeList();
    return html;
}
function buildMarkdownReport() {
    const rv = calculateRV();
    if (rv <= 0) return '';
    const { remainDays, totalCycleDays } = getRemainInfo();
    const ra = parseFloat(els.ra.value);
    const pd = parseInt(els.pd.value);
    const cycleText = PD_TEXT[pd] || `${pd} 天`;
    const rc = els.rc.value;
    const tc = els.tc.value;
    const pushTc = getPushAmountTc();
    const pushVal = parseFloat(els.push.value) || 0;
    const isBuyer = els.ps.value === 'buyer';
    let rateLine = `1 ${rc} = ${parseFloat(currentRate).toFixed(4)} ${tc}`;
    if (pushTc > 0 && els.pc.value !== tc && els.pc.value !== rc) {
        rateLine += ` · 1 ${els.pc.value} = ${getPushRate().toFixed(4)} ${tc}`;
    }
    const taVal = parseFloat(els.ta.value);
    const hasTa = !isNaN(taVal);
    const pct = totalCycleDays > 0 ? (remainDays / totalCycleDays) * 100 : 0;
    const leftRows = [
        ['续费金额', `${ra.toFixed(3)} ${rc} · ${cycleText}`],
        ['计费周期', `${totalCycleDays} 天`],
        ['到期时间', `${els.ed.value}（余 ${remainDays} 天）`],
        ['剩余比例', `${pct.toFixed(3)}%`],
        ['交易日期', `${els.td.value}`]
    ];
    const rightRows = [];
    if (hasTa) {
        const premium = taVal - pushTc - rv;
        const sign = premium >= 0 ? '+' : '-';
        rightRows.push(['交易金额', `**${taVal.toFixed(3)} ${tc}**${pushTc > 0 && isBuyer ? '（含PUSH费）' : ''}`]);
        rightRows.push(['剩余价值', `**${rv.toFixed(3)} ${tc}**`]);
        rightRows.push(['溢价金额', `${sign}${Math.abs(premium).toFixed(3)} ${tc}`]);
        rightRows.push(['溢价幅度', `${sign}${Math.abs((premium / rv) * 100).toFixed(3)}%`]);
    } else {
        rightRows.push(['剩余价值', `**${rv.toFixed(3)} ${tc}**`]);
    }
    if (pushTc > 0) {
        rightRows.push(['PUSH费', `${pushVal.toFixed(3)} ${els.pc.value}${els.pc.value !== tc ? ` ≈ ${pushTc.toFixed(3)} ${tc}` : ''} · **${isBuyer ? '买家承担' : '卖家承担'}**`]);
    }
    const rowCount = Math.max(leftRows.length, rightRows.length);
    const lines = [];
    lines.push('# VPS 剩余价值', '');
    lines.push('| 基础信息 | | 交易信息 | |');
    lines.push('| --- | --- | --- | --- |');
    for (let i = 0; i < rowCount; i++) {
        const l = leftRows[i] || ['', ''];
        const r = rightRows[i] || ['', ''];
        lines.push(`| ${l[0]} | ${l[1]} | ${r[0]} | ${r[1]} |`);
    }
    lines.push(`| 汇率 | ${rateLine} | | |`);
    const b64 = getUrl().slice(4);
    lines.push('', `[查看完整信息](${window.location.origin}/vrv${b64})`);
    return lines.join('\n');
}
let debounceTimer = null;
function update() {
    if (!els.ra.value || !els.pd.value || !els.ed.value) {
        img.style.display = 'none';
        statusMsg.style.display = 'block';
        mdReportSource = '';
        mdPreview.innerHTML = '';
        return;
    }
    syncTransactionFields();
    updateActualMarks();
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
        const targetUrl = getUrl();
        const tempImg = new Image();
        tempImg.onload = () => {
            img.src = targetUrl;
            statusMsg.style.display = 'none';
            img.style.display = 'block';
            mdReportSource = buildMarkdownReport();
            mdPreview.innerHTML = renderMarkdown(mdReportSource);
        };
        tempImg.src = targetUrl;
    }, 300);
}
function getRemainInfo() {
    const pd = parseInt(els.pd.value) || 0;
    if (!els.ed.value || !els.td.value) return { remainDays: 0, totalCycleDays: pd };
    const endMs = new Date(els.ed.value).getTime();
    const transMs = new Date(els.td.value).getTime();
    const remainDays = Math.max(0, Math.ceil((endMs - transMs) / (1000 * 60 * 60 * 24)));
    let totalCycleDays = pd;
    if (els.cm && els.cm.value === 'real') {
        const d = new Date(els.ed.value);
        const day = d.getDate();
        if (pd === 30) d.setMonth(d.getMonth() - 1);
        else if (pd === 90) d.setMonth(d.getMonth() - 3);
        else if (pd === 180) d.setMonth(d.getMonth() - 6);
        else if (pd === 365) d.setFullYear(d.getFullYear() - 1);
        else if (pd === 730) d.setFullYear(d.getFullYear() - 2);
        else if (pd === 1095) d.setFullYear(d.getFullYear() - 3);
        else if (pd === 1825) d.setFullYear(d.getFullYear() - 5);
        else d.setDate(d.getDate() - pd);
        if ((pd === 30 || pd === 90 || pd === 180) && d.getDate() !== day) {
            d.setDate(0);
        }
        if (els.eom && els.eom.value === 'eom' && (pd === 30 || pd === 90 || pd === 180)) {
            d.setFullYear(d.getFullYear(), d.getMonth() + 1, 0);
        }
        totalCycleDays = Math.round((endMs - d.getTime()) / (1000 * 60 * 60 * 24));
    }
    return { remainDays, totalCycleDays };
}
function calculateRV() {
    if (!els.ra.value || !els.pd.value || !els.ed.value || !els.td.value) return 0;
    const ra = parseFloat(els.ra.value);
    const { remainDays, totalCycleDays } = getRemainInfo();
    return (ra / totalCycleDays) * remainDays * currentRate;
}
els.dr.addEventListener('input', (e) => {
    lastTxField = 'dr';
    if (e.target.value === '') {
        els.ta.value = '';
        els.pa.value = '';
    }
    updateManualMark();
    update();
});
els.pa.addEventListener('input', (e) => {
    lastTxField = 'pa';
    if (e.target.value === '') {
        els.ta.value = '';
        els.dr.value = '';
    }
    updateManualMark();
    update();
});
els.ta.addEventListener('input', (e) => {
    lastTxField = 'ta';
    if (e.target.value === '') {
        els.dr.value = '';
        els.pa.value = '';
    }
    updateManualMark();
    update();
});
Object.values(els).forEach(el => {
    el.addEventListener('input', update);
});
els.rc.addEventListener('change', updateRateField);
els.tc.addEventListener('change', updateRateField);
els.pc.addEventListener('change', update);
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
    const paramsObj = getUrlParamsObj();
    const b64 = generateBase64Url(paramsObj);
    const fullUrlShort = window.location.origin + `/svg${b64}`;
    const shareUrlShort = window.location.origin + `/vrv${b64}`;
    fallbackCopyTextToClipboard(`[![VPS Remaining Value](${fullUrlShort})](${shareUrlShort} "查看工具")`);
    tempText(e.target, '已复制 Markdown');
});
document.getElementById('copy-md-preview-btn').addEventListener('click', (e) => {
    if (!mdReportSource) return;
    fallbackCopyTextToClipboard(mdReportSource);
    tempText(e.target, '已复制全文');
});
document.getElementById('copy-link-btn').addEventListener('click', (e) => {
    if (!els.ra.value || !els.pd.value || !els.ed.value) return;
    const paramsObj = getUrlParamsObj();
    const b64 = generateBase64Url(paramsObj);
    const shareUrlShort = window.location.origin + `/vrv${b64}`;
    fallbackCopyTextToClipboard(shareUrlShort);
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
if (urlParams.has('per')) {
    urlPushRate = parseFloat(urlParams.get('per'));
}
if (urlParams.has('ta')) {
    lastTxField = 'ta';
} else if (urlParams.has('pa')) {
    lastTxField = 'pa';
} else if (urlParams.has('dr')) {
    lastTxField = 'dr';
}
if (urlParams.has('er')) {
    currentRate = parseFloat(urlParams.get('er')).toFixed(4);
    const from = els.rc.value || 'USD';
    const to = els.tc.value || 'CNY';
    rateDisplay.value = `1 ${from} = ${currentRate} ${to}`;
    update();
} else {
    fetchRates();
}
const refreshIcon = document.getElementById('refresh-icon');
refreshIcon.addEventListener('click', async (e) => {
    refreshIcon.classList.add('spinning');
    await fetchRates();
    const url = new URL(window.location.href);
    if (url.searchParams.has('er')) {
        url.searchParams.delete('er');
        window.history.replaceState({}, '', url.pathname + url.search);
    }
    setTimeout(() => refreshIcon.classList.remove('spinning'), 500);
});
document.getElementById('reset-btn').addEventListener('click', (e) => {
    els.ra.value = '';
    els.rc.value = 'USD';
    els.pd.value = '365';
    els.cm.value = 'real';
    els.eom.value = 'exact';
    document.getElementById('eom-group').style.display = 'none';
    initEomCapsule();
    initCapsule();
    const d = new Date();
    const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
    const bjTime = new Date(utc + (8 * 60 * 60 * 1000));
    els.td.value = bjTime.toISOString().split('T')[0];
    const tomorrow = new Date(bjTime.getTime() + (24 * 60 * 60 * 1000));
    els.ed.value = tomorrow.toISOString().split('T')[0];
    els.ta.value = '';
    els.dr.value = '';
    els.pa.value = '';
    els.tc.value = 'CNY';
    els.push.value = '0';
    els.ps.value = 'seller';
    els.pc.value = 'CNY';
    initPsCapsule();
    document.querySelectorAll('.input-group.is-manual').forEach(g => g.classList.remove('is-manual'));
    lastTxField = 'ta';
    urlPushRate = null;
    window.history.replaceState({}, '', window.location.pathname);
    fetchRates();
    tempText(e.target, '已重置');
});
const cmSwitch = document.getElementById('cm-switch');
const cmBtns = document.querySelectorAll('.cm-btn');
const cmInput = document.getElementById('cm');
function initCapsule() {
    const val = cmInput.value || 'real';
    cmBtns.forEach(b => b.classList.remove('active'));
    document.querySelector(`.cm-btn[data-value="${val}"]`)?.classList.add('active');
    if (val === 'real') {
        cmSwitch.classList.add('is-real');
    } else {
        cmSwitch.classList.remove('is-real');
    }
}
cmBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const val = btn.dataset.value;
        cmInput.value = val;
        initCapsule();
        checkEomVisibility();
        update();
    });
});
initCapsule();
const eomSwitch = document.getElementById('eom-switch');
const eomBtns = document.querySelectorAll('.eom-btn');
const eomInput = document.getElementById('eom');
const eomGroup = document.getElementById('eom-group');
function initEomCapsule() {
    const val = eomInput.value || 'exact';
    eomBtns.forEach(b => b.classList.remove('active'));
    document.querySelector(`.eom-btn[data-value="${val}"]`)?.classList.add('active');
    if (val === 'exact') {
        eomSwitch.classList.add('is-exact');
    } else {
        eomSwitch.classList.remove('is-exact');
    }
}
eomBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        eomInput.value = btn.dataset.value;
        initEomCapsule();
        update();
    });
});
function checkEomVisibility() {
    if (!els.ed.value) return;
    const d = new Date(els.ed.value);
    const nextDay = new Date(d.getTime() + 24 * 60 * 60 * 1000);
    if (cmInput.value === 'real' && nextDay.getDate() === 1) {
        eomGroup.style.display = 'flex';
    } else {
        eomGroup.style.display = 'none';
        eomInput.value = 'exact';
        initEomCapsule();
    }
}
els.ed.addEventListener('change', checkEomVisibility);
checkEomVisibility();
initEomCapsule();
const psSwitch = document.getElementById('ps-switch');
const psBtns = document.querySelectorAll('.ps-btn');
const psInput = document.getElementById('ps');
function initPsCapsule() {
    const val = psInput.value || 'seller';
    psBtns.forEach(b => b.classList.remove('active'));
    document.querySelector(`.ps-btn[data-value="${val}"]`)?.classList.add('active');
    if (val === 'buyer') {
        psSwitch.classList.add('is-buyer');
    } else {
        psSwitch.classList.remove('is-buyer');
    }
}
psBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        psInput.value = btn.dataset.value;
        initPsCapsule();
        update();
    });
});
initPsCapsule();
updateManualMark();