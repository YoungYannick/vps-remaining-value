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
        background-repeat: no-repeat;
        background-attachment: fixed;
        color: var(--text);
        font-family: var(--font);
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 100vh;
        box-sizing: border-box;
        overflow-x: hidden;
    }
    ::selection {
        background: var(--gold);
        color: #000;
    }
    ::-moz-selection {
        background: var(--gold);
        color: #000;
    }
    ::-webkit-scrollbar {
        width: 8px;
        height: 8px;
    }
    ::-webkit-scrollbar-track {
        background: var(--bg);
    }
    ::-webkit-scrollbar-thumb {
        background: var(--panel-border);
        border-radius: 4px;
    }
    ::-webkit-scrollbar-thumb:hover {
        background: var(--text-muted);
    }
    html {
        scrollbar-width: thin;
        scrollbar-color: var(--panel-border) var(--bg);
    }
    .layout-wrapper {
        width: 100%;
        max-width: 95%;
        padding: 20px;
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
        position: relative;
        margin-bottom: 24px;
        background: rgba(235, 210, 136, 0.03);
        padding: 16px;
        border-radius: 12px;
        border: 1px solid rgba(235, 210, 136, 0.1);
    }
    .section-mt {
        margin-top: 24px;
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
        grid-template-columns: repeat(3, 1fr);
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
    .emo-group {
        display: none;
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
    input[type="number"]::-webkit-inner-spin-button,
    input[type="number"]::-webkit-outer-spin-button {
        -webkit-appearance: none;
        margin: 0;
    }
    input[type="number"] {
        -moz-appearance: textfield;
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
    .section-title {
        font-size: 15px;
        font-weight: 600;
        color: var(--gold);
        margin-bottom: 16px;
        border-left: 3px solid var(--gold);
        padding-left: 10px;
        letter-spacing: 0.5px;
    }
    .rate-header {
        margin-bottom: 6px;
    }
    .rate-header label { margin-bottom: 0; }
    .icon-btn {
        position: absolute;
        top: 12px;
        right: 12px;
        background: transparent;
        border: none;
        color: var(--gold-dim);
        cursor: pointer;
        padding: 4px;
        border-radius: 6px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;
        box-shadow: none;
        min-width: auto;
    }
    .icon-btn:hover {
        color: var(--gold);
        background: rgba(235, 210, 136, 0.1);
        transform: translateY(0);
        box-shadow: none;
    }
    .icon-btn.spinning svg {
        animation: spin 1s linear infinite;
    }
    @keyframes spin { 100% { transform: rotate(360deg); } }
    .cm-header, .eom-header, .field-header {
        display: flex;
        align-items: center;
        gap: 6px;
        margin-bottom: 8px;
    }
    .cm-header label, .eom-header label, .field-header label { margin-bottom: 0; }
    .tooltip-container {
        position: relative;
        display: flex;
        align-items: center;
        color: var(--text-muted);
        cursor: help;
    }
    .tooltip-container:hover { color: var(--gold); }
    .tooltip {
        position: absolute;
        bottom: 150%;
        left: 50%;
        transform: translateX(-50%);
        background: #202026;
        color: #fff;
        padding: 10px 14px;
        border-radius: 8px;
        font-size: 12px;
        white-space: nowrap;
        opacity: 0;
        visibility: hidden;
        transition: all 0.2s;
        border: 1px solid var(--panel-border);
        box-shadow: 0 4px 16px rgba(0,0,0,0.6);
        z-index: 10;
        line-height: 1.5;
    }
    .tooltip-container:hover .tooltip {
        opacity: 1;
        visibility: visible;
    }
    .capsule-switch {
        display: flex;
        background: #0a0a0d;
        border: 1px solid var(--panel-border);
        border-radius: 8px;
        position: relative;
        padding: 4px;
        height: 44px;
        box-sizing: border-box;
    }
    .cm-btn, .eom-btn {
        flex: 1;
        background: transparent;
        color: var(--text-muted);
        border: none;
        padding: 0;
        font-size: 13px;
        font-weight: 500;
        border-radius: 6px;
        cursor: pointer;
        z-index: 1;
        transition: color 0.3s;
        box-shadow: none;
        min-width: auto;
    }
    .cm-btn.active, .eom-btn.active { color: #000; }
    .cm-btn:hover, .eom-btn:hover {
        transform: none;
        box-shadow: none;
        background: transparent;
    }
    .capsule-bg {
        position: absolute;
        top: 4px;
        bottom: 4px;
        width: calc(50% - 4px);
        background: var(--gold);
        border-radius: 6px;
        transition: left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        z-index: 0;
        left: 4px;
    }
    .capsule-switch.is-real .capsule-bg {
        left: 50%;
    }
    .capsule-switch.is-exact .capsule-bg {
        left: 50%;
    }
    @media (max-width: 1200px) {
        body { align-items: flex-start; }
        .layout { flex-direction: column; }
        .panel { min-width: 0; }
        .display { min-width: 0; min-height: 400px; }
    }
    @media (max-width: 600px) {
        .layout-wrapper { padding: 12px; max-width: 100%; }
        .panel { padding: 20px; }
        .header { font-size: 20px; margin-bottom: 20px; }
        .form-grid { grid-template-columns: 1fr; gap: 16px; }
        .display { min-height: 260px; border-radius: 12px; }
        .btn-group { gap: 12px; margin-top: 24px; }
        button { min-width: calc(50% - 6px); padding: 12px 16px; }
        .tooltip { white-space: normal; width: max-content; max-width: 200px; text-align: center; }
    }
    @media (max-width: 380px) {
        button { min-width: 100%; }
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
        <div class="rate-header">
          <label>汇率预览</label>
          <button id="refresh-icon" class="icon-btn">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 2v6h-6M3 12a9 9 0 0 1 15-6.7L21 8M3 22v-6h6M21 12a9 9 0 0 1-15 6.7L3 16"/></svg>
          </button>
        </div>
        <input type="text" id="rate-display" readonly value="加载中...">
        <div id="rate-source" class="rate-source"></div>
      </div>

      <div class="section-title">物品信息</div>
      <div class="form-grid">
        <div class="input-group">
          <div class="cm-header">
            <label>计算模式</label>
            <div class="help-icon tooltip-container">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
              <div class="tooltip">真实天数：按自然月/年对冲计算<br>固定天数：每月按30天/每年365天计算</div>
            </div>
          </div>
          <div class="capsule-switch is-real" id="cm-switch">
            <div class="capsule-bg"></div>
            <button type="button" class="cm-btn" data-value="fixed">固定</button>
            <button type="button" class="cm-btn active" data-value="real">真实</button>
            <input type="hidden" id="cm" value="real">
          </div>
        </div>
        <div class="input-group">
          <label>付款周期</label>
          <select id="pd">
            <option value="30">月付</option>
            <option value="90">季付</option>
            <option value="180">半年付</option>
            <option value="365" selected>年付</option>
            <option value="730">两年付</option>
            <option value="1095">三年付</option>
            <option value="1825">五年付</option>
          </select>
        </div>
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
          <label>到期时间</label>
          <input type="date" id="ed">
        </div>
        <div class="input-group emo-group" id="eom-group">
          <div class="eom-header">
            <label>起始日推算</label>
            <div class="help-icon tooltip-container">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
              <div class="tooltip">当到期日为月末时，购买日可能是上个月的对应日或月末<br>例如2月28日到期，购买日可能是1月28日或1月31日</div>
            </div>
          </div>
          <div class="capsule-switch is-exact" id="eom-switch">
            <div class="capsule-bg"></div>
            <button type="button" class="eom-btn" data-value="eom">月末</button>
            <button type="button" class="eom-btn active" data-value="exact">对日</button>
            <input type="hidden" id="eom" value="exact">
          </div>
        </div>
      </div>

      <div class="section-title section-mt">交易信息</div>
      <div class="form-grid">
        <div class="input-group">
          <label>交易时间</label>
          <input type="date" id="td">
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
        <div class="input-group">
          <div class="field-header">
            <label>交易金额</label>
            <div class="help-icon tooltip-container">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
              <div class="tooltip">可选</div>
            </div>
          </div>

          <input type="number" id="ta" step="0.01">
        </div>
        <div class="input-group">
          <div class="field-header">
            <label>溢价金额</label>
            <div class="help-icon tooltip-container">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
              <div class="tooltip">可选<br>正数表示溢价，负数表示折价</div>
            </div>
          </div>
          <input type="number" id="pa" step="0.01">
        </div>
        <div class="input-group">
          <div class="field-header">
            <label>交易折扣</label>
            <div class="help-icon tooltip-container">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
              <div class="tooltip">可选<br>支持多种输入格式，如：0.88 / 8.8 / 88</div>
            </div>
          </div>
          <input type="number" id="dr" step="0.01">
        </div>
      </div>
      <div class="btn-group">
        <button id="copy-md-btn" class="alt-btn">复制 Markdown</button>
        <button id="copy-link-btn" class="alt-btn">复制分享链接</button>
        <button id="download-btn" class="alt-btn">下载 SVG</button>
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
        document.getElementById('rate-source').innerText = \`数据来源: ${data.source}\`;
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
        rateDisplay.value = \`1 ${from} = ${rate.toFixed(4)} ${to}\`;
    } else {
        currentRate = 1.0000;
        rateDisplay.value = \`1 ${from} = 1 ${to}\`;
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
    return \`/svg?${params.toString()}\`;
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
    fallbackCopyTextToClipboard(\`[![VPS Remaining Value](${fullUrl})](${shareUrl} "查看工具")\`);
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
    a.download = \`vps-remaining-value-${els.td.value}.svg\`;
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
    rateDisplay.value = \`1 ${from} = ${currentRate} ${to}\`;
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
    document.querySelector(\`.cm-btn[data-value="${val}"]\`)?.classList.add('active');
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
    document.querySelector(\`.eom-btn[data-value="${val}"]\`)?.classList.add('active');
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
</script>
</body>
</html>`;

let ratesCache = null;
let ratesCacheTime = 0;

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
            if (ratesCache && Date.now() < ratesCacheTime) {
                const ageMs = Date.now() - ratesCache.cachedAt;
                const ageMins = Math.floor(ageMs / 60000);
                const ageSecs = Math.floor((ageMs % 60000) / 1000);
                const timeStr = ageMins > 0 ? `${ageMins}分${ageSecs}秒前` : `${ageSecs}秒前`;
                return new Response(JSON.stringify({
                    source: `${ratesCache.source} (缓存于 ${timeStr})`,
                    rates: ratesCache.rates
                }), {
                    headers: { 'Content-Type': 'application/json' }
                });
            }
            const apis = [
                { url: 'https://api.exchangerate.fun/latest?base=USD', name: 'ExchangeRate.fun', ttl: 3600000 },
                { url: `https://v6.exchangerate-api.com/v6/${env.V6_API_KEY}/latest/USD`, name: 'ExchangeRate-API V6', ttl: 3600000 },
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
                            return new Response(JSON.stringify({
                                source: api.name,
                                rates: ratesCache.rates
                            }), {
                                headers: { 'Content-Type': 'application/json' }
                            });
                        }
                    } catch (e) {}
                }
            }
            const fallbackRates = {
                "USD": 1,
                "CNY": 6.78,
                "EUR": 0.87,
                "GBP": 0.75,
                "HKD": 7.84,
                "JPY": 160.80,
                "TWD": 31.93,
                "AUD": 1.44,
                "CAD": 1.42,
                "RUB": 77.24,
                "INR": 95.30
            };
            ratesCache = {
                source: '离线备用汇率',
                rates: fallbackRates,
                cachedAt: Date.now()
            };
            return new Response(JSON.stringify({
                source: ratesCache.source,
                rates: ratesCache.rates
            }), {
                headers: { 'Content-Type': 'application/json' }
            });
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
            const cm = searchParams.get('cm') || 'fixed';
            const eom = searchParams.get('eom') || 'exact';

            if (!ed) {
                return new Response(`<svg xmlns="http://www.w3.org/2000/svg" width="1100" height="530" viewBox="50 50 1100 530" style="margin: auto; position: absolute; top: 0; left: 0; right: 0; bottom: 0;"><rect x="50" y="50" width="1100" height="530" rx="20" fill="#0d0d12"/><text x="600" y="315" fill="#ebd288" font-size="24" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif"></text></svg>`, {
                    headers: { 'Content-Type': 'image/svg+xml; charset=utf-8', 'Cache-Control': 'no-cache' }
                });
            }

            const endMs = new Date(ed).getTime();
            const transMs = new Date(td).getTime();
            const remainMs = Math.max(0, endMs - transMs);
            const remainDays = Math.ceil(remainMs / (1000 * 60 * 60 * 24));
            let totalCycleDays = pd;
            if (cm === 'real') {
                const d = new Date(ed);
                const day = d.getDate();
                if (pd === 30) d.setMonth(d.getMonth() - 1);
                else if (pd === 90) d.setMonth(d.getMonth() - 3);
                else if (pd === 180) d.setMonth(d.getMonth() - 6);
                else if (pd === 365) d.setFullYear(d.getFullYear() - 1);
                else if (pd === 730) d.setFullYear(d.getFullYear() - 2);
                else if (pd === 1095) d.setFullYear(d.getFullYear() - 3);
                else if (pd === 1825) d.setFullYear(d.getFullYear() - 5);
                if ((pd === 30 || pd === 90 || pd === 180) && d.getDate() !== day) {
                    d.setDate(0);
                }
                if (eom === 'eom' && (pd === 30 || pd === 90 || pd === 180)) {
                    d.setFullYear(d.getFullYear(), d.getMonth() + 1, 0);
                }
                totalCycleDays = Math.round((endMs - d.getTime()) / (1000 * 60 * 60 * 24));
            }
            const remainingValueBase = (ra / totalCycleDays) * remainDays;
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

            const pct = Math.max(0, (remainDays / totalCycleDays) * 100);
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
<text x="${rightX}" y="340" font-size="22" font-weight="600" dominant-baseline="central">${remainDays} / ${totalCycleDays} 天</text>
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