'use strict';
const typeset=text=>text.replace(/(^|[\s«(])(а|в|во|и|к|ко|на|о|об|обо|от|по|с|со|у|за|из|до|не|но|для|при|или|без|над|под) +(?=\S)/giu,'$1$2\u00a0');
const tabs = [...document.querySelectorAll('[data-strategy]')];
function selectStrategy(index, focus = false) {
 const data = strategies[index];
 tabs.forEach((tab,i) => { tab.setAttribute('aria-selected',String(i===index));tab.tabIndex=i===index?0:-1; });
 const fields={title:data.title,description:data.description,audience:data.audience,limit:data.limit};
 Object.entries(fields).forEach(([key,value]) => { document.getElementById(`strategy-${key}`).textContent=typeset(value); });
 const kpis=document.getElementById('strategy-kpi');kpis.replaceChildren(...data.kpi.split(';').map(text=>{const item=document.createElement('li');item.textContent=typeset(text.trim());return item;}));
 document.getElementById('strategy-title').style.whiteSpace='pre-line';
 document.getElementById('strategy-panel').setAttribute('aria-labelledby',`tab-${index}`);
 document.querySelector('.strategy-details').open=false;
 renderStrategy(index);
 if(focus) tabs[index].focus();
}
tabs.forEach((tab,index)=>{
 tab.addEventListener('click',()=>{selectStrategy(index);if(matchMedia('(max-width: 640px)').matches)document.getElementById('strategy-panel').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});});
 tab.addEventListener('keydown',event=>{
  const moves={ArrowDown:1,ArrowUp:-1,ArrowRight:1,ArrowLeft:-1};
  if(event.key in moves){event.preventDefault();selectStrategy((index+moves[event.key]+tabs.length)%tabs.length,true);}
  if(event.key==='Home'||event.key==='End'){event.preventDefault();selectStrategy(event.key==='Home'?0:tabs.length-1,true);}
 });
});
const menuButton=document.querySelector('.menu-toggle');
const navigation=document.getElementById('navigation');
function closeMenu(){menuButton.setAttribute('aria-expanded','false');menuButton.setAttribute('aria-label','Открыть меню');navigation.classList.remove('is-open');document.querySelector('.header').classList.remove('menu-is-open');}
menuButton.addEventListener('click',()=>{const open=menuButton.getAttribute('aria-expanded')!=='true';menuButton.setAttribute('aria-expanded',String(open));menuButton.setAttribute('aria-label',open?'Закрыть меню':'Открыть меню');navigation.classList.toggle('is-open',open);document.querySelector('.header').classList.toggle('menu-is-open',open);});
navigation.querySelectorAll('a').forEach(link=>link.addEventListener('click',closeMenu));
document.addEventListener('keydown',event=>{if(event.key==='Escape')closeMenu();});
let previousFocus;
function openDialog(dialog){previousFocus=document.activeElement;dialog.showModal();document.body.style.overflow='hidden';}
function closeDialog(dialog){
 if(dialog.id!=='chat-dialog'||matchMedia('(prefers-reduced-motion: reduce)').matches){dialog.close();return;}
 if(dialog.classList.contains('is-closing'))return;
 dialog.classList.add('is-closing');
 const exit=dialog.animate([{opacity:1,transform:'translateY(0)'},{opacity:0,transform:'translateY(10px)'}],{duration:200,easing:'ease-in',fill:'forwards'});
 let finished=false;
 const finish=()=>{if(finished)return;finished=true;clearTimeout(fallback);dialog.close();dialog.classList.remove('is-closing');exit.cancel();};
 const fallback=setTimeout(finish,240);
 exit.finished.then(finish,()=>{});
}
document.querySelectorAll('dialog').forEach(dialog=>{
 dialog.querySelectorAll('[data-close-dialog]').forEach(button=>button.addEventListener('click',()=>closeDialog(dialog)));
 dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)closeDialog(dialog);}});
 dialog.addEventListener('cancel',event=>{if(dialog.id==='chat-dialog'){event.preventDefault();closeDialog(dialog);}});
 dialog.addEventListener('close',()=>{document.body.style.overflow='';previousFocus?.focus();});
});
document.querySelectorAll('[data-open-legal]').forEach(button=>button.addEventListener('click',()=>openDialog(document.getElementById('legal-dialog'))));
const chat=document.getElementById('chat-dialog');
document.querySelectorAll('[data-open-chat]').forEach(button=>button.addEventListener('click',()=>{openDialog(chat);if(window.OMNI_BOT.chatUrl)document.getElementById('chat-input').focus();}));
const botUrl=window.OMNI_BOT.chatUrl;
const chatForm=document.getElementById('chat-form');
let chatSession=crypto.randomUUID();
try { chatSession=sessionStorage.getItem('omni-chat-session')||chatSession;sessionStorage.setItem('omni-chat-session',chatSession); } catch {}
function addChatMessage(text,role){const element=document.createElement('div');element.className=`message ${role}`;element.textContent=text;document.getElementById('chat-log').append(element);const log=document.getElementById('chat-log');log.scrollTop=log.scrollHeight;}
if(botUrl){
 document.getElementById('chat-status').textContent='Расскажите о вашей задаче';
 document.getElementById('chat-welcome').textContent='Здравствуйте! Расскажите о вашем бизнесе и задаче.';
 chatForm.hidden=false;
}
chatForm.addEventListener('submit',async event=>{
 event.preventDefault();const input=document.getElementById('chat-input');const message=input.value.trim();if(!message||!botUrl)return;
 const submit=chatForm.querySelector('button');const error=document.getElementById('chat-error');
 submit.disabled=true;input.disabled=true;error.textContent='';addChatMessage(message,'user');
 const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),60000);
 try {
  const response=await fetch(botUrl,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'sendMessage',sessionId:chatSession,chatInput:message}),signal:controller.signal});
  if(!response.ok)throw new Error('Chat unavailable');
  let data=await response.json();if(Array.isArray(data))data=data[0];const reply=data?.output??data?.text;
  if(typeof reply!=='string'||!reply.trim())throw new Error('Empty response');
  addChatMessage(reply,'assistant');input.value='';
 } catch {error.textContent='Не удалось получить ответ. Попробуйте ещё раз или продолжите в Telegram.';}
 finally {clearTimeout(timeout);submit.disabled=false;input.disabled=false;input.focus();}
});

