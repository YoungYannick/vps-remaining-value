const els = ['ra', 'rc', 'pd', 'cm', 'ed', 'td', 'dr', 'pa', 'ta', 'tc', 'eom'].reduce((acc, id) => {
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

function syncTransactionFields() {
    const rv = calculateRV();
    if (rv <= 0) return;

    if (lastTxField === 'dr' && els.dr.value !== '') {
        let drVal = parseFloat(els.dr.value);
        if (isNaN(drVal)) return;
        if (drVal > 1 && drVal <= 10) drVal = drVal / 10;
        else if (drVal > 10) drVal = drVal / 100;
        const targetTa = rv * drVal;
        els.ta.value = targetTa.toFixed(3);
        els.pa.value = (targetTa - rv).toFixed(3);
    } else if (lastTxField === 'pa' && els.pa.value !== '') {
        const paVal = parseFloat(els.pa.value);
        if (isNaN(paVal)) return;
        const targetTa = rv + paVal;
        els.ta.value = Math.max(0, targetTa).toFixed(3);
        els.dr.value = (targetTa / rv).toFixed(3);
    } else if (lastTxField === 'ta' && els.ta.value !== '') {
        const taVal = parseFloat(els.ta.value);
        if (isNaN(taVal)) return;
        els.dr.value = (taVal / rv).toFixed(3);
        els.pa.value = (taVal - rv).toFixed(3);
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
let debounceTimer = null;
function update() {
    if (!els.ra.value || !els.pd.value || !els.ed.value) {
        img.style.display = 'none';
        statusMsg.style.display = 'block';
        return;
    }
    syncTransactionFields();
    statusMsg.style.display = 'none';
    img.style.display = 'block';
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
        img.src = getUrl();
    }, 300);
}
function calculateRV() {
    if (!els.ra.value || !els.pd.value || !els.ed.value || !els.td.value) return 0;
    const ra = parseFloat(els.ra.value);
    const pd = parseInt(els.pd.value);
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
    return (ra / totalCycleDays) * remainDays * currentRate;
}
els.dr.addEventListener('input', (e) => {
    lastTxField = 'dr';
    if (e.target.value === '') {
        els.ta.value = '';
        els.pa.value = '';
    }
    update();
});
els.pa.addEventListener('input', (e) => {
    lastTxField = 'pa';
    if (e.target.value === '') {
        els.ta.value = '';
        els.dr.value = '';
    }
    update();
});
els.ta.addEventListener('input', (e) => {
    lastTxField = 'ta';
    if (e.target.value === '') {
        els.dr.value = '';
        els.pa.value = '';
    }
    update();
});
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