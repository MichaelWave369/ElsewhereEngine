import test from 'node:test';
import assert from 'node:assert/strict';
import { SCHEMA_VERSION, EVIDENCE, HOTSPOT_ORDER, freshState, parseSave, serializeState, inspect, choose, isReady, evidenceCount, normalizeState } from '../src/engine.mjs';

const collect = (ids = EVIDENCE) => ids.reduce((s, id) => inspect(s, id).state, freshState());

test('fresh state is valid, closed and empty', () => {
  const s = freshState();
  assert.equal(s.version, SCHEMA_VERSION);
  assert.equal(isReady(s), false);
  assert.equal(evidenceCount(s), 0);
  assert.equal(s.decision, null);
});
test('hotspots map to keyboard 1–5 in stable order', () => {
  assert.deepEqual(HOTSPOT_ORDER, ['directory', 'clock', 'desk', 'tube', 'elevator']);
});
test('inspecting a clue collects exactly one record even if repeated', () => {
  const first = inspect(freshState(), 'desk');
  const repeated = inspect(first.state, 'desk');
  assert.equal(first.changed, true);
  assert.equal(repeated.changed, false);
  assert.equal(repeated.state.evidence.length, 1);
});
test('optional clock and locked elevator cannot substitute for clues', () => {
  const s = inspect(inspect(freshState(), 'clock').state, 'elevator');
  assert.equal(evidenceCount(s.state), 0);
  assert.match(s.entry.text, /3 more verified records/);
  assert.equal(isReady(s.state), false);
});
test('all three independent clues unlock elevator', () => {
  const state = collect();
  assert.equal(evidenceCount(state), 3);
  assert.equal(isReady(state), true);
  assert.equal(inspect(state, 'elevator').entry.title, 'Elevator 13 does not take passengers.');
});
test('choice cannot occur before sufficient evidence', () => {
  const result = choose(inspect(freshState(), 'desk').state, 'follow');
  assert.equal(result.changed, false);
  assert.equal(result.state.decision, null);
});
test('a valid choice can be made once and cannot be overwritten', () => {
  const a = choose(collect(), 'follow');
  assert.equal(a.changed, true);
  assert.equal(a.state.decision, 'follow');
  const b = choose(a.state, 'report');
  assert.equal(b.changed, false);
  assert.equal(b.state.decision, 'follow');
});
test('second branch has a distinct conclusion', () => {
  const a = choose(collect(), 'follow').ending;
  const b = choose(collect(), 'report').ending;
  assert.notEqual(a.title, b.title);
});
test('save round trip preserves evidence and conclusion', () => {
  const s = choose(collect(), 'report').state;
  assert.deepEqual(parseSave(serializeState(s)), s);
});
test('corrupt, oversized, old-version and non-object saves reset safely', () => {
  assert.deepEqual(parseSave('not-json'), freshState());
  assert.deepEqual(parseSave('x'.repeat(10001)), freshState());
  assert.deepEqual(parseSave('{"version":99,"decision":"follow"}'), freshState());
  assert.deepEqual(parseSave('null'), freshState());
});
test('unknown evidence, duplicate entries, and forged ending are rejected', () => {
  const s = normalizeState({ version: SCHEMA_VERSION, visited: ['desk','desk','fake'], evidence: ['desk','desk','tube','hacked'], decision: 'follow' });
  assert.deepEqual(s.visited, ['desk']);
  assert.deepEqual(s.evidence, ['desk']);
  assert.equal(s.decision, null);
});
test('missing recorded visit prevents forged evidence and premature unlock', () => {
  const s = normalizeState({ version: SCHEMA_VERSION, visited: [], evidence: EVIDENCE, decision: 'follow' });
  assert.equal(isReady(s), false);
  assert.equal(s.decision, null);
});
test('invalid choice does not change an unlocked state', () => {
  const before = collect();
  assert.deepEqual(choose(before, 'hack').state, before);
});
