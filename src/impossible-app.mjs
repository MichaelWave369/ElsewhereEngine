import {SAVE_KEY, STAGES, SIGILS, CONTROLS, ENDINGS, freshState, parseSave, serializeState, stageOf, progressOf, stageIntro, act} from './impossible-story.mjs';
const $=id=>document.getElementById(id);
let persistent=true, state=load(), feedback='';
function load(){try{return parseSave(localStorage.getItem(SAVE_KEY));}catch{persistent=false;return freshState();}}
function store(){try{localStorage.setItem(SAVE_KEY,serializeState(state));persistent=true;}catch{persistent=false;}}
function render(){
  const stage=stageOf(state),intro=stageIntro(state),done=Boolean(state.ending),progress=progressOf(state);
  document.body.dataset.stage=done?'ending':stage;
  $('gallery-scene').dataset.perspective=stage==='stair'?state.stair.view:stage==='prism'?(state.prism.seen.at(-1)||'front'):'front';
  $('stage-eyebrow').textContent=done?'ARCHIVE RECORD CLOSED':('ROOM '+String(STAGES.indexOf(stage)+1).padStart(2,'0')+' / 04');
  $('stage-title').textContent=intro.title;
  $('stage-story').textContent=intro.text;
  $('feedback').textContent=feedback||(done?'This ending is saved in this browser.': 'Choose an action to investigate the room.');
  $('progress-count').textContent=String(progress)+' / 4';
  $('progress-meter').style.width=(progress/4*100)+'%';
  $('progressbar').setAttribute('aria-valuenow',String(progress));
  $('save-status').textContent=persistent?'LOCAL JOURNEY · SAVED IN THIS BROWSER':'LOCAL JOURNEY · SESSION ONLY (STORAGE UNAVAILABLE)';
  const list=$('actions');list.replaceChildren();
  if(!done)for(const control of CONTROLS[stage]){
    const button=document.createElement('button');button.type='button';button.className='action';
    const title=document.createElement('strong');title.textContent=control.label;
    const note=document.createElement('small');note.textContent=control.detail;
    button.append(title,note);button.addEventListener('click',()=>take(control.id));list.append(button);
  }
  else{const note=document.createElement('p');note.className='finished';note.textContent='CASE COMPLETE · '+ENDINGS[state.ending].title;list.append(note);}
  const journal=[];
  if(state.stair.loops)journal.push('STAIR · '+state.stair.loops+' loop'+(state.stair.loops>1?'s':'')+' witnessed');
  if(state.stair.crossed)journal.push('STRUCTURE · Side doorway found');
  if(state.dream.seen.length)journal.push('DREAM · '+state.dream.seen.join(' + ')+' observed');
  if(state.dream.planted)journal.push('TIME · Dream garden awakened');
  if(state.prism.seen.length)journal.push('PORTRAIT · '+state.prism.seen.join(' / '));
  if(state.prism.assembled)journal.push('PERCEPTION · Portrait reconciled');
  if(state.synthesis.inscribed.length)journal.push('SYNTHESIS · '+state.synthesis.inscribed.join(' + '));
  if(state.ending)journal.push('DISPOSITION · '+ENDINGS[state.ending].title);
  $('journal').replaceChildren(...(journal.length?journal:['No observations recorded yet.']).map(text=>{const li=document.createElement('li');li.textContent=text;return li;}));
  for(const dot of document.querySelectorAll('[data-room]')){
    const idx=STAGES.indexOf(dot.dataset.room);dot.classList.toggle('complete',idx<progress);dot.classList.toggle('active',dot.dataset.room===stage&&!done);
    dot.setAttribute('aria-current',dot.dataset.room===stage&&!done?'step':'false');
  }
}
function take(action){const result=act(state,action);state=result.state;feedback=result.message;if(result.changed)store();render();}
$('reset').addEventListener('click',()=>{
  if(!window.confirm('Restart The First Stair? Only this gallery episode save will be cleared.'))return;
  state=freshState();feedback='You return to the first impossible landing.';store();render();
});
render();
