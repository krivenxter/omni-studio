'use strict';
// Each illustration shares coordinates with its connectors, at every viewport.
const visualIcon=(name,x,y,size=24)=>`<use href="#i-${name}" x="${x}" y="${y}" width="${size}" height="${size}"/>`;
const visualLabel=(label)=>{const words=label.split(' ');if(label.length>12&&words.length>1){const middle=Math.ceil(words.length/2);return `<text x="14" y="58" text-anchor="start"><tspan x="14">${words.slice(0,middle).join(' ')}</tspan><tspan x="14" dy="15">${words.slice(middle).join(' ')}</tspan></text>`;}return `<text x="14" y="58" text-anchor="start">${label}</text>`;};
const visualCard=(x,y,w,h,label,icon,blue=false)=>`<g class="scene-card ${blue?'scene-blue':''}" transform="translate(${x} ${y})"><rect width="${w}" height="${Math.max(h,label.length>12&&label.includes(' ')?88:72)}" rx="12"/>${visualIcon(icon,14,12,22)}${visualLabel(label)}</g>`;
const visualDefs=`<defs><linearGradient id="scene-blue" x2=".8" y2="1"><stop stop-color="#7898ff"/><stop offset=".5" stop-color="#365dff"/><stop offset="1" stop-color="#1835bf"/></linearGradient><linearGradient id="scene-paper" x2="1" y2="1"><stop stop-color="#fff"/><stop offset="1" stop-color="#edf1ff"/></linearGradient><filter id="scene-shadow" x="-40%" y="-40%" width="180%" height="200%"><feDropShadow dx="0" dy="7" stdDeviation="7" flood-color="#183568" flood-opacity=".12"/></filter></defs>`;
const line=d=>`<path class="scene-connector" d="${d}"/>`;
const strategyScenes=[
 ()=>`<g class="map-roads" mask="url(#map-fade)"><defs><radialGradient id="map-opacity"><stop offset=".55" stop-color="white"/><stop offset="1" stop-color="black"/></radialGradient><mask id="map-fade"><rect width="560" height="230" fill="url(#map-opacity)"/></mask></defs><path d="M0 48H560M0 156H560M110 0V220M450 0V220M0 0 560 220"/></g><ellipse class="map-radius" cx="280" cy="110" rx="154" ry="86"/>${line('M240 105H166M320 105H394M280 142V172')}${visualCard(223,67,114,80,'Ваш бизнес','store',true)}${visualCard(48,48,118,72,'Люди рядом','user')}${visualCard(394,48,118,72,'Карты и отзывы','pin')}<g class="map-location">${visualIcon('pin',266,169,28)}</g>`,
 ()=>`${line('M280 105 127 47M280 105 435 47M280 105 127 176M280 105 435 176')}${visualCard(219,66,122,80,'Ваша идея','spark',true)}${visualCard(66,10,122,67,'Репост','share')}${visualCard(374,10,122,67,'Репост','share')}${visualCard(66,144,122,67,'Аудитория','user')}${visualCard(374,144,122,67,'Аудитория','user')}`,
 ()=>`${line('M113 110H448')}<g class="episode-strip">${visualCard(35,54,138,110,'Завязка','film')}${visualCard(211,38,138,110,'Развитие','trending',true)}${visualCard(387,65,138,110,'Продолжение','play')}</g><path class="scene-loop" d="M456 185Q280 242 105 185"/>`,
 ()=>`${line('M280 108 112 66M280 108 448 66M280 108 125 175M280 108 435 175')}<circle class="trust-halo" cx="280" cy="108" r="73"/><g class="scene-card scene-blue"><circle cx="280" cy="108" r="48"/>${visualIcon('user',256,77,48)}</g>${visualCard(35,25,132,73,'Опыт','book')}${visualCard(393,25,132,73,'Решения','target')}${visualCard(35,143,132,73,'История','book')}${visualCard(393,143,132,73,'Доверие','shield')}`,
 ()=>`<path class="scene-loop" d="M170 65Q280-15 390 65Q500 160 390 187Q280 248 170 187Q60 150 170 65Z"/>${visualCard(210,66,140,94,'Ваш характер','brain',true)}${visualCard(48,20,124,72,'Рубрика','layout')}${visualCard(388,20,124,72,'Сценарий','plan')}${visualCard(48,148,124,72,'Реакция','heart')}${visualCard(388,148,124,72,'Репост','share')}`,
 ()=>`${line('M145 110H205M355 110H415')}${visualCard(30,68,115,87,'Контент','film')}<g class="funnel"><path d="M205 51H355L325 137V173H235V137Z"/><use href="#i-user" x="264" y="78" width="32" height="32"/><text x="280" y="157" text-anchor="middle">Выбор</text></g>${visualCard(415,68,115,87,'Обращение','message',true)}`
];
strategyScenes.push(
 ()=>`${line('M160 110H220M340 110H400')}${visualCard(25,65,135,95,'Идея','spark')}${visualCard(215,45,130,125,'AI-визуал','wand',true)}${visualCard(400,65,135,95,'Продукт','package')}`,
 ()=>`${line('M280 100V130H95V160M280 130V160M280 130H465V160')}${visualCard(210,10,140,90,'Ваша модель','box',true)}${visualCard(25,160,140,65,'Стандарты','plan')}${visualCard(210,160,140,65,'Партнёры','users')}${visualCard(395,160,140,65,'Рост','chart')}`
);
strategyScenes.push(()=>`${line('M160 110H215M345 110H400')}${visualCard(25,65,135,95,'Идея','spark')}${visualCard(215,45,130,125,'AI-мир','wand',true)}${visualCard(400,65,135,95,'Вселенная','image')}`);
const formatSceneOrder=[4,5,2,8,1,6,3,7];
const formatSceneLabels=['Мемы вызывают реакцию и репосты','Контент ведёт к обращению','История развивается от выпуска к выпуску','Идея становится визуальной вселенной бренда','Идея распространяется через репосты','Рекламная идея раскрывает продукт','Личность формирует доверие','Модель бизнеса передаётся партнёрам'];
function renderStrategy(index){const el=document.getElementById('strategy-graphic');el.dataset.mode=index;el.innerHTML=`<svg class="strategy-scene" viewBox="0 0 560 230" preserveAspectRatio="xMinYMid meet" role="img" aria-label="${formatSceneLabels[index]}">${visualDefs}${strategyScenes[formatSceneOrder[index]]()}</svg>`;const svg=el.querySelector('svg');try{const box=svg.getBBox();if(box.width>0&&box.height>0)svg.setAttribute('viewBox',`${box.x-16} ${box.y-16} ${box.width+32} ${box.height+32}`);}catch{}svg.setAttribute('preserveAspectRatio','xMidYMid meet');if(!matchMedia('(prefers-reduced-motion: reduce)').matches)el.animate([{opacity:0,transform:'translateY(8px)'},{opacity:1,transform:'translateY(0)'}],{duration:450,easing:'ease-out'});}
function renderProcess(stage){
 stage=[0,1,2,4][stage];
 const scene=document.getElementById('process-scene');
 scene.classList.toggle('process-complete',stage===4);
 if(!scene.querySelector('svg')){
  const research=`<g class="process-layer build-research" data-from="0">${visualCard(20,28,125,80,'Бизнес','store')}${visualCard(20,133,125,80,'Аудитория','user')}${line('M145 67H185V115H225M145 173H185V115')}</g>`;
  const lens=`<g class="research-lens" data-only="0"><circle cx="300" cy="115" r="60"/>${visualIcon('search',268,83,64)}<text x="245" y="210">Аудит</text></g>`;
  const plan=`<g class="process-layer build-plan" data-from="1">${visualCard(225,70,150,98,'Стратегия','plan',true)}</g>`;
  const create=`<g class="process-layer build-create" data-from="2">${line('M300 70V36H429M375 119H429M300 168V202H429')}${visualCard(429,7,110,63,'Съёмка','camera')}${visualCard(429,85,110,63,'Контент','film')}${visualCard(429,163,110,63,'Форматы','layout')}</g>`;
  const release=`<g class="process-layer build-release" data-from="3"><path class="release-path" d="M484 226Q484 257 375 257H239"/><g class="release-badge"><rect x="225" y="237" width="154" height="38" rx="19"/>${visualIcon('send',239,246,20)}<text x="267" y="261">Аналитика</text></g></g>`;
  const success=`<g class="process-layer build-success" data-from="4"><circle class="success-aura" cx="300" cy="119" r="79"/><path class="success-chart" d="m264 138 21-20 19 9 32-27"/><g class="check-seal success-seal" transform="translate(300 177)"><circle r="17"/>${visualIcon('check',-10,-10,20)}</g></g>`;
  scene.innerHTML=`<svg viewBox="0 0 560 290" aria-hidden="true">${visualDefs}${research}${lens}${plan}${create}${release}${success}</svg>`;
 }
 scene.querySelectorAll('[data-from],[data-only]').forEach(group=>{
  const shown=group.hasAttribute('data-only')?stage===Number(group.dataset.only):stage>=Number(group.dataset.from);
  group.classList.toggle('is-present',shown);
  group.setAttribute('aria-hidden',String(!shown));
 });
}
