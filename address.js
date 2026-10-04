// Mailing addresses for virtual exchanges: checks, US address lookup, and formatting.
//
// US addresses are checked against the US Census Bureau's free address service,
// which returns the standardized (mail-style) version of an address it recognizes.
// It confirms the street address exists; it doesn't check apartment numbers or
// guarantee delivery the way the Postal Service's paid tools do.

export const US_STATES = [
  ["AL","Alabama"],["AK","Alaska"],["AZ","Arizona"],["AR","Arkansas"],["CA","California"],["CO","Colorado"],["CT","Connecticut"],
  ["DE","Delaware"],["DC","District of Columbia"],["FL","Florida"],["GA","Georgia"],["HI","Hawaii"],["ID","Idaho"],["IL","Illinois"],
  ["IN","Indiana"],["IA","Iowa"],["KS","Kansas"],["KY","Kentucky"],["LA","Louisiana"],["ME","Maine"],["MD","Maryland"],
  ["MA","Massachusetts"],["MI","Michigan"],["MN","Minnesota"],["MS","Mississippi"],["MO","Missouri"],["MT","Montana"],["NE","Nebraska"],
  ["NV","Nevada"],["NH","New Hampshire"],["NJ","New Jersey"],["NM","New Mexico"],["NY","New York"],["NC","North Carolina"],
  ["ND","North Dakota"],["OH","Ohio"],["OK","Oklahoma"],["OR","Oregon"],["PA","Pennsylvania"],["RI","Rhode Island"],
  ["SC","South Carolina"],["SD","South Dakota"],["TN","Tennessee"],["TX","Texas"],["UT","Utah"],["VT","Vermont"],["VA","Virginia"],
  ["WA","Washington"],["WV","West Virginia"],["WI","Wisconsin"],["WY","Wyoming"],
  ["PR","Puerto Rico"],["GU","Guam"],["VI","U.S. Virgin Islands"],["AS","American Samoa"],["MP","Northern Mariana Islands"],
  ["AA","Armed Forces Americas"],["AE","Armed Forces Europe"],["AP","Armed Forces Pacific"]
];
const STATE_CODES = new Set(US_STATES.map(s => s[0]));
const clean = v => String(v || "").trim().replace(/\s+/g, " ");

// Quick checks before looking anything up. Returns a message, or "" if it looks fine.
export function checkAddress(a){
  if (!clean(a.fullName)) return "Add the full name to put on the package.";
  if (a.intl) return clean(a.intl).length < 10 ? "Add the full mailing address, including the country." : "";
  if (!clean(a.line1)) return "Add the street address.";
  if (!/\d/.test(a.line1)) return "The street address usually starts with a house or building number, like 12 Elm St.";
  if (!clean(a.city)) return "Add the city.";
  if (!STATE_CODES.has(a.state)) return "Choose the state.";
  if (!/^\d{5}(-?\d{4})?$/.test(clean(a.zip))) return "The ZIP code should be 5 digits, like 02139 (or ZIP+4, like 02139-4307).";
  return "";
}

