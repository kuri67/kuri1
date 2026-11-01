import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import './style.css';
import { Level, chapters, labels, type Kind, type Creation } from './levels';
const app = document.querySelector<HTMLDivElement>('#app')!;
app.innerHTML = `<main><header><a class="brand">◈ 未完成的世界 <small>THE UNFINISHED WORLD</small></a><select id="chapters" aria-label="关卡选择"><option value="0">01 绘桥之章</option><option value="1">02 树根之森</option><option value="2">03 无声钟城</option><option value="3">04 无名之海</option></select><button id="reset">↻ 重新开始</button></header><section id="stage"><div id="view"></div><div class="chapter"><span>01 — 绘桥之章</span><h1>路，在笔下生长。</h1><p>穿过失色的遗迹，走向那一束光。</p></div><div class="badge" id="mode">● 探索中 · 物理运行</div><div id="drawpanel" hidden><div class="eyebrow">THE CREATION DESK / 创作台</div><h2>给世界，添上一笔。</h2><p>一笔画出封闭轮廓。细长的形状适合搭桥。</p><label class="part-label">部件用途 <select id="kind" aria-label="部件用途"></select></label><canvas id="paper" width="840" height="480" aria-label="绘画画布"></canvas><div class="tools"><button id="undo">撤销</button><button id="clear">清空画布</button><button id="example">示例轮廓</button><button id="rework">收回上件作品</button></div><p id="ink">从任意一点开始，回到起点闭合（允许 24 像素误差）。</p><div class="tools"><button id="cancel">返回探索</button><button class="primary" id="finish">完成绘画 →</button></div></div><div id="placement" hidden><b>放置你的创造</b><p>拖动预览调整位置；滚轮或滑块调整大小。</p><label>缩放 <input id="scale" type="range" min="0.3" max="2.5" step="0.05" value="1"><output id="scalevalue">1.00×</output></label><p id="placementhint">金色虚线内可放置。绿色预览表示位置有效。</p><div class="placement-controls"><label>X <input id="posx" type="number" min="-8.5" max="8.5" step="0.1" value="0"></label><label>Y <input id="posy" type="number" min="0" max="5" step="0.1" value="0"></label><label>Z <input id="posz" type="number" min="-4.5" max="4.5" step="0.1" value="0"></label><label>角度 <input id="angle" type="range" min="-60" max="60" value="0"></label></div><button id="edit">返回修改</button><button class="primary" id="confirm">确认放置</button></div><div id="win" hidden><span>CHAPTER COMPLETE</span><h2>你让世界，多了一条路。</h2><p>有些未来，需要亲手画出来。</p><button id="again">再试一种解法</button><button id="next" class="primary">进入下一章 →</button></div><aside id="mission"><b id="mission-title"></b><p id="hint"></p><p id="mechanism"></p><button id="activate" hidden>F · 启动升降台</button></aside><div class="bottom"><div><span class="key">W A S D</span> 移动 <span class="key">SPACE</span> 跳跃 <span class="key">E</span> 绘画</div><button class="primary" id="draw">✎ 进入绘画模式</button></div></section><footer><span id="status" role="status">正在唤醒遗迹…</span><span>无限墨水 · 多种解法 · 真实物理</span></footer></main>`;
const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
let mode: 'play' | 'draw' | 'place' | 'win' = 'play';
const status = (s: string) => { $('status').textContent = s; };
const scene = new THREE.Scene();
scene.background = new THREE.Color('#ddd9c7');
scene.fog = new THREE.Fog('#ddd9c7', 38, 75);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
$('view').append(renderer.domElement);
const camera = new THREE.PerspectiveCamera(38, 1, .1, 150);
camera.position.set(-12, 21, 25);
camera.lookAt(0, 0, 0);
scene.add(new THREE.HemisphereLight(0xfff6d7, 0x667e79, 2));
const sun = new THREE.DirectionalLight(0xffedc6, 3);
sun.position.set(-8, 18, 10);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
Object.assign(sun.shadow.camera, { left: -25, right: 25, top: 25, bottom: -25 });
scene.add(sun);
const mat = (color: string) => new THREE.MeshStandardMaterial({ color, roughness: 1, flatShading: true });
// Stylized Noah: teal jacket, brown hair and boots, satchel and pencil.
const noah = new THREE.Group();
scene.add(noah);
function part(w: number, h: number, d: number, x: number, y: number, z: number, c: string) { const p = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(c)); p.position.set(x, y, z); p.castShadow = true; noah.add(p); return p; }
part(.55, .6, .35, 0, .05, 0, '#267c85');
part(.38, .12, .38, 0, .36, 0, '#a5b58c');
const head = new THREE.Mesh(new THREE.SphereGeometry(.32, 12, 10), mat('#e7b386'));
head.position.y = .65;
head.castShadow = true;
noah.add(head);
part(.6, .21, .53, 0, .88, -.04, '#503b35');
part(.15, .25, .45, -.25, .75, -.05, '#503b35');
for (const x of [-.13, .13]) {
    part(.18, .38, .22, x, -.4, 0, '#85785c');
    part(.22, .17, .35, x, -.65, .05, '#713e35');
    part(.05, .06, .035, x, .67, .29, '#302e2d');
}
part(.13, .5, .17, -.36, .02, 0, '#267c85');
part(.13, .5, .17, .36, .02, 0, '#267c85');
part(.25, .32, .22, -.4, -.13, -.13, '#715a41');
const pencil = part(.045, .65, .045, .44, -.1, .08, '#f0bf65');
pencil.rotation.z = -.25;
await RAPIER.init();
const world = new RAPIER.World({ x: 0, y: -9.81, z: 0 });
const level = new Level(scene, world);
level.load(0);
const player = world.createRigidBody(RAPIER.RigidBodyDesc.dynamic().setTranslation(-9, 1, 0).lockRotations().setLinearDamping(2));
world.createCollider(RAPIER.ColliderDesc.capsule(.35, .28).setFriction(0).setFrictionCombineRule(RAPIER.CoefficientCombineRule.Min).setRestitution(0), player);
const creations: Creation[] = [];
let kind: Kind = "plank", py = .12, angle = 0;
let preview: THREE.Mesh | undefined, geom: THREE.ExtrudeGeometry | undefined, shapePoints: {
    x: number;
    y: number;
}[] = [];
let scale = 1, px = 0, pz = 0;
const bounds = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(17, .02, 9)), new THREE.LineBasicMaterial({ color: '#c69240' }));
bounds.position.y = .05;
scene.add(bounds);
bounds.visible = false;
function setMode(m: typeof mode) {
    mode = m;
    $('drawpanel').hidden = m !== 'draw';
    $('placement').hidden = m !== 'place';
    $('win').hidden = m !== 'win';
    $('stage').classList.toggle('drawing', m === 'draw');
    $('draw').hidden = m !== 'play';
    $('mode').textContent = m === 'play' ? '● 探索中 · 物理运行' : m === 'win' ? '✦ 已抵达彼岸' : 'Ⅱ 创作中 · 世界暂停';
    bounds.visible = m === 'place';
    if (preview)
        preview.visible = m === 'place';
    resize();
}
function drawMode() {
    if (mode === 'win')
        return;
    $('drawpanel').querySelector('p')!.textContent = chapters[level.index].hint;
    keys.clear();
    setMode('draw');
    status('世界已暂停。闭合轮廓后，可以将作品放入场景。');
}
$('draw').onclick = drawMode;
$('cancel').onclick = () => { setMode('play'); status('物理模拟已恢复。'); };
const paper = $<HTMLCanvasElement>('paper'), ctx = paper.getContext('2d')!;
let points: {
    x: number;
    y: number;
}[] = [], closed = false, drawing = false;
function paint() {
    ctx.clearRect(0, 0, paper.width, paper.height);
    ctx.strokeStyle = '#d6d1bd';
    ctx.lineWidth = 1;
    for (let x = 0; x < 840; x += 30) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, 480);
        ctx.stroke();
    }
    for (let y = 0; y < 480; y += 30) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(840, y);
        ctx.stroke();
    }
    if (!points.length)
        return;
    ctx.beginPath();
    points.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y));
    if (closed) {
        ctx.closePath();
        ctx.fillStyle = '#b5c8b8aa';
        ctx.fill();
    }
    ctx.strokeStyle = '#306c68';
    ctx.lineWidth = 4;
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(points[0].x, points[0].y, 10, 0, Math.PI * 2);
    ctx.strokeStyle = '#c49444';
    ctx.lineWidth = 2;
    ctx.stroke();
}
function coord(e: PointerEvent) { const r = paper.getBoundingClientRect(); return { x: (e.clientX - r.left) * 840 / r.width, y: (e.clientY - r.top) * 480 / r.height }; }
paper.onpointerdown = e => { points = [coord(e)]; closed = false; drawing = true; paper.setPointerCapture(e.pointerId); paint(); };
paper.onpointermove = e => {
    if (drawing) {
        const p = coord(e), last = points.at(-1)!;
        if (Math.hypot(p.x - last.x, p.y - last.y) > 4)
            points.push(p);
        paint();
    }
};
paper.onpointerup = e => {
    if (!drawing)
        return;
    drawing = false;
    const p = coord(e);
    points.push(p);
    closed = points.length >= 4 && Math.hypot(p.x - points[0].x, p.y - points[0].y) <= 24;
    if (closed)
        points.pop();
    $('ink').textContent = closed ? '✓ 轮廓已闭合。可以完成绘画，也可以重新画一笔。' : '轮廓尚未闭合，请重画并回到金色起点。';
    paint();
};
paper.onpointercancel = () => { drawing = false; closed = false; };
$('clear').onclick = $('undo').onclick = () => { points = []; closed = false; paint(); $('ink').textContent = '画布已清空，可以重新绘制。'; };
$('example').onclick = () => {
    if (['gear', 'wheel', 'pulley'].includes(kind))
        points = Array.from({ length: 32 }, (_, i) => ({ x: 420 + 80 * Math.cos(i * Math.PI / 16), y: 240 + 80 * Math.sin(i * Math.PI / 16) }));
    else if (kind === 'support')
        points = [{ x: 380, y: 200 }, { x: 460, y: 200 }, { x: 460, y: 280 }, { x: 380, y: 280 }];
    else if (kind === 'weight')
        points = [{ x: 340, y: 160 }, { x: 500, y: 160 }, { x: 500, y: 320 }, { x: 340, y: 320 }];
    else if (kind === 'sail')
        points = [{ x: 340, y: 140 }, { x: 500, y: 240 }, { x: 340, y: 340 }];
    else if (kind === 'float')
        points = [{ x: 260, y: 200 }, { x: 580, y: 200 }, { x: 580, y: 280 }, { x: 260, y: 280 }];
    else if (kind === 'rope')
        points = [{ x: 180, y: 235 }, { x: 660, y: 235 }, { x: 660, y: 245 }, { x: 180, y: 245 }];
    else
        points = [{ x: 140, y: 220 }, { x: 700, y: 220 }, { x: 700, y: 260 }, { x: 140, y: 260 }];
    closed = true;
    paint();
    $('ink').textContent = '示例已闭合，可修改或放入场景。';
};
$('rework').onclick = () => {
    const c = creations.pop();
    if (!c) {
        $('ink').textContent = '还没有可收回的作品。';
        return;
    }
    points = c.outline;
    kind = c.kind;
    $<HTMLSelectElement>('kind').value = kind;
    closed = true;
    world.removeRigidBody(c.body);
    scene.remove(c.mesh);
    c.mesh.geometry.dispose();
    (c.mesh.material as THREE.Material).dispose();
    paint();
    $('ink').textContent = '已收回最近一件作品。可保留轮廓重新放置，或重画修改。';
};
function area(ps: typeof points) { return Math.abs(ps.reduce((a, p, i) => { const q = ps[(i + 1) % ps.length]; return a + p.x * q.y - q.x * p.y; }, 0) / 2); }
function simple(ps: typeof points) {
    const cross = (a: typeof ps[0], b: typeof ps[0], c: typeof ps[0]) => (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
    for (let i = 0; i < ps.length; i++)
        for (let j = i + 2; j < ps.length; j++) {
            if (i === 0 && j === ps.length - 1)
                continue;
            const a = ps[i], b = ps[(i + 1) % ps.length], c = ps[j], d = ps[(j + 1) % ps.length];
            if (cross(a, b, c) * cross(a, b, d) < 0 && cross(c, d, a) * cross(c, d, b) < 0)
                return false;
        }
    return true;
}
$('finish').onclick = () => {
    if (!closed || area(points) < 200 || !simple(points)) {
        $('ink').textContent = '请画出不自交、面积足够的封闭轮廓。';
        return;
    }
    if (['gear', 'wheel', 'pulley'].includes(kind)) {
        const perimeter = points.reduce((sum, p, i) => { const q = points[(i + 1) % points.length]; return sum + Math.hypot(p.x - q.x, p.y - q.y); }, 0);
        if (points.length < 8 || 4 * Math.PI * area(points) / (perimeter * perimeter) < .82) {
            $('ink').textContent = '齿轮、滚轮和滑轮需要近圆形的封闭轮廓，可使用示例。';
            return;
        }
    }
    const minX = Math.min(...points.map(p => p.x)), maxX = Math.max(...points.map(p => p.x)), minY = Math.min(...points.map(p => p.y)), maxY = Math.max(...points.map(p => p.y));
    shapePoints = points.map(p => ({ x: (p.x - (minX + maxX) / 2) / 80, y: ((minY + maxY) / 2 - p.y) / 80 }));
    const shape = new THREE.Shape(shapePoints.map(p => new THREE.Vector2(p.x, p.y)));
    if (preview) {
        scene.remove(preview);
        preview.geometry.dispose();
        (preview.material as THREE.Material).dispose();
    }
    geom = new THREE.ExtrudeGeometry(shape, { depth: kind === 'float' ? 3 : 1.5, bevelEnabled: false, steps: 1 });
    geom.translate(0, 0, kind === 'float' ? -1.5 : -.75);
    preview = new THREE.Mesh(geom, new THREE.MeshStandardMaterial({ color: '#55b6a2', transparent: true, opacity: .65, flatShading: true }));
    scene.add(preview);
    scale = 1;
    const suggested = level.suggested(kind);
    px = suggested.x;
    pz = suggested.z;
    py = level.placementY(kind, px);
    angle = 0;
    $<HTMLInputElement>('angle').value = '0';
    $<HTMLInputElement>('scale').value = '1';
    setMode('place');
    updatePreview();
    status('世界仍暂停。调整位置、高度、大小和角度，再确认放置。');
};
function valid() {
    if (!preview)
        return false;
    const b = new THREE.Box3().setFromObject(preview);
    return (level.index!==3||b.max.x-b.min.x<=8)&&b.min.x >= -(level.index === 0 ? 7 : level.index === 3 ? 10 : 8.5) && b.max.x <= (level.index === 0 ? 7 : level.index === 3 ? 10 : 8.5) && b.min.z >= -4.5 && b.max.z <= 4.5;
}
function updatePreview() {
    if (!preview)
        return;
    preview.scale.setScalar(scale);
    geom!.computeBoundingBox();
    preview.rotation.z = angle;
    preview.position.set(px, 0, pz);
    const b = new THREE.Box3().setFromObject(preview);
    preview.position.y = kind === 'gear' || kind === 'pulley' || kind === 'rope' ? py : py - b.min.y;
    for (const [id, value] of [['posx', px], ['posy', py], ['posz', pz]] as const)
        $<HTMLInputElement>(id).value = value.toFixed(2);
    (preview.material as THREE.MeshStandardMaterial).color.set(valid() ? '#55b6a2' : '#d36d54');
    $('scalevalue').textContent = scale.toFixed(2) + '×';
}
$<HTMLInputElement>('scale').oninput = e => { scale = Number((e.target as HTMLInputElement).value); updatePreview(); };
$('edit').onclick = () => setMode('draw');
$('confirm').onclick = () => {
    if (!preview || !valid()) {
        status(level.index===3?'作品超出放置范围或单件跨度超过 8，请移动、缩小或组合多件船体。':'作品超出金色放置范围，请移动或缩小。');
        return;
    }
    const pos = preview.position;
    const fixed = ['support', 'rope', 'pulley'].includes(kind);
    const desc = kind === 'gear' ? RAPIER.RigidBodyDesc.kinematicPositionBased() : fixed ? RAPIER.RigidBodyDesc.fixed() : RAPIER.RigidBodyDesc.dynamic();
    const body = world.createRigidBody(desc.setTranslation(pos.x, pos.y, pos.z).setRotation(preview.quaternion).setLinearDamping(.3).setAngularDamping(.6).setCcdEnabled(true));
    // Triangulate the same silhouette used for rendering; each triangle is a convex prism.
    const verts = shapePoints.map(p => new THREE.Vector2(p.x, p.y));
    const tris = THREE.ShapeUtils.triangulateShape(verts, []);
    for (const tri of tris) {
        const v: number[] = [];
        for (const z of (kind === 'float' ? [-1.5, 1.5] : [-.75, .75]))
            for (const i of tri)
                v.push(verts[i].x * scale, verts[i].y * scale, z * scale);
        const col = RAPIER.ColliderDesc.convexHull(new Float32Array(v));
        if (col)
            world.createCollider(col.setSensor(kind === 'rope' || kind === 'pulley' || kind === 'sail').setDensity(kind === 'weight' ? 6 : kind === 'float' ? .25 : kind === 'sail' ? .08 : 1).setFriction(.9), body);
    }
    const mesh = new THREE.Mesh(geom!.clone(), mat('#b77e4e'));
    mesh.scale.setScalar(scale);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
    geom!.computeBoundingBox();
    const size = geom!.boundingBox!.getSize(new THREE.Vector3()).multiplyScalar(scale);
    creations.push({ body, mesh, outline: points.map(p => ({ ...p })), kind, width: size.x, height: size.y, depth: size.z, scale, anchor: pos.clone(), rotation: angle });
    if (level.index === 3 && ['sail', 'plank', 'float'].includes(kind)) {
        const partners = creations.slice(0, -1).filter(c => ['float', 'plank'].includes(c.kind) && c.anchor.distanceTo(pos) < 4);
        for (const partner of partners) {
            const q = new THREE.Quaternion().copy(partner.body.rotation()).invert();
            const local = pos.clone().sub(new THREE.Vector3().copy(partner.body.translation())).applyQuaternion(q);
            const frame = q.clone().multiply(preview.quaternion);
            world.createImpulseJoint(RAPIER.JointData.fixed(local, frame, { x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 0, w: 1 }), partner.body, body, true).setContactsEnabled(false);
        }
    }
    setMode('play');
    status('作品已生成，物理恢复。观察装置，再尝试通行。');
};
const raycaster = new THREE.Raycaster(), plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
let dragging = false;
function placeAt(e: PointerEvent) {
    const r = renderer.domElement.getBoundingClientRect();
    raycaster.setFromCamera(new THREE.Vector2((e.clientX - r.left) / r.width * 2 - 1, -(e.clientY - r.top) / r.height * 2 + 1), camera);
    const hit = new THREE.Vector3();
    if (raycaster.ray.intersectPlane(plane, hit)) {
        px = hit.x;
        pz = hit.z;
        updatePreview();
    }
}
renderer.domElement.onpointerdown = e => {
    if (mode === 'place') {
        dragging = true;
        renderer.domElement.setPointerCapture(e.pointerId);
        placeAt(e);
    }
};
renderer.domElement.onpointermove = e => {
    if (dragging)
        placeAt(e);
};
renderer.domElement.onpointerup = () => dragging = false;
renderer.domElement.onwheel = e => {
    if (mode === 'place') {
        e.preventDefault();
        scale = THREE.MathUtils.clamp(scale - e.deltaY * .001, .3, 2.5);
        $<HTMLInputElement>('scale').value = String(scale);
        updatePreview();
    }
};
const keys = new Set<string>();
let jump = false;
let riding: Creation | undefined, rideGrace = 0;
window.addEventListener('keydown', e => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement)
        return;
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code))
        e.preventDefault();
    keys.add(e.code);
    if (e.code === 'KeyF' && mode === 'play') {
        level.start(player);
        status(level.report);
    }
    if (e.code === 'KeyE' && !e.repeat && mode === 'play')
        drawMode();
    if (e.code === 'Space' && !e.repeat)
        jump = true;
});
window.addEventListener('keyup', e => keys.delete(e.code));
window.addEventListener('blur', () => keys.clear());
function respawn() { riding = undefined; rideGrace = 0; player.setTranslation(level.spawn, true); player.setLinvel({ x: 0, y: 0, z: 0 }, true); }
function clearCreations() {
    riding = undefined;
    rideGrace = 0;
    for (const c of creations) {
        world.removeRigidBody(c.body);
        scene.remove(c.mesh);
        c.mesh.geometry.dispose();
        (c.mesh.material as THREE.Material).dispose();
    }
    creations.length = 0;
}
function loadLevel(index: number) {
    clearCreations();
    level.load(index);
    points = [];
    closed = false;
    paint();
    keys.clear();
    jump = false;
    respawn();
    if (preview)
        preview.visible = false;
    setMode('play');
    const chapter = chapters[index];
    document.querySelector('.chapter>span')!.textContent = `0${index + 1} — ${chapter.name}`;
    document.querySelector('.chapter h1')!.textContent = chapter.title;
    document.querySelector('.chapter p')!.textContent = chapter.story;
    $('placementhint').textContent=index===3?'海面单件跨度最多 8；请组合浮筒与推进结构。绿色表示位置有效。':'金色边框内可放置。绿色表示位置有效。';$('mission-title').textContent = `目标 / ${chapter.name}`;
    $('hint').textContent = chapter.hint;
    $('mechanism').textContent = '';
    $('activate').hidden = index !== 2;
    $<HTMLSelectElement>('chapters').value = String(index);
    $('next').hidden = index === 3;
    $('win').querySelector('h2')!.textContent = index === 3 ? '你画出了，通往未来的路。' : '你让世界，多了一条路。';
    $<HTMLSelectElement>('kind').innerHTML = level.allowedKinds.map(k => `<option value="${k}">${labels[k]}</option>`).join('');
    kind = level.allowedKinds[0];
    bounds.scale.x = level.index === 3 ? 20 / 17 : level.index === 0 ? 14 / 17 : 1;
    camera.position.set(index === 3 ? -15 : -12, index === 2 ? 25 : 21, index === 2 ? 30 : 25);
    camera.lookAt(0, index === 2 ? 2 : 0, 0);
    status(index === 0 ? '走向断桥 · 按 E 绘画 · 到达右侧青色门廊即可通关' : chapter.hint);
}
function reset() { loadLevel(level.index); }
$('reset').onclick = $('again').onclick = reset;
$('next').onclick = () => loadLevel(Math.min(3, level.index + 1));
$<HTMLSelectElement>('chapters').onchange = e => loadLevel(Number((e.target as HTMLSelectElement).value));
$<HTMLSelectElement>('kind').onchange = e => { kind = (e.target as HTMLSelectElement).value as Kind; };
$('activate').onclick = () => { level.start(player); status(level.report); };
for (const id of ['posx', 'posy', 'posz', 'angle'])
    $<HTMLInputElement>(id).oninput = e => {
        const v = Number((e.target as HTMLInputElement).value);
        if (!Number.isFinite(v))
            return;
        if (id === 'posx')
            px = v;
        if (id === 'posy')
            py = Math.max(0, Math.min(5, v));
        if (id === 'posz')
            pz = v;
        if (id === 'angle')
            angle = v * Math.PI / 180;
        updatePreview();
    };
