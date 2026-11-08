const els = ['ra', 'rc', 'pd', 'cm', 'ed', 'td', 'dr', 'pa', 'ta', 'tc', 'eom', 'push', 'ps', 'pc'].reduce((acc, id) => {
    acc[id] = document.getElementById(id);
    return acc;
}, {});
const TIMEZONE = (typeof window.TIMEZONE === 'string' && window.TIMEZONE) ? window.TIMEZONE : 'Asia/Shanghai';
const dateFmt = new Intl.DateTimeFormat('en-CA', { timeZone: TIMEZONE, year: 'numeric', month: '2-digit', day: '2-digit' });
const timeFmt = new Intl.DateTimeFormat('sv-SE', { timeZone: TIMEZONE, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
const getTodayStr = () => dateFmt.format(new Date());
const addDays = (dateStr, days) => {
    const d = new Date(dateStr + 'T00:00:00Z');
    d.setUTCDate(d.getUTCDate() + days);
    return d.toISOString().split('T')[0];
};
els.td.value = getTodayStr();
els.ed.value = addDays(els.td.value, 1);
console.log(`[VPS-RV] 服务端时区: ${TIMEZONE} | 当前(按此时区): ${timeFmt.format(new Date())} | 交易日期默认: ${els.td.value} | 到期默认: ${els.ed.value}`);
console.log(`[VPS-RV] 浏览器本地时区: ${Intl.DateTimeFormat().resolvedOptions().timeZone} | 本地时间: ${new Date().toLocaleString()}`);
const img = document.getElementById('preview');
const statusMsg = document.getElementById('status-msg');
const rateDisplay = document.getElementById('rate-display');
let exchangeRates = {};
let currentRate = null;
let rateLocked = false;
let lockedPair = '';
let txBaseValue = null;
let txBaseCurrency = null;
let txBaseRate = null;
let txBaseField = null;
let lastTxField = 'ta';
let urlPushRate = null;
let pushRateLocked = false;
let lockedPushPair = '';

function getPushRate() {
    const pc = els.pc.value;
    const tc = els.tc.value;
    if (pc === tc) return 1;
    if (pushRateLocked && `${pc}_${tc}` === lockedPushPair && urlPushRate !== null && isFinite(urlPushRate) && urlPushRate > 0) {
        return urlPushRate;
    }
    pushRateLocked = false;
    if (exchangeRates[pc] && exchangeRates[tc]) {
        return exchangeRates[tc] / exchangeRates[pc];
    }
    if (urlPushRate !== null && isFinite(urlPushRate) && urlPushRate > 0) return urlPushRate;
    return NaN;
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
    const taMark = document.getElementById('actual-ta');
    const paMark = document.getElementById('actual-pa');
    const drMark = document.getElementById('actual-dr');
    let taText = '';
    let paText = '';
    let drText = '';
    const pushTc = getPushAmountTc();
    if (pushTc > 0 && els.ps.value === 'buyer' && lastTxField === 'ta' && els.ta.value !== '') {
        const taVal = parseFloat(els.ta.value);
        if (!isNaN(taVal)) taText = `实际 ${(taVal + pushTc).toFixed(3)}`;
    }
    if (pushTc > 0 && els.ps.value === 'seller' && (lastTxField === 'pa' || lastTxField === 'dr')) {
        const rv = calculateRV();
        if (rv > 0) {
            const paVal = parseFloat(els.pa.value);
            const drVal = parseFloat(els.dr.value);
            if (!isNaN(paVal)) paText = `实际 ${(paVal - pushTc).toFixed(3)}`;
            if (!isNaN(drVal)) drText = `实际 ${(drVal - pushTc / rv).toFixed(3)}`;
        }
    }
    taMark.innerText = taText;
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
        const effectivePush = isFinite(pushTc) ? pushTc : 0;
        const baseTa = isBuyerPush ? taVal : taVal - effectivePush;
        els.dr.value = (baseTa / rv).toFixed(3);
        els.pa.value = (baseTa - rv).toFixed(3);
    }
}
function applyRates(data) {
    exchangeRates = data.rates;
    document.getElementById('rate-source').innerText = `数据来源: ${data.source}`;
    updateRateField();
}
async function fetchRates() {
    try {
        const res = await fetch('/api/rates');
        if (!res.ok) throw new Error('API Error');
        const data = await res.json();
        applyRates(data);
        if (data.stale) {
            const freshRes = await fetch('/api/rates?wait=1', { signal: AbortSignal.timeout(30000) }).catch(() => null);
            if (freshRes && freshRes.ok) applyRates(await freshRes.json());
        }
    } catch (e) {
        document.getElementById('rate-source').innerText = '数据来源: 获取失败';
        updateRateField();
    }
}
const formatRate = (n) => {
    if (!isFinite(n) || n <= 0) return '--';
    const digits = n >= 1000 ? 2 : n >= 100 ? 3 : n >= 1 ? 4 : n >= 0.1 ? 5 : 6;
    const s = n.toFixed(digits);
    return s.includes('.') ? s.replace(/0+$/, '').replace(/\.$/, '') : s;
};
const serializeRate = (n) => String(parseFloat(n.toPrecision(12)));
function updateRateField() {
    const from = els.rc.value;
    const to = els.tc.value;
    const cur = parseFloat(currentRate);
    if (rateLocked && `${from}_${to}` === lockedPair && isFinite(cur) && cur > 0) {
        update();
        return;
    }
    rateLocked = false;
    if (from === to) {
        currentRate = 1;
        rateDisplay.value = `1 ${from} = 1 ${to}`;
    } else if (exchangeRates[from] && exchangeRates[to]) {
        const rate = exchangeRates[to] / exchangeRates[from];
        currentRate = rate;
        rateDisplay.value = `1 ${from} ≈ ${formatRate(rate)} ${to}`;
    } else {
        currentRate = null;
        rateDisplay.value = '汇率不可用';
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
    let extF64 = false;
    let totalBytes = 2;
    for (let i = 0; i < SCHEMA.length; i++) {
        const def = SCHEMA[i];
        const val = paramsObj[def.key];
        if (val !== undefined && val !== '') {
            mask |= (1 << def.bit);
            if (def.type === 'float') {
                const needF64 = String(val).replace(/[^0-9]/g, '').length > 7;
                if (def.bit < 16) {
                    if (needF64) f64Mask |= (1 << def.bit);
                } else if (needF64) {
                    extF64 = true;
                }
                totalBytes += needF64 ? 8 : 4;
            } else if (def.type === 'u16' || def.type === 'date') {
                totalBytes += 2;
            } else if (def.type === 'dict') {
                totalBytes += 1;
            }
        }
    }
    const hasF64Mask = f64Mask > 0;
    const extMask = (mask >>> 16) | (extF64 ? 0x8000 : 0);
    const hasExtMask = (mask >>> 16) > 0;
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
                const isF64 = def.bit < 16 ? ((f64Mask & (1 << def.bit)) !== 0) : extF64;
                if (isF64) {
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
const CURRENCY_CODE = SCHEMA.find(s => s.key === 'rc').dict;
function generateBase64UrlV2(paramsObj) {
    const rcVal = paramsObj.rc && paramsObj.rc !== 'USD' ? paramsObj.rc : '';
    const tcVal = paramsObj.tc && paramsObj.tc !== 'CNY' ? paramsObj.tc : '';
    const pcVal = paramsObj.pc && paramsObj.pc !== 'CNY' ? paramsObj.pc : '';
    const pairPresent = !!(rcVal || tcVal);
    const reusePer = !!(paramsObj.per && (paramsObj.rc || 'USD') === (paramsObj.pc || 'CNY'));
    let mask = 0;
    let f64Mask = 0;
    let extF64 = false;
    let totalBytes = 2;
    if (pairPresent) { mask |= (1 << 1); totalBytes += 1; }
    if (paramsObj.cm === 'fixed') mask |= (1 << 3);
    if (paramsObj.eom === 'eom') mask |= (1 << 10);
    if (paramsObj.ps === 'buyer') mask |= (1 << 13);
    if (pcVal) { mask |= (1 << 16); totalBytes += 1; }
    for (const def of SCHEMA) {
        if (['cm', 'eom', 'ps', 'rc', 'tc', 'pc'].includes(def.key)) continue;
        if (reusePer && def.key === 'per') continue;
        const val = paramsObj[def.key];
        if (val === undefined || val === '') continue;
        mask |= (1 << def.bit);
        if (def.type === 'float') {
            const needF64 = String(val).replace(/[^0-9]/g, '').length > 7;
            if (def.bit < 16) {
                if (needF64) f64Mask |= (1 << def.bit);
            } else if (needF64) {
                extF64 = true;
            }
            totalBytes += needF64 ? 8 : 4;
        } else if (def.type === 'u16' || def.type === 'date') {
            totalBytes += 2;
        }
    }
    const hasF64Mask = f64Mask > 0;
    const extMask = (mask >>> 16) | (extF64 ? 0x8000 : 0);
    const hasExtMask = (mask >>> 16) > 0;
    if (hasF64Mask) { mask |= 0x8000; totalBytes += 2; }
    if (hasExtMask) { mask |= 0x4000; totalBytes += 2; }
    const view = new DataView(new ArrayBuffer(totalBytes));
    view.setUint16(0, mask & 0xFFFF);
    let offset = 2;
    if (hasF64Mask) { view.setUint16(offset, f64Mask); offset += 2; }
    if (hasExtMask) { view.setUint16(offset, extMask); offset += 2; }
    for (const def of SCHEMA) {
        if (def.key === 'tc' || def.key === 'cm' || def.key === 'eom' || def.key === 'ps') continue;
        if (def.key === 'rc') {
            if (pairPresent) {
                const rcCode = rcVal ? CURRENCY_CODE[rcVal] : 0;
                const tcCode = tcVal ? CURRENCY_CODE[tcVal] : 0;
                view.setUint8(offset, (tcCode << 4) | rcCode);
                offset += 1;
            }
            continue;
        }
        if (def.key === 'pc') {
            if (pcVal) { view.setUint8(offset, CURRENCY_CODE[pcVal]); offset += 1; }
            continue;
        }
        if ((mask & (1 << def.bit)) === 0) continue;
        const val = paramsObj[def.key];
        if (def.type === 'float') {
            const isF64 = def.bit < 16 ? ((f64Mask & (1 << def.bit)) !== 0) : extF64;
            if (isF64) {
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
        }
    }
    const uint8Array = new Uint8Array(view.buffer);
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
    const erNum = parseFloat(currentRate);
    if (isFinite(erNum) && erNum > 0) paramsObj['er'] = serializeRate(erNum);
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
            const pr = getPushRate();
            if (isFinite(pr) && pr > 0) paramsObj['per'] = serializeRate(pr);
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
    const b64 = generateBase64UrlV2(paramsObj);
    return `/svg2/${b64}`;
}
const mdPreview = document.getElementById('md-preview');
const PD_TEXT = { 30: '月付', 90: '季付', 180: '半年付', 365: '年付', 730: '两年付', 1095: '三年付', 1825: '五年付' };
let mdTextSource = '';
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
function buildMarkdownText() {
    const rv = calculateRV();
    if (rv !== null && rv <= 0) return '';
    const { remainDays, totalCycleDays } = getRemainInfo();
    const ra = parseFloat(els.ra.value);
    const cycleText = PD_TEXT[parseInt(els.pd.value)];
    const rc = els.rc.value;
    const tc = els.tc.value;
    const pushTc = getPushAmountTc();
    const pushVal = parseFloat(els.push.value) || 0;
    const isBuyer = els.ps.value === 'buyer';
    const erNum = parseFloat(currentRate);
    const taVal = parseFloat(els.ta.value);
    const hasTa = !isNaN(taVal);
    const rateOp = rc === tc ? '=' : '≈';
    let rateLine = (isFinite(erNum) && erNum > 0) ? `1 ${rc} ${rateOp} ${formatRate(erNum)} ${tc}` : '汇率不可用';
    if (hasTa && rv !== null && pushTc > 0 && els.pc.value !== tc && els.pc.value !== rc) {
        const pr = getPushRate();
        if (isFinite(pr)) rateLine += ` · 1 ${els.pc.value} ≈ ${formatRate(pr)} ${tc}`;
    }
    const pct = totalCycleDays > 0 ? (remainDays / totalCycleDays) * 100 : 0;
    const leftRows = [
        ['续费金额', `${ra.toFixed(3)} ${rc}`],
        ['计费周期', cycleText ? `${cycleText}（${totalCycleDays} 天）` : `${totalCycleDays} 天`],
        ['到期时间', `${els.ed.value}（余 ${remainDays} 天）`],
        ['剩余比例', `${pct.toFixed(3)}%`]
    ];
    const rightRows = [];
    const hasTrade = hasTa && rv !== null;
    if (hasTrade) {
        const effectivePush = isFinite(pushTc) ? Math.max(0, pushTc) : 0;
        const actualTa = taVal + (lastTxField === 'ta' && isBuyer ? effectivePush : 0);
        const premium = actualTa - effectivePush - rv;
        const sign = premium >= 0 ? '+' : '-';
        rightRows.push(['交易日期', `${els.td.value}`]);
        rightRows.push(['交易金额', `**${actualTa.toFixed(3)} ${tc}**${effectivePush > 0 && isBuyer ? '（含PUSH费）' : ''}`]);
        rightRows.push(['溢价金额', `${sign}${Math.abs(premium).toFixed(3)} ${tc}`]);
        rightRows.push(['溢价幅度', `${sign}${Math.abs((premium / rv) * 100).toFixed(3)}%`]);
    } else {
        leftRows.push(['计算日期', `${els.td.value}`]);
    }
    if (hasTrade && pushTc > 0) {
        rightRows.push(['PUSH费', `${pushVal.toFixed(3)} ${els.pc.value}${els.pc.value !== tc ? ` ≈ ${pushTc.toFixed(3)} ${tc}` : ''} · **${isBuyer ? '买家承担' : '卖家承担'}**`]);
    }
    leftRows.push(['剩余价值', rv !== null ? `**${rv.toFixed(3)} ${tc}**` : '--']);
    const rowCount = Math.max(leftRows.length, rightRows.length);
    const lines = [];
    lines.push(`# ${hasTrade ? 'VPS 交易估值' : 'VPS 剩余价值'}`, '');
    if (rightRows.length === 0) {
        lines.push('| 基础信息 | |');
        lines.push('| --- | --- |');
        for (const [k, v] of leftRows) {
            lines.push(`| ${k} | ${v} |`);
        }
        lines.push(`| 汇率 | ${rateLine} |`);
    } else {
        lines.push('| 基础信息 | | 交易信息 | |');
        lines.push('| --- | --- | --- | --- |');
        for (let i = 0; i < rowCount; i++) {
            const l = leftRows[i] || ['', ''];
            const r = rightRows[i] || ['', ''];
            lines.push(`| ${l[0]} | ${l[1]} | ${r[0]} | ${r[1]} |`);
        }
        lines.push(`| 汇率 | ${rateLine} | | |`);
    }
    const b64 = generateBase64UrlV2(getUrlParamsObj());
    lines.push('', `[查看完整信息](${window.location.origin}/v2/${b64})`);
    return lines.join('\n');
}
let debounceTimer = null;
function update() {
    if (!els.ra.value || !els.pd.value || !els.ed.value) {
        img.style.display = 'none';
        statusMsg.style.display = 'block';
        mdTextSource = '';
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
            mdTextSource = buildMarkdownText();
            mdPreview.innerHTML = renderMarkdown(mdTextSource);
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
        const d = new Date(els.ed.value + 'T00:00:00Z');
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
        if (els.eom && els.eom.value === 'eom' && (pd === 30 || pd === 90 || pd === 180)) {
            d.setUTCFullYear(d.getUTCFullYear(), d.getUTCMonth() + 1, 0);
        }
        totalCycleDays = Math.round((endMs - d.getTime()) / (1000 * 60 * 60 * 24));
    }
    return { remainDays, totalCycleDays };
}
function calculateRV() {
    if (!els.ra.value || !els.pd.value || !els.ed.value || !els.td.value) return 0;
    const er = parseFloat(currentRate);
    if (!isFinite(er) || er <= 0) return null;
    const ra = parseFloat(els.ra.value);
    const cycleText = PD_TEXT[parseInt(els.pd.value)];
    const { remainDays, totalCycleDays } = getRemainInfo();
    return (ra / totalCycleDays) * remainDays * er;
}
els.dr.addEventListener('input', (e) => {
    lastTxField = 'dr';
    txBaseField = 'dr';
    txBaseValue = null;
    txBaseCurrency = null;
    txBaseRate = null;
    if (e.target.value === '') {
        els.ta.value = '';
        els.pa.value = '';
    }
    updateManualMark();
    update();
});
els.pa.addEventListener('input', (e) => {
    lastTxField = 'pa';
    txBaseField = 'pa';
    if (e.target.value === '') {
        els.ta.value = '';
        els.dr.value = '';
        txBaseValue = null;
    } else {
        txBaseValue = parseFloat(e.target.value);
        txBaseCurrency = els.tc.value;
        txBaseRate = parseFloat(currentRate);
    }
    updateManualMark();
    update();
});
els.ta.addEventListener('input', (e) => {
    lastTxField = 'ta';
    txBaseField = 'ta';
    if (e.target.value === '') {
        els.dr.value = '';
        els.pa.value = '';
        txBaseValue = null;
    } else {
        txBaseValue = parseFloat(e.target.value);
        txBaseCurrency = els.tc.value;
        txBaseRate = parseFloat(currentRate);
    }
    updateManualMark();
    update();
});
Object.values(els).forEach(el => {
    el.addEventListener('input', update);
});
function getRateForTc(tc) {
    if (tc === els.rc.value) return 1;
    if (exchangeRates[els.rc.value] && exchangeRates[tc]) return exchangeRates[tc] / exchangeRates[els.rc.value];
    return null;
}
function convertTcAmounts() {
    if (txBaseField !== 'ta' && txBaseField !== 'pa') return;
    if (txBaseValue === null || !isFinite(txBaseValue)) return;
    const newTc = els.tc.value;
    if (!newTc) return;
    if (txBaseCurrency === newTc) {
        const restored = txBaseValue.toFixed(3);
        if (txBaseField === 'ta') els.ta.value = restored;
        else els.pa.value = restored;
        return;
    }
    let baseRate = getRateForTc(txBaseCurrency);
    if (!isFinite(baseRate) || baseRate <= 0) baseRate = parseFloat(txBaseRate);
    const newRate = getRateForTc(newTc);
    if (!isFinite(baseRate) || baseRate <= 0 || !isFinite(newRate) || newRate <= 0) return;
    const factor = newRate / baseRate;
    if (!isFinite(factor) || factor <= 0) return;
    const converted = (txBaseValue * factor).toFixed(3);
    if (txBaseField === 'ta') els.ta.value = converted;
    else els.pa.value = converted;
}
els.rc.addEventListener('change', updateRateField);
els.tc.addEventListener('change', () => {
    convertTcAmounts();
    updateRateField();
});
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
    const b64 = generateBase64UrlV2(paramsObj);
    const fullUrlShort = window.location.origin + `/svg2/${b64}`;
    const shareUrlShort = window.location.origin + `/v2/${b64}`;
    fallbackCopyTextToClipboard(`[![VPS Remaining Value](${fullUrlShort})](${shareUrlShort} "查看工具")`);
    tempText(e.target, '已复制 Markdown');
});
document.getElementById('copy-md-preview-btn').addEventListener('click', (e) => {
    if (!mdTextSource) return;
    fallbackCopyTextToClipboard(mdTextSource);
    tempText(e.target, '已复制全文');
});
document.getElementById('copy-link-btn').addEventListener('click', (e) => {
    if (!els.ra.value || !els.pd.value || !els.ed.value) return;
    const paramsObj = getUrlParamsObj();
    const b64 = generateBase64UrlV2(paramsObj);
    const shareUrlShort = window.location.origin + `/v2/${b64}`;
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
    const perNum = parseFloat(urlParams.get('per'));
    if (perNum !== null && isFinite(perNum) && perNum > 0) {
        urlPushRate = perNum;
        pushRateLocked = true;
        lockedPushPair = `${els.pc.value || 'CNY'}_${els.tc.value || 'CNY'}`;
    }
}
if (urlParams.has('ta')) {
    lastTxField = 'ta';
} else if (urlParams.has('pa')) {
    lastTxField = 'pa';
} else if (urlParams.has('dr')) {
    lastTxField = 'dr';
}
if (urlParams.has('er')) {
    const erNum = parseFloat(urlParams.get('er'));
    const from = els.rc.value || 'USD';
    const to = els.tc.value || 'CNY';
    if (isFinite(erNum) && erNum > 0) {
        currentRate = erNum;
        rateLocked = true;
        lockedPair = `${from}_${to}`;
        rateDisplay.value = `1 ${from} ${from === to ? '=' : '≈'} ${formatRate(currentRate)} ${to}`;
    } else {
        currentRate = null;
        rateDisplay.value = '汇率不可用';
    }
    fetchRates();
    update();
} else {
    fetchRates();
}
if (lastTxField === 'ta' || lastTxField === 'pa') {
    const baseVal = parseFloat(els[lastTxField].value);
    if (isFinite(baseVal)) {
        txBaseField = lastTxField;
        txBaseValue = baseVal;
        txBaseCurrency = els.tc.value;
        txBaseRate = parseFloat(currentRate);
    }
}
document.getElementById('share-tip').style.display = (rateLocked || pushRateLocked) ? 'block' : 'none';
if (urlParams.has('ra') || urlParams.has('er')) {
    setTimeout(() => {
        document.querySelector('.display')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 300);
}
const refreshIcon = document.getElementById('refresh-icon');
refreshIcon.addEventListener('click', async (e) => {
    refreshIcon.classList.add('spinning');
    rateLocked = false;
    pushRateLocked = false;
    urlPushRate = null;
    document.getElementById('share-tip').style.display = 'none';
    await fetchRates();
    const url = new URL(window.location.href);
    let changed = false;
    if (url.searchParams.has('er')) {
        url.searchParams.delete('er');
        changed = true;
    }
    if (url.searchParams.has('per')) {
        url.searchParams.delete('per');
        changed = true;
    }
    if (changed) window.history.replaceState({}, '', url.pathname + url.search);
    setTimeout(() => refreshIcon.classList.remove('spinning'), 500);
});
document.getElementById('reset-btn').addEventListener('click', (e) => {
    rateLocked = false;
    pushRateLocked = false;
    lockedPair = '';
    lockedPushPair = '';
    document.getElementById('share-tip').style.display = 'none';
    els.ra.value = '';
    els.rc.value = 'USD';
    els.pd.value = '365';
    els.cm.value = 'real';
    els.eom.value = 'exact';
    document.getElementById('eom-group').style.display = 'none';
    initEomCapsule();
    initCapsule();
    els.td.value = getTodayStr();
    els.ed.value = addDays(els.td.value, 1);
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
    txBaseField = 'ta';
    txBaseValue = null;
    txBaseCurrency = null;
    txBaseRate = null;
    urlPushRate = null;
    window.history.replaceState({}, '', window.location.pathname);
    fetchRates();
    tempText(e.target, '已重置');
});
document.getElementById('share-tip').addEventListener('click', () => {
    document.getElementById('reset-btn').click();
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
    const d = new Date(els.ed.value + 'T00:00:00Z');
    const nextDay = new Date(d.getTime() + 86400000);
    if (cmInput.value === 'real' && nextDay.getUTCDate() === 1) {
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