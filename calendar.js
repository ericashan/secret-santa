// "Add to calendar" for the exchange date: Google Calendar, or a calendar file
// that Apple Calendar, Outlook and most other calendar apps can open.
import { t } from "./i18n.js?v=202610041058";

const ymd = d => d.replace(/-/g, "");
function nextDay(d){ const x = new Date(d + "T12:00:00Z"); x.setUTCDate(x.getUTCDate() + 1); return x.toISOString().slice(0, 10); }

export function eventFor(group, link){
  const title = t("Secret Santa gift exchange: {name}", { name: group.ev || t("Secret Santa") });
  const lines = [];
  if (group.virtual) lines.push(t("Virtual exchange: gifts should arrive by this date, so mail yours early."));
  if (group.budget) lines.push(t("Spending limit {amount}", { amount: group.budget }));
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

// The two calendar choices, hidden until the calendar icon is tapped.
export function calendarMenu(group, link, uidSeed){
  const ev = eventFor(group, link);
  const menu = document.createElement("div"); menu.className = "calmenu"; menu.hidden = true;
  const g = document.createElement("a"); g.className = "button small"; g.href = googleCalendarUrl(ev); g.target = "_blank"; g.rel = "noopener";
  g.append(iconLabel(ICON.web, t("Google Calendar")));
  const i = document.createElement("button"); i.type = "button"; i.className = "small";
  i.append(iconLabel(ICON.download, t("Apple, Outlook or other")));
  i.onclick = () => downloadIcs(ev, uidSeed);
  menu.append(g, i);
  return menu;
}
// A calendar icon that sits right on the date and opens the menu.
export function calendarIcon(menu){
  const b = document.createElement("button"); b.type = "button"; b.className = "calicon";
  b.setAttribute("aria-label", t("Add to calendar")); b.title = t("Add to calendar");
  b.setAttribute("aria-expanded", String(!menu.hidden));
  b.innerHTML = ICON.calAdd;
  b.onclick = () => { menu.hidden = !menu.hidden; b.setAttribute("aria-expanded", String(!menu.hidden)); };
  return b;
}