// Motion follows the scroll; native content stays visible without JavaScript.
const motionPreference=matchMedia('(prefers-reduced-motion: reduce)');
const revealItems=[...document.querySelectorAll('.hero-top,.hero-copy h1,.hero-lead,.hero-actions,.hero-bottom,.intro-grid,.direction,.section-heading,.individual-factor,.individual-result,.strategy-layout,.franchise-copy,.franchise-package,.ai-copy,.ai-console,.contact-grid,.footer-top,.footer-bottom')];
if(!motionPreference.matches){
 document.documentElement.classList.add('motion-enabled');
 document.querySelectorAll('.hero-copy h1,.hero-lead,.hero-actions').forEach((element,index)=>element.style.setProperty('--reveal-delay',`${index*70}ms`));
 const revealObserver=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('is-visible');revealObserver.unobserve(entry.target);}});},{threshold:0,rootMargin:'0px 0px -24px 0px'});
 revealItems.forEach(element=>{element.classList.add('reveal');revealObserver.observe(element);});
 motionPreference.addEventListener('change',event=>{if(event.matches){revealItems.forEach(element=>element.classList.add('is-visible'));revealObserver.disconnect();}});
}
const processSteps=[...document.querySelectorAll('.process-list li')];
let currentStage=-1;
function updateProcess(){
 const target=innerWidth<=640?innerHeight*.6:innerHeight*.48;
 const index=processSteps.reduce((best,step,i)=>Math.abs(step.getBoundingClientRect().top-target)<Math.abs(processSteps[best].getBoundingClientRect().top-target)?i:best,0);
 if(index===currentStage)return;currentStage=index;
 processSteps.forEach((step,i)=>step.classList.toggle('is-active',i===index));
 const visual=document.querySelector('.process-visual');visual.dataset.stage=index;
 visual.setAttribute('aria-label','Этап работы: '+processSteps[index].querySelector('h3').textContent);
 renderProcess(index);
 document.querySelectorAll('[data-stage-dot]').forEach((dot,i)=>dot.classList.toggle('current',i<=index));
}
let pageMotionFrame;
function pageMotion(){if(pageMotionFrame)return;pageMotionFrame=requestAnimationFrame(()=>{
 pageMotionFrame=null;updateProcess();
 const header=document.querySelector('.header');header.classList.toggle('is-scrolled',scrollY>24);
 const dark=[...document.querySelectorAll('.process,.ai-section,.contact,.footer')].some(el=>{const r=el.getBoundingClientRect();return r.top<45&&r.bottom>45;});header.classList.toggle('is-over-dark',dark);
 const bridge=document.querySelector('.process-footer');const box=bridge.getBoundingClientRect();
 const progress=Math.max(0,Math.min(1,(innerHeight-box.top)/(innerHeight*.72)));
 bridge.style.setProperty('--bridge-progress',motionPreference.matches?1:progress);
 bridge.classList.toggle('is-revealed',progress>.2);
 bridge.querySelectorAll('h2 b').forEach((word,i)=>{const value=motionPreference.matches?1:Math.max(0,Math.min(1,(progress-.08-i*.12)/.18));word.style.opacity=value;word.style.transform=`translateY(${(1-value)*22}px)`;});
});}
addEventListener('scroll',pageMotion,{passive:true});addEventListener('resize',pageMotion);pageMotion();updateProcess();
// Keep native details semantics while animating both opening and closing.
document.querySelectorAll('details').forEach(details=>{
 const summary=details.querySelector('summary');let animation;details.classList.toggle('is-expanded',details.open);
 details.addEventListener('toggle',()=>{if(!animation)details.classList.toggle('is-expanded',details.open);});
 summary.addEventListener('click',event=>{
  if(motionPreference.matches)return;
  event.preventDefault();animation?.cancel();
  const start=details.getBoundingClientRect().height;
  const closing=details.open&&details.dataset.closing!=='true';
  details.dataset.closing=closing?'true':'';details.open=true;details.classList.toggle('is-expanded',!closing);
  const end=closing?summary.getBoundingClientRect().height:details.scrollHeight;
  details.style.overflow='hidden';
  animation=details.animate({height:[start+'px',end+'px']},{duration:320,easing:'cubic-bezier(.2,.7,.3,1)'});
  animation.onfinish=()=>{details.open=!closing;delete details.dataset.closing;details.style.overflow='';animation=null;};
 });
});
renderStrategy(0);
const photoObserver=new IntersectionObserver(entries=>entries.forEach(entry=>entry.target.classList.toggle('is-assembled',entry.isIntersecting)),{threshold:.2});
document.querySelectorAll('.directions').forEach(element=>photoObserver.observe(element));
const contactSection=document.getElementById('contact');
contactSection.addEventListener('pointermove',event=>{if(motionPreference.matches)return;const box=contactSection.getBoundingClientRect();contactSection.style.setProperty('--cosmos-x',((event.clientX-box.left)/box.width-.5)*320+'px');contactSection.style.setProperty('--cosmos-y',((event.clientY-box.top)/box.height-.5)*240+'px');});

