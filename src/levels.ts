import * as THREE from 'three';
import R from '@dimforge/rapier3d-compat';
export type Kind = 'plank' | 'support' | 'weight' | 'wheel' | 'rope' | 'gear' | 'pulley' | 'float' | 'sail';
export const labels: Record<Kind, string> = { plank: '木板 / 杠杆', support: '支撑块', weight: '重物', wheel: '滚轮', rope: '牵引绳', gear: '齿轮', pulley: '滑轮', float: '浮筒 / 船体', sail: '船帆' };
export interface Creation {
    body: R.RigidBody;
    mesh: THREE.Mesh;
    outline: {
        x: number;
        y: number;
    }[];
    kind: Kind;
    width: number;
    height: number;
    depth: number;
    scale: number;
    anchor: THREE.Vector3;
    rotation: number;
    used?: boolean;
}
export const chapters = [
    { name: '绘桥之章', title: '路，在笔下生长。', story: '穿过失色的遗迹，走向那一束光。', hint: '画一块长木板跨过深沟，两端搭岸，空格跳上桥。', bg: '#ddd9c7' },
    { name: '树根之森', title: '小小支点，撬动山石。', story: '悬根与藤蔓间，古老机械等待新的力量。', hint: '黄色标记为支点。支撑块 → 长木板 → 左端重物；也可用斜坡与滚轮，或树根绳索与配重。', bg: '#a9b6a0' },
    { name: '无声钟城', title: '让时间，再次流动。', story: '补全传动，乘升降台抵达钟楼上层。', hint: '在金色圆环补上半径约 1 的齿轮；或左侧滑轮＋配重；或支撑块＋杠杆＋重物。站上中央平台后按 F 启动。', bg: '#b5bec2' },
    { name: '无名之海', title: '把思念，送往彼岸。', story: '母亲最后的画，就在海的另一边。', hint: '左岸旁放下船体，跳上去。船帆顺风，多个浮筒随流；或连接岸边牵引装置。A/D、W/S 可在船上小幅调整航向。', bg: '#aec6c5' }
];
export class Level {
    group = new THREE.Group();
    private bodies: R.RigidBody[] = [];
    private staticColliders: R.Collider[] = [];
    private dynamic: {
        body: R.RigidBody;
        mesh: THREE.Object3D;
    }[] = [];
    index = 0;
    progress = 0;
    energy = 0;
    route = '';
    liftY = 0;
    started = false;
    solved = false;
    report = '';
    private boulder?: R.RigidBody;
    private elevator?: R.RigidBody;
    private gears: THREE.Object3D[] = [];
    private ropes: THREE.Line[] = [];
    private time = 0;
    private leverAngle = 0;
    constructor(private scene: THREE.Scene, private world: R.World) { scene.add(this.group); }
    private material(c: string) { return new THREE.MeshStandardMaterial({ color: c, roughness: 1, flatShading: true }); }
    private box(x: number, y: number, z: number, w: number, h: number, d: number, c: string, solid = false) {
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), this.material(c));
        mesh.position.set(x, y, z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        this.group.add(mesh);
        if (solid)
            this.staticColliders.push(this.world.createCollider(R.ColliderDesc.cuboid(w / 2, h / 2, d / 2).setTranslation(x, y, z)));
        return mesh;
    }
    private line(points: THREE.Vector3[], color = '#ceb777') { const l = new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), new THREE.LineBasicMaterial({ color })); this.group.add(l); return l; }
    private ring(x: number, y: number, z: number, r: number) { const m = new THREE.Mesh(new THREE.TorusGeometry(r, .045, 8, 40), this.material('#e4b75d')); m.position.set(x, y, z); this.group.add(m); return m; }
    private gear(x: number, y: number, r: number, c: string) {
        const g = new THREE.Group();
        g.position.set(x, y, -2.3);
        const disk = new THREE.Mesh(new THREE.CylinderGeometry(r, r, .3, 20), this.material(c));
        disk.rotation.x = Math.PI / 2;
        g.add(disk);
        for (let i = 0; i < 12; i++) {
            const a = i * Math.PI / 6;
            const t = new THREE.Mesh(new THREE.BoxGeometry(.25, .35, .4), this.material(c));
            t.position.set(Math.cos(a) * r, Math.sin(a) * r, 0);
            t.rotation.z = a - Math.PI / 2;
            g.add(t);
        }
        this.group.add(g);
        return g;
    }
    private movingBox(x: number, y: number, z: number, w: number, h: number, d: number, c: string) { const mesh = this.box(x, y, z, w, h, d, c); const b = this.world.createRigidBody(R.RigidBodyDesc.kinematicPositionBased().setTranslation(x, y, z)); this.bodies.push(b); this.world.createCollider(R.ColliderDesc.cuboid(w / 2, h / 2, d / 2).setFriction(.8), b); this.dynamic.push({ body: b, mesh }); return b; }
    load(index: number) {
        this.dispose();
        this.index = index;
        this.progress = 0;
        this.energy = 0;
        this.liftY = 0;
        this.started = false;
        this.solved = false;
        this.route = '';
        this.time = 0;
        this.leverAngle = 0;
        this.boulder = undefined;
        this.elevator = undefined;
        this.gears = [];
        this.report = chapters[index].hint;
        this.scene.background = new THREE.Color(chapters[index].bg);
        this.scene.fog = new THREE.Fog(chapters[index].bg, 45, 90);
        if (index === 0) {
            for (const x of [-8, 8])
                this.box(x, -1.1, 0, 12, 2, 13, '#c7ba95', true);
            this.box(0, -5, 0, 4, 1, 13, '#647975');
            for (const x of [-12, -7, 6, 12]) {
                this.box(x, 1.6, -5, .9, 3.5, .9, '#8b9687');
                this.box(x, 3.45, -5, 1.3, .25, 1.3, '#e3c99d');
            }
        }
        if (index === 1) {
            this.box(0, -.6, 0, 28, 1, 9, '#727f56', true);
            for (const z of [-2.3, 2.3])
                this.box(0, 1.6, z, 28, 3.4, .5, '#536a4e', true);
            for (const x of [-11, -6, 3, 10]) {
                this.box(x, 3, -4, 1, 6, 1.3, '#5c654b');
                const crown = new THREE.Mesh(new THREE.IcosahedronGeometry(2.7, 0), this.material('#476d56'));
                crown.position.set(x, 6, -4);
                this.group.add(crown);
                this.line([new THREE.Vector3(x, 5, -4), new THREE.Vector3(x + 2, 4, -2), new THREE.Vector3(x + 3, 5, 0)], '#635e42');
                for (let j = 0; j < 3; j++)
                    this.line([new THREE.Vector3(x + j * .4, 5, -2), new THREE.Vector3(x + j * .4, 1, -2)], '#789572');
            }
            this.boulder = this.movingBox(1, 1.3, 0, 2.6, 2.8, 4, '#777668');
            this.ring(-2, .9, 0, .4);
            this.box(-2, .02, 0, 1.1, .1, 1.8, '#d8b66a');
            this.ring(-5, 4, 0, .35);
            this.line([new THREE.Vector3(-5, 4, 0), new THREE.Vector3(-5, 4, -4)], '#594d39');
        }
        if (index === 2) {
            this.box(-7, -.6, 0, 14, 1, 9, '#a3a6a0', true);
            this.box(8, 5.45, 0, 12, 1, 9, '#a3a6a0', true);
            this.box(7, 1.8, -4, 6, 9, 1, '#7c8d8b');
            this.box(7, 6.6, -4, 7, .5, 1.5, '#d1c5a6');
            this.ring(7, 8, -3.4, 1.15);
            this.gears = [this.gear(-4, 2.7, 1, '#a18753'), this.gear(0, 2.7, 1, '#537d7c')];
            this.ring(-2, 2.7, -2.3, 1);
            this.ring(-6, 4, 0, .5);
            this.line([new THREE.Vector3(-6, 4, 0), new THREE.Vector3(0, 4, 0)], '#9a8e69');
            this.elevator = this.movingBox(0, 0, 0, 3, .25, 3, '#467f7c');
            this.box(-3, .02, 0, 1, .1, 1.6, '#d8b66a');
        }
        if (index === 3) {
            this.box(-13, -1.1, 0, 8, 2, 12, '#c6b48e', true);
            this.box(13, -1.1, 0, 8, 2, 12, '#c6b48e', true);
            const sea = this.box(0, -.2, 0, 18, .12, 18, '#72a9ac');
            (sea.material as THREE.MeshStandardMaterial).transparent = true;
            (sea.material as THREE.MeshStandardMaterial).opacity = .65;
            for (let i = 0; i < 12; i++)
                this.line([new THREE.Vector3(-8 + i * 1.5, -.12, -7), new THREE.Vector3(-7 + i * 1.5, -.12, 7)], '#91bebd');
            for (const [x, z] of [[-1, 3], [4, -3]]) {
                this.box(x, -.3, z, 1.3, 2.4, 1.7, '#657c79', true);
            }
            this.ring(-8, 2, 0, .35);
            this.ring(8, 2, 0, .35);
            this.line([new THREE.Vector3(-8, 2, 0), new THREE.Vector3(8, 2, 0)], '#c2b287');
            this.box(12, 1.9, -1, 2.6, 2, .15, '#e8d4a6');
            this.box(12, 1.9, -.89, 2, 1.4, .08, '#719987');
        }
        const gy = index === 2 ? 6 : 0;
        this.box(11, gy + .03, 0, 2.5, .12, 3, '#277c79');
        for (const x of [9.5, 12.5])
            this.box(x, gy + 2, -.4, .35, 4, .5, '#277c79');
        this.box(11, gy + 4, -.4, 3.4, .35, .5, '#277c79');
        this.ring(11, gy + 2, 0, .6);
    }
    get spawn() { return { x: this.index === 3 ? -12 : -9, y: 1, z: 0 }; }
    get allowedKinds(): Kind[] { return this.index === 0 ? ['plank', 'support', 'weight'] : this.index === 1 ? ['plank', 'support', 'weight', 'wheel', 'rope'] : this.index === 2 ? ['gear', 'pulley', 'weight', 'plank', 'support'] : ['float', 'plank', 'sail', 'rope', 'pulley', 'weight']; }
    placementY(kind: Kind, x: number) {
        if (this.index === 1 && kind === 'rope')
            return 4;
        if (this.index === 2) {
            if (kind === 'gear')
                return 2.7;
            if (kind === 'pulley')
                return 4;
        }
        if (this.index === 3) {
            if (kind === 'rope' || kind === 'pulley')
                return 2;
            if (kind === 'sail')
                return 1.2;
            return .3;
        }
        if (kind === 'weight')
            return this.index === 0 ? .1 : 3.3;
        if (this.index === 1 && kind === 'plank')
            return 1.05;
        return .12;
    }
    suggested(kind: Kind) {
        if (this.index === 1)
            return { x: kind === 'support' ? -2 : kind === 'weight' ? -4.5 : kind === 'wheel' ? -6 : kind === 'rope' ? -5 : -2, z: 0 };
        if (this.index === 2)
            return { x: kind === 'gear' ? -2 : kind === 'pulley' || kind === 'weight' ? -6 : kind === 'support' ? -3 : -3, z: kind === 'gear' ? -2.3 : 0 };
        if (this.index === 3)
            return { x: -7, z: 0 };
        return { x: 0, z: 0 };
    }
    private leverWork(cs: Creation[], pivot: number) {
        const support = cs.find(c => c.kind === 'support' && Math.abs(c.anchor.x - pivot) < 1 && Math.abs(c.anchor.z) < 1 && c.height >= .3);
        const plank = cs.find(c => c.kind === 'plank' && c.width > 4 && Math.abs(c.anchor.x - pivot) < 1.2 && Math.abs(c.anchor.z) < 1);
        if (!support || !plank)
            return 0;
        let torque = 0;
        for (const c of cs.filter(c => c.kind === 'weight')) {
            const p = c.body.translation();
            const arm = pivot - c.anchor.x;
            if (arm > 1 && arm < plank.width / 2 + .7 && Math.abs(c.anchor.z) < 1.1 && p.y < 3.5 && p.y > -.5)
                torque += c.body.mass() * 9.81 * arm;
        }
        return torque;
    }
    private setRope(a: THREE.Vector3, b: THREE.Vector3) {
        if (!this.ropes[0])
            this.ropes.push(this.line([a, b]));
        else {
            this.ropes[0].geometry.dispose();
            this.ropes[0].geometry = new THREE.BufferGeometry().setFromPoints([a, b]);
        }
    }
    start(player: R.RigidBody) {
        if (this.index !== 2)
            return;
        if (this.energy < 10) {
            this.report = '动力不足：补全齿轮，或安装滑轮配重 / 杠杆配重。';
            return;
        }
        const p = player.translation();
        if (Math.abs(p.x) > 1.6 || Math.abs(p.z) > 1.6 || Math.abs((p.y - .63) - (this.liftY + .125)) > .4) {
            this.report = '先站上中央青色升降台，再按 F。';
            return;
        }
        this.started = true;
        this.report = '升降台运转中，请留在平台上。';
    }
    step(dt: number, cs: Creation[], player: R.RigidBody) {
        this.time += dt;
        if (this.index === 1 && this.boulder) {
            const torque = this.leverWork(cs, -2);
            const rope = cs.find(c => c.kind === 'rope' && Math.abs(c.anchor.x + 5) < 1);
            const weight = cs.find(c => c.kind === 'weight' && c.body.mass() > 1);
            let power = 0;
            if (torque > 70) {
                power = (torque - 70) * .012;
                this.route = '杠杆与配重';
                this.leverAngle = Math.min(.35, this.leverAngle + dt * .3);
            }
            else if (rope && weight && weight.body.translation().y < weight.anchor.y - .3) {
                power = weight.body.mass() * 1.4;
                this.route = '树根绳索牵引';
                this.setRope(new THREE.Vector3(-5, 4, 0), new THREE.Vector3(1, 1.3 + this.progress, 0));
            }
            else {
                for (const c of cs.filter(c => c.kind === 'wheel')) {
                    const p = c.body.translation(), v = c.body.linvel();
                    if (!c.used && p.x > -2.5 && p.x < 2 && Math.abs(p.z) < 2 && v.x > 1.3) {
                        c.used = true;
                        power = c.body.mass() * v.x * 24;
                        this.route = '斜坡滚轮冲击';
                    }
                }
            }
            this.progress = THREE.MathUtils.clamp(this.progress + power * dt, 0, 4.2);
            this.boulder.setNextKinematicTranslation({ x: 1, y: 1.3 + this.progress, z: 0 });
            this.solved = this.progress > 3.6;
            this.report = this.solved ? '通道打开！穿过巨石下方，抵达森林出口。' : `巨石抬升 ${Math.round(this.progress / 4.2 * 100)}% · 支点在金色标记 x=-2；左端重物需产生足够力矩。`;
            for (const c of cs)
                if (c.kind === 'plank' && this.leverAngle > 0) {
                    c.body.addTorque({ x: 0, y: 0, z: this.leverAngle * 10 }, true);
                }
        }
        if (this.index === 2 && this.elevator) {
            const gear = cs.find(c => c.kind === 'gear' && Math.abs(c.anchor.x + 2) < .35 && Math.abs(c.anchor.y - 2.7) < .3 && Math.abs(c.width / 2 - 1) < .25 && Math.abs(c.height / c.width - 1) < .25 && Math.abs(c.anchor.z + 2.3) < .5);
            const pulley = cs.find(c => c.kind === 'pulley' && Math.abs(c.anchor.x + 6) < 1);
            const weight = cs.find(c => c.kind === 'weight' && Math.abs(c.anchor.x + 6) < 1.4 && c.body.mass() > 2 && c.body.translation().y < c.anchor.y - .3);
            const torque = this.leverWork(cs, -3);
            if (gear) {
                this.energy = 100;
                this.route = '齿轮传动';
            }
            else if (pulley && weight) {
                this.energy = Math.max(this.energy, weight.body.mass() * 18);
                this.route = '滑轮与配重';
            }
            else if (torque > 65) {
                this.energy = Math.min(100, this.energy + dt * torque * .2);
                this.route = '杠杆分段提升';
            }
            else if (!this.started)
                this.energy = Math.max(0, this.energy - dt * 2);
            if (this.started && this.energy >= 10) {
                this.liftY = Math.min(6, this.liftY + dt * .8);
                this.elevator.setNextKinematicTranslation({ x: 0, y: this.liftY, z: 0 });
                this.solved = this.liftY >= 5.95;
            }
            for (let i = 0; i < this.gears.length; i++)
                this.gears[i].rotation.z = this.energy >= 10 ? this.time * (i ? 1 : -1) : 0;
            for (const c of cs)
                if (c.kind === 'gear' && gear === c) {
                    c.body.setNextKinematicRotation({ x: 0, y: 0, z: Math.sin(this.time / 2), w: Math.cos(this.time / 2) });
                }
            this.report = this.solved ? '钟楼已苏醒！从平台走向右侧上层出口。' : `动力 ${Math.min(100, Math.round(this.energy))}% · ${this.route || '尚未接通'} · 站上平台按 F 启动`;
        }
        if (this.index === 3) {
            if (this.carrier(player, cs))
                this.started = true;
            for (const c of cs.filter(c => c.kind === 'float' || c.kind === 'plank')) {
                const p = c.body.translation();
                const submerged = THREE.MathUtils.clamp((.05 - (p.y - c.height / 2)) / Math.max(c.height, .1), 0, 1);
                if (submerged > 0) {
                    const v = c.body.linvel(), av = c.body.angvel();
                    const rotation = new THREE.Quaternion().copy(c.body.rotation());
                    for (const sx of [-1, 1])
                        for (const sz of [-1, 1]) {
                            const offset = new THREE.Vector3(sx * c.width * .4, 0, sz * c.depth * .4).applyQuaternion(rotation);
                            const point = new THREE.Vector3(p.x, p.y, p.z).add(offset);
                            const fraction = THREE.MathUtils.clamp((.05 - (point.y - c.height / 2)) / Math.max(c.height, .1), 0, 1);
                            const pointVy = v.y + av.z * offset.x - av.x * offset.z;
                            const up = c.width * c.height * c.depth * fraction * 9.81 / 4 - pointVy * c.body.mass() * .7;
                            c.body.addForceAtPoint({ x: 0, y: Math.max(0, up), z: 0 }, point, true);
                        }
                    c.body.addForce({ x: this.started && c.kind === 'float' ? c.body.mass() * .65 : 0, y: 0, z: -v.z * c.body.mass() * .6 }, true);
                    c.body.addTorque({ x: -av.x * .7, y: -av.y * .5, z: -av.z * .7 }, true);
                    const sail = cs.find(s => s.kind === 'sail' && s.anchor.distanceTo(c.anchor) < 3);
                    const tether = cs.find(s => (s.kind === 'rope' || s.kind === 'pulley') && Math.abs(s.anchor.x + 7) < 2);
                    if (sail && this.started) {
                        c.body.addForce({ x: sail.width * sail.height * .5, y: 0, z: 0 }, true);
                        this.route = '船帆与风力';
                    }
                    else if (tether && this.started) {
                        c.body.addForce({ x: 4, y: 0, z: 0 }, true);
                        this.route = '牵引漂浮平台';
                        this.setRope(new THREE.Vector3(8, 2, 0), new THREE.Vector3(p.x, p.y, p.z));
                    }
                    else
                        this.route = '浮筒与海流';
                }
            }
            this.report = `${this.started ? this.route : '岸边系泊：先画船体与推进装置，再跳上船'} · 船体越宽越稳定；在船上移动可微调航向。`;
        }
    }
    carrier(player: R.RigidBody, cs: Creation[]) {
        if (this.index !== 3)
            return undefined;
        const p = player.translation();
        const hit = this.world.castRay(new R.Ray({ x: p.x, y: p.y - .55, z: p.z }, { x: 0, y: -1, z: 0 }), .32, true, undefined, undefined, undefined, player);
        if (!hit)
            return undefined;
        const body = hit.collider.parent();
        return cs.find(c => (c.kind === 'float' || c.kind === 'plank') && c.body.handle === body?.handle);
    }
    sync() {
        for (const o of this.dynamic) {
            o.mesh.position.copy(o.body.translation());
            o.mesh.quaternion.copy(o.body.rotation());
        }
    }
    won(p: R.Vector) { return p.x > 9 && Math.abs(p.z) < 1.5 && (this.index === 1 ? this.solved : this.index === 2 ? this.solved && p.y > 6 : true); }
    dispose() {
        for (const b of this.bodies)
            this.world.removeRigidBody(b);
        for (const c of this.staticColliders)
            this.world.removeCollider(c, true);
        this.bodies = [];
        this.staticColliders = [];
        this.dynamic = [];
        this.ropes = [];
        this.group.traverse(o => {
            if (o instanceof THREE.Mesh || o instanceof THREE.Line) {
                o.geometry.dispose();
                const ms = Array.isArray(o.material) ? o.material : [o.material];
                for (const m of ms)
                    m.dispose();
            }
        });
        this.group.clear();
    }
}
