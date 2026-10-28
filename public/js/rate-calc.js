const rateCalcBtn = document.getElementById('rate-calc-btn');
const rateModal = document.getElementById('rate-modal');
const rateModalHeader = document.getElementById('rate-modal-header');
const rateModalClose = document.getElementById('rate-modal-close');
const rateFromCurrency = document.getElementById('rate-from-currency');
const rateToCurrency = document.getElementById('rate-to-currency');
const rateFromAmount = document.getElementById('rate-from-amount');
const rateToAmount = document.getElementById('rate-to-amount');
const rateExchangeInfo = document.getElementById('rate-exchange-info');
let lastRateField = 'from';
let isDragging = false;
let dragOffsetX = 0;
let dragOffsetY = 0;

function getModalRate() {
    const from = rateFromCurrency.value;
    const to = rateToCurrency.value;
    if (exchangeRates[from] && exchangeRates[to]) {
        return exchangeRates[to] / exchangeRates[from];
    }
    return 1;
}
function updateRateExchangeInfo() {
    if (!Object.keys(exchangeRates).length) {
        rateExchangeInfo.innerText = '汇率数据获取失败，按 1:1 计算';
        return;
    }
    rateExchangeInfo.innerText = `1 ${rateFromCurrency.value} = ${getModalRate().toFixed(4)} ${rateToCurrency.value}`;
}
function syncRateFields() {
    const rate = getModalRate();
    if (lastRateField === 'from') {
        const fromVal = parseFloat(rateFromAmount.value);
        rateToAmount.value = isNaN(fromVal) ? '' : (fromVal * rate).toFixed(4);
    } else {
        const toVal = parseFloat(rateToAmount.value);
        rateFromAmount.value = isNaN(toVal) ? '' : (toVal / rate).toFixed(4);
    }
    updateRateExchangeInfo();
}
function resetRateModalPosition() {
    rateModal.classList.remove('is-dragging');
    rateModal.style.left = '';
    rateModal.style.top = '';
    rateModal.style.animation = '';
}
function openRateModal() {
    resetRateModalPosition();
    lastRateField = 'from';
    rateModal.classList.add('is-open');
    syncRateFields();
}
function closeRateModal() {
    rateModal.classList.remove('is-open');
    isDragging = false;
}
function startDrag(x, y) {
    isDragging = true;
    const rect = rateModal.getBoundingClientRect();
    dragOffsetX = x - rect.left;
    dragOffsetY = y - rect.top;
    rateModal.style.animation = 'none';
    rateModal.style.left = `${rect.left}px`;
    rateModal.style.top = `${rect.top}px`;
    rateModal.classList.add('is-dragging');
}
function moveDrag(x, y) {
    if (!isDragging) return;
    const maxX = Math.max(0, window.innerWidth - rateModal.offsetWidth);
    const maxY = Math.max(0, window.innerHeight - rateModal.offsetHeight);
    rateModal.style.left = `${Math.min(Math.max(x - dragOffsetX, 0), maxX)}px`;
    rateModal.style.top = `${Math.min(Math.max(y - dragOffsetY, 0), maxY)}px`;
}
rateCalcBtn.addEventListener('click', openRateModal);
rateModalClose.addEventListener('click', closeRateModal);
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeRateModal();
});
rateFromAmount.addEventListener('input', () => {
    lastRateField = 'from';
    syncRateFields();
});
rateToAmount.addEventListener('input', () => {
    lastRateField = 'to';
    syncRateFields();
});
rateFromCurrency.addEventListener('change', syncRateFields);
rateToCurrency.addEventListener('change', syncRateFields);
rateModalHeader.addEventListener('mousedown', (e) => {
    if (e.target.closest('.rate-modal-close')) return;
    startDrag(e.clientX, e.clientY);
    e.preventDefault();
});
document.addEventListener('mousemove', (e) => moveDrag(e.clientX, e.clientY));
document.addEventListener('mouseup', () => { isDragging = false; });
rateModalHeader.addEventListener('touchstart', (e) => {
    if (e.target.closest('.rate-modal-close')) return;
    const t = e.touches[0];
    startDrag(t.clientX, t.clientY);
}, { passive: true });
document.addEventListener('touchmove', (e) => {
    if (!isDragging) return;
    const t = e.touches[0];
    moveDrag(t.clientX, t.clientY);
    e.preventDefault();
}, { passive: false });
document.addEventListener('touchend', () => { isDragging = false; });
new MutationObserver(syncRateFields).observe(document.getElementById('rate-source'), { childList: true });
