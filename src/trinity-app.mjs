import { SAVE_KEY, STEPS, CAST, INCIDENT, ENDINGS, freshState, parseSave, serializeState, nextStep, isReady, act, finish, speak } from './trinity-story.mjs';
const $ = id => document.getElementById(id);
let persistent = true;
let state = read();
let current = { title: 'This wall has two addresses.', story: 'The crew arrives at StarChucks on Walbash Avenue. Behind the unfinished drywall, someone is knocking from a room that the blueprints insist does not exist.', byline: 'MANDATORY SITE INSPECTION' };
function read() { try { return parseSave(localStorage.getItem(SAVE_KEY)); } catch { persistent = false; return freshState(); } }
function save() { try { localStorage.setItem(SAVE_KEY, serializeState(state)); persistent = true; } catch { persistent = false; } }
function lineItem(text, className = '') { const li = document.createElement('li'); li.textContent = text; li.className = className; return li; }
function render() {
  const count = state.steps.length;
  $('count').textContent = count + ' / 4';
  $('meter').setAttribute('aria-valuenow', String(count));
  $('fill').style.width = (count * 25) + '%';
  const complete = Boolean(state.ending);
  $('status').textContent = complete ? 'CLOSED' : isReady(state) ? 'DECISION REQUIRED' : 'IN PROGRESS';
  $('stage-status').textContent = complete ? 'CONTRACT FILED / REALITY PENDING' : isReady(state) ? 'SEAM STABILIZED' : 'INSPECTION ' + count + '/4';
  $('case-title').textContent = current.title;
  $('byline').textContent = current.byline;
  $('narrative').textContent = current.story;
  const step = nextStep(state);
  $('task-list').replaceChildren(...STEPS.map((id, i) => lineItem((i + 1) + '. ' + INCIDENT[id].title, state.steps.includes(id) ? 'done' : id === step ? 'current' : '')));
  for (const b of document.querySelectorAll('[data-act]')) b.disabled = complete || b.dataset.act !== step;
  $('actions').hidden = complete;
  $('decision').hidden = !isReady(state);
  $('completed').hidden = !complete;
  if (complete) { $('ending-title').textContent = ENDINGS[state.ending].title; $('ending-text').textContent = ENDINGS[state.ending].text; }
  const logs = state.steps.map(id => lineItem(INCIDENT[id].log));
  if (complete) logs.push(lineItem(ENDINGS[state.ending].log));
  if (!logs.length) logs.push(lineItem('No work has been logged yet.'));
  $('ledger-list').replaceChildren(...logs);
  $('save-status').textContent = persistent ? 'LOCAL RECORD · SAVED IN THIS BROWSER' : 'LOCAL RECORD · SESSION ONLY (STORAGE UNAVAILABLE)';
}
for (const b of document.querySelectorAll('[data-act]')) b.addEventListener('click', () => {
  const result = act(state, b.dataset.act);
  if (!result.changed) return;
  state = result.state; current = { title: result.scene.title, story: result.scene.story, byline: result.scene.actor.toUpperCase() + ' · FIELD REPORT' };
  save(); render();
});
for (const b of document.querySelectorAll('[data-talk]')) b.addEventListener('click', () => {
  const id = b.dataset.talk; const character = speak(id);
  if (!character) return;
  current = { title: character.name + ': ' + character.title, story: character.line + ' ' + character.description, byline: character.role.toUpperCase() + ' · CREW INTERVIEW' };
  render();
});
for (const b of document.querySelectorAll('[data-ending]')) b.addEventListener('click', () => {
  const result = finish(state, b.dataset.ending);
  if (!result.changed) return;
  state = result.state; current = { title: result.scene.title, story: result.scene.text, byline: 'CASE CLOSED · CONSEQUENCES REMAIN' }; save(); render();
});
$('reset').addEventListener('click', () => {
  if (!window.confirm('Start a new Walbash work order? Only this side episode save will be reset.')) return;
  state = freshState(); current = { title: 'This wall has two addresses.', story: 'The crew arrives at StarChucks on Walbash Avenue. Behind the unfinished drywall, someone is knocking from a room that the blueprints insist does not exist.', byline: 'MANDATORY SITE INSPECTION' }; save(); render();
});
document.addEventListener('keydown', ev => {
  if (ev.ctrlKey || ev.metaKey || ev.altKey || ev.repeat || ev.target?.matches?.('input,textarea,select,[contenteditable]')) return;
  const index = Number(ev.key) - 1;
  if (!Number.isInteger(index) || index < 0 || index > 3) return;
  const b = document.querySelector('[data-act="' + STEPS[index] + '"]');
  if (b && !b.disabled) b.click();
});
if (state.ending) current = { title: ENDINGS[state.ending].title, story: ENDINGS[state.ending].text, byline: 'CASE CLOSED · CONSEQUENCES REMAIN' };
else if (state.steps.length) { const item = INCIDENT[state.steps.at(-1)]; current = { title: item.title, story: item.story, byline: item.actor.toUpperCase() + ' · FIELD REPORT' }; }
render();
