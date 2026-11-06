import test from 'node:test';
import assert from 'node:assert/strict';
import {SAVE_KEY,VERSION,CONTROLS,STAGES,freshState,normalizeState,parseSave,serializeState,stageOf,progressOf,act} from '../src/impossible-story.mjs';
const doActions=(actions,start=freshState())=>actions.reduce((state,action)=>act(state,action).state,start);
const intoDream=()=>doActions(['climb','profile','cross']);
const intoPrism=()=>doActions(['shadow','seed','soften','plant'],intoDream());
const intoSynthesis=()=>doActions(['front','profile','inside','assemble'],intoPrism());
test('fresh journey is isolated, versioned and at the stair',()=>{
  assert.match(SAVE_KEY,/first-stair/);assert.equal(freshState().version,VERSION);
  assert.equal(stageOf(freshState()),'stair');assert.equal(progressOf(freshState()),0);
  assert.deepEqual(STAGES,['stair','dream','prism','synthesis']);
});
test('cannot cross the stair until a witnessed loop and profile view',()=>{
  assert.equal(stageOf(act(freshState(),'cross').state),'stair');
  assert.equal(stageOf(doActions(['profile','cross'])),'stair');
  assert.equal(stageOf(doActions(['climb','cross'])),'stair');
  assert.equal(stageOf(intoDream()),'dream');
});
test('dream requires seed, shadow and softened clock',()=>{
  assert.equal(stageOf(doActions(['shadow','seed','plant'],intoDream())),'dream');
  assert.equal(stageOf(doActions(['soften','plant'],intoDream())),'dream');
  assert.equal(stageOf(intoPrism()),'prism');
});
test('portrait requires all three viewpoints',()=>{
  assert.equal(stageOf(doActions(['front','inside','assemble'],intoPrism())),'prism');
  assert.equal(stageOf(intoSynthesis()),'synthesis');
});
test('both synthesis outcomes require three bound laws and are distinct',()=>{
  const s=intoSynthesis();
  assert.equal(act(s,'preserve').changed,false);
  const ready=doActions(['gravity','time','perspective'],s);
  const a=act(ready,'preserve'),b=act(ready,'release');
  assert.equal(a.state.ending,'preserve');assert.equal(b.state.ending,'release');
  assert.notEqual(a.message,b.message);assert.equal(progressOf(a.state),4);
  assert.equal(act(a.state,'release').changed,false);
});
test('save roundtrip preserves progression without touching other episodes',()=>{
  const s=doActions(['gravity','time','perspective','release'],intoSynthesis());
  assert.deepEqual(parseSave(serializeState(s)),s);
  assert.notEqual(SAVE_KEY,'elsewhere-engine.arrival.v1');
  assert.notEqual(SAVE_KEY,'elsewhere-engine.walbash.v1');
});
test('invalid payload, oversized saves and impossible progress reset safely',()=>{
  assert.deepEqual(parseSave('nope'),freshState());
  assert.deepEqual(parseSave('x'.repeat(10001)),freshState());
  assert.deepEqual(normalizeState({version:92}),freshState());
  assert.equal(stageOf(normalizeState({version:VERSION,stair:{crossed:true,loops:0,view:'front'},dream:{planted:true},prism:{assembled:true},ending:'release'})),'stair');
});
test('controls are valid per stage and repeated observations are idempotent',()=>{
  for(const stage of STAGES)assert.ok(CONTROLS[stage].length>=4);
  assert.equal(act(freshState(),'release').changed,false);
  const s=act(intoDream(),'seed').state;
  assert.equal(act(s,'seed').changed,false);
  assert.equal(s.dream.seen.length,1);
});
