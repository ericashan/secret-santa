// Small hand-drawn icons used next to names.

const BABY_SVG = `<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
  <circle cx="12" cy="13" r="9" fill="#f6c9a8" stroke="#d9a07c" stroke-width="1"/>
  <path d="M10.2 4.6 C10.8 2.6 13.6 2.4 13.9 4.2 C14.1 5.4 12.8 6 12.2 5.3" fill="none" stroke="#7a4e26" stroke-width="1.6" stroke-linecap="round"/>
  <path d="M7.6 12.2 q1.3 -1.3 2.6 0 M13.8 12.2 q1.3 -1.3 2.6 0" fill="none" stroke="#2a2a2a" stroke-width="1.3" stroke-linecap="round"/>
  <circle cx="7.3" cy="15" r="1.5" fill="#f29a9a" opacity=".75"/>
  <circle cx="16.7" cy="15" r="1.5" fill="#f29a9a" opacity=".75"/>
  <circle cx="12" cy="17.2" r="2.3" fill="#8fc4e8" stroke="#5a9cc8" stroke-width=".8"/>
  <rect x="10.4" y="16.6" width="3.2" height="1.2" rx=".6" fill="#ffffff"/>
</svg>`;

// Returns a <span> holding the baby icon, labelled for screen readers.
export function babyIcon(){
  const s = document.createElement("span");
  s.className = "baby-icon";
  s.setAttribute("role", "img");
  s.setAttribute("aria-label", "kid");
  s.title = "Kid";
  s.innerHTML = BABY_SVG;
  return s;
}

// Name helpers for spotting duplicates: "  Lílý  S. " -> "lily s"
export function normName(name){
  return name.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^\p{L}\p{N} ]+/gu, " ").replace(/\s+/g, " ").trim();
}
export const firstName = name => normName(name).split(" ")[0] || "";
// One roster entry per child name, so the database itself refuses an exact duplicate.
export const kidRosterId = name => { const n = normName(name); return n ? "kid-" + n.replace(/ /g, "-") : null; };
