// Site-wide language support. English is the default.
//
// How it works: every piece of interface text is written in English. When another
// language is chosen, any text on the page that has a translation is swapped as the
// page draws itself (including text added later, like messages and buttons).
// Sentences that include names or numbers use t("Hi {name}!", { name }).
import KO from "./i18n-ko.js?v=202610041048";

export const LANGS = [["en", "English"], ["ko", "한국어"]];
const DICTS = { en: null, ko: KO };
const KEY = "ss-lang";

export function getLang(){
  try { const l = localStorage.getItem(KEY); if (l && l in DICTS) return l; } catch (e) {}
  return "en";
}
const lang = getLang();
const dict = DICTS[lang];
export const locale = lang === "ko" ? "ko-KR" : undefined;   // for dates

export function t(s, vars){
  let out = (dict && dict[s]) || s;
  if (vars) out = out.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m));
  return out;
}

export function setLang(l){
  try { localStorage.setItem(KEY, l); } catch (e) {}
  location.reload();
}

// ---------- Translating the page ----------
const ATTRS = ["placeholder", "aria-label", "title"];
function skip(node){
  const p = node.nodeType === 3 ? node.parentElement : node;
  return !p || !!p.closest("script, style, textarea, [translate=no]");
}
function trText(n){
  const raw = n.data, key = raw.trim();
  if (!key) return;
  const tr = dict[key];
  if (tr && tr !== key) n.data = raw.replace(key, tr);
}
function trAttrs(e){
  ATTRS.forEach(a => { const v = e.getAttribute && e.getAttribute(a); if (v && dict[v] && dict[v] !== v) e.setAttribute(a, dict[v]); });
}
function walk(root){
  if (root.nodeType === 3) { if (!skip(root)) trText(root); return; }
  if (root.nodeType !== 1 || skip(root)) return;
  // Sentences with markup inside (like "Tap <b>Start a group</b>.") are translated whole.
  const htmlEls = root.matches("[data-i18n-html]") ? [root] : [...root.querySelectorAll("[data-i18n-html]")];
  htmlEls.forEach(e => { const k = e.innerHTML.trim().replace(/\s+/g, " "); if (dict[k]) e.innerHTML = dict[k]; });
  trAttrs(root);
  root.querySelectorAll("[placeholder],[aria-label],[title]").forEach(trAttrs);
  const tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let n; while ((n = tw.nextNode())) if (!skip(n)) trText(n);
}

export function startTranslating(){
  document.documentElement.lang = lang;
  mountPicker();
  if (!dict) return;
  document.title = t(document.title);
  walk(document.body);
  new MutationObserver(list => {
    for (const m of list) {
      if (m.type === "characterData") { if (!skip(m.target)) trText(m.target); }
      else if (m.type === "attributes") { if (!skip(m.target)) trAttrs(m.target); }
      else m.addedNodes.forEach(walk);
    }
  }).observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ATTRS });
}

// ---------- Language picker (top of every page) ----------
const GLOBE = '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M3 12h18M12 3c2.6 2.6 3.8 5.6 3.8 9s-1.2 6.4-3.8 9c-2.6-2.6-3.8-5.6-3.8-9S9.4 5.6 12 3z" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>';
function mountPicker(){
  if (document.getElementById("langPicker")) return;
  const bar = document.createElement("div");
  bar.className = "langbar"; bar.setAttribute("translate", "no");
  const label = document.createElement("label");
  label.className = "langpick"; label.htmlFor = "langPicker";
  label.innerHTML = GLOBE + '<span class="sr-only">Language / 언어</span>';
  const sel = document.createElement("select");
  sel.id = "langPicker";
  LANGS.forEach(([code, name]) => { const o = new Option(name, code); if (code === lang) o.selected = true; sel.append(o); });
  sel.addEventListener("change", () => setLang(sel.value));
  label.append(sel); bar.append(label);
  const wrap = document.querySelector(".wrap") || document.body;
  wrap.prepend(bar);
}
