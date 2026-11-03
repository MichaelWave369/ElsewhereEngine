// An original, independent companion episode in the Elsewhere universe.
// Deliberately does not read or write Race to Oblivion or TweedleVerse saves.
export const SAVE_KEY = 'elsewhere-engine.walbash.v1';
export const VERSION = 1;
export const STEPS = Object.freeze(['permit', 'tunnel', 'brace', 'balance']);
export const CAST = Object.freeze({
  larry: Object.freeze({ name: 'Larry', role: 'Structural repair', title: 'The Builder', description: 'Larry can fix a wall between universes, but he cannot tell you whether it ought to exist.', line: 'There is a right wrench for every impossible situation. Somebody borrowed mine.' }),
  tweedsie: Object.freeze({ name: 'Tweedsie', role: 'Tunnel scouting', title: 'The Explorer', description: 'The curious burrower finds shortcuts without knowing whether shortcuts are safe.', line: '*Two quick squeaks. One suspiciously confident head tilt.*' }),
  mavis: Object.freeze({ name: 'Mavis Plumb', role: 'Boundary equilibrium', title: 'The Equalizer', description: 'A retired inspector and practitioner of measured magic. She can balance a boundary, but not without cost.', line: 'Some walls divide us. Others are the only things keeping us together.' })
});
export const INCIDENT = Object.freeze({
  permit: Object.freeze({ actor: 'The team', title: 'Read the construction order', log: 'The permit is for StarChucks, 108 Walbash Avenue. The new mycelium macro-mesh drywall is supposed to stop unauthorized overlap with other realms.', story: 'Larry squints at the permit. “They ordered the cheap mesh. That stuff has a habit of remembering the wrong room.” Mavis circles a discrepancy: TWO INTERIOR DIMENSIONS CLAIMED.' }),
  tunnel: Object.freeze({ actor: 'Tweedsie', title: 'Investigate the hollow wall', log: 'Tweedsie found two different foundation plans occupying the same space. An older doorway is trapped between them.', story: 'Tweedsie slips under the floor. Three knocks answer from the other side of the drywall. He returns with a brass washer stamped 108 and a map neither universe admits printing.' }),
  brace: Object.freeze({ actor: 'Larry', title: 'Brace the split', log: 'Larry installed a temporary frame and prevented both realities from collapsing into the coffee counter.', story: 'Larry wedges the frame into place. “There. That oughta hold until Tuesday.” The room stops bending. The espresso machine continues making a sound like a distant ocean.' }),
  balance: Object.freeze({ actor: 'Mavis', title: 'Set the equilibrium', log: 'Mavis stabilized the boundary using her level, anchored by the brass washer. The working cost her the memory of her route home.', story: 'The bubble in Mavis’s old carpenter’s level divides into two, then settles. She grips the brass washer and murmurs a promise she cannot take back. The seam steadies. She looks down Walbash Avenue and can no longer recall which direction leads home.' })
});
export const ENDINGS = Object.freeze({
  seal: Object.freeze({ title: 'The Quiet Repair', text: 'The seam closes. StarChucks receives an ordinary wall and a very unusual invoice. You promise to guide Mavis home. Beneath the fresh plaster, something knocks exactly three times.', log: 'The Walbash boundary was sealed, with a persistent personal cost to Mavis.' }),
  passage: Object.freeze({ title: 'The Unlicensed Passage', text: 'You preserve a narrow, stable doorway behind a removable panel. It is not public, safe for travel, or linked to any other game yet. Mavis demands a watch schedule; Larry demands overtime. Tweedsie is already investigating the other side.', log: 'The Walbash boundary remains as a monitored passage, not a working cross-game portal.' })
});

export function freshState() { return { version: VERSION, steps: [], ending: null }; }
export function normalizeState(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw) || raw.version !== VERSION || !Array.isArray(raw.steps)) return freshState();
  const steps = raw.steps;
  if (steps.length > STEPS.length || !steps.every((s, i) => s === STEPS[i])) return freshState();
  const ending = steps.length === STEPS.length && Object.prototype.hasOwnProperty.call(ENDINGS, raw.ending) ? raw.ending : null;
  return { version: VERSION, steps: [...steps], ending };
}
export function parseSave(json) {
  if (typeof json !== 'string' || json.length > 4096) return freshState();
  try { return normalizeState(JSON.parse(json)); } catch { return freshState(); }
}
export function serializeState(state) { return JSON.stringify(normalizeState(state)); }
export function nextStep(state) { return STEPS[normalizeState(state).steps.length] || null; }
export function isReady(state) { const s = normalizeState(state); return s.steps.length === STEPS.length && s.ending === null; }
export function act(state, step) {
  const s = normalizeState(state);
  if (s.ending || !Object.prototype.hasOwnProperty.call(INCIDENT, step) || nextStep(s) !== step) return { state: s, changed: false };
  return { state: { ...s, steps: [...s.steps, step] }, changed: true, scene: INCIDENT[step] };
}
export function finish(state, ending) {
  const s = normalizeState(state);
  if (!isReady(s) || !Object.prototype.hasOwnProperty.call(ENDINGS, ending)) return { state: s, changed: false };
  return { state: { ...s, ending }, changed: true, scene: ENDINGS[ending] };
}
export function speak(id) { return Object.prototype.hasOwnProperty.call(CAST, id) ? CAST[id] : null; }
