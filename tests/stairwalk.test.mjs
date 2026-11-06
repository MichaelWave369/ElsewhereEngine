import test from 'node:test';
import assert from 'node:assert/strict';
import {SAVE_KEY,VERSION,EXIT_MIN_Z,EXIT_MAX_Z,freshState,eyeHeight,advance,serializeCheckpoint,parseCheckpoint} from '../src/stairwalk-engine.mjs';
const run=(state,input,steps)=>{let result={state};for(let i=0;i<steps;i++)result=advance(result.state,input,.1);return result;};
test('annex starts on the landing in a separate local save namespace',()=>{
  const state=freshState();
  assert.equal(state.z,7.1);assert.equal(state.loops,0);assert.equal(state.escaped,false);
  assert.notEqual(SAVE_KEY,'elsewhere-engine.first-stair.v1');
  assert.equal(VERSION,1);
});
test('W-style forward movement can climb the stairs and re-enter the initial landing',()=>{
  let s=freshState(),seen=false;
  for(let i=0;i<70;i++){const result=advance(s,{forward:1},.1);s=result.state;if(result.event==='loop'){seen=true;break;}}
  assert.equal(seen,true);assert.equal(s.loops,1);assert.equal(s.z,7.1);assert.equal(s.x,0);
});
test('the exit is blocked before a loop, but opens afterward',()=>{
  let s=run(freshState(),{forward:1},8).state;
  assert.ok(s.z>=EXIT_MIN_Z&&s.z<=EXIT_MAX_Z);
  const locked=run(s,{strafe:1},12).state;
  assert.equal(locked.escaped,false);assert.ok(locked.x<=1.8);
  let after=freshState();
  for(let i=0;i<70;i++){const r=advance(after,{forward:1},.1);after=r.state;if(r.event==='loop')break;}
  after=run(after,{forward:1},8).state;
  const escaped=run(after,{strafe:1},10).state;
  assert.equal(escaped.escaped,true);assert.equal(escaped.loops,1);
});
test('movement and turn clamp malformed input, diagonal speed and giant frame deltas',()=>{
  const a=advance(freshState(),{forward:1,strafe:1,turn:500},500).state;
  const b=advance(freshState(),{forward:1,strafe:1,turn:1},.16).state;
  assert.deepEqual(a,b);
  assert.ok(Math.hypot(a.x,a.z-7.1)<=3.4*.16+1e-8);
  assert.deepEqual(advance(freshState(),{forward:NaN,turn:Infinity},NaN).state,freshState());
});
test('eye height rises on staircase and restores at landing',()=>{
  assert.ok(eyeHeight({z:-5})>eyeHeight(freshState()));
  assert.equal(eyeHeight(freshState()),1.55);
});
test('checkpoints preserve earned portal access but not movement or another story save',()=>{
  let s=freshState();for(let i=0;i<70;i++){const r=advance(s,{forward:1},.1);s=r.state;if(r.event==='loop')break;}
  const saved=parseCheckpoint(serializeCheckpoint(s));
  assert.equal(saved.loops,1);assert.equal(saved.z,7.1);assert.equal(saved.escaped,false);
  assert.equal(parseCheckpoint('garbage').loops,0);
  assert.equal(parseCheckpoint('x'.repeat(1025)).loops,0);
  assert.equal(parseCheckpoint(JSON.stringify({version:VERSION,loops:0,escaped:true})).escaped,false);
  assert.equal(parseCheckpoint(JSON.stringify({version:VERSION,loops:Infinity,escaped:true})).escaped,false);
});
test('escape is terminal until reset',()=>{
  let s={...freshState(),z:4.6,x:2.55,loops:1};
  const escaped=advance(s,{strafe:1},.1);
  assert.equal(escaped.event,'escape');
  assert.deepEqual(advance(escaped.state,{forward:1},.1).state,escaped.state);
});
