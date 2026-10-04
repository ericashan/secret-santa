// "Add to calendar" for the exchange date: Google Calendar, or a calendar file
// that Apple Calendar, Outlook and most other calendar apps can open.
import { formatMoney, currencyOf } from "./app.js?v=202610041142";
import { t } from "./i18n.js?v=202610041142";

const ymd = d => d.replace(/-/g, "");
function nextDay(d){ const x = new Date(d + "T12:00:00Z"); x.setUTCDate(x.getUTCDate() + 1); return x.toISOString().slice(0, 10); }

export function eventFor(group, link){
  const title = t("Secret Santa gift exchange: {name}", { name: group.ev || t("Secret Santa") });
  const lines = [];
  if (group.virtual) lines.push(t("Virtual exchange: gifts should arrive by this date, so mail yours early."));
  if (group.budget) lines.push(t("Spending limit {amount}", { amount: formatMoney(group.budget, currencyOf(group)) }));
  lines.push(t("Group page: {link}", { link }));
  return { title, date: group.date, details: lines.join("\n"), link };
}

export function googleCalendarUrl(ev){
  const q = new URLSearchParams({ action: "TEMPLATE", text: ev.title, dates: ymd(ev.date) + "/" + ymd(nextDay(ev.date)), details: ev.details });
  return "https://calendar.google.com/calendar/render?" + q.toString();
}

const esc = s => String(s).replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
// Lines in a calendar file must be folded at 75 characters.
const fold = line => { let out = "", s = line; while (s.length > 74) { out += s.slice(0, 74) + "\r\n "; s = s.slice(74); } return out + s; };

export function icsFile(ev, uidSeed){
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+Z$/, "Z");
  const lines = [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Secret Santa//EN", "CALSCALE:GREGORIAN", "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    "UID:" + (uidSeed || "secret-santa") + "-" + ymd(ev.date) + "@secret-santa",
    "DTSTAMP:" + stamp,
    "DTSTART;VALUE=DATE:" + ymd(ev.date),
    "DTEND;VALUE=DATE:" + ymd(nextDay(ev.date)),
    "SUMMARY:" + esc(ev.title),
    "DESCRIPTION:" + esc(ev.details),
    "URL:" + ev.link,
    "TRANSP:TRANSPARENT",
    // Reminders a week before and the day before.
    "BEGIN:VALARM", "ACTION:DISPLAY", "DESCRIPTION:" + esc(ev.title), "TRIGGER:-P7D", "END:VALARM",
    "BEGIN:VALARM", "ACTION:DISPLAY", "DESCRIPTION:" + esc(ev.title), "TRIGGER:-P1D", "END:VALARM",
    "END:VEVENT", "END:VCALENDAR"
  ];
  return lines.map(fold).join("\r\n") + "\r\n";
}

export function downloadIcs(ev, uidSeed){
  const blob = new Blob([icsFile(ev, uidSeed)], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "secret-santa.ics";
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

// Icons (simple line drawings that follow the text color).
const ICON = {
  calAdd: '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false"><rect x="3.5" y="5" width="17" height="15.5" rx="2.5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M3.5 9.5h17M8 3v4M16 3v4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M12 12.5v5M9.5 15h5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
  web: '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false"><rect x="3.5" y="5" width="17" height="15.5" rx="2.5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M3.5 9.5h17M8 3v4M16 3v4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M8 13h2.5M13.5 13H16M8 16.5h2.5M13.5 16.5H16" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
  download: '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false"><path d="M12 4v11M7.5 10.5 12 15l4.5-4.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M5 18.5h14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>'
};
function iconLabel(icon, text){ const f = document.createDocumentFragment(); const i = document.createElement("span"); i.className = "ico"; i.innerHTML = icon; f.append(i, document.createTextNode(text)); return f; }

// A calendar icon that sits on the date. Tapping it opens a small pop-up right
// next to it with the two choices; tapping outside, scrolling or Escape closes it.
let openPop = null;
function closePop(){ if (!openPop) return; const { pop, btn, onDoc, onKey, onScroll } = openPop; pop.remove(); btn.setAttribute("aria-expanded", "false");
  document.removeEventListener("pointerdown", onDoc, true); document.removeEventListener("keydown", onKey); window.removeEventListener("scroll", onScroll, true); window.removeEventListener("resize", onScroll); openPop = null; }

export function calendarIcon(group, link, uidSeed){
  const btn = document.createElement("button"); btn.type = "button"; btn.className = "calicon";
  btn.setAttribute("aria-label", t("Add to calendar")); btn.title = t("Add to calendar");
  btn.setAttribute("aria-haspopup", "true"); btn.setAttribute("aria-expanded", "false");
  btn.innerHTML = ICON.calAdd;
  btn.onclick = e => {
    e.stopPropagation();
    if (openPop && openPop.btn === btn) { closePop(); return; }
    closePop();
    const ev = eventFor(group, link);
    const pop = document.createElement("div"); pop.className = "calpop"; pop.setAttribute("role", "dialog"); pop.setAttribute("aria-label", t("Add to calendar"));
    const title = document.createElement("span"); title.className = "label"; title.textContent = t("Add to calendar");
    const g = document.createElement("a"); g.className = "calopt"; g.href = googleCalendarUrl(ev); g.target = "_blank"; g.rel = "noopener";
    g.append(iconLabel(ICON.web, t("Google Calendar"))); g.addEventListener("click", () => setTimeout(closePop, 0));
    const i = document.createElement("button"); i.type = "button"; i.className = "calopt";
    i.append(iconLabel(ICON.download, t("Apple, Outlook or other")));
    i.onclick = () => { downloadIcs(ev, uidSeed); closePop(); };
    pop.append(title, g, i);
    document.body.append(pop);
    // Place it just below the icon, kept inside the screen.
    const r = btn.getBoundingClientRect(), w = pop.offsetWidth, h = pop.offsetHeight, gap = 8;
    let left = Math.min(Math.max(12, r.left + r.width / 2 - w / 2), window.innerWidth - w - 12);
    let top = r.bottom + gap; if (top + h > window.innerHeight - 12) top = Math.max(12, r.top - h - gap);
    pop.style.left = left + "px"; pop.style.top = top + "px";
    pop.style.setProperty("--arrow-x", (r.left + r.width / 2 - left) + "px");
    if (top < r.top) pop.classList.add("above");
    btn.setAttribute("aria-expanded", "true");
    const onDoc = ev2 => { if (!pop.contains(ev2.target) && ev2.target !== btn && !btn.contains(ev2.target)) closePop(); };
    const onKey = ev2 => { if (ev2.key === "Escape") { closePop(); btn.focus(); } };
    const onScroll = () => closePop();
    document.addEventListener("pointerdown", onDoc, true); document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScroll, true); window.addEventListener("resize", onScroll);
    openPop = { pop, btn, onDoc, onKey, onScroll };
    g.focus();
  };
  return btn;
}
