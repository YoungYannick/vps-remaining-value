const fs = require('fs');
const path = require('path');

let logoSvg = fs.readFileSync(path.join(__dirname, '..', 'public', 'images', 'logo.svg'), 'utf-8');
logoSvg = logoSvg.replace(/#000000|#000\b|black/gi, '#D4AF37');
const logoBase64 = `data:image/svg+xml;base64,${Buffer.from(logoSvg).toString('base64')}`;

const githubPath = 'M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z';

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1150" height="580" viewBox="25 25 1150 580" style="margin: auto; position: absolute; top: 0; left: 0; right: 0; bottom: 0;">
<defs>
<linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
<stop offset="0%" stop-color="#16161a"/>
<stop offset="100%" stop-color="#0a0a0d"/>
</linearGradient>
<linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
<stop offset="0%" stop-color="#F5C900"/>
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
<clipPath id="roundCorner">
<rect x="25" y="25" width="1150" height="580" rx="24" ry="24"/>
</clipPath>
<clipPath id="barClip">
<rect x="90" y="545" width="1020" height="8" rx="4"/>
</clipPath>
<style>
.f { font-family: system-ui, -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
.anim { animation: fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) both; }
.d1 { animation-delay: 0.1s; }
.d2 { animation-delay: 0.2s; }
.d3 { animation-delay: 0.3s; }
</style>
</defs>
<g clip-path="url(#roundCorner)">
<rect x="25" y="25" width="1150" height="580" fill="url(#bg)"/>
<rect x="50" y="50" width="1100" height="530" rx="20" fill="none" stroke="url(#g)" stroke-width="1.5" opacity="0.15"/>
<g class="f" fill="#FFFFFF">
<image x="90" y="72" width="48" height="48" href="${logoBase64}"/>
<text x="152" y="110" font-size="28" font-weight="700" fill="url(#textShine)" letter-spacing="1">VPS Remaining Value</text>
<g opacity="0.4">
<path d="${githubPath}" transform="translate(854, 68)"/>
<text x="1110" y="81" font-size="14" text-anchor="end">YoungYannick/vps-remaining-value</text>
</g>
<line x1="50" y1="145" x2="1150" y2="145" stroke="#FFFFFF" opacity="0.08"/>
<g class="anim d1">
<text x="600" y="285" font-size="42" font-weight="700" fill="url(#g)" text-anchor="middle">服务暂时不可用</text>
</g>
<g class="anim d2">
<text x="600" y="335" font-size="18" opacity="0.6" text-anchor="middle">我们正在进行短暂的维护与调整，页面稍后将自动恢复</text>
</g>
<g class="anim d3">
<text x="600" y="367" font-size="16" opacity="0.45" text-anchor="middle">感谢你的理解与耐心</text>
</g>
<line x1="50" y1="480" x2="1150" y2="480" stroke="#FFFFFF" opacity="0.08"/>
<text x="90" y="525" font-size="14" opacity="0.4">服务正在恢复中</text>
<rect x="90" y="545" width="1020" height="8" rx="4" fill="#202026"/>
<g clip-path="url(#barClip)">
<rect x="-160" y="545" width="240" height="8" fill="url(#shimmer)">
<animate attributeName="x" values="-160;1120;1120" keyTimes="0;0.7;1" dur="3.5s" repeatCount="indefinite"/>
</rect>
</g>
</g>
</g>
</svg>`;

const outFile = path.join(__dirname, 'error.svg');
fs.writeFileSync(outFile, svg);
console.log(`written ${path.relative(path.join(__dirname, '..'), outFile)} (${Buffer.byteLength(svg)} bytes)`);