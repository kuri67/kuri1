import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import './style.css';

const app = document.querySelector<HTMLDivElement>('#app')!;
app.innerHTML = `<main><header><a class="brand">◈ 未完成的世界 <small>THE UNFINISHED WORLD</small></a><span>可玩原型 / CHAPTER 01</span><button id="reset">↻ 重新开始</button></header><section id="stage"><div id="view"></div><div class="chapter"><span>01 — 绘桥之章</span><h1>路，在笔下生长。</h1><p>穿过失色的遗迹，走向那一束光。</p></div><div class="badge" id="mode">● 探索中 · 物理运行</div><div id="drawpanel" hidden><div class="eyebrow">THE CREATION DESK / 创作台</div><h2>给世界，添上一笔。</h2><p>一笔画出封闭轮廓。细长的形状适合搭桥。</p><canvas id="paper" width="840" height="480" aria-label="绘画画布"></canvas><div class="tools"><button id="undo">撤销</button><button id="clear">清空画布</button><button id="example">试试桥板轮廓</button><button id="rework">收回上件作品</button></div><p id="ink">从任意一点开始，回到起点闭合（允许 24 像素误差）。</p><div class="tools"><button id="cancel">返回探索</button><button class="primary" id="finish">完成绘画 →</button></div></div><div id="placement" hidden><b>放置你的创造</b><p>拖动预览调整位置；滚轮或滑块调整大小。</p><label>缩放 <input id="scale" type="range" min="0.3" max="2.5" step="0.05" value="1"><output id="scalevalue">1.00×</output></label><p>金色虚线内可放置。绿色预览表示位置有效。</p><button id="edit">返回修改</button><button class="primary" id="confirm">确认放置</button></div><div id="win" hidden><span>CHAPTER COMPLETE</span><h2>你让世界，多了一条路。</h2><p>有些未来，需要亲手画出来。</p><button id="again" class="primary">再试一种解法</button></div><div class="bottom"><div><span class="key">W A S D</span> 移动 <span class="key">SPACE</span> 跳跃 <span class="key">E</span> 绘画</div><button class="primary" id="draw">✎ 进入绘画模式</button></div></section><footer><span id="status" role="status">正在唤醒遗迹…</span><span>无限墨水 · 多种解法 · 真实物理</span></footer></main>`;
const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
let mode: 'play'|'draw'|'place'|'win' = 'play';
const status = (s:string) => { $('status').textContent=s; };
const scene=new THREE.Scene(); scene.background=new THREE.Color('#ddd9c7'); scene.fog=new THREE.Fog('#ddd9c7',38,75);
const renderer=new THREE.WebGLRenderer({antialias:true}); renderer.setPixelRatio(Math.min(devicePixelRatio,2)); renderer.shadowMap.enabled=true; renderer.shadowMap.type=THREE.PCFSoftShadowMap; $('view').append(renderer.domElement);
const camera=new THREE.PerspectiveCamera(38,1,.1,150); camera.position.set(-12,21,25); camera.lookAt(0,0,0);
scene.add(new THREE.HemisphereLight(0xfff6d7,0x667e79,2)); const sun=new THREE.DirectionalLight(0xffedc6,3);sun.position.set(-8,18,10);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-25,right:25,top:25,bottom:-25});scene.add(sun);
const mat=(color:string)=>new THREE.MeshStandardMaterial({color,roughness:1,flatShading:true});
const cream=mat('#c7ba95'), teal=mat('#277c79'), stone=mat('#8b9687'), sand=mat('#e3c99d');
function box(x:number,y:number,z:number,w:number,h:number,d:number,m:THREE.Material){const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;scene.add(o);return o;}
// Dry, architectural islands with a readable four-unit chasm.
box(-8,-1.1,0,12,2,13,cream);box(8,-1.1,0,12,2,13,cream);box(0,-5,0,4,1,13,mat('#647975'));
for(const side of [-1,1])for(let i=0;i<6;i++){box(side*(3+i*1.9),.015,-3.6,1.65,.08,1.25,sand);}
for(const x of [-12,-7,6,12]){box(x,1.6,-5, .9,3.5,.9,stone);box(x,3.45,-5,1.3,.25,1.3,cream);}
for(const x of [-11,11]){box(x,.25,4.8,2,.7,1,stone);box(x+.4,.8,4.8,.8,.4,.8,cream);}
const goal=box(10,.03,0,2.5,.12,3,teal);const arch= new THREE.Group();arch.position.set(11,0,-.4);scene.add(arch);for(const x of [-1.5,1.5]){const p=new THREE.Mesh(new THREE.BoxGeometry(.35,4,.5),teal);p.position.set(x,2,0);arch.add(p);}const top=new THREE.Mesh(new THREE.BoxGeometry(3.4,.35,.5),teal);top.position.y=4;arch.add(top);
const ring=new THREE.Mesh(new THREE.RingGeometry(.55,.62,40),new THREE.MeshBasicMaterial({color:'#efc56a',side:THREE.DoubleSide}));ring.position.set(11,2,0);scene.add(ring);
// Stylized Noah: teal jacket, brown hair and boots, satchel and pencil.
const noah=new THREE.Group();scene.add(noah);
function part(w:number,h:number,d:number,x:number,y:number,z:number,c:string){const p=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat(c));p.position.set(x,y,z);p.castShadow=true;noah.add(p);return p;}
part(.55,.6,.35,0,.05,0,'#267c85');part(.38,.12,.38,0,.36,0,'#a5b58c');
const head=new THREE.Mesh(new THREE.SphereGeometry(.32,12,10),mat('#e7b386'));head.position.y=.65;head.castShadow=true;noah.add(head);
part(.6,.21,.53,0,.88,-.04,'#503b35');part(.15,.25,.45,-.25,.75,-.05,'#503b35');
for(const x of [-.13,.13]){part(.18,.38,.22,x,-.4,0,'#85785c');part(.22,.17,.35,x,-.65,.05,'#713e35');part(.05,.06,.035,x,.67,.29,'#302e2d');}
part(.13,.5,.17,-.36,.02,0,'#267c85');part(.13,.5,.17,.36,.02,0,'#267c85');part(.25,.32,.22,-.4,-.13,-.13,'#715a41');const pencil=part(.045,.65,.045,.44,-.1,.08,'#f0bf65');pencil.rotation.z=-.25;
await RAPIER.init();const world=new RAPIER.World({x:0,y:-9.81,z:0});
for(const x of [-8,8])world.createCollider(RAPIER.ColliderDesc.cuboid(6,1,6.5).setTranslation(x,-1.1,0));
const player=world.createRigidBody(RAPIER.RigidBodyDesc.dynamic().setTranslation(-9,1,0).lockRotations().setLinearDamping(2));
world.createCollider(RAPIER.ColliderDesc.capsule(.35,.28).setFriction(0).setFrictionCombineRule(RAPIER.CoefficientCombineRule.Min).setRestitution(0),player);
const creations:{body:RAPIER.RigidBody,mesh:THREE.Mesh,outline:{x:number,y:number}[]}[]=[];
let preview:THREE.Mesh|undefined, geom:THREE.ExtrudeGeometry|undefined, shapePoints:{x:number,y:number}[]=[];
let scale=1,px=0,pz=0;
const bounds=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(14,.02,9)),new THREE.LineBasicMaterial({color:'#c69240'}));bounds.position.y=.05;scene.add(bounds);bounds.visible=false;
function setMode(m:typeof mode){mode=m;$('drawpanel').hidden=m!=='draw';$('placement').hidden=m!=='place';$('win').hidden=m!=='win';$('stage').classList.toggle('drawing',m==='draw');$('draw').hidden=m!=='play';$('mode').textContent=m==='play'?'● 探索中 · 物理运行':m==='win'?'✦ 已抵达彼岸':'Ⅱ 创作中 · 世界暂停';bounds.visible=m==='place';if(preview)preview.visible=m==='place';resize();}
function drawMode(){if(mode==='win')return;setMode('draw');status('世界已暂停。闭合轮廓后，可以将作品放入场景。');}
$('draw').onclick=drawMode;$('cancel').onclick=()=>{setMode('play');status('物理模拟已恢复。');};
const paper=$<HTMLCanvasElement>('paper'),ctx=paper.getContext('2d')!;
let points:{x:number,y:number}[]=[],closed=false,drawing=false;
function paint(){ctx.clearRect(0,0,paper.width,paper.height);ctx.strokeStyle='#d6d1bd';ctx.lineWidth=1;for(let x=0;x<840;x+=30){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,480);ctx.stroke();}for(let y=0;y<480;y+=30){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(840,y);ctx.stroke();}if(!points.length)return;ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));if(closed){ctx.closePath();ctx.fillStyle='#b5c8b8aa';ctx.fill();}ctx.strokeStyle='#306c68';ctx.lineWidth=4;ctx.lineJoin='round';ctx.stroke();ctx.beginPath();ctx.arc(points[0].x,points[0].y,10,0,Math.PI*2);ctx.strokeStyle='#c49444';ctx.lineWidth=2;ctx.stroke();}
function coord(e:PointerEvent){const r=paper.getBoundingClientRect();return{x:(e.clientX-r.left)*840/r.width,y:(e.clientY-r.top)*480/r.height};}
paper.onpointerdown=e=>{points=[coord(e)];closed=false;drawing=true;paper.setPointerCapture(e.pointerId);paint();};paper.onpointermove=e=>{if(drawing){const p=coord(e),last=points.at(-1)!;if(Math.hypot(p.x-last.x,p.y-last.y)>4)points.push(p);paint();}};
paper.onpointerup=e=>{if(!drawing)return;drawing=false;const p=coord(e);points.push(p);closed=points.length>=4&&Math.hypot(p.x-points[0].x,p.y-points[0].y)<=24; if(closed)points.pop();$('ink').textContent=closed?'✓ 轮廓已闭合。可以完成绘画，也可以重新画一笔。':'轮廓尚未闭合，请重画并回到金色起点。';paint();};paper.onpointercancel=()=>{drawing=false;closed=false;};
$('clear').onclick=$('undo').onclick=()=>{points=[];closed=false;paint();$('ink').textContent='画布已清空，可以重新绘制。';};
$('example').onclick=()=>{points=[{x:140,y:220},{x:700,y:220},{x:700,y:260},{x:140,y:260}];closed=true;paint();$('ink').textContent='示例：长而薄的封闭桥板。可以直接放置，或重画自己的轮廓。';};
$('rework').onclick=()=>{const c=creations.pop();if(!c){$('ink').textContent='还没有可收回的作品。';return;}points=c.outline;closed=true;world.removeRigidBody(c.body);scene.remove(c.mesh);c.mesh.geometry.dispose();(c.mesh.material as THREE.Material).dispose();paint();$('ink').textContent='已收回最近一件作品。可保留轮廓重新放置，或重画修改。';};
function area(ps:typeof points){return Math.abs(ps.reduce((a,p,i)=>{const q=ps[(i+1)%ps.length];return a+p.x*q.y-q.x*p.y;},0)/2);}
function simple(ps:typeof points){const cross=(a:typeof ps[0],b:typeof ps[0],c:typeof ps[0])=>(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);for(let i=0;i<ps.length;i++)for(let j=i+2;j<ps.length;j++){if(i===0&&j===ps.length-1)continue;const a=ps[i],b=ps[(i+1)%ps.length],c=ps[j],d=ps[(j+1)%ps.length];if(cross(a,b,c)*cross(a,b,d)<0&&cross(c,d,a)*cross(c,d,b)<0)return false;}return true;}
$('finish').onclick=()=>{if(!closed||area(points)<200||!simple(points)){ $('ink').textContent='请画出不自交、面积足够的封闭轮廓。';return;}const minX=Math.min(...points.map(p=>p.x)),maxX=Math.max(...points.map(p=>p.x)),minY=Math.min(...points.map(p=>p.y)),maxY=Math.max(...points.map(p=>p.y));shapePoints=points.map(p=>({x:(p.x-(minX+maxX)/2)/80,y:((minY+maxY)/2-p.y)/80}));const shape=new THREE.Shape(shapePoints.map(p=>new THREE.Vector2(p.x,p.y)));if(preview){scene.remove(preview);preview.geometry.dispose();(preview.material as THREE.Material).dispose();}geom=new THREE.ExtrudeGeometry(shape,{depth:1.5,bevelEnabled:false,steps:1});geom.translate(0,0,-.75);preview=new THREE.Mesh(geom,new THREE.MeshStandardMaterial({color:'#55b6a2',transparent:true,opacity:.65,flatShading:true}));scene.add(preview);scale=1;px=0;pz=0;$<HTMLInputElement>('scale').value='1';setMode('place');updatePreview();status('世界仍暂停。将作品两端搭在岸上，再确认放置。');};
function valid(){if(!preview)return false;const b=new THREE.Box3().setFromObject(preview);return b.min.x>=-7&&b.max.x<=7&&b.min.z>=-4.5&&b.max.z<=4.5;}
function updatePreview(){if(!preview)return;preview.scale.setScalar(scale);geom!.computeBoundingBox();preview.position.set(px,.12-geom!.boundingBox!.min.y*scale,pz);(preview.material as THREE.MeshStandardMaterial).color.set(valid()?'#55b6a2':'#d36d54');$('scalevalue').textContent=scale.toFixed(2)+'×';}
$<HTMLInputElement>('scale').oninput=e=>{scale=Number((e.target as HTMLInputElement).value);updatePreview();};$('edit').onclick=()=>setMode('draw');
$('confirm').onclick=()=>{if(!preview||!valid()){status('作品超出金色放置范围，请移动或缩小。');return;}const pos=preview.position;const body=world.createRigidBody(RAPIER.RigidBodyDesc.dynamic().setTranslation(pos.x,pos.y,pos.z).setLinearDamping(.3).setAngularDamping(.6));
// Triangulate the same silhouette used for rendering; each triangle is a convex prism.
const verts=shapePoints.map(p=>new THREE.Vector2(p.x,p.y));const tris=THREE.ShapeUtils.triangulateShape(verts,[]);for(const tri of tris){const v:number[]=[];for(const z of [-.75,.75])for(const i of tri)v.push(verts[i].x*scale,verts[i].y*scale,z*scale);const col=RAPIER.ColliderDesc.convexHull(new Float32Array(v));if(col)world.createCollider(col.setDensity(1).setFriction(.9),body);}
const mesh=new THREE.Mesh(geom!.clone(),mat('#b77e4e'));mesh.scale.setScalar(scale);mesh.castShadow=true;mesh.receiveShadow=true;scene.add(mesh);creations.push({body,mesh,outline:points.map(p=>({...p}))});setMode('play');status('作品已生成，物理恢复。试着走过你创造的桥！');};
const raycaster=new THREE.Raycaster(),plane=new THREE.Plane(new THREE.Vector3(0,1,0),0);let dragging=false;
function placeAt(e:PointerEvent){const r=renderer.domElement.getBoundingClientRect();raycaster.setFromCamera(new THREE.Vector2((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1),camera);const hit=new THREE.Vector3();if(raycaster.ray.intersectPlane(plane,hit)){px=hit.x;pz=hit.z;updatePreview();}}
renderer.domElement.onpointerdown=e=>{if(mode==='place'){dragging=true;renderer.domElement.setPointerCapture(e.pointerId);placeAt(e);}};renderer.domElement.onpointermove=e=>{if(dragging)placeAt(e);};renderer.domElement.onpointerup=()=>dragging=false;renderer.domElement.onwheel=e=>{if(mode==='place'){e.preventDefault();scale=THREE.MathUtils.clamp(scale-e.deltaY*.001,.3,2.5);$<HTMLInputElement>('scale').value=String(scale);updatePreview();}};
const keys=new Set<string>();let jump=false;
window.addEventListener('keydown',e=>{if(e.target instanceof HTMLInputElement)return;if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();keys.add(e.code);if(e.code==='KeyE'&&!e.repeat&&mode==='play')drawMode();if(e.code==='Space'&&!e.repeat)jump=true;});window.addEventListener('keyup',e=>keys.delete(e.code));window.addEventListener('blur',()=>keys.clear());
function respawn(){player.setTranslation({x:-9,y:1,z:0},true);player.setLinvel({x:0,y:0,z:0},true);}
function reset(){for(const c of creations){world.removeRigidBody(c.body);scene.remove(c.mesh);c.mesh.geometry.dispose();(c.mesh.material as THREE.Material).dispose();}creations.length=0;respawn();setMode('play');status('新的一页。前往断桥，按 E 开始绘画。');}
$('reset').onclick=$('again').onclick=reset;
function resize(){const r=$('view').getBoundingClientRect();renderer.setSize(r.width,r.height);camera.aspect=r.width/r.height;camera.updateProjectionMatrix();}window.addEventListener('resize',resize);paint();resize();status('走向断桥 · 按 E 绘画 · 到达右侧青色门廊即可通关');
let last=performance.now(),acc=0;
function animate(now:number){requestAnimationFrame(animate);const dt=Math.min((now-last)/1000,.05);last=now;if(mode==='play'){acc+=dt;while(acc>=1/60){let x=0,z=0;if(keys.has('KeyW')||keys.has('ArrowUp'))z--;if(keys.has('KeyS')||keys.has('ArrowDown'))z++;if(keys.has('KeyA')||keys.has('ArrowLeft'))x--;if(keys.has('KeyD')||keys.has('ArrowRight'))x++;const len=Math.hypot(x,z)||1;const v=player.linvel();let vy=v.y;if(jump){const p=player.translation();const hit=world.castRay(new RAPIER.Ray({x:p.x,y:p.y-.58,z:p.z},{x:0,y:-1,z:0}),.2,true,undefined,undefined,undefined,player);if(hit)vy=5.5;jump=false;}player.setLinvel({x:x/len*3.6,y:vy,z:z/len*3.6},true);if(x||z)noah.rotation.y=Math.atan2(x,z);world.timestep=1/60;world.step();acc-=1/60;}const p=player.translation();if(p.y<-7){respawn();status('诺亚已回到岸边。作品仍保留，按 E 调整方案或重新开始。');}else if(p.x>9&&Math.abs(p.z)<1.5){setMode('win');status('通关成功！你的创造连接了两岸。');}}else{acc=0;jump=false;}const p=player.translation();noah.position.set(p.x,p.y+.07,p.z);for(const c of creations){c.mesh.position.copy(c.body.translation());c.mesh.quaternion.copy(c.body.rotation());}ring.rotation.y=now*.0005;renderer.render(scene,camera);}
requestAnimationFrame(animate);
// Non-mutating state for automated readiness checks.
Object.assign(window,{gameState:()=>({mode,player:{...player.translation()},objects:creations.length,closed})});