// "4600 SILVER HILL RD" -> "4600 Silver Hill Rd" (keeps N, SW, PO and similar in capitals)
const KEEP_UPPER = new Set(["N","S","E","W","NE","NW","SE","SW","PO","US","FM","CR","SR","RR","APO","FPO","DPO"]);
export function mailCase(s){
  return clean(s).toLowerCase().split(" ").map(w => {
    const up = w.toUpperCase();
    if (KEEP_UPPER.has(up)) return up;
    if (/^\d+(st|nd|rd|th)$/.test(w)) return w;          // 1st, 22nd
    if (/^\d/.test(w)) return up;                          // 12B
    return w.replace(/(^|[-'])([a-z])/g, (m, p, c) => p + c.toUpperCase());
  }).join(" ");
}

// Compare two addresses ignoring capitals, punctuation and common abbreviations.
const ABBR = { STREET:"ST", AVENUE:"AVE", AV:"AVE", ROAD:"RD", DRIVE:"DR", LANE:"LN", COURT:"CT", BOULEVARD:"BLVD", PLACE:"PL",
  TERRACE:"TER", CIRCLE:"CIR", PARKWAY:"PKWY", HIGHWAY:"HWY", SQUARE:"SQ", TRAIL:"TRL", WAY:"WAY", NORTH:"N", SOUTH:"S", EAST:"E",
  WEST:"W", NORTHEAST:"NE", NORTHWEST:"NW", SOUTHEAST:"SE", SOUTHWEST:"SW", MOUNT:"MT", SAINT:"ST", FORT:"FT" };
const norm = s => clean(s).toUpperCase().replace(/[.,#]/g, " ").split(/\s+/).filter(Boolean).map(w => ABBR[w] || w).join(" ");
export function sameAddress(a, b){
  return norm(a.line1) === norm(b.line1) && norm(a.city) === norm(b.city) && a.state === b.state && clean(a.zip).slice(0, 5) === clean(b.zip).slice(0, 5);
}
export function exactlySame(a, b){
  return clean(a.line1) === clean(b.line1) && clean(a.city) === clean(b.city) && a.state === b.state && clean(a.zip).slice(0, 5) === clean(b.zip).slice(0, 5);
}

// Turn one Census match into a suggested address.
export function fromCensusMatch(m){
  const parts = String(m.matchedAddress || "").split(",").map(s => s.trim());
  const c = m.addressComponents || {};
  const street = parts[0] || "", city = parts[1] || c.city || "", state = (parts[2] || c.state || "").toUpperCase(), zip = parts[3] || c.zip || "";
  return { line1: mailCase(street), city: mailCase(city), state, zip };
}

// Look up a US address. Resolves { status: "match", suggestions: [...] } | { status: "nomatch" } | { status: "error" }.
let seq = 0;
export function lookupUS(a, timeoutMs = 9000){
  return new Promise(resolve => {
    const cb = "__censusCb" + (++seq) + "_" + Date.now();
    const s = document.createElement("script");
    let finished = false;
    const done = r => { if (finished) return; finished = true; clearTimeout(t); try { delete window[cb]; } catch (e) { window[cb] = undefined; } s.remove(); resolve(r); };
    const t = setTimeout(() => done({ status: "error" }), timeoutMs);
    window[cb] = data => {
      try {
        const matches = (data && data.result && data.result.addressMatches) || [];
        if (!matches.length) return done({ status: "nomatch" });
        const seen = new Set(), suggestions = [];
        matches.forEach(m => { const sug = fromCensusMatch(m); const k = norm(sug.line1) + "|" + sug.zip; if (!seen.has(k) && suggestions.length < 3) { seen.add(k); suggestions.push(sug); } });
        done({ status: "match", suggestions });
      } catch (e) { done({ status: "error" }); }
    };
    s.onerror = () => done({ status: "error" });
    const q = new URLSearchParams({ street: clean(a.line1), city: clean(a.city), state: a.state, zip: clean(a.zip).slice(0, 5), benchmark: "Public_AR_Current", format: "jsonp", callback: cb });
    s.src = "https://geocoding.geo.census.gov/geocoder/locations/address?" + q.toString();
    document.head.append(s);
  });
}

// The lines to write on a package.
export function labelLines(a){
  if (!a) return [];
  const name = clean(a.fullName) + (a.careOf ? "\nc/o " + clean(a.careOf) : "");
  if (a.intl) return [name, ...String(a.intl).split("\n").map(clean)].join("\n").split("\n").filter(Boolean);
  const zip = clean(a.zip).replace(/^(\d{5})(\d{4})$/, "$1-$2");
  return [name, clean(a.line1), clean(a.line2), clean(a.city) + ", " + a.state + " " + zip].join("\n").split("\n").filter(Boolean);
}
export const oneLine = a => labelLines(a).slice(a && a.careOf ? 2 : 1).join(", ");
