import * as THREE from './vendor/three.module.min.js';
const host=document.getElementById('planet');
const mobile=matchMedia('(max-width: 640px)').matches;
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
let renderer;
try { renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,preserveDrawingBuffer:true,powerPreference:'low-power'}); }
catch { host.classList.add('planet-fallback'); }
if(renderer){
 renderer.setPixelRatio(Math.min(devicePixelRatio,mobile?1.25:1.75));
 renderer.setClearColor(0x000000,0);renderer.outputColorSpace=THREE.SRGBColorSpace;
 renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.2;
 renderer.shadowMap.enabled=!mobile;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
 host.prepend(renderer.domElement);renderer.domElement.setAttribute('aria-hidden','true');
 const scene=new THREE.Scene();
 if(!mobile){
 const pmrem=new THREE.PMREMGenerator(renderer);
 const room=new THREE.Scene();room.background=new THREE.Color(0x747780);
 for(const [position,scale,intensity] of [[[-3,4,4],[5,1.8,1],3.2],[[4,1,-2],[1.2,7,1],2.6]]){
  const panel=new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({color:new THREE.Color().setScalar(intensity),side:THREE.DoubleSide}));panel.position.set(...position);panel.scale.set(...scale);panel.lookAt(0,0,0);room.add(panel);
 }
 scene.environment=pmrem.fromScene(room,.12).texture;room.traverse(object=>{object.geometry?.dispose();object.material?.dispose();});pmrem.dispose();
 }
 const camera=new THREE.PerspectiveCamera(35,1,.1,40);camera.position.set(0,1.15,7.2);camera.lookAt(0,0,0);
 scene.add(new THREE.HemisphereLight(0xf5f7ff,0x9ba8bf,1.1));
 const key=new THREE.DirectionalLight(0xffffff,1.9);key.position.set(-2,2.8,5);key.castShadow=!mobile;key.shadow.mapSize.set(2048,2048);key.shadow.camera.left=-4;key.shadow.camera.right=4;key.shadow.camera.top=4;key.shadow.camera.bottom=-4;key.shadow.normalBias=.008;scene.add(key);
 const rim=new THREE.DirectionalLight(0xc7ddff,1.8);rim.position.set(3,1,-3);scene.add(rim);
 const fill=new THREE.PointLight(0xc9e8ff,.4);fill.position.set(2,1,4);scene.add(fill);
 const root=new THREE.Group();root.rotation.z=.22;root.scale.setScalar(0);scene.add(root);
 const material=mobile?new THREE.MeshPhongMaterial({color:0x264aef,specular:0x7189d9,shininess:24}):new THREE.MeshPhysicalMaterial({color:0x1537cb,metalness:.35,roughness:.28,clearcoat:1,clearcoatRoughness:.16,envMapIntensity:1.1});
 let assetsReady=false,assetsFailed=false;
 const loadingManager=new THREE.LoadingManager(()=>{
  if(assetsFailed)return;
  renderer.compileAsync(scene,camera).then(()=>{assetsReady=true;last=performance.now();host.classList.add('planet-ready');}).catch(()=>{assetsReady=true;last=performance.now();host.classList.add('planet-ready');});
 });
 loadingManager.onError=()=>{assetsFailed=true;host.classList.add('planet-fallback');host.classList.remove('planet-ready');};
 const textureLoader=new THREE.TextureLoader(loadingManager);
 const surface=textureLoader.load(mobile?'./assets/lunar-surface-mobile.webp':'./assets/lunar-surface.webp');surface.wrapS=THREE.RepeatWrapping;surface.anisotropy=renderer.capabilities.getMaxAnisotropy();
 const heightMap=mobile?null:textureLoader.load('./assets/lunar-height.webp');if(heightMap){heightMap.wrapS=THREE.RepeatWrapping;heightMap.anisotropy=surface.anisotropy;}
 material.bumpMap=surface;material.bumpScale=.075;if(!mobile){material.displacementMap=heightMap;material.displacementScale=.055;material.displacementBias=-.0275;}
 if(!mobile){material.roughness=.3;material.metalness=.12;material.clearcoat=.75;material.clearcoatRoughness=.26;material.envMapIntensity=1;material.specularIntensity=.35;}
 material.color.setHex(0x264aef);material.emissive.setHex(0x264aef);material.emissiveIntensity=.12;
 const growthUniforms={time:{value:0},strength:{value:0}};
 material.onBeforeCompile=shader=>{
  shader.uniforms.growthTime=growthUniforms.time;shader.uniforms.growthStrength=growthUniforms.strength;
  shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vGrowthPosition;').replace('#include <begin_vertex>','#include <begin_vertex>\nvGrowthPosition=position;');
  shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vGrowthPosition;uniform float growthTime;uniform float growthStrength;');
  // Preserve the site's cobalt hue after lighting and tone mapping.
  shader.fragmentShader=shader.fragmentShader.replace('#include <colorspace_fragment>',`#include <colorspace_fragment>
   float lightness=dot(gl_FragColor.rgb,vec3(.2126,.7152,.0722));
   vec3 brandBlue=vec3(.149,.290,.937);
   vec3 shadedBrand=brandBlue*(.35+lightness*1.45);
   gl_FragColor.rgb=mix(shadedBrand,gl_FragColor.rgb,.25);
   gl_FragColor.rgb*=mix(.7,1.2,smoothstep(.1,.65,texture2D(bumpMap,vBumpMapUv).r));
   float scanProgress=clamp((growthTime-.6)/4.6,0.,1.);
   float scanY=mix(-1.35,1.35,scanProgress);
   float warp=sin(vGrowthPosition.x*3.+vGrowthPosition.z*2.+growthTime*.6)*.07+sin(vGrowthPosition.z*6.-vGrowthPosition.x*2.)*.025;
   float scanDistance=vGrowthPosition.y-scanY+warp;
   float heatWidth=.23+.035*sin(vGrowthPosition.x*4.+growthTime*.5);
   float surfaceHeat=texture2D(bumpMap,vBumpMapUv).r;
   float heat=exp(-pow((scanDistance+.07)/heatWidth,2.))*(.88+.12*smoothstep(.15,.7,surfaceHeat));
   vec3 thermal=mix(vec3(.114,.145,.153),vec3(.35,.82,.82),smoothstep(.08,.42,heat));
   thermal=mix(thermal,vec3(.867,.961,.580),smoothstep(.38,.78,heat));
   thermal=mix(thermal,vec3(.93,1.,.78),smoothstep(.82,1.,heat));
   float scanMask=exp(-pow(scanDistance/.43,2.))*growthStrength;
   float scanEdge=exp(-pow((scanDistance-.09)/.035,2.))*growthStrength;
   thermal+=vec3(.04,.08,.07)*scanEdge;
   gl_FragColor.rgb=mix(gl_FragColor.rgb,thermal,scanMask*.94);

  `);
  shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>' ,`#include <color_fragment>
  float terrain=texture2D(bumpMap,vBumpMapUv).r;
  diffuseColor.rgb*=mix(vec3(.42,.55,.83),vec3(1.28),smoothstep(.16,.72,terrain));
 `);};
 const globe=new THREE.Group();globe.scale.setScalar(1.36);root.add(globe);
 const sphere=new THREE.Mesh(new THREE.SphereGeometry(1.04,mobile?48:160,mobile?32:96),material);sphere.castShadow=true;sphere.receiveShadow=true;globe.add(sphere);
 const gridMaterial=new THREE.LineBasicMaterial({color:0xc8deff,transparent:true,opacity:.27,depthWrite:false});
 for(let lat=-60;lat<=60;lat+=30){const y=Math.sin(lat*Math.PI/180)*1.09;const radius=Math.cos(lat*Math.PI/180)*1.09;const points=[];for(let i=0;i<=160;i++){const a=i/160*Math.PI*2;points.push(new THREE.Vector3(Math.cos(a)*radius,y,Math.sin(a)*radius));}globe.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points),gridMaterial));}
 for(let j=0;j<8;j++){const points=[];for(let i=0;i<=160;i++){const a=i/160*Math.PI*2;points.push(new THREE.Vector3(Math.cos(a)*Math.cos(j*Math.PI/8)*1.09,Math.sin(a)*1.09,Math.cos(a)*Math.sin(j*Math.PI/8)*1.09));}globe.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points),gridMaterial));}
 const atmosphere=new THREE.Mesh(new THREE.SphereGeometry(1.09,mobile?32:64,mobile?20:48),new THREE.ShaderMaterial({uniforms:{color:{value:new THREE.Color(0x6c95ff)}},vertexShader:'varying vec3 vN;varying vec3 vV;void main(){vec4 p=modelViewMatrix*vec4(position,1.);vN=normalize(normalMatrix*normal);vV=normalize(-p.xyz);gl_Position=projectionMatrix*p;}',fragmentShader:'uniform vec3 color;varying vec3 vN;varying vec3 vV;void main(){float f=pow(1.-abs(dot(normalize(vN),normalize(vV))),3.5);gl_FragColor=vec4(color,f*.1);}',transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));atmosphere.scale.setScalar(1.36);root.add(atmosphere);
 // Two partner worlds inherit the business terrain and develop their own systems.
 const partners=[[-1.9,-.7,.65,.34],[1.83,.6,-.2,.29]].map(([x,y,z,size],index)=>{
  const system=new THREE.Group();root.add(system);
  const skin=mobile?new THREE.MeshPhongMaterial({color:index?0x98d0ff:0xc4e48a,specular:0xcccccc,shininess:35,bumpMap:surface,bumpScale:.012}):new THREE.MeshPhysicalMaterial({color:index?0x98d0ff:0xc4e48a,metalness:0,roughness:index?.27:.3,clearcoat:1,clearcoatRoughness:index?.22:.18,envMapIntensity:1.05,iridescence:index?.65:0,iridescenceIOR:1.35,iridescenceThicknessRange:[150,300],sheen:index?.7:0,sheenColor:0xb8bdff,sheenRoughness:.4,bumpMap:surface,bumpScale:index?.015:.03,displacementMap:heightMap,displacementScale:.012,displacementBias:-.006});
  skin.onBeforeCompile=shader=>{shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
   float terrain=texture2D(bumpMap,vBumpMapUv).r;
   diffuseColor.rgb*=mix(.78,1.12,smoothstep(.1,.85,terrain));
  `);};
  const world=new THREE.Mesh(new THREE.SphereGeometry(size,mobile?24:64,mobile?16:48),skin);world.castShadow=true;world.receiveShadow=true;system.add(world);
  const points=[];for(let i=0;i<=120;i++){const a=i/120*Math.PI*2;points.push(new THREE.Vector3(Math.cos(a)*size*1.8,Math.sin(a)*size*1.08,Math.sin(a)*size*1.44));}
  const ring=new THREE.Line(new THREE.BufferGeometry().setFromPoints(points),new THREE.LineBasicMaterial({color:0x7492c9,transparent:true,opacity:.5}));system.add(ring);
  const moon=new THREE.Mesh(new THREE.SphereGeometry(.045,16,12),new THREE.MeshStandardMaterial({color:0xdff594,roughness:.4}));system.add(moon);
  const connection=new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(),new THREE.Vector3(x,y,z)]),new THREE.LineDashedMaterial({color:0x7694d7,transparent:true,opacity:.35,dashSize:.055,gapSize:.08}));connection.computeLineDistances();root.add(connection);
  return{system,world,ring,moon,connection,target:new THREE.Vector3(x,y,z),size};
 });
 const audience=new THREE.Group();audience.rotation.set(.12,.1,.16);root.add(audience);
 const particleCount=mobile?60:120,positions=new Float32Array(particleCount*3),particleAlpha=new Float32Array(particleCount);
 const audienceGeometry=new THREE.BufferGeometry();audienceGeometry.setAttribute('position',new THREE.BufferAttribute(positions,3));audienceGeometry.setAttribute('particleAlpha',new THREE.BufferAttribute(particleAlpha,1));
 const audienceMaterial=new THREE.PointsMaterial({color:0x3158e8,size:.096,transparent:true,opacity:.8,depthWrite:false});
 audienceMaterial.onBeforeCompile=shader=>{
  shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nattribute float particleAlpha;varying float vParticleAlpha;').replace('#include <begin_vertex>','#include <begin_vertex>\nvParticleAlpha=particleAlpha;');
  shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nvarying float vParticleAlpha;').replace('#include <clipping_planes_fragment>','#include <clipping_planes_fragment>\nif(length(gl_PointCoord-vec2(.5))>.5) discard;').replace('#include <opaque_fragment>','diffuseColor.a*=vParticleAlpha;\n#include <opaque_fragment>');
 };
 audience.add(new THREE.Points(audienceGeometry,audienceMaterial));
 const trails=[1.85,2.12,2.38].map((radius,index)=>{
  const points=[];for(let i=0;i<=160;i++){const a=i/160*Math.PI*2;points.push(new THREE.Vector3(Math.cos(a)*radius,Math.sin(a)*radius*.25,-Math.sin(a)*radius*.968));}
  const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints(points),new THREE.LineBasicMaterial({color:index===1?0x7c95bd:0x476beb,transparent:true,opacity:.34}));audience.add(line);return line;
 });
 let pointerX=0,pointerY=0,scroll=0,targetScroll=0,visible=true,paused=reduced.matches,elapsed=0,last=performance.now(),frame;
 let canvasWidth=0,canvasHeight=0;
 function resize(){const rect=host.getBoundingClientRect();const width=Math.round(rect.width),height=Math.round(rect.height);if(!width||!height||(width===canvasWidth&&height===canvasHeight))return;canvasWidth=width;canvasHeight=height;renderer.setSize(width,height);camera.aspect=width/height;camera.position.z=camera.aspect<1.25?7.8:7.2;camera.updateProjectionMatrix();}
 new ResizeObserver(resize).observe(host);
 document.querySelector('.hero').addEventListener('pointermove',event=>{if(event.pointerType==='touch')return;const box=host.getBoundingClientRect();pointerX=Math.max(-.8,Math.min(.8,(event.clientX-box.left)/box.width-.5));pointerY=Math.max(-.7,Math.min(.7,(event.clientY-box.top)/box.height-.5));});
 document.querySelector('.hero').addEventListener('pointerleave',()=>{pointerX=0;pointerY=0;});
 window.addEventListener('scroll',()=>{targetScroll=Math.max(0,Math.min(window.scrollY/(innerHeight*.65),1));},{passive:true});
 const control=document.querySelector('.planet-pause');
 control.setAttribute('aria-pressed',String(paused));control.innerHTML='<svg class="icon" viewBox="0 0 24 24"><use href="#i-'+(paused?'play':'pause')+'"/></svg>';control.setAttribute('aria-label',paused?'Включить вращение планеты':'Остановить вращение планеты');
 control.addEventListener('click',()=>{paused=!paused;control.setAttribute('aria-pressed',String(paused));control.setAttribute('aria-label',paused?'Включить вращение планеты':'Остановить вращение планеты');control.innerHTML='<svg class="icon" viewBox="0 0 24 24"><use href="#i-'+(paused?'play':'pause')+'"/></svg>';});
 reduced.addEventListener('change',()=>{paused=reduced.matches;control.setAttribute('aria-pressed',String(paused));control.innerHTML='<svg class="icon" viewBox="0 0 24 24"><use href="#i-'+(paused?'play':'pause')+'"/></svg>';});
 let lastDraw=-Infinity;
 function render(now){if(mobile&&now-lastDraw<32){frame=requestAnimationFrame(render);return;}lastDraw=now;const delta=Math.min((now-last)/1000,.05);last=now;if(assetsReady&&!paused&&!document.hidden&&visible)elapsed+=delta;
  if(visible&&!document.hidden&&assetsReady){
   scroll+=(targetScroll-scroll)*Math.min(1,delta*12);
   const still=reduced.matches;
   // Nine-second story. Scroll changes only the transition scale, never its stage.
   const cycle=elapsed%9;
   const reset=THREE.MathUtils.smoothstep(cycle,7.4,9);
   const growth=still?1:THREE.MathUtils.smoothstep(cycle,.4,3.1)*(1-reset);
   const businessScale=.55+growth*.87;
   globe.scale.setScalar(businessScale);atmosphere.scale.setScalar(businessScale);
   growthUniforms.time.value=cycle;growthUniforms.strength.value=still?0:THREE.MathUtils.smoothstep(cycle,0,.8)*(1-THREE.MathUtils.smoothstep(cycle,4.8,5.6));
   host.dataset.growthStage=still?'system':cycle<3.1?'audience':cycle<5.7?'expansion':cycle<7.4?'system':'return';
   root.rotation.y+=((still?0:pointerX*.45+scroll*.8)-root.rotation.y)*.075;
   root.rotation.x+=((still?0:-pointerY*.28+scroll*.2)-root.rotation.x)*.075;
   root.position.x+=((still?0:pointerX*.25)-root.position.x)*.075;
   const intro=still?1:THREE.MathUtils.smoothstep(elapsed,0,1.2);
   const scale=(1.1+(still?0:scroll*.7))*intro;root.scale.lerp(new THREE.Vector3().setScalar(scale),.06);
   root.position.y=scroll*.35;globe.rotation.y=elapsed*.16+(still?0:scroll*1.8+pointerX*.35);
   audienceMaterial.opacity=still?.65:THREE.MathUtils.smoothstep(cycle,0,.9)*(1-THREE.MathUtils.smoothstep(cycle,6.8,9))*.95;
   trails.forEach(line=>{line.material.opacity=.24+growth*.22;line.scale.setScalar((businessScale/1.42)*(innerWidth>640?1.18:1));});
   for(let i=0;i<particleCount;i++){
    const lane=i%3,phase=i*2.399963+elapsed*(.09+lane*.025);
    const travel=(i/particleCount+elapsed*(.18+lane*.025))%1;
    particleAlpha[i]=still?1:THREE.MathUtils.smoothstep(travel,0,.15)*(1-THREE.MathUtils.smoothstep(travel,.78,1));
    const radius=3-travel*(3-businessScale*.95)+lane*.05;
    const attraction=still?0:Math.max(0,Math.cos(phase-Math.atan2(-pointerY,pointerX)))*.12;
    positions[i*3]=Math.cos(phase)*(radius-attraction);
    positions[i*3+1]=Math.sin(phase)*radius*.64;
    positions[i*3+2]=Math.sin(phase*1.4+i)*.45;
   }
   audienceGeometry.attributes.position.needsUpdate=true;audienceGeometry.attributes.particleAlpha.needsUpdate=true;
   audience.rotation.z=.16+(still?0:Math.sin(elapsed*.12)*.035+pointerX*.05);
   partners.forEach((partner,index)=>{
    const emergence=still?1:THREE.MathUtils.smoothstep(elapsed,.25+index*.4,1.5+index*.6);
    partner.system.scale.setScalar(Math.max(.001,emergence*(businessScale/1.42)));
    const orbitStart=.25+index*.4;
    const orbitAge=still?0:Math.max(0,elapsed-orbitStart);
    const angle=Math.atan2(partner.target.z,partner.target.x)+orbitAge*.48;
    const radius=2.2+index*.1;
    const orbitPosition=new THREE.Vector3(Math.cos(angle)*radius,Math.sin(angle)*radius*.48+partner.target.y*.3,Math.sin(angle)*radius*.88);
    const orbitBlend=still?0:THREE.MathUtils.smoothstep(elapsed,orbitStart,orbitStart+.65);
    partner.system.position.copy(partner.target).lerp(orbitPosition,orbitBlend).multiplyScalar(.6+emergence*.4);
    partner.world.rotation.y=elapsed*.15;partner.ring.rotation.z=still?0:Math.sin(elapsed*.2+index)*.25;
    partner.moon.position.set(Math.cos(elapsed*.5+index)*partner.size*1.8,Math.sin(elapsed*.5+index)*partner.size*1.08,Math.sin(elapsed*.5+index)*partner.size*1.44);
    partner.connection.material.opacity=emergence*.45;
    const attribute=partner.connection.geometry.attributes.position;attribute.setXYZ(1,partner.system.position.x,partner.system.position.y,partner.system.position.z);attribute.needsUpdate=true;
   });
   renderer.render(scene,camera);
  }
  frame=requestAnimationFrame(render);
 }
 new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;},{rootMargin:'100px'}).observe(host);
 renderer.domElement.addEventListener('webglcontextlost',event=>{event.preventDefault();cancelAnimationFrame(frame);host.classList.add('planet-fallback');});
 resize();render(last);
 window.addEventListener('pagehide',()=>cancelAnimationFrame(frame));
 window.addEventListener('pageshow',event=>{if(event.persisted){last=performance.now();frame=requestAnimationFrame(render);}});
}
