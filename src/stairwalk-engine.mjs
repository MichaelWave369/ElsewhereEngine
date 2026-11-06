/** The First Stair walkable WebGL lab: testable motion and portal rules; no DOM APIs. */
export const SAVE_KEY = 'elsewhere-engine.stairwalk.v1';
export const VERSION = 1;
const LIMIT = 99, START_Z = 7.1, SPEED = 3.4, TURN_SPEED = 2.0;
export const EXIT_MIN_Z = 3.7;
export const EXIT_MAX_Z = 5.8;
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const valid=n=>typeof n==='number'&&Number.isFinite(n);
export function freshState(){return {x:0,z:START_Z,yaw:0,loops:0,escaped:false};}
export function checkpoint(state){return {version:VERSION,loops:state.loops,escaped:state.escaped};}
export function parseCheckpoint(raw){
  let obj;
  try{if(typeof raw!=='string'||raw.length>1024)return freshState();obj=JSON.parse(raw);}catch{return freshState();}
  if(!obj||typeof obj!=='object'||obj.version!==VERSION)return freshState();
  const loops=Number.isInteger(obj.loops)?clamp(obj.loops,0,LIMIT):0;
  return {...freshState(),loops,escaped:loops>0&&obj.escaped===true};
}
export function serializeCheckpoint(state){return JSON.stringify(checkpoint(state));}
export function eyeHeight(state){
  const fraction=clamp((2.8-state.z)/9.3,0,1);
  return 1.55+fraction*2.4;
}
export function advance(original,input={},seconds=0){
  const s={...original},dt=clamp(valid(seconds)?seconds:0,0,.16);
  if(!dt||s.escaped)return {state:s,event:null};
  const turn=clamp(valid(input.turn)?input.turn:0,-1,1);
  s.yaw+=turn*TURN_SPEED*dt;
  if(s.yaw>Math.PI)s.yaw-=Math.PI*2;
  if(s.yaw< -Math.PI)s.yaw+=Math.PI*2;
  let forward=clamp(valid(input.forward)?input.forward:0,-1,1);
  let strafe=clamp(valid(input.strafe)?input.strafe:0,-1,1);
  const length=Math.hypot(forward,strafe);
  if(length>1){forward/=length;strafe/=length;}
  const dx=(Math.sin(s.yaw)*forward+Math.cos(s.yaw)*strafe)*SPEED*dt;
  const dz=(-Math.cos(s.yaw)*forward+Math.sin(s.yaw)*strafe)*SPEED*dt;
  const nextZ=clamp(s.z+dz,-7.4,7.5);
  const inExitZone=nextZ>=EXIT_MIN_Z&&nextZ<=EXIT_MAX_Z;
  const mayEnterExit=s.loops>0&&inExitZone;
  const nextX=clamp(s.x+dx,-1.8,mayEnterExit?3:1.8);
  s.x=nextX;s.z=nextZ;
  if(s.z<=-7.0&&s.x>=-1.45&&s.x<=1.45){
    s.x=0;s.z=START_Z;s.yaw=0;
    s.loops=clamp(s.loops+1,0,LIMIT);
    return {state:s,event:'loop'};
  }
  if(mayEnterExit&&s.x>=2.65){s.escaped=true;return {state:s,event:'escape'};}
  return {state:s,event:null};
}
