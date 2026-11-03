import test from 'node:test';
import assert from 'node:assert/strict';
import { SAVE_KEY, VERSION, STEPS, CAST, INCIDENT, ENDINGS, freshState, normalizeState, parseSave, serializeState, nextStep, isReady, act, finish, speak } from '../src/trinity-story.mjs';
const fullRun = () => STEPS.reduce((s, step) => act(s, step).state, freshState());
test('side story uses a distinct, versioned save key', () => {
  assert.equal(SAVE_KEY, 'elsewhere-engine.walbash.v1');
  assert.notEqual(SAVE_KEY, 'elsewhere-engine.arrival.v1');
  assert.equal(VERSION, 1);
});
test('three original party roles have unique specialties', () => {
  assert.deepEqual(Object.keys(CAST), ['larry', 'tweedsie', 'mavis']);
  assert.equal(new Set(Object.values(CAST).map(c => c.role)).size, 3);
  assert.ok(speak('mavis').line);
  assert.equal(speak('__proto__'), null);
});
test('fresh case begins at permit and locks endings', () => {
  const s = freshState();
  assert.deepEqual(s.steps, []);
  assert.equal(nextStep(s), 'permit');
  assert.equal(isReady(s), false);
  assert.equal(finish(s, 'seal').changed, false);
});
test('out-of-order work is rejected without changing state', () => {
  const s = freshState();
  assert.deepEqual(act(s, 'balance').state, s);
  assert.equal(act(s, 'balance').changed, false);
  assert.equal(act(s, 'bogus').changed, false);
});
test('four successive actions complete the investigation', () => {
  const s = fullRun();
  assert.deepEqual(s.steps, STEPS);
  assert.equal(isReady(s), true);
  assert.equal(nextStep(s), null);
  assert.equal(Object.keys(INCIDENT).length, 4);
});
test('duplicate action does not grant extra progress', () => {
  const s = act(freshState(), 'permit').state;
  assert.equal(act(s, 'permit').changed, false);
  assert.deepEqual(act(s, 'permit').state, s);
});
test('two endings are different and final', () => {
  const s = fullRun();
  const a = finish(s, 'seal');
  const b = finish(s, 'passage');
  assert.equal(a.changed, true);
  assert.equal(b.changed, true);
  assert.notEqual(a.scene.title, b.scene.title);
  assert.equal(finish(a.state, 'passage').changed, false);
  assert.equal(act(a.state, 'permit').changed, false);
});
test('old or corrupted saves are safely reset', () => {
  assert.deepEqual(parseSave(null), freshState());
  assert.deepEqual(parseSave('{broken'), freshState());
  assert.deepEqual(parseSave('x'.repeat(4097)), freshState());
  assert.deepEqual(parseSave('{"version":2,"steps":["permit"]}'), freshState());
});
test('forged and out-of-order progress is not accepted', () => {
  assert.deepEqual(normalizeState({ version: 1, steps: ['balance'], ending: null }), freshState());
  assert.deepEqual(normalizeState({ version: 1, steps: ['permit', 'permit'], ending: null }), freshState());
  assert.deepEqual(normalizeState({ version: 1, steps: STEPS.concat('hack'), ending: 'seal' }), freshState());
});
test('premature or unauthorized endings are ignored', () => {
  const partial = { version: 1, steps: ['permit'], ending: 'seal' };
  assert.equal(normalizeState(partial).ending, null);
  assert.equal(finish(fullRun(), '__proto__').changed, false);
});
test('progress persists through serializing and parsing', () => {
  const s = finish(fullRun(), 'passage').state;
  assert.deepEqual(parseSave(serializeState(s)), s);
  assert.ok(ENDINGS.passage.text.includes('not'));
});
test('cost of magic is recorded, never free or consequence-free', () => {
  assert.match(INCIDENT.balance.log, /cost her the memory/);
  assert.match(ENDINGS.seal.text, /Mavis/);
});
