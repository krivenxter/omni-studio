const host=document.getElementById('planet');
const control=host.querySelector('.planet-pause');
let started=false;
async function startPlanet(){
 if(started)return;
 started=true;control.disabled=true;
 try{await import('./planet.js?v=59');host.classList.remove('planet-poster-only');}
 catch{host.classList.add('planet-fallback');}
 finally{control.disabled=false;}
}
if(matchMedia('(prefers-reduced-motion: reduce)').matches){
 host.classList.add('planet-poster-only');
 control.setAttribute('aria-label','Включить 3D-планету');
 control.setAttribute('aria-pressed','false');
 control.addEventListener('click',startPlanet,{once:true});
}else{
 const start=()=>{if('requestIdleCallback' in window)requestIdleCallback(startPlanet,{timeout:1500});else setTimeout(startPlanet,250);};
 if(document.readyState==='complete')start();else addEventListener('load',start,{once:true});
}