function resize() { const r = $('view').getBoundingClientRect(); renderer.setSize(r.width, r.height); camera.aspect = r.width / r.height; camera.updateProjectionMatrix(); }
window.addEventListener('resize', resize);
paint();
resize();
loadLevel(0);
let last = performance.now(), acc = 0;
function animate(now: number) {
    requestAnimationFrame(animate);
    const dt = Math.min((now - last) / 1000, .05);
    last = now;
    if (mode === 'play') {
        acc += dt;
        while (acc >= 1 / 60) {
            let x = 0, z = 0;
            if (keys.has('KeyW') || keys.has('ArrowUp'))
                z--;
            if (keys.has('KeyS') || keys.has('ArrowDown'))
                z++;
            if (keys.has('KeyA') || keys.has('ArrowLeft'))
                x--;
            if (keys.has('KeyD') || keys.has('ArrowRight'))
                x++;
            const len = Math.hypot(x, z) || 1;
            const v = player.linvel();
            let vy = v.y;
            const groundedCarrier = level.carrier(player, creations);
            if (groundedCarrier) {
                riding = groundedCarrier;
                rideGrace = .6;
            }
            else
                rideGrace -= 1 / 60;
            const carrier = groundedCarrier ?? (level.index === 3 && rideGrace > 0 && riding && creations.includes(riding) ? riding : undefined);
            player.setLinearDamping(carrier ? 0 : 2);
            if (jump) {
                const p = player.translation();
                const hit = world.castRay(new RAPIER.Ray({ x: p.x, y: p.y - .58, z: p.z }, { x: 0, y: -1, z: 0 }), .2, true, undefined, undefined, undefined, player);
                if (hit)
                    vy = 5.5;
                jump = false;
            }
            const cv = carrier?.body.velocityAtPoint(player.translation());
            player.setLinvel({ x: x / len * (carrier ? 1.3 : 3.6) + (cv?.x ?? 0), y: vy, z: z / len * (carrier ? 1.3 : 3.6) + (cv?.z ?? 0) }, true);
            if (carrier && (x || z))
                carrier.body.applyImpulse({ x: x * .05, y: 0, z: z * .05 }, true);
            if (x || z)
                noah.rotation.y = Math.atan2(x, z);
            for (const c of creations) {
                c.body.resetForces(true);
                c.body.resetTorques(true);
            }
            level.step(1 / 60, creations, player);
            world.timestep = 1 / 60;
            world.step();
            acc -= 1 / 60;
        }
        const p = player.translation();
        if (p.y < (level.index === 3 ? -2 : -7)) {
            respawn();
            status('诺亚已回到岸边。作品仍保留，按 E 调整方案或重新开始。');
        }
        else if (level.won(p)) {
            setMode('win');
            status(`通关成功！${chapters[level.index].name}已完成。`);
        }
    }
    else {
        acc = 0;
        jump = false;
    }
    const p = player.translation();
    noah.position.set(p.x, p.y + .07, p.z);
    for (const c of creations) {
        c.mesh.position.copy(c.body.translation());
        c.mesh.quaternion.copy(c.body.rotation());
    }
    level.sync();
    $('mechanism').textContent = level.report;
    renderer.render(scene, camera);
}
requestAnimationFrame(animate);
// Non-mutating state for automated readiness checks.
Object.assign(window, { gameState: () => ({ mode, player: { ...player.translation() }, objects: creations.length, closed, level: level.index, energy: level.energy, progress: level.progress, liftY: level.liftY, solved: level.solved, route: level.route, creations: creations.map(c => ({ kind: c.kind, mass: c.body.mass(), position: { ...c.body.translation() }, velocity: { ...c.body.linvel() }, rotation: { ...c.body.rotation() } })) }) });
