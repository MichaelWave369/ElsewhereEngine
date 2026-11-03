import { SAVE_KEY, EVIDENCE, HOTSPOT_ORDER, OBSERVATIONS, ENDINGS, freshState, parseSave, serializeState, isReady, evidenceCount, inspect, choose } from './engine.mjs';

const $ = id => document.getElementById(id);
const buttons = [...document.querySelectorAll('[data-hotspot]')];
const journal = $('journal');
const journalToggle = $('journal-toggle');
let persistent = true;
let state = readSave();
let current = { overline: 'WELCOME, UNLISTED VISITOR', title: 'The doors have opened.', text: 'A receptionist stares at an empty registration screen. The clock counts backward. Somewhere nearby, an old machine makes three dull knocks.' };

function readSave() {
  try { return parseSave(localStorage.getItem(SAVE_KEY)); }
  catch { persistent = false; return freshState(); }
}
function save() {
  try { localStorage.setItem(SAVE_KEY, serializeState(state)); persistent = true; }
  catch { persistent = false; }
}
function makeEntry(id) {
  const li = document.createElement('li');
  const heading = document.createElement('strong');
  heading.textContent = id === 'elevator' ? 'Elevator 13' : OBSERVATIONS[id].title;
  const body = document.createElement('p');
  body.textContent = OBSERVATIONS[id].record;
  li.append(heading, body);
  return li;
}
function showJournal(open) {
  journal.hidden = !open;
  journalToggle.setAttribute('aria-expanded', String(open));
  if (open) $('journal-close').focus();
  else journalToggle.focus();
}
function render() {
  const count = evidenceCount(state);
  $('case-overline').textContent = current.overline;
  $('case-heading').textContent = current.title;
  $('case-text').textContent = current.text;
  $('evidence-count').textContent = `${count} / 3`;
  $('journal-count').textContent = `${count}/3`;
  $('evidence-fill').style.width = `${(count / 3) * 100}%`;
  $('evidence-meter').setAttribute('aria-valuenow', String(count));
  $('case-status').textContent = state.decision ? 'FILED' : isReady(state) ? 'ACTION REQUIRED' : 'UNFILED';
  $('scene-phase').textContent = state.decision ? 'CASE CLOSED / QUESTIONS OPEN' : isReady(state) ? 'ELEVATOR 13 RESPONDING' : 'ARRIVAL UNREGISTERED';
  $('elevator-art').classList.toggle('is-unlocked', isReady(state));
  for (const button of buttons) {
    const id = button.dataset.hotspot;
    button.classList.toggle('seen', state.visited.includes(id));
    button.classList.toggle('selected', current.id === id);
  }
  $('evidence-list').replaceChildren(...EVIDENCE.map(id => {
    const li = document.createElement('li');
    const label = document.createElement('span');
    label.textContent = ({ desk: 'Arrival registry', directory: 'Building directory', tube: 'Pneumatic dispatch' })[id];
    const status = document.createElement('span');
    const found = state.evidence.includes(id);
    status.textContent = found ? 'LOGGED ✓' : 'UNKNOWN';
    status.className = found ? 'found' : '';
    li.append(label, status);
    return li;
  }));
  $('decision-area').hidden = !isReady(state) || Boolean(state.decision);
  $('ending-area').hidden = !state.decision;
  if (state.decision) {
    $('ending-title').textContent = ENDINGS[state.decision].title;
    $('ending-text').textContent = ENDINGS[state.decision].text;
  }
  $('save-status').textContent = persistent ? 'LOCAL RECORD · SAVED IN THIS BROWSER' : 'LOCAL RECORD · STORAGE UNAVAILABLE / SESSION ONLY';
  const entries = state.visited.length ? state.visited.map(makeEntry) : [];
  if (state.decision) {
    const li = document.createElement('li');
    const h = document.createElement('strong'); h.textContent = 'Disposition: ' + ENDINGS[state.decision].title;
    const p = document.createElement('p'); p.textContent = ENDINGS[state.decision].journal;
    li.append(h, p); entries.push(li);
  }
  if (!entries.length) {
    const li = document.createElement('li'); li.textContent = 'No recorded observations yet.'; entries.push(li);
  }
  $('journal-entries').replaceChildren(...entries);
  $('journal-bottom').textContent = state.decision ? 'Your decision is recorded. The mystery is not finished.' : isReady(state) ? 'Three records verified. Choose a disposition in the case report.' : `${count} of 3 required records recovered.`;
}
function onInspect(id) {
  const next = inspect(state, id);
  if (!next.entry) return;
  state = next.state;
  current = { ...next.entry, id };
  if (next.changed) save();
  render();
}
for (const button of buttons) button.addEventListener('click', () => onInspect(button.dataset.hotspot));
for (const button of document.querySelectorAll('[data-choice]')) button.addEventListener('click', () => {
  const result = choose(state, button.dataset.choice);
  if (!result.changed) return;
  state = result.state;
  current = { ...result.ending, overline: 'AN UNAUTHORIZED CONCLUSION', id: 'elevator' };
  save(); render();
  $('case-heading').focus?.();
});
journalToggle.addEventListener('click', () => showJournal(journal.hidden));
$('journal-close').addEventListener('click', () => showJournal(false));
$('reset-button').addEventListener('click', () => {
  if (!window.confirm('Start a new arrival? This clears only Elsewhere Engine episode 001 progress in this browser.')) return;
  state = freshState();
  current = { overline: 'WELCOME, UNLISTED VISITOR', title: 'The doors have opened.', text: 'A receptionist stares at an empty registration screen. The clock counts backward. Somewhere nearby, an old machine makes three dull knocks.' };
  save(); render();
  if (!journal.hidden) showJournal(false);
});
document.addEventListener('keydown', event => {
  if (event.altKey || event.ctrlKey || event.metaKey || event.repeat || event.target?.matches('input, textarea, select, [contenteditable]')) return;
  if (event.key === 'Escape' && !journal.hidden) { showJournal(false); return; }
  if (!journal.hidden) return;
  const index = Number(event.key) - 1;
  if (Number.isInteger(index) && index >= 0 && index < HOTSPOT_ORDER.length) onInspect(HOTSPOT_ORDER[index]);
});
if (state.decision) current = { ...ENDINGS[state.decision], overline: 'ENTRY RECORDED', id: 'elevator' };
render();
