// The draw. Pure functions, no database, so they can be tested on their own.
//
// adults: [{ id, volunteer }]   kids: [{ id, parent }]   excl: [[adultId, adultId], ...]
// Every adult gives one gift to another adult and receives one.
// Every kid receives one gift from an extra adult who isn't their parent
// and isn't linked to their parent by an exclusion rule. Volunteers go first,
// and nobody gets a second kid unless there's no other way.

function rand(n){ return crypto.getRandomValues(new Uint32Array(1))[0] % n; }
function shuffle(a){ a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = rand(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; }

export function drawAdults(ids, excl){
  const bad = new Set(excl.flatMap(([a, b]) => [a + "|" + b, b + "|" + a]));
  for (let t = 0; t < 5000; t++) {
    const p = shuffle(ids);
    if (ids.every((n, i) => p[i] !== n && !bad.has(n + "|" + p[i]))) return Object.fromEntries(ids.map((n, i) => [n, p[i]]));
  }
  return null;
}

export function assignKids(adults, kids, excl){
  if (!kids.length) return {};
  const linked = new Set(excl.flatMap(([a, b]) => [a + "|" + b, b + "|" + a]));
  const canGive = (adult, kid) => adult !== kid.parent && !linked.has(adult + "|" + kid.parent);
  for (const maxPer of [1, 2, 3]) {
    for (let t = 0; t < 3000; t++) {
      const load = Object.fromEntries(adults.map(a => [a.id, 0]));
      const out = {};
      let ok = true;
      // Kids with the fewest possible givers are placed first.
      const order = shuffle(kids).sort((x, y) => adults.filter(a => canGive(a.id, x)).length - adults.filter(a => canGive(a.id, y)).length);
      for (const kid of order) {
        const options = adults.filter(a => canGive(a.id, kid) && load[a.id] < maxPer);
        if (!options.length) { ok = false; break; }
        // Best tier: fewest kids so far, then volunteers.
        const score = a => load[a.id] * 2 + (a.volunteer ? 0 : 1);
        const best = Math.min(...options.map(score));
        const tier = options.filter(a => score(a) === best);
        const pick = tier[rand(tier.length)];
        load[pick.id]++;
        (out[pick.id] = out[pick.id] || []).push(kid.id);
      }
      if (ok) return out;
    }
  }
  return null;
}

export function drawAll(adults, kids, excl){
  if (adults.length < 3) return { error: "You need at least 3 adults to draw names." };
  const adultPairs = drawAdults(adults.map(a => a.id), excl);
  if (!adultPairs) return { error: "There's no way to match the adults with these rules. Remove a rule or wait for more people to join." };
  const kidGivers = assignKids(adults, kids, excl);
  if (!kidGivers) return { error: "There aren't enough adults outside each kid's household to buy for every kid. Remove a rule or invite more adults." };
  return { adultPairs, kidGivers };
}