contactSection.addEventListener('pointerleave',()=>{contactSection.style.setProperty('--cosmos-x','0px');contactSection.style.setProperty('--cosmos-y','0px');});

// Replay once on pointer, keyboard focus, or touch; never imply measured results.
const leadTokens=[...document.querySelectorAll('[data-lead-token]')];
const leadTimers=new WeakMap();
function playLeadToken(token){
 if(motionPreference.matches||token.classList.contains('is-playing'))return;
 clearTimeout(leadTimers.get(token));token.classList.add('is-playing');
 leadTimers.set(token,setTimeout(()=>token.classList.remove('is-playing'),1600));
}
leadTokens.forEach(token=>{
 token.addEventListener('pointerenter',event=>{if(event.pointerType!=='touch')playLeadToken(token);});
 token.addEventListener('focus',()=>playLeadToken(token));
 token.addEventListener('click',()=>playLeadToken(token));
});
const leadObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{
 if(entry.isIntersecting){leadTokens.filter(token=>token.dataset.leadToken!=='photo').forEach(playLeadToken);leadObserver.unobserve(entry.target);}
}),{threshold:.7});
const heroLead=document.querySelector('.hero-lead');if(heroLead)leadObserver.observe(heroLead);

motionPreference.addEventListener('change',()=>{document.documentElement.classList.toggle('motion-enabled',!motionPreference.matches);if(motionPreference.matches){leadTokens.forEach(token=>{clearTimeout(leadTimers.get(token));token.classList.remove('is-playing');});document.querySelectorAll('.reveal').forEach(el=>el.classList.add('is-visible'));}pageMotion();});

// Reveal upcoming plans from behind the section edge.
const tariffsSection=document.getElementById('tariffs');
if(tariffsSection&&!motionPreference.matches){
 tariffsSection.classList.add('tariffs-motion-ready');
 const tariffsObserver=new IntersectionObserver(entries=>{if(entries.some(entry=>entry.isIntersecting)){tariffsSection.classList.add('tariffs-visible');tariffsObserver.disconnect();}},{threshold:.18});
 tariffsObserver.observe(tariffsSection);
}
