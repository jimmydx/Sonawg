/* Pure numerical core. Coordinates are east/north in km; values are synthetic m/s. */
(function(root){
'use strict';
const TAU=2*Math.PI, clamp=(x,a,b)=>Math.min(b,Math.max(a,x));
const config=Object.freeze({dxKm:4,n:512,pathKm:960,interiorKm:880,referenceHz:300,
  semitonesPerUnit:6,pitchGain:0.10,pulseGain:0.12,audificationGain:0.14,
  crestThreshold:0.0001,pulseSeconds:0.06,burstInterval:0.25,burstOffset:0.1,
  radial:Object.freeze({innerWavelengthKm:48,wavelengthGrowth:0.24,periodSeconds:1200,sourceTaperKm:24,outerTaperStartKm:1000,outerTaperEndKm:1200})});
function radialWavelength(r){return config.radial.innerWavelengthKm+config.radial.wavelengthGrowth*r;}
function radialCrestRadius(order,t){const c=config.radial;return c.innerWavelengthKm/c.wavelengthGrowth*Math.expm1(c.wavelengthGrowth*(order+t/c.periodSeconds));}
function ramp(t,a,b){return (1-Math.cos(Math.PI*clamp((t-a)/(b-a),0,1)))/2;}
function pulse(t,on,plateau,off){return (on===0?1:ramp(t,on,on+300))*(1-ramp(t,plateau,off));}
function packets(id,t,events=[]){
  const q=t/7200, p=(a,l,period,angle,x,y,sigma)=>({a,l,phase:TAU*t/period,angle,x,y,sigma});
  switch(id){
    case 'radial_chirp':return [{type:'radial',time:t}];
    case 'isolated_60':return [p(1,60,600,0,330,0,100)];
    case 'isolated_120':return [p(1,120,1200,Math.PI/2,0,330,145)];
    case 'isolated_240':return [p(1,240,2400,0,-350,0,220)];
    case 'simultaneous':return [p(ramp(t,3000,3600),60,600,0,340,-80,100),p(1,120,1200,Math.PI/2,-40,350,145),p(1,240,2400,0,-360,-100,220)];
    case 'crossing':return [p(1,60,600,Math.PI/4,-330+660*q,-240+480*q,100),p(1,120,1200,-Math.PI/4,-330+660*q,240-480*q,145)];
    case 'amplitude':return [p(pulse(t,0,1500,1800)+2*pulse(t,2400,3300,3600)+4*pulse(t,4200,5100,5400),120,1200,Math.PI/4,300,300,145)];
    case 'stationary':return [{a:1,l:120,phase:0,angle:0,x:300,y:300,sigma:145}];
    case 'surround':return events.map(e=>{const a=Math.sin(Math.PI/2*clamp((t/120-e.onset_audio_s)/e.fade_in_s,0,1))**2*Math.sin(Math.PI/2*clamp((e.end_audio_s-t/120)/e.fade_out_s,0,1))**2;return p(a,e.wavelength_km,10*e.wavelength_km,Math.PI/2-e.azimuth_deg*Math.PI/180,e.center_x_km,e.center_y_km,170);}).filter(p=>p.a>0);
    default:throw Error('Unknown calibration pattern');
  }
}
function fieldValue(ps,x,y){
  let z=0;
  for(const p of ps){
    if(p.type==='radial'){
      const c=config.radial,r=Math.hypot(x,y),phase=TAU/c.wavelengthGrowth*Math.log1p(c.wavelengthGrowth*r/c.innerWavelengthKm)-TAU*p.time/c.periodSeconds;
      const envelope=Math.sin(Math.PI/2*clamp(r/c.sourceTaperKm,0,1))**2*Math.cos(Math.PI/2*clamp((r-c.outerTaperStartKm)/(c.outerTaperEndKm-c.outerTaperStartKm),0,1))**2;
      z+=envelope*Math.cos(phase);continue;
    }
    const e=x-p.x,n=y-p.y;z+=p.a*Math.exp(-(e*e+n*n)/(2*p.sigma*p.sigma))*Math.cos(TAU/p.l*(e*Math.cos(p.angle)+n*Math.sin(p.angle))-p.phase);
  }
  const edge=Math.max(Math.abs(x),Math.abs(y));
  return z*(edge>880?Math.cos(Math.PI/2*clamp((edge-880)/144,0,1))**2:1);
}
let radialBasis=null;
function field(id,t,events=[],output=null){
  const values=output||new Float64Array(512*512);
  if(id==='radial_chirp'){
    if(!radialBasis){const pa=packets(id,0),pb=packets(id,config.radial.periodSeconds/4);radialBasis=[new Float64Array(512*512),new Float64Array(512*512)];for(let j=0;j<512;j++)for(let i=0;i<512;i++){const x=-1024+4*i,y=-1024+4*j,k=j*512+i;radialBasis[0][k]=fieldValue(pa,x,y);radialBasis[1][k]=fieldValue(pb,x,y);}}
    const a=Math.cos(TAU*t/config.radial.periodSeconds),b=Math.sin(TAU*t/config.radial.periodSeconds);for(let k=0;k<values.length;k++)values[k]=radialBasis[0][k]*a+radialBasis[1][k]*b;return values;
  }
  const ps=packets(id,t,events);
  for(let j=0;j<512;j++)for(let i=0;i<512;i++)values[j*512+i]=fieldValue(ps,-1024+4*i,-1024+4*j);
  return values;
}
function sampleGrid(values,x,y){
  const u=(x+1024)/4,v=(y+1024)/4;
  if(u<0||u>511||v<0||v>511)throw Error('Sample outside native grid');
  const i=Math.min(510,Math.floor(u)),j=Math.min(510,Math.floor(v)),a=u-i,b=v-j,k=j*512+i;
  return (1-b)*((1-a)*values[k]+a*values[k+1])+b*((1-a)*values[k+512]+a*values[k+513]);
}
function geometry(cx,cy,angle,reverse=false){
  const a=angle*Math.PI/180,dx=Math.sin(a),dy=Math.cos(a),h=config.pathKm/2;
  const x=clamp(cx,-880+h*Math.abs(dx),880-h*Math.abs(dx)),y=clamp(cy,-880+h*Math.abs(dy),880-h*Math.abs(dy));
  const direction=reverse?-1:1;
  return {cx:x,cy:y,angle,reverse,start:[x-h*dx*direction,y-h*dy*direction],end:[x+h*dx*direction,y+h*dy*direction]};
}
function profile(values,g){
  return Array.from({length:241},(_,i)=>{const q=i/240,x=g.start[0]+q*(g.end[0]-g.start[0]),y=g.start[1]+q*(g.end[1]-g.start[1]);return {distance_km:i*4,x_km:x,y_km:y,value:sampleGrid(values,x,y)};});
}
function at(p,q){const x=clamp(q,0,1)*(p.length-1),i=Math.min(p.length-2,Math.floor(x));return p[i].value+(p[i+1].value-p[i].value)*(x-i);}
function extrema(p,sign=1){
  const found=[];
  for(let i=1;i<p.length-1;i++){
    const a=sign*p[i-1].value,b=sign*p[i].value,c=sign*p[i+1].value;
    if(b>=config.crestThreshold&&b>a&&b>=c){const d=clamp(0.5*(a-c)/(a-2*b+c),-.5,.5),q=(i+d)/(p.length-1);found.push({q,value:sign*(b-.25*(a-c)*d)});}
  }
  return found;
}
function pitchHz(value){return config.referenceHz*2**(value*config.semitonesPerUnit/12);}
function readPosition(t,s){
  if(s.method!=='audification')return {q:clamp(t/s.duration,0,1),active:t>=0&&t<s.duration};
  const u=t-config.burstOffset,k=Math.floor(u/config.burstInterval),local=u-k*config.burstInterval,d=config.pathKm/s.speed;
  return {q:clamp(local/d,0,1),active:k>=0&&local<d&&t<8};
}
function render(p,s,fs=48000){
  const seconds=s.method==='audification'?8:s.duration,n=Math.round(seconds*fs),data=new Float32Array(n),events=[];
  if(s.method==='pitch'){
    let phase=0;
    for(let i=0;i<n;i++){const t=i/fs;phase+=TAU*pitchHz(at(p,t/seconds))/fs;data[i]=config.pitchGain*Math.sin(phase);}
  }else if(s.method==='pulses'){
    for(const sign of s.troughs?[1,-1]:[1])for(const e of extrema(p,sign)){
      const time=e.q*seconds,frequency=sign===1?700:220;events.push({time,value:e.value,sign,q:e.q});
      const start=Math.round(time*fs),length=Math.round(config.pulseSeconds*fs);
      for(let j=0;j<length&&start+j<n;j++){const t=j/fs,envelope=Math.min(1,t/.002)*Math.exp(-t/.012)*(1-Math.exp(-(config.pulseSeconds-t)/.002));data[start+j]+=config.pulseGain*Math.abs(e.value)*envelope*Math.sin(TAU*frequency*t);}
    }
  }else if(s.method==='audification'){
    const length=config.pathKm/s.speed;
    for(let onset=config.burstOffset;onset+length<=seconds;onset+=config.burstInterval){
      events.push({time:onset,duration:length});const start=Math.round(onset*fs),count=Math.round(length*fs);
      for(let j=0;j<count;j++){const q=j/(count-1),window=Math.sin(Math.PI/2*Math.min(1,q/.05,(1-q)/.05))**2;data[start+j]=config.audificationGain*at(p,q)*window;}
    }
  }else throw Error('Unknown sound method');
  let peak=0;
  for(let i=0;i<n;i++){data[i]*=Math.min(1,i/(.02*fs),(n-1-i)/(.02*fs));peak=Math.max(peak,Math.abs(data[i]));}
  if(peak>.98)throw Error('Fixed gain would clip this profile; playback stopped');
  return {data,seconds,events,peak,fs};
}
const api={config,packets,fieldValue,field,sampleGrid,geometry,profile,at,extrema,pitchHz,readPosition,render,radialWavelength,radialCrestRadius};
if(typeof module!=='undefined')module.exports=api;else root.SonawgTransect=api;
})(typeof window!=='undefined'?window:globalThis);
