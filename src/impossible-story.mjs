// Archive of Impossibilities / The First Stair. Pure, local-first episode logic.
export const SAVE_KEY = 'elsewhere-engine.first-stair.v1';
export const VERSION = 1;
export const STAGES = Object.freeze(['stair', 'dream', 'prism', 'synthesis']);
export const SIGILS = Object.freeze(['gravity', 'time', 'perspective']);
export const ENDINGS = Object.freeze({
  preserve: Object.freeze({title:'THE ROOM THAT REMAINS',text:'You give the impossible a stable address. The stair remembers every direction, the garden keeps its shadow, and the portrait keeps its many viewpoints. The Archive labels the room SAFE TO ENTER. Nobody believes the label.'}),
  release: Object.freeze({title:'THE OPEN FRAME',text:'You leave the final frame unfastened. The gallery unfolds into doorways nobody can catalogue. Somewhere far below, a receptionist receives an unsigned permit for a floor that has not yet been built.'})
});
export const CONTROLS = Object.freeze({
  stair: Object.freeze([
    {id:'climb',label:'Climb the stair',detail:'Test the apparent ascent'},
    {id:'profile',label:'Look from the side',detail:'Challenge the painted viewpoint'},
    {id:'front',label:'Look straight ahead',detail:'Restore the familiar angle'},
    {id:'cross',label:'Follow the side doorway',detail:'Look for an exit that does not climb'}
  ]),
  dream: Object.freeze([
    {id:'shadow',label:'Examine the shadow',detail:'The object casting it is missing'},
    {id:'seed',label:'Examine the glass seed',detail:'Something small waits in the sand'},
    {id:'soften',label:'Let the clock soften',detail:'Change time rather than the path'},
    {id:'plant',label:'Plant the seed',detail:'Give the dream an anchor'}
  ]),
  prism: Object.freeze([
    {id:'front',label:'View the front',detail:'One face of the story'},
    {id:'profile',label:'View the profile',detail:'A second truth'},
    {id:'inside',label:'View the interior',detail:'See what the surface hides'},
    {id:'assemble',label:'Reassemble the portrait',detail:'Hold all perspectives together'}
  ]),
  synthesis: Object.freeze([
    {id:'gravity',label:'Bind the staircase',detail:'Acknowledge the loop'},
    {id:'time',label:'Bind the dream',detail:'Acknowledge the shadow'},
    {id:'perspective',label:'Bind the portrait',detail:'Acknowledge every angle'},
    {id:'preserve',label:'Preserve the room',detail:'Make the paradox navigable'},
    {id:'release',label:'Open the frame',detail:'Let the gallery keep changing'}
  ])
});
const unique = (input,allowed)=>Array.isArray(input)?[...new Set(input.filter(x=>typeof x==='string'&&allowed.includes(x)))]:[];
export function freshState(){return {version:VERSION,stair:{loops:0,view:'front',crossed:false},dream:{seen:[],softened:false,planted:false},prism:{seen:[],assembled:false},synthesis:{inscribed:[]},ending:null};}
export function normalizeState(raw){
  const init=freshState();
  if(!raw||typeof raw!=='object'||raw.version!==VERSION)return init;
  const loops=Number.isInteger(raw.stair?.loops)?Math.max(0,Math.min(3,raw.stair.loops)):0;
  const view=raw.stair?.view==='profile'?'profile':'front';
  const crossed=raw.stair?.crossed===true&&loops>0&&view==='profile';
  const seenDream=crossed?unique(raw.dream?.seen,['shadow','seed']):[];
  const softened=crossed&&raw.dream?.softened===true;
  const planted=crossed&&raw.dream?.planted===true&&softened&&seenDream.length===2;
  const seenPrism=planted?unique(raw.prism?.seen,['front','profile','inside']):[];
  const assembled=planted&&raw.prism?.assembled===true&&seenPrism.length===3;
  const inscribed=assembled?unique(raw.synthesis?.inscribed,SIGILS):[];
  const ending=assembled&&inscribed.length===3&&Object.hasOwn(ENDINGS,raw.ending)?raw.ending:null;
  return {version:VERSION,stair:{loops,view,crossed},dream:{seen:seenDream,softened,planted},prism:{seen:seenPrism,assembled},synthesis:{inscribed},ending};
}
export function parseSave(raw){if(typeof raw!=='string'||raw.length>10000)return freshState();try{return normalizeState(JSON.parse(raw));}catch{return freshState();}}
export function serializeState(state){return JSON.stringify(normalizeState(state));}
export function stageOf(s){const x=normalizeState(s);return !x.stair.crossed?'stair':!x.dream.planted?'dream':!x.prism.assembled?'prism':'synthesis';}
export function progressOf(s){const x=normalizeState(s);return Number(x.stair.crossed)+Number(x.dream.planted)+Number(x.prism.assembled)+(x.ending?1:0);}
export function stageIntro(s){
  const x=normalizeState(s);
  if(x.ending)return {title:ENDINGS[x.ending].title,text:ENDINGS[x.ending].text};
  switch(stageOf(x)){
    case 'stair':return {title:'The stair with no final step',text:'The climb leads back to the same landing. Perhaps the exit is not above you. Try the stair, then question the angle.'};
    case 'dream':return {title:'The garden of unspent hours',text:'A clock hangs like rain over an empty plain. A shadow has lost its owner. The seed cannot grow without a witness and a softer kind of time.'};
    case 'prism':return {title:'The portrait that refuses one face',text:'Three angles tell different truths. None alone is a lie, and none alone is enough. Collect the viewpoints before you assemble them.'};
    default:return {title:'The room between the rules',text:'Structure, dream and perception have arrived together. Bind each law, then decide whether the room should remain or unfold.'};
  }
}
export function act(state,action){
  const s=normalizeState(state);
  if(s.ending)return {state:s,changed:false,message:'This visit has an ending. Start a new journey to explore the gallery again.'};
  const stage=stageOf(s);
  if(!CONTROLS[stage].some(c=>c.id===action))return {state:s,changed:false,message:'That action does not belong to this room.'};
  let message='',changed=false;
  if(stage==='stair'){
    if(action==='climb'){s.stair.loops=Math.min(3,s.stair.loops+1);changed=true;message='You take the steps upward and arrive at the same landing. The rail is warm where your hand was before. The building has kept your footprints.';}
    if(action==='profile'||action==='front'){s.stair.view=action;changed=true;message=action==='profile'?'From the side, the ascent breaks into flat planes. A narrow doorway appears where the stair should meet itself.':'The stairs reclaim their perfect illusion. The doorway disappears behind the geometry.';}
    if(action==='cross'){
      if(s.stair.loops>0&&s.stair.view==='profile'){s.stair.crossed=true;changed=true;message='You step sideways instead of upward. Gravity files a complaint. A desert of suspended time opens beyond the frame.';}
      else message='The doorway is concealed. Experience the loop, then view it from the side.';
    }
  } else if(stage==='dream'){
    if(action==='shadow'||action==='seed'){
      if(!s.dream.seen.includes(action)){s.dream.seen.push(action);changed=true;}
      message=action==='shadow'?'The shadow points toward an object that is not there. It remains when you close your eyes.':'The seed contains a tiny doorway, folded inward like a memory.';
    }
    if(action==='soften'){s.dream.softened=true;changed=true;message='The clock does not stop. It loosens its shape and drifts toward the horizon. Time becomes something the seed can drink.';}
    if(action==='plant'){
      if(s.dream.seen.length===2&&s.dream.softened){s.dream.planted=true;changed=true;message='You plant the seed inside the shadow. A many-sided portrait grows from the sand, facing several directions at once.';}
      else message='The seed needs both observations and softened time. Nothing in this garden grows by force.';
    }
  } else if(stage==='prism'){
    if(['front','profile','inside'].includes(action)){
      if(!s.prism.seen.includes(action)){s.prism.seen.push(action);changed=true;}
      message=({front:'From the front, the figure looks toward a distant doorway.',profile:'From the side, the same figure is watching you.',inside:'Inside the face is a quiet staircase and the shadow of a seed.'})[action];
    }
    if(action==='assemble'){
      if(s.prism.seen.length===3){s.prism.assembled=true;changed=true;message='The three perspectives overlap without erasing one another. A fourth chamber opens: the rules are finally ready to meet.';}
      else message='One viewpoint cannot stand in for another. Examine the front, profile and interior.';
    }
  } else {
    if(SIGILS.includes(action)){
      if(!s.synthesis.inscribed.includes(action)){s.synthesis.inscribed.push(action);changed=true;}
      message=({gravity:'The impossible stair becomes a reliable threshold.',time:'The clock keeps flowing, but its shadow can now be carried.',perspective:'The fractured portrait holds every angle without choosing a winner.'})[action];
    } else if(s.synthesis.inscribed.length===3){
      s.ending=action;changed=true;message=ENDINGS[action].text;
    } else message='The room still lacks a law. Bind structure, dream and perception before deciding its fate.';
  }
  return {state:normalizeState(s),changed,message};
}
