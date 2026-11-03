/** Pure rules for the first Elsewhere Engine episode. No browser or network APIs. */
export const SAVE_KEY = 'elsewhere-engine.arrival.v1';
export const SCHEMA_VERSION = 1;
export const EVIDENCE = Object.freeze(['desk', 'directory', 'tube']);
export const HOTSPOT_ORDER = Object.freeze(['directory', 'clock', 'desk', 'tube', 'elevator']);
export const CHOICES = Object.freeze(['follow', 'report']);

export const OBSERVATIONS = Object.freeze({
  directory: Object.freeze({ title: 'The directory is missing a floor.', overline: 'EVIDENCE 02 · BUILDING DIRECTORY', text: 'Each floor has a department, a manager, and an evacuation route. Floor 13 has none. Its only listed occupant is “YOUR NAME, PENDING.”', record: 'Floor 13 appears nowhere on the public directory. The occupant field is an unresolved placeholder.' }),
  clock: Object.freeze({ title: 'The clock is watching you.', overline: 'OPTIONAL OBSERVATION · TIMEKEEPING', text: 'The hands move backward whenever you look away. When you stare directly at the face, they stop. A note beneath it reads: “Do not synchronize with outside time.”', record: 'A wall clock seems to reverse while unobserved. Its cause is unknown.' }),
  desk: Object.freeze({ title: 'You are not on the list.', overline: 'EVIDENCE 01 · ARRIVAL REGISTRY', text: 'The receptionist types your details, frowns, and turns the screen around. Your name is already there, under DEPARTURES. The departure time is tomorrow.', record: 'The registry includes a future departure but no arrival. The receptionist insists this is “an administrative matter.”' }),
  tube: Object.freeze({ title: 'No one has opened the dispatch.', overline: 'EVIDENCE 03 · PNEUMATIC DISPATCH', text: 'A brass cylinder rolls from the tube. The oldest label is forty thousand years overdue. Inside, a single sentence is repeated across hundreds of reports: “THE DOOR KNOCKS FROM BOTH SIDES.”', record: 'Undelivered dispatches repeat the same warning. The destination column reads “RETURN TO SENDER,” but the sender is blank.' }),
  elevator: Object.freeze({ title: 'Elevator 13 does not take passengers.', overline: 'RESTRICTED ACCESS · ELEVATOR 13', text: 'Three knocks arrive from behind a seamless metal door. Its indicator reads neither up nor down, only “ELSEWHERE.”', record: 'Elevator 13 is absent from the official directory. A sound comes from behind its locked doors.' })
});

export const ENDINGS = Object.freeze({
  follow: Object.freeze({ title: 'THE THIRTEENTH FLOOR', text: 'You step toward the sound. The doors open inward, revealing a hallway much older than the building. At its end, someone knocks from your side of the door.', journal: 'You chose to follow the knocking. The Department recorded no departure.' }),
  report: Object.freeze({ title: 'THE UNFILED FILE', text: 'You submit your report. The terminal prints a receipt dated forty thousand years ago. Beneath your signature, someone has already written: “THANK YOU FOR NOT OPENING IT.”', journal: 'You chose to file the anomaly report. The Department assigned it a case number that predates the building.' })
});

export function freshState() { return { version: SCHEMA_VERSION, visited: [], evidence: [], decision: null }; }
const includes = (list, item) => list.includes(item);
const uniqueAllowed = (value, allowed) => Array.isArray(value) ? [...new Set(value.filter(x => typeof x === 'string' && includes(allowed, x)))].slice(0, allowed.length) : [];

export function normalizeState(input) {
  if (!input || typeof input !== 'object' || input.version !== SCHEMA_VERSION) return freshState();
  const visited = uniqueAllowed(input.visited, HOTSPOT_ORDER);
  // Evidence must correspond to something that was actually inspected.
  const evidence = uniqueAllowed(input.evidence, EVIDENCE).filter(id => visited.includes(id));
  const ready = EVIDENCE.every(id => evidence.includes(id));
  const decision = ready && CHOICES.includes(input.decision) ? input.decision : null;
  return { version: SCHEMA_VERSION, visited, evidence, decision };
}

export function parseSave(raw) {
  if (typeof raw !== 'string' || raw.length > 10000) return freshState();
  try { return normalizeState(JSON.parse(raw)); } catch { return freshState(); }
}
export function serializeState(state) { return JSON.stringify(normalizeState(state)); }
export function isReady(state) { return EVIDENCE.every(id => state.evidence.includes(id)); }
export function evidenceCount(state) { return EVIDENCE.filter(id => state.evidence.includes(id)).length; }

export function inspect(state, id) {
  const current = normalizeState(state);
  if (!HOTSPOT_ORDER.includes(id)) return { state: current, entry: null, changed: false };
  const wasVisited = current.visited.includes(id);
  const visited = wasVisited ? current.visited : [...current.visited, id];
  const hasEvidence = EVIDENCE.includes(id) && !current.evidence.includes(id);
  const evidence = hasEvidence ? [...current.evidence, id] : current.evidence;
  const next = normalizeState({ ...current, visited, evidence });
  if (id === 'elevator' && !isReady(next)) {
    const missing = 3 - evidenceCount(next);
    return { state: next, changed: !wasVisited, entry: { title: 'Access denied. Again.', overline: 'ELEVATOR 13 · SEALED', text: `The doors remain closed. A mechanical voice requests ${missing} more verified ${missing === 1 ? 'record' : 'records'}. Something knocks three times from the other side.` } };
  }
  if (id === 'elevator' && next.decision) {
    return { state: next, changed: !wasVisited, entry: { ...ENDINGS[next.decision], overline: 'CASE ALREADY CLOSED' } };
  }
  return { state: next, changed: !wasVisited || hasEvidence, entry: OBSERVATIONS[id] };
}

export function choose(state, choice) {
  const current = normalizeState(state);
  if (!isReady(current) || !CHOICES.includes(choice) || current.decision !== null) return { state: current, changed: false };
  return { state: { ...current, decision: choice }, changed: true, ending: ENDINGS[choice] };
}
