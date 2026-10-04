// Slide-out menu on every page: home, start a group, and all your groups.
import { t } from "./i18n.js?v=202610041118";
import { localGroups, personalLink, organizeLink, groupLink, homeLink, groupIdFromUrl } from "./app.js?v=202610041118";

const MENU_ICON = '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false"><path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
const CLOSE_ICON = '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false"><path d="M6 6l12 12M18 6 6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };

export function mountNav(){
  if (document.getElementById("navBtn")) return;
  let bar = document.querySelector(".langbar");
  if (!bar) { bar = el("div", "langbar"); (document.querySelector(".wrap") || document.body).prepend(bar); }
  bar.classList.add("topbar");

  const btn = el("button", "navbtn"); btn.type = "button"; btn.id = "navBtn";
  btn.setAttribute("aria-controls", "navDrawer"); btn.setAttribute("aria-expanded", "false");
  btn.innerHTML = MENU_ICON; btn.append(el("span", null, t("Menu")));
  bar.prepend(btn);

  const backdrop = el("div", "navbackdrop"); backdrop.hidden = true;
  const drawer = el("nav", "navdrawer"); drawer.id = "navDrawer"; drawer.setAttribute("aria-label", t("Menu")); drawer.hidden = true;
  document.body.append(backdrop, drawer);

  const close = () => { drawer.classList.remove("open"); backdrop.classList.remove("open"); btn.setAttribute("aria-expanded", "false");
    setTimeout(() => { if (!drawer.classList.contains("open")) { drawer.hidden = true; backdrop.hidden = true; } }, 220); btn.focus(); };
  const open = () => { build(); drawer.hidden = false; backdrop.hidden = false;
    requestAnimationFrame(() => { drawer.classList.add("open"); backdrop.classList.add("open"); });
    btn.setAttribute("aria-expanded", "true"); const first = drawer.querySelector("a,button"); if (first) first.focus(); };
  btn.onclick = () => (drawer.classList.contains("open") ? close() : open());
  backdrop.onclick = close;
  document.addEventListener("keydown", e => { if (e.key === "Escape" && drawer.classList.contains("open")) close(); });

  function build(){
    drawer.textContent = "";
    const head = el("div", "navhead");
    head.append(el("span", "navtitle", t("Secret Santa")));
    const x = el("button", "navclose"); x.type = "button"; x.setAttribute("aria-label", t("Close menu")); x.innerHTML = CLOSE_ICON; x.onclick = close;
    head.append(x); drawer.append(head);

    const here = location.pathname.split("/").pop() || "index.html";
    const currentGid = groupIdFromUrl();
    const link = (href, text, cls, current) => { const a = el("a", "navlink" + (cls ? " " + cls : ""), text); a.href = href; if (current) a.setAttribute("aria-current", "page"); a.addEventListener("click", () => setTimeout(close, 0)); return a; };

    const main = el("div", "navsection");
    main.append(link(homeLink(), t("My groups"), "", here === "index.html" || here === ""));
    main.append(link(homeLink() + "#start", t("Start a group"), "", false));
    drawer.append(main);

    const mine = localGroups();
    const ids = Object.keys(mine).sort((a, b) => (mine[b].updated || 0) - (mine[a].updated || 0));
    const sec = el("div", "navsection");
    sec.append(el("span", "label", t("Your groups")));
    if (!ids.length) sec.append(el("p", "hint", t("Groups you join or organize will show up here.")));
    ids.forEach(gid => {
      const m = mine[gid], isHere = gid === currentGid;
      const item = el("div", "navgroup" + (isHere ? " here" : ""));
      const name = m.groupName || t("Secret Santa group");
      const mainHref = m.secret ? personalLink(gid, m.secret) : m.organizer ? organizeLink(gid) : groupLink(gid);
      const a = link(mainHref, name, "navgroupname", isHere); a.setAttribute("translate", "no"); item.append(a);
      // Organizers get both pages: playing (or joining) and organizing.
      if (m.organizer) {
        const subs = el("div", "navsubs");
        subs.append(m.secret ? link(personalLink(gid, m.secret), t("My page"), "navsub", isHere && here === "group.html")
                             : link(groupLink(gid), t("Join"), "navsub", isHere && here === "group.html"));
        subs.append(link(organizeLink(gid), t("Organize"), "navsub", isHere && here === "organize.html"));
        item.append(subs);
      }
      sec.append(item);
    });
    drawer.append(sec);
  }
}
