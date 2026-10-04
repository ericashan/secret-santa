// A cartoon Santa dragging a sack of gifts, shown while the site is busy.
// showLoading(text) / hideLoading() can overlap; Santa stays until the last one finishes.
// Quick actions (under 0.2s) never show him, and once he appears he stays at least 0.4s.

const SANTA_SVG = `
<svg class="santa-svg" viewBox="0 0 240 140" role="img" aria-label="Santa dragging a sack of gifts">
  <g class="santa-ground">
    <line x1="0" y1="124" x2="16" y2="124"/><line x1="40" y1="124" x2="56" y2="124"/>
    <line x1="80" y1="124" x2="96" y2="124"/><line x1="120" y1="124" x2="136" y2="124"/>
    <line x1="160" y1="124" x2="176" y2="124"/><line x1="200" y1="124" x2="216" y2="124"/>
    <line x1="240" y1="124" x2="256" y2="124"/>
  </g>
  <g class="santa-puffs">
    <circle cx="14" cy="118" r="4"/><circle cx="6" cy="114" r="3"/><circle cx="20" cy="112" r="2.5"/>
  </g>
  <path class="santa-rope" d="M80 74 Q106 88 131 78"/>
  <g class="santa-sack">
    <rect x="30" y="50" width="16" height="16" rx="2" fill="#2f8f5b"/>
    <rect x="36.5" y="50" width="3" height="16" fill="#f4d58d"/>
    <rect x="52" y="44" width="14" height="20" rx="2" fill="#4a7bd1" transform="rotate(10 59 54)"/>
    <rect x="57.5" y="44" width="3" height="20" fill="#ffffff" transform="rotate(10 59 54)"/>
    <circle cx="60" cy="43" r="3" fill="#e2566e"/>
    <path d="M20 121 C8 102 14 74 32 68 L74 68 C94 74 98 104 88 121 Z" fill="#b07a45" stroke="#7a4e26" stroke-width="2.5"/>
    <ellipse cx="53" cy="68" rx="22" ry="5.5" fill="#7a4e26"/>
    <path d="M38 92 q6 -4 12 0 M60 102 q6 -4 12 0" stroke="#7a4e26" stroke-width="2" fill="none" stroke-linecap="round"/>
  </g>
  <g transform="rotate(7 160 122)">
    <g class="santa-body">
      <g class="santa-leg santa-leg-back">
        <rect x="146" y="96" width="10" height="20" fill="#a3212f"/>
        <rect x="144" y="112" width="17" height="9" rx="4" fill="#2a2a2a"/>
      </g>
      <g class="santa-leg santa-leg-front">
        <rect x="160" y="96" width="10" height="20" fill="#c62b3c"/>
        <rect x="158" y="112" width="17" height="9" rx="4" fill="#2a2a2a"/>
      </g>
      <path d="M148 74 L131 78" stroke="#c62b3c" stroke-width="9" stroke-linecap="round"/>
      <circle cx="130" cy="78" r="5.5" fill="#1f5a45"/>
      <ellipse cx="158" cy="86" rx="22" ry="20" fill="#d32f3f"/>
      <rect x="137" y="98" width="42" height="7" rx="3.5" fill="#ffffff"/>
      <rect x="136" y="83" width="44" height="7" fill="#2a2a2a"/>
      <rect x="153.5" y="82" width="9" height="9" rx="1.5" fill="none" stroke="#e3b558" stroke-width="2"/>
      <g class="santa-arm-front">
        <path d="M170 74 L179 88" stroke="#c62b3c" stroke-width="8" stroke-linecap="round"/>
        <circle cx="180" cy="90" r="5" fill="#1f5a45"/>
      </g>
      <circle cx="166" cy="56" r="13" fill="#f6c9a8"/>
      <path d="M151 57 Q152 80 167 82 Q182 80 181 57 Q166 66 151 57 Z" fill="#ffffff" stroke="#e4e4e4" stroke-width="1"/>
      <ellipse cx="170" cy="61" rx="6" ry="3" fill="#ffffff" stroke="#e4e4e4" stroke-width="1"/>
      <circle cx="178" cy="56" r="3" fill="#ec9b86"/>
      <circle cx="171" cy="51.5" r="1.8" fill="#2a2a2a" class="santa-eye"/>
      <circle cx="175" cy="58" r="2.6" fill="#f29a9a" opacity=".7"/>
      <path d="M153 46 C150 34 145 30 138 30 C150 25 172 29 181 46 Z" fill="#d32f3f"/>
      <rect x="150" y="43" width="33" height="8" rx="4" fill="#ffffff"/>
      <circle cx="136" cy="30" r="5" fill="#ffffff"/>
    </g>
  </g>
</svg>`;

let el = null, timer = null, shownAt = 0, count = 0;

function ensure(){
  if (el) return;
  el = document.createElement("div");
  el.className = "santa-overlay";
  el.hidden = true;
  el.setAttribute("role", "status");
  el.setAttribute("aria-live", "polite");
  el.innerHTML = `<div class="santa-card">${SANTA_SVG}<p class="santa-text"></p></div>`;
  document.body.append(el);
}

export function showLoading(text = "Loading…", immediate = false){
  ensure();
  count++;
  el.querySelector(".santa-text").textContent = text;
  if (!el.hidden) return;
  if (immediate) { clearTimeout(timer); timer = null; el.hidden = false; shownAt = Date.now(); return; }
  if (!timer) timer = setTimeout(() => { timer = null; if (count) { el.hidden = false; shownAt = Date.now(); } }, 200);
}

export function hideLoading(){
  count = Math.max(0, count - 1);
  if (count || !el) return;
  if (timer) { clearTimeout(timer); timer = null; return; }
  if (el.hidden) return;
  const wait = Math.max(0, 400 - (Date.now() - shownAt));
  setTimeout(() => { if (!count) el.hidden = true; }, wait);
}
