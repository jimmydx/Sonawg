(function(){
'use strict';
const C=window.SonawgTransect,params=new URLSearchParams(location.search),lab=document.getElementById('transect-lab');
const enabled=params.get('lab')==='transect';
document.getElementById('reference-player').hidden=enabled;lab.hidden=!enabled;
document.getElementById(enabled?'nav-lab':'nav-reference').setAttribute('aria-current','page');
if(!enabled)return;
lab.innerHTML=`<h2>Transect lab</h2>
<p>Freeze a field, then listen along a straight path. Compare wave shape, crest spacing and mixtures. These are analytical calibration patterns; the field does not evolve during playback.</p>
<p><a href="?lab=transect&amp;pattern=radial_chirp&amp;method=pulses">Try the outward-radiating circular wave</a></p>
<p id="lab-radial-description" class="note" hidden>Circular crests move outward from the fixed observer. Their local wavelength increases with radius: λ(r) = 48 + 0.24r km, with r in km. The default path runs from the observer outward to 960 km (NE), where λ is about 278 km. Listen for increasing gaps between plucks. This is a prescribed synthetic radial chirp, not a dispersion simulation. The central 24 km is softened; the inner wavelength is a phase-law limit.</p>
<div class="controls">
<label>Frozen pattern<select id="lab-pattern" aria-label="Frozen pattern"></select></label>
<label>Simulation minute <output id="lab-minute-value">0</output><input id="lab-minute" aria-label="Simulation minute" type="range" min="0" max="120" step="1" value="0"></label>
<label>Sound method<select id="lab-method"><option value="pitch">Signed value → pitch</option><option value="pulses">Crest-crossing pulses</option><option value="audification">Spatial audification bursts</option></select></label>
<label>Slow scan duration<select id="lab-duration"><option value="4">4 seconds</option><option value="8" selected>8 seconds</option><option value="16">16 seconds</option></select></label>
<label>Audification reading speed<select id="lab-speed"><option value="16000">16,000 km/s</option><option value="32000" selected>32,000 km/s</option><option value="64000">64,000 km/s</option></select></label>
<label>Path bearing <output id="lab-angle-value">90°</output><input id="lab-angle" aria-label="Path bearing" type="range" min="0" max="359" step="1" value="90"></label>
</div>
<div class="position"><label>Center east (km)<input type="number" id="lab-cx" min="-880" max="880" step="any" value="300"></label><label>Center north (km)<input type="number" id="lab-cy" min="-880" max="880" step="any" value="300"></label></div>
<div class="controls"><label class="check"><input id="lab-reverse" type="checkbox">Reverse traversal</label><label class="check"><input id="lab-troughs" type="checkbox">Include troughs as low plucks</label><label class="check"><input id="lab-spatial" type="checkbox">Spatialize scanner position</label><label class="check"><input id="lab-sound-only" type="checkbox">Sound-only view</label></div>
<p class="explanation" id="lab-explanation"></p>
<div class="actions"><button class="primary" id="lab-play">Play / replay</button><button id="lab-stop" disabled>Stop</button><button id="lab-preview" hidden>Preview outward motion (silent)</button><button id="lab-reset">Reset transect</button><button id="lab-share">Copy link to this setup</button></div>
<p id="lab-status" class="status" role="status" aria-live="polite">Ready. Use headphones at a comfortable level.</p>
<div class="readout" id="lab-readout"></div>
<div class="figures" id="lab-figures"><figure><canvas id="lab-map" width="560" height="560" aria-label="Frozen horizontal field with compass and draggable transect"></canvas><figcaption>Drag anywhere to move the 960 km transect. Bearing is clockwise from north. Endpoints stay inside ±880 km. White dot: fixed observer; yellow: start and traversal.</figcaption></figure>
<figure><canvas id="lab-profile" width="700" height="400" aria-label="Signed field profile with crest markers and playback cursor"></canvas><figcaption>Signed samples every 4 km along the path, using bilinear interpolation on the 4 km grid. Orange dots mark positive local maxima; blue dots mark optional negative troughs. The color scale and profile axis remain fixed at ±4 synthetic m/s.</figcaption></figure></div>
<p class="note">The scanner creates the reading order and rhythm. A path parallel to a crest can miss its spacing entirely. All three methods use this same signed profile, without wavelength filtering.</p>
<p class="note" id="lab-renderer">Centered browser audio. Spatialization uses your browser’s generic HRTF stereo renderer, separately from the reference player’s Logic-rendered binaural clips. North is front; east is right. No distance attenuation or head tracking. Audification moves too fast for the display to follow each sample, so the whole transect flashes for each burst.</p>
<div class="downloads"><button id="lab-csv">Download sampled profile (CSV)</button><button id="lab-settings">Download mapping settings (JSON)</button></div>
<details><summary>Fixed mappings, gains and listening tasks</summary><p>Pitch: 300 × 2<sup>value / 2</sup> Hz, continuous and unquantized. Zero is a 300 Hz tone, not silence. Constant oscillator gain 0.10. Pulses: 60 ms plucks at positive maxima, 700 Hz crest / optional 220 Hz trough; gain 0.12 per synthetic m/s. Fixed extrema threshold 0.0001 m/s; endpoint maxima are excluded. Audification gain 0.14 per synthetic m/s, 5% cosine-squared edge windows, four bursts per second for eight seconds. Burst cadence and windows are imposed: even a constant nonzero profile can produce boundary transients. All methods have 20 ms start/end fades and no automatic normalization. Gains differ by method; perceived loudness is not directly comparable between methods.</p><p>Try 60, 120 and 240 km patterns; rotate the path across and along crests; then compare amplitude and crossing patterns. Report which method makes spacing, sign and a second structure easiest to notice. Browser output may use the device sample rate; settings record the actual rate after playback. Spatial position indicates scanner location, not wave propagation. Human interpretability and front/back localization remain listening questions.</p><p><a href="transect-validation.json">Numerical validation</a> · <a href="?case=surround">Existing wavelength-and-direction exercise</a></p></details>`;
const $=id=>document.getElementById('lab-'+id),events=typeof exerciseAnswers!=='undefined'?exerciseAnswers:[],titles=[...study.cases,{id:'radial_chirp',title:'Circular wave / spacing grows outward'}];
for(const c of titles){const o=document.createElement('option');o.value=c.id;o.textContent=c.id==='stationary'?'Stationary 120 km packet':c.title;$('pattern').append(o);}
let state={pattern:'stationary',minute:0,method:'pitch',duration:8,speed:32000,angle:90,cx:300,cy:300,reverse:false,troughs:false,spatial:false,soundOnly:false};
for(const key of ['pattern','method'])if(params.has(key))state[key]=params.get(key);
for(const key of ['minute','duration','speed','angle','cx','cy'])if(params.has(key)&&Number.isFinite(+params.get(key)))state[key]=+params.get(key);
for(const key of ['reverse','troughs','spatial','soundOnly'])state[key]=params.get(key)==='1';
if(!titles.some(c=>c.id===state.pattern))state.pattern='stationary';
if(state.pattern==='radial_chirp'){if(!params.has('cx'))state.cx=480*Math.SQRT1_2;if(!params.has('cy'))state.cy=480*Math.SQRT1_2;if(!params.has('angle'))state.angle=45;}
if(!['pitch','pulses','audification'].includes(state.method))state.method='pitch';
state.minute=Math.round(Math.max(0,Math.min(120,state.minute)));state.angle=Math.round(((state.angle%360)+360)%360);
if(![4,8,16].includes(state.duration))state.duration=8;if(![16000,32000,64000].includes(state.speed))state.speed=32000;
let grid,profile,g,fieldKey='',audioContext,source,gain,panner,playing=false,startTime=0,rendered=null,generation=0,raf=0,lastRate=null,lastDrawTime=null,previewing=false,previewTime=null;
const map=$('map'),mapContext=map.getContext('2d'),plot=$('profile'),plotContext=plot.getContext('2d'),background=document.createElement('canvas');background.width=512;background.height=512;
function controls(){for(const k of ['pattern','minute','method','duration','speed','angle','cx','cy'])$(k).value=state[k];for(const [id,k] of [['reverse','reverse'],['troughs','troughs'],['spatial','spatial'],['sound-only','soundOnly']])$(id).checked=state[k];}
function stop(message='Stopped. Replay starts at the beginning.'){
  generation++;cancelAnimationFrame(raf);const wasPlaying=playing,wasPreview=previewing;playing=false;previewing=false;previewTime=null;
  if(source){const old=source,oldGain=gain,oldPanner=panner;source=null;gain=null;panner=null;try{oldGain.gain.cancelScheduledValues(audioContext.currentTime);oldGain.gain.setValueAtTime(oldGain.gain.value,audioContext.currentTime);oldGain.gain.linearRampToValueAtTime(0,audioContext.currentTime+.02);old.stop(audioContext.currentTime+.025);}catch(_){}setTimeout(()=>{old.disconnect();oldGain.disconnect();if(oldPanner)oldPanner.disconnect();},50);}
  if(wasPreview){makeBackground();describeProfile();}$('preview').textContent='Preview outward motion (silent)';
  $('stop').disabled=true;$('play').disabled=false;if(wasPlaying||wasPreview)$('status').textContent=message;
  if(profile)draw();
}
function makeBackground(values=grid){
  const ctx=background.getContext('2d'),im=ctx.createImageData(512,512);
  for(let j=0;j<512;j++)for(let i=0;i<512;i++){
    const v=Math.max(-1,Math.min(1,values[(511-j)*512+i]/4)),a=Math.abs(v),k=(j*512+i)*4;
    im.data[k]=v>=0?24+218*a:24;im.data[k+1]=v>=0?47+116*a:47+126*a;im.data[k+2]=v>=0?65-15*a:65+175*a;im.data[k+3]=255;
  }ctx.putImageData(im,0,0);
}
function mapXY(x,y){return [(x+1024)/2048*560,(1020-y)/2048*560];}
function draw(t=null,shownProfile=profile){
  lastDrawTime=t;
  mapContext.drawImage(background,0,0,560,560);mapContext.font='16px system-ui';mapContext.lineWidth=1;mapContext.strokeStyle='#b7ccdc88';
  const inset=(1024-880)/2048*560;mapContext.strokeRect(inset,inset,1760/2048*560,1760/2048*560);
  mapContext.fillStyle='#fff';for(const [label,x,y] of [['N',274,23],['E',537,283],['S',275,548],['W',9,283]])mapContext.fillText(label,x,y);
  const colors=mapContext.createLinearGradient(185,0,375,0);colors.addColorStop(0,'rgb(24,173,240)');colors.addColorStop(.5,'rgb(24,47,65)');colors.addColorStop(1,'rgb(242,163,50)');mapContext.fillStyle=colors;mapContext.fillRect(185,526,190,6);mapContext.fillStyle='#c8d9e4';mapContext.font='11px system-ui';mapContext.fillText('−4',164,533);mapContext.fillText('+4 m/s',380,533);
  const o=mapXY(0,0);mapContext.beginPath();mapContext.arc(...o,4,0,2*Math.PI);mapContext.fill();
  const a=mapXY(...g.start),b=mapXY(...g.end);mapContext.strokeStyle='#ffdf78';mapContext.lineWidth=2;mapContext.beginPath();mapContext.moveTo(...a);mapContext.lineTo(...b);mapContext.stroke();
  mapContext.fillStyle='#ffdf78';mapContext.beginPath();mapContext.arc(...a,5,0,2*Math.PI);mapContext.fill();mapContext.font='13px system-ui';mapContext.fillText('start',a[0]+7,a[1]-7);
  if(Math.hypot(...g.start)<1){mapContext.beginPath();mapContext.arc(...a,7,0,2*Math.PI);mapContext.stroke();mapContext.fillStyle='#fff';mapContext.beginPath();mapContext.arc(...a,3,0,2*Math.PI);mapContext.fill();}
  const center=mapXY(g.cx,g.cy);mapContext.strokeRect(center[0]-6,center[1]-6,12,12);
  const X=q=>52+q*625,Y=v=>185-v/4*140;plotContext.fillStyle='#091725';plotContext.fillRect(0,0,700,400);plotContext.strokeStyle='#728997';plotContext.lineWidth=1;
  for(const v of [-4,-2,0,2,4]){plotContext.beginPath();plotContext.moveTo(52,Y(v));plotContext.lineTo(677,Y(v));plotContext.stroke();plotContext.fillStyle='#c8d9e4';plotContext.font='14px system-ui';plotContext.fillText(String(v),20,Y(v)+5);}
  plotContext.strokeStyle='#e6edf1';plotContext.lineWidth=2;plotContext.beginPath();shownProfile.forEach((p,i)=>i?plotContext.lineTo(X(i/240),Y(p.value)):plotContext.moveTo(X(0),Y(p.value)));plotContext.stroke();
  for(const sign of state.troughs?[1,-1]:[1])for(const e of C.extrema(shownProfile,sign)){plotContext.fillStyle=sign===1?'#ffb66b':'#6ed4f4';plotContext.beginPath();plotContext.arc(X(e.q),Y(e.value),4,0,2*Math.PI);plotContext.fill();}
  plotContext.fillStyle='#c8d9e4';plotContext.font='15px system-ui';plotContext.fillText('0',50,358);plotContext.fillText('480',350,358);plotContext.fillText('960 km along path',540,358);plotContext.fillText('synthetic m/s',20,24);
  if(t!==null){
    const r=C.readPosition(t,state);
    if(state.method==='audification'){
      const u=t-C.config.burstOffset,local=u-Math.floor(u/C.config.burstInterval)*C.config.burstInterval;
      if(u>=0&&local<Math.max(.06,C.config.pathKm/state.speed)){mapContext.strokeStyle='#fff';mapContext.lineWidth=5;mapContext.beginPath();mapContext.moveTo(...a);mapContext.lineTo(...b);mapContext.stroke();plotContext.fillStyle='#ffdf7830';plotContext.fillRect(52,40,625,290);}
    }else{
      const x=g.start[0]+r.q*(g.end[0]-g.start[0]),y=g.start[1]+r.q*(g.end[1]-g.start[1]);mapContext.fillStyle='#fff';mapContext.beginPath();mapContext.arc(...mapXY(x,y),7,0,2*Math.PI);mapContext.fill();
      plotContext.strokeStyle='#ffdf78';plotContext.beginPath();plotContext.moveTo(X(r.q),40);plotContext.lineTo(X(r.q),330);plotContext.stroke();
    }
  }
}
function describeProfile(){
  const peak=Math.max(...profile.map(p=>Math.abs(p.value))),count=C.extrema(profile).length;
  const radial=state.pattern==='radial_chirp'?' · local λ at path ends '+[g.start,g.end].map(xy=>C.radialWavelength(Math.hypot(...xy)).toFixed(0)).join(' → ')+' km':'';
  $('readout').textContent=`Frozen at ${state.minute} simulated minutes · 960 km path · ${count} positive crests · maximum |value| ${peak.toFixed(3)} m/s${radial}`;
  return peak;
}
function update(){
  stop('Settings changed. Ready to replay the frozen field.');
  g=C.geometry(state.cx,state.cy,state.angle,state.reverse);state.cx=g.cx;state.cy=g.cy;
  const key=state.pattern+':'+state.minute;
  if(key!==fieldKey){grid=C.field(state.pattern,state.minute*60,events);fieldKey=key;makeBackground();}
  profile=C.profile(grid,g);controls();$('minute-value').value=state.minute;$('angle-value').value=state.angle+'°';
  $('duration').disabled=state.method==='audification';$('speed').disabled=state.method!=='audification';$('troughs').disabled=state.method!=='pulses';$('figures').hidden=state.soundOnly;
  const peak=describeProfile();$('radial-description').hidden=state.pattern!=='radial_chirp';$('preview').hidden=state.pattern!=='radial_chirp';
  $('explanation').textContent=state.method==='pitch'?'A continuous tone rises over positive crests and falls through negative troughs. Zero is a 300 Hz reference tone. Larger magnitudes widen the pitch excursion; crest spacing changes the rhythm of that excursion.':state.method==='pulses'?'Positive local maxima trigger high plucks; optional negative troughs trigger low plucks. Magnitude sets pluck amplitude. Rhythm depends on both spatial spacing and scan speed.':'Each burst rapidly reads this entire profile as an audio waveform. Four bursts per second, for eight seconds. At '+state.speed.toLocaleString()+' km/s, aligned 60 / 120 / 240 km structures give approximately '+[60,120,240].map(l=>(state.speed/l).toFixed(0)).join(' / ')+' Hz. These are spatial reading frequencies.';
  $('status').textContent=peak<.0001?'Near-zero profile: pitch mode still plays the 300 Hz reference; pulses and audification may be silent.':'Ready. The field remains frozen; changing controls stops playback.';
  draw();
}
function onChange(id,key,type='number'){$(id).addEventListener('input',()=>{const input=$(id),value=type==='boolean'?input.checked:type==='string'?input.value:Number(input.value);if(type==='number'&&!Number.isFinite(value))return;state[key]=value;if(key==='pattern'&&value==='radial_chirp'){state.cx=state.cy=480*Math.SQRT1_2;state.angle=45;state.reverse=false;}update();});}
for(const key of ['pattern','method'])onChange(key,key,'string');for(const key of ['minute','angle','cx','cy','duration','speed'])onChange(key,key);
for(const [id,key] of [['reverse','reverse'],['troughs','troughs'],['spatial','spatial'],['sound-only','soundOnly']])onChange(id,key,'boolean');
let dragging=false;
function drag(e){const r=map.getBoundingClientRect();state.cx=Math.round(((e.clientX-r.left)/r.width*2048-1024)/4)*4;state.cy=Math.round((1020-(e.clientY-r.top)/r.height*2048)/4)*4;update();}
map.addEventListener('pointerdown',e=>{dragging=true;map.setPointerCapture(e.pointerId);drag(e);});map.addEventListener('pointermove',e=>{if(dragging)drag(e);});for(const event of ['pointerup','pointercancel'])map.addEventListener(event,()=>dragging=false);
$('reset').addEventListener('click',()=>{const centers={isolated_60:[330,0,90],isolated_120:[0,330,0],isolated_240:[-350,0,90],stationary:[300,300,90],amplitude:[300,300,45],crossing:[0,0,45],simultaneous:[0,0,90],surround:[0,0,90],radial_chirp:[480*Math.SQRT1_2,480*Math.SQRT1_2,45]},v=centers[state.pattern];[state.cx,state.cy,state.angle]=v;state.reverse=false;update();});
$('preview').addEventListener('click',()=>{
  if(previewing){stop('Motion preview stopped. Listening snapshot restored.');return;}
  stop();document.querySelectorAll('audio,video').forEach(a=>a.pause());previewing=true;$('stop').disabled=false;$('preview').textContent='Stop motion preview';
  if(state.soundOnly){state.soundOnly=false;$('sound-only').checked=false;$('figures').hidden=false;}
  const started=performance.now();let previous=-Infinity,previewGrid=null;
  function frame(now){
    if(!previewing)return;const elapsed=(now-started)/1000;
    if(elapsed>=8){stop('Motion preview finished. Listening uses the restored frozen snapshot.');return;}
    if(elapsed-previous>=1/12){previous=elapsed;previewTime=state.minute*60+elapsed/8*C.config.radial.periodSeconds;previewGrid=C.field('radial_chirp',previewTime,events,previewGrid);makeBackground(previewGrid);draw(null,C.profile(previewGrid,g));$('readout').textContent=`Silent motion preview · ${(previewTime/60).toFixed(1)} simulated minutes · listening snapshot stays at ${state.minute} minutes`;$('status').textContent='Circular crests move outward; one 20-minute phase cycle is shown in eight seconds. Audio is stopped.';}
    raf=requestAnimationFrame(frame);
  }raf=requestAnimationFrame(frame);
});
async function play(){
  stop();const token=generation;$('play').disabled=true;$('status').textContent='Preparing audio…';
  try{
    document.querySelectorAll('audio,video').forEach(a=>a.pause());
    const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)throw Error('Web Audio is unavailable in this browser');
    if(!audioContext)audioContext=new Audio();await audioContext.resume();if(token!==generation)return;
    rendered=C.render(profile,state,audioContext.sampleRate);lastRate=audioContext.sampleRate;
    const buffer=audioContext.createBuffer(1,rendered.data.length,lastRate);buffer.copyToChannel(rendered.data,0);
    source=audioContext.createBufferSource();source.buffer=buffer;gain=audioContext.createGain();gain.gain.value=1;source.connect(gain);
    startTime=audioContext.currentTime+.08;
    if(state.spatial){
      panner=audioContext.createPanner();panner.panningModel='HRTF';panner.rolloffFactor=0;panner.positionY.value=0;
      const length=Math.ceil(rendered.seconds*1000)+1,x=new Float32Array(length),z=new Float32Array(length);
      for(let i=0;i<length;i++){const r=C.readPosition(i/(length-1)*rendered.seconds,state),e=g.start[0]+r.q*(g.end[0]-g.start[0]),n=g.start[1]+r.q*(g.end[1]-g.start[1]),distance=Math.max(24,Math.hypot(e,n));x[i]=e/distance;z[i]=-n/distance;}
      panner.positionX.setValueCurveAtTime(x,startTime,rendered.seconds);panner.positionZ.setValueCurveAtTime(z,startTime,rendered.seconds);gain.connect(panner);panner.connect(audioContext.destination);
    }else gain.connect(audioContext.destination);
    const activeSource=source;source.onended=()=>{if(source!==activeSource)return;source.disconnect();gain.disconnect();if(panner)panner.disconnect();source=gain=panner=null;playing=false;cancelAnimationFrame(raf);$('stop').disabled=true;$('play').disabled=false;$('status').textContent='Finished. Replay uses the same frozen field and path.';draw();};
    playing=true;$('stop').disabled=false;$('play').disabled=false;source.start(startTime);
    function frame(){if(!playing)return;const t=Math.max(0,audioContext.currentTime-startTime);draw(t);$('status').textContent=`Playing ${state.method==='audification'?'rapid spatial bursts':'transect'} · ${Math.min(t,rendered.seconds).toFixed(1)} / ${rendered.seconds} s · ${lastRate.toLocaleString()} Hz · ${state.spatial?'browser HRTF':'centered stereo'}`;raf=requestAnimationFrame(frame);}frame();
  }catch(error){stop();$('status').textContent='Playback could not start: '+error.message;$('play').disabled=false;}
}
$('play').addEventListener('click',play);$('stop').addEventListener('click',()=>stop());
document.querySelectorAll('audio,video').forEach(a=>a.addEventListener('play',()=>stop()));
document.addEventListener('visibilitychange',()=>{if(document.hidden)stop('Stopped while the page was in the background.');});
window.addEventListener('pagehide',()=>stop());
function metadata(){return {schema:'sonawg_transect_v1',pattern:state.pattern,simulation_time_s:state.minute*60,field_units:'synthetic m/s',native_grid_km:4,profile_interpolation:'bilinear',profile_step_km:4,geometry:g,settings:{...state},fixed_mappings:C.config,audio_sample_rate_hz:lastRate,observer_east_north_km:[0,0],renderer:state.spatial?'Browser HRTF stereo':'Centered browser audio',normalization:'none; fixed gains differ by method',audification:'spatial reading frequency, not physical wave frequency',positive_crests:C.extrema(profile),negative_troughs:C.extrema(profile,-1),human_listening_validation:'pending'};}
function download(name,text,type){const a=document.createElement('a'),url=URL.createObjectURL(new Blob([text],{type}));a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
$('csv').addEventListener('click',()=>{download('Sonawg-transect-profile.csv','distance_km,east_km,north_km,signed_value_synthetic_m_per_s\n'+profile.map(p=>[p.distance_km,p.x_km,p.y_km,p.value].join(',')).join('\n')+'\n','text/csv');});
$('settings').addEventListener('click',()=>download('Sonawg-transect-settings.json',JSON.stringify(metadata(),null,2)+'\n','application/json'));
$('share').addEventListener('click',async()=>{const url=new URL(location.protocol==='file:'?'https://jimmydx.github.io/Sonawg/':location.href);url.search='';url.searchParams.set('lab','transect');for(const [k,v] of Object.entries(state))url.searchParams.set(k,typeof v==='boolean'?(v?'1':'0'):String(v));try{if(location.protocol!=='file:')history.replaceState(null,'',url.href);}catch(_){}try{if(navigator.clipboard&&location.protocol!=='file:'){await navigator.clipboard.writeText(url.href);$('status').textContent='Link copied. Playback never starts automatically.';}else{$('status').textContent='Setup link: '+url.href;}}catch(_){$('status').textContent='Copy this setup link: '+url.href;}});
// Expose read-only snapshots for repeatable scientific and browser validation.
window.sonawgLab={snapshot:()=>({state:{...state},geometry:g,profile:profile.map(p=>({...p})),playing,previewing,preview_simulation_time_s:previewTime,playback_elapsed_s:playing?Math.max(0,audioContext.currentTime-startTime):null,visual_elapsed_s:lastDrawTime,metadata:metadata(),rendered:rendered?{seconds:rendered.seconds,peak:rendered.peak,fs:rendered.fs}:null})};
controls();update();
})();
