// Shared setup for every page: Firebase, small helpers, and "my groups".
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc, deleteField } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getAuth, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { t, locale } from "./i18n.js?v=202610041058";
import { firebaseConfig } from "./firebase-config.js?v=202610041058";

export const configured = !String(firebaseConfig.apiKey).startsWith("PASTE");
export const app = configured ? initializeApp(firebaseConfig) : null;
export const db = configured ? getFirestore(app) : null;
export const auth = configured ? getAuth(app) : null;

// ---------- Helpers ----------
export const $ = id => document.getElementById(id);
export function el(tag, cls, text){ const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
export function msg(id, kind, text){ const m = $(id); m.className = "msg " + kind; m.textContent = text; m.hidden = !text; }
export function randomId(n = 24){ const a = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789"; const r = crypto.getRandomValues(new Uint8Array(n)); return Array.from(r, x => a[x % a.length]).join(""); }
export function fmtDate(d){ if (!d) return ""; const dt = new Date(d + "T12:00:00"); return isNaN(dt) ? d : dt.toLocaleDateString(locale, { weekday: "short", month: "short", day: "numeric", year: "numeric" }); }
export async function copyText(text, btn, label){
  try { await navigator.clipboard.writeText(text); btn.textContent = t("Copied"); }
  catch (e) { btn.textContent = t("Couldn't copy"); }
  setTimeout(() => btn.textContent = label, 1800);
}
const siteBase = () => location.origin + location.pathname.replace(/[^/]*$/, "");
export const groupLink = gid => siteBase() + "group.html?g=" + encodeURIComponent(gid);
export const personalLink = (gid, secret) => groupLink(gid) + "#" + secret;
export const organizeLink = gid => siteBase() + "organize.html?g=" + encodeURIComponent(gid);
export const homeLink = () => siteBase();
export const groupIdFromUrl = () => { const g = new URLSearchParams(location.search).get("g"); return g && /^[A-Za-z0-9]{8,40}$/.test(g) ? g : null; };

// ---------- Sign-in (optional for members, required for organizers) ----------
let firstAuth = null;
export function authReady(){
  if (!auth) return Promise.resolve(null);
  if (!firstAuth) firstAuth = new Promise(res => { const u = onAuthStateChanged(auth, user => { u(); res(user); }); });
  return firstAuth;
}
export async function signInWithGoogle(){
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  const cred = await signInWithPopup(auth, provider);
  await syncAccount(cred.user);
  return cred.user;
}
export const signOutNow = () => signOut(auth);
export function signInError(e){
  if (e && e.code === "auth/unauthorized-domain") return t("This website isn't approved for Google sign-in yet. In Firebase, add it under Authentication → Settings → Authorized domains.");
  if (e && (e.code === "auth/popup-blocked" || e.code === "auth/cancelled-popup-request")) return t("Your browser blocked the sign-in window. Allow pop-ups for this site and try again.");
  if (e && e.code === "auth/popup-closed-by-user") return t("Sign-in was closed before it finished.");
  return t("Sign-in didn't finish. Try again.");
}

// ---------- My groups ----------
// Kept on this device, and copied to your account when you're signed in.
// Each entry: { groupName, myName, secret, organizer, updated }
const KEY = "ss-my-groups";
export function localGroups(){ try { return JSON.parse(localStorage.getItem(KEY) || "{}") || {}; } catch (e) { return {}; } }
function saveLocal(m){ try { localStorage.setItem(KEY, JSON.stringify(m)); } catch (e) {} }

const defined = o => Object.fromEntries(Object.entries(o || {}).filter(([, v]) => v !== undefined));
function mergeEntry(a = {}, b = {}){
  a = defined(a); b = defined(b);
  const newer = (b.updated || 0) >= (a.updated || 0) ? b : a, older = newer === b ? a : b;
  return { ...older, ...newer, secret: ("secret" in newer && newer.secret === null && newer.myName === null) ? null : (newer.secret || older.secret || null), organizer: !!(a.organizer || b.organizer) };
}

export async function rememberGroup(gid, info){
  const m = localGroups();
  m[gid] = mergeEntry(m[gid], { ...info, updated: Date.now() });
  Object.keys(m[gid]).forEach(k => m[gid][k] === undefined && delete m[gid][k]);
  saveLocal(m);
  const user = await authReady();
  if (user) { try { await setDoc(doc(db, "users", user.uid), { groups: { [gid]: m[gid] } }, { merge: true }); } catch (e) {} }
}

// A personal link that no longer works (removed by the organizer): stop offering it.
export async function dropSecret(gid){
  const m = localGroups(); if (!m[gid]) return;
  m[gid] = { ...m[gid], secret: null, myName: null, updated: Date.now() }; saveLocal(m);
  const user = await authReady();
  if (user) { try { await setDoc(doc(db, "users", user.uid), { groups: { [gid]: m[gid] } }, { merge: true }); } catch (e) {} }
}

export async function forgetGroup(gid){
  const m = localGroups(); delete m[gid]; saveLocal(m);
  const user = await authReady();
  if (user) { try { await setDoc(doc(db, "users", user.uid), { groups: { [gid]: deleteField() } }, { merge: true }); } catch (e) {} }
}

// Combine this device's groups with the account's, and save the result in both places.
export async function syncAccount(user){
  if (!user) return localGroups();
  const ref = doc(db, "users", user.uid);
  let remote = {};
  try { const s = await getDoc(ref); remote = (s.exists() && s.data().groups) || {}; } catch (e) { return localGroups(); }
  const local = localGroups(), merged = {};
  new Set([...Object.keys(local), ...Object.keys(remote)]).forEach(g => { merged[g] = mergeEntry(remote[g], local[g]); });
  saveLocal(merged);
  try { await setDoc(ref, { groups: merged }, { merge: true }); } catch (e) {}
  return merged;
}

// ---------- Sharing ----------
export const inviteText = name => name ? t("Join our Secret Santa: {name}! Open this link and add your name:", { name }) : t("Join our Secret Santa! Open this link and add your name:");
export const canShare = () => typeof navigator.share === "function";
// Opens the phone's share sheet (Messages, WhatsApp, email…). Returns false if it isn't available.
export async function shareInvite(name, url){
  if (!canShare()) return false;
  try { await navigator.share({ title: name || "Secret Santa", text: inviteText(name), url }); } catch (e) { /* closed or not allowed */ }
  return true;
}
// A link that opens the Messages app with the invite filled in.
export const smsHref = (name, url) => "sms:?&body=" + encodeURIComponent(inviteText(name) + " " + url);

// ---------- Group photo ----------
// Shrinks a picked photo so it fits in the database (no paid storage needed).
export async function photoToDataUrl(file, maxSide = 1000){
  if (!file || !/^image\//.test(file.type || "image/")) throw new Error("not-image");
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error("unreadable")); i.src = url; });
    const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.max(1, Math.round(img.naturalWidth * scale)), h = Math.max(1, Math.round(img.naturalHeight * scale));
    const c = document.createElement("canvas"); c.width = w; c.height = h;
    const ctx = c.getContext("2d"); ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, w, h); ctx.drawImage(img, 0, 0, w, h);
    let q = 0.82, out = c.toDataURL("image/jpeg", q);
    while (out.length > 600000 && q > 0.45) { q -= 0.1; out = c.toDataURL("image/jpeg", q); }
    if (out.length > 850000) throw new Error("too-big");
    return out;
  } finally { URL.revokeObjectURL(url); }
}
export function photoError(e){
  if (e && e.message === "not-image") return t("That file isn't a photo. Pick a JPG, PNG or similar image.");
  if (e && e.message === "unreadable") return t("This browser can't read that photo format. Try a JPG or PNG, or a screenshot of it.");
  if (e && e.message === "too-big") return t("That photo is too detailed to save. Try a different one.");
  return t("Couldn't save the photo. Check your connection and try again.");
}

// ---------- Phone numbers (for organizer group texts) ----------
// "(555) 123-4567" -> "+15551234567". Numbers starting with + keep their country code.
export function normalizePhone(raw){
  const s = String(raw || "").trim();
  if (!s) return "";
  const digits = s.replace(/\D/g, "");
  if (s.startsWith("+")) return digits.length >= 7 && digits.length <= 15 ? "+" + digits : null;
  if (digits.length === 10) return "+1" + digits;
  if (digits.length === 11 && digits[0] === "1") return "+" + digits;
  return null;
}
export function formatPhone(p){
  const m = /^\+1(\d{3})(\d{3})(\d{4})$/.exec(p || "");
  return m ? "(" + m[1] + ") " + m[2] + "-" + m[3] : (p || "");
}
// Opens Messages with several recipients and the message filled in.
// iPhones and Android phones use different link formats for group texts.
export function smsGroupHref(numbers, body){
  const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const b = encodeURIComponent(body || "");
  if (ios) return "sms://open?addresses=" + numbers.join(",") + "&body=" + b;
  return "sms:" + numbers.join(",") + "?body=" + b;
}
