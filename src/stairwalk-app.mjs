import {SAVE_KEY,freshState,parseCheckpoint,serializeCheckpoint,eyeHeight,advance} from './stairwalk-engine.mjs';
const $=id=>document.getElementById(id);
const canvas=$('viewport');
const gl=canvas.getContext('webgl',{antialias:true,alpha:false,depth:true});
let state=load();
let lastTime=0,dragging=false,lastX=0,mesh=null,meshForLoops=-1;
const held=new Set();
let persistent=true;
function load(){try{return parseCheckpoint(localStorage.getItem(SAVE_KEY));}catch{return freshState();}}
function save(){try{localStorage.setItem(SAVE_KEY,serializeCheckpoint(state));persistent=true;}catch{persistent=false;}}
function status(message){$('narration').textContent=message;}
function updateHud(){
  $('loop-count').textContent=String(state.loops);
  $('exit-state').textContent=state.escaped?'DISCOVERED':state.loops>0?'OPEN / RIGHT-HAND DOOR':'HIDDEN / WALK THE STAIR';
  $('finish').hidden=!state.escaped;
  $('save-status').textContent=persistent?'CHECKPOINTS STORED IN THIS BROWSER':'SESSION ONLY / LOCAL STORAGE BLOCKED';
}
function xyz(x,y,z){return [x,y,z];}
function shade(rgb,m){return rgb.map(v=>Math.min(1,v*m));}
const stone=[.49,.44,.58],slate=[.19,.23,.35],mauve=[.65,.47,.55],gold=[.96,.70,.46],mint=[.45,.84,.75];
function buildGeometry(unlocked){
  const verts=[];
  function tri(a,b,c,color){for(const p of [a,b,c])verts.push(...p,...color);}
  function quad(a,b,c,d,color){tri(a,b,c,color);tri(a,c,d,color);}
  function box(x1,y1,z1,x2,y2,z2,color){
    quad(xyz(x1,y1,z1),xyz(x2,y1,z1),xyz(x2,y1,z2),xyz(x1,y1,z2),shade(color,.7));
    quad(xyz(x1,y2,z2),xyz(x2,y2,z2),xyz(x2,y2,z1),xyz(x1,y2,z1),shade(color,1.15));
    quad(xyz(x1,y1,z1),xyz(x1,y2,z1),xyz(x2,y2,z1),xyz(x2,y1,z1),shade(color,.9));
    quad(xyz(x2,y1,z2),xyz(x2,y2,z2),xyz(x1,y2,z2),xyz(x1,y1,z2),shade(color,.77));
    quad(xyz(x1,y1,z2),xyz(x1,y2,z2),xyz(x1,y2,z1),xyz(x1,y1,z1),shade(color,.64));
    quad(xyz(x2,y1,z1),xyz(x2,y2,z1),xyz(x2,y2,z2),xyz(x2,y1,z2),shade(color,.82));
  }
  // The corridor genuinely occupies 3D space. The paradox happens at a discreet portal transform.
  box(-2,-.18,-8,2,0,8,slate);
  box(-2,5.9,-8,2,6.06,8,stone);
  box(-2.15,0,-8,-2,5.9,8,stone);
  if(unlocked){
    box(2,0,-8,2.15,5.9,3.7,stone);
    box(2,0,5.8,2.15,5.9,8,stone);
    box(2,3.55,3.7,2.15,5.9,5.8,stone);
    box(2,0,3.7,3.12,.12,5.8,mint);
    box(2,0,3.7,3.12,5.0,3.84,stone);
    box(2,0,5.66,3.12,5.0,5.8,stone);
    box(3.12,0,3.7,3.28,5.9,5.8,shade(mint,.6));
  }else{
    box(2,0,-8,2.15,5.9,8,stone);
    box(1.92,0,3.7,1.99,3.55,5.8,shade(mauve,.6));
  }
  box(-2,0,7.9,2,5.9,8.03,shade(slate,.9));
  // Stairway: twelve graduated, independently modeled stone treads.
  const count=12,stepSize=9.3/count;
  for(let i=0;i<count;i++){
    const front=2.8-i*stepSize;
    const back=front-stepSize;
    box(-1.60,0,back,1.6,(i+1)*.2,front,i%2===0?stone:mauve);
    box(-1.74,(i+1)*.2,back,-1.64,(i+1)*.2+.24,front,gold);
    box(1.64,(i+1)*.2,back,1.74,(i+1)*.2+.24,front,gold);
  }
  // Distant frame and portal can be seen while climbing.
  box(-1.7,2.3,-7.72,-1.5,5.3,-7.5,gold);
  box(1.5,2.3,-7.72,1.7,5.3,-7.5,gold);
  box(-1.7,5.1,-7.72,1.7,5.3,-7.5,gold);
  box(-1.49,2.3,-7.64,1.49,5.1,-7.61,shade(mint,.6));
  // Repeated pillars establish depth cues.
  for(let z=-5;z<=7;z+=3){
    box(-2.0,0,z,-1.86,5.9,z+.2,shade(gold,.7));
    if(z<2||z>6)box(1.86,0,z,2,5.9,z+.2,shade(gold,.7));
  }
  return new Float32Array(verts);
}
function shader(type,source){
  const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);
  if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));
  return s;
}
function mul(a,b){
  const out=new Float32Array(16);
  for(let c=0;c<4;c++)for(let r=0;r<4;r++)for(let k=0;k<4;k++)out[c*4+r]+=a[k*4+r]*b[c*4+k];
  return out;
}
function projection(aspect){
  const f=1/Math.tan(67*Math.PI/360),near=.08,far=80;
  return new Float32Array([f/aspect,0,0,0,0,f,0,0,0,0,(far+near)/(near-far),-1,0,0,2*far*near/(near-far),0]);
}
function view(s){
  const cy=Math.cos(s.yaw),sy=Math.sin(s.yaw);
  // Camera right=(cy,0,sy), forward=(sy,0,-cy), up=(0,1,0).
  const y=eyeHeight(s);
  return new Float32Array([cy,0,-sy,0,0,1,0,0,sy,0,cy,0,-cy*s.x-sy*s.z,-y,-sy*s.x+cy*s.z,1]);
}
let program,buffer,uniform;
if(gl){
  try{
    const vertex=shader(gl.VERTEX_SHADER,`attribute vec3 aPosition;attribute vec3 aColor;uniform mat4 uVP;varying vec3 vColor;void main(){gl_Position=uVP*vec4(aPosition,1.0);vColor=aColor;}`);
    const fragment=shader(gl.FRAGMENT_SHADER,`precision mediump float;varying vec3 vColor;void main(){gl_FragColor=vec4(vColor,1.0);}`);
    program=gl.createProgram();gl.attachShader(program,vertex);gl.attachShader(program,fragment);gl.linkProgram(program);
    if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));
    gl.useProgram(program);
    buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
    for(const [name,offset] of [['aPosition',0],['aColor',12]]){
      const loc=gl.getAttribLocation(program,name);gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,3,gl.FLOAT,false,24,offset);
    }
    uniform=gl.getUniformLocation(program,'uVP');gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);
  }catch(error){status('WebGL initialization failed: '+error.message+' Use the accessible illustrated gallery instead.');$('unavailable').hidden=false;canvas.hidden=true;}
}else{$('unavailable').hidden=false;canvas.hidden=true;status('WebGL is unavailable on this device. The illustrated gallery remains playable.');}
function render(){
  if(!gl||!program||canvas.hidden)return;
  const dpr=Math.min(window.devicePixelRatio||1,2);
  const w=Math.max(1,Math.floor(canvas.clientWidth*dpr)),h=Math.max(1,Math.floor(canvas.clientHeight*dpr));
  if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;gl.viewport(0,0,w,h);}
  if(meshForLoops!==(state.loops>0?1:0)){
    mesh=buildGeometry(state.loops>0);gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,mesh,gl.STATIC_DRAW);meshForLoops=state.loops>0?1:0;
  }
  gl.clearColor(.055,.047,.10,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
  gl.uniformMatrix4fv(uniform,false,mul(projection(w/h),view(state)));
  gl.drawArrays(gl.TRIANGLES,0,mesh.length/6);
}
const bindings={KeyW:['forward',1],ArrowUp:['forward',1],KeyS:['forward',-1],ArrowDown:['forward',-1],KeyA:['strafe',-1],KeyD:['strafe',1],KeyQ:['turn',-1],ArrowLeft:['turn',-1],KeyE:['turn',1],ArrowRight:['turn',1]};
function controls(){
  const out={forward:0,strafe:0,turn:0};
  for(const key of held){const item=bindings[key];if(item)out[item[0]]+=item[1];}
  for(const item of document.querySelectorAll('[data-motion][data-held="true"]'))out[item.dataset.motion]+=Number(item.dataset.direction);
  return out;
}
document.addEventListener('keydown',e=>{
  if(!bindings[e.code]||e.altKey||e.ctrlKey||e.metaKey||e.target?.matches('input,textarea,select,[contenteditable]'))return;
  e.preventDefault();held.add(e.code);
});
document.addEventListener('keyup',e=>held.delete(e.code));
window.addEventListener('blur',()=>{held.clear();for(const b of document.querySelectorAll('[data-motion]'))delete b.dataset.held;dragging=false;});
for(const b of document.querySelectorAll('[data-motion]')){
  const release=()=>delete b.dataset.held;
  b.addEventListener('pointerdown',e=>{b.dataset.held='true';b.setPointerCapture?.(e.pointerId);});
  b.addEventListener('pointerup',release);b.addEventListener('pointercancel',release);b.addEventListener('lostpointercapture',release);
  b.addEventListener('click',()=>apply({[b.dataset.motion]:Number(b.dataset.direction)},.13));
}
canvas.addEventListener('pointerdown',e=>{dragging=true;lastX=e.clientX;canvas.setPointerCapture(e.pointerId);});
canvas.addEventListener('pointermove',e=>{if(!dragging||state.escaped)return;const dx=e.clientX-lastX;lastX=e.clientX;state.yaw+=dx*.005;});
canvas.addEventListener('pointerup',()=>dragging=false);canvas.addEventListener('pointercancel',()=>dragging=false);
function apply(input,dt){
  const result=advance(state,input,dt);state=result.state;
  if(result.event==='loop'){save();updateHud();status('A landing returns beneath your feet. Your footprints are already here. A side door has appeared near the beginning.');}
  if(result.event==='escape'){save();updateHud();status('You stepped sideways out of the loop. The Archive has no field for that direction.');}
}
function tick(time){
  const dt=lastTime?Math.min((time-lastTime)/1000,.06):0;lastTime=time;
  if(dt&&!state.escaped)apply(controls(),dt);
  $('heading').textContent=Math.round(((state.yaw*180/Math.PI)%360+360)%360)+'°';
  render();requestAnimationFrame(tick);
}
$('reset').addEventListener('click',()=>{
  if(!window.confirm('Reset this 3D staircase lab? The four-act gallery save will not be touched.'))return;
  state=freshState();save();updateHud();status('The landing is waiting. It remembers nothing you can prove.');
});
updateHud();requestAnimationFrame(tick);
