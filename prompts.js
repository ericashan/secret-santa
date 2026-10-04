// Tap-to-add prompts above a wishlist box, plus a small "how helpful is this list" meter.
import { t } from "./i18n.js?v=202610041118";

const ADULT = ["Sizes", "Favorite colors", "Hobbies I'm into lately", "Stores or brands I like", "Snacks and treats I love",
  "Something I'd never buy myself", "Experiences I'd enjoy", "I already have", "Please no", "Link to something I want"];
const KID = ["Age", "Clothing and shoe size", "Favorite characters or shows", "Toys they love right now", "Already has", "Please avoid"];
const EXTRA = { friends: ["Gift cards I'd use"], coworkers: ["Desk or office goodies", "Gift cards I'd use"], other: ["Gift cards I'd use"] };
const SURPRISE = "I'm easy, surprise me!";
const GOAL = 3;

// Counts filled-in ideas: plain lines, or "Prompt: answer" lines with an answer.
export function countIdeas(text){
  return String(text || "").split("\n").map(l => l.trim()).filter(l => {
    if (!l) return false;
    const m = /^([^:：]{1,40})[:：]\s*(.*)$/.exec(l);
    return m ? m[2].trim().length > 0 : true;
  }).length;
}

function meterText(n, surprise){
  if (surprise) return { text: t("Got it. Your Secret Santa will surprise you."), done: true };
  if (n >= GOAL) return { text: t("✓ Great list. Your Secret Santa will thank you."), done: true };
  if (n === 0) return { text: t("Add {n} ideas to help your Secret Santa.", { n: GOAL }), done: false };
  return { text: t(GOAL - n === 1 ? "Nice! 1 more idea would help." : "Nice! {n} more ideas would help.", { n: GOAL - n }), done: false };
}

// Adds a starter line ("Favorite colors: ") or jumps to it if it's already there.
function addLine(ta, label){
  const prefix = t(label) + ": ";
  const lines = ta.value.split("\n");
  const at = lines.findIndex(l => l.trim().toLowerCase().startsWith(prefix.trim().toLowerCase()));
  let caret;
  if (at >= 0) {
    caret = lines.slice(0, at + 1).join("\n").length;
  } else {
    const base = ta.value.replace(/\s+$/, "");
    ta.value = (base ? base + "\n" : "") + prefix;
    caret = ta.value.length;
  }
  ta.focus();
  ta.setSelectionRange(caret, caret);
  ta.dispatchEvent(new Event("input", { bubbles: true }));   // saves automatically
}

// who: "adult" or "kid"; groupKind: family | friends | coworkers | other
export function wishlistHelpers(ta, who, groupKind){
  const box = document.createElement("div"); box.className = "prompts";
  const chips = document.createElement("div"); chips.className = "promptchips";
  const list = who === "kid" ? KID : ADULT.concat(EXTRA[groupKind] || []);
  const SHOW = 5;   // the rest sit behind "More prompts" so the list stays short on phones
  const extras = [];
  list.forEach((label, i) => {
    const b = document.createElement("button"); b.type = "button"; b.className = "promptchip"; b.textContent = "+ " + t(label);
    b.onclick = () => addLine(ta, label);
    if (i >= SHOW) { b.hidden = true; extras.push(b); }
    chips.append(b);
  });
  if (extras.length) {
    const more = document.createElement("button"); more.type = "button"; more.className = "promptchip more"; more.textContent = t("More prompts…");
    more.setAttribute("aria-expanded", "false");
    more.onclick = () => { extras.forEach(b => b.hidden = false); more.remove(); };
    chips.append(more);
  }
  if (who !== "kid") {
    const s = document.createElement("button"); s.type = "button"; s.className = "promptchip surprise"; s.textContent = t(SURPRISE);
    s.onclick = () => {
      const line = t(SURPRISE);
      if (!ta.value.includes(line)) { const base = ta.value.replace(/\s+$/, ""); ta.value = (base ? base + "\n" : "") + line; ta.dispatchEvent(new Event("input", { bubbles: true })); }
      ta.focus();
    };
    chips.append(s);
  }
  const meter = document.createElement("p"); meter.className = "meter";
  const update = () => {
    const surprise = who !== "kid" && ta.value.includes(t(SURPRISE));
    const m = meterText(countIdeas(ta.value.replace(t(SURPRISE), "")), surprise);
    meter.textContent = m.text; meter.classList.toggle("done", m.done);
  };
  ta.addEventListener("input", update);
  box.append(chips);
  box.update = update;
  return { chips: box, meter, update };
}
