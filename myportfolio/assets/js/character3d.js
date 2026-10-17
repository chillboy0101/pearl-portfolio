/* Carl's 3D character, built from simple shapes with Three.js (loaded only when needed).
   Two places use it:
   - the game's waiting screen: the head peeks up from the bottom edge, follows the cursor and blinks;
   - the closing art panel: the character slides in, then turns its head toward the cursor.
   If WebGL or the library is unavailable, the pixel versions already on the page stay in place. */

const THREE_URL = 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js';
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const pointer = { x: 0, y: 0, cx: innerWidth / 2, cy: innerHeight / 2 };
let threePromise = null;

window.addEventListener('pointermove', (e) => {
    pointer.cx = e.clientX;
    pointer.cy = e.clientY;
    pointer.x = e.clientX / innerWidth * 2 - 1;
    pointer.y = e.clientY / innerHeight * 2 - 1;
}, { passive: true });

function webglAvailable() {
    try {
        const c = document.createElement('canvas');
        return !!(c.getContext('webgl2') || c.getContext('webgl'));
    } catch (e) {
        return false;
    }
}

function loadThree() {
    if (!threePromise) threePromise = import(THREE_URL);
    return threePromise;
}

/* Run cb(true/false) as el enters or leaves the viewport. */
function watch(el, cb, margin) {
    new IntersectionObserver((entries) => cb(entries[0].isIntersecting), { rootMargin: margin || '0px' }).observe(el);
}

const COLOURS = {
    skin: 0xc98d5f,
    cheek: 0xf27bf2,
    cap: 0x1f883d,
    capDark: 0x166a2f,
    eye: 0xffffff,
    pupil: 0x14181f,
    hoodie: 0x24292f,
    string: 0x19c23f,
    mouth: 0x3a1e12
};

/* Builds the character. Returns the root group plus the parts that animate. */
function buildCharacter(THREE) {
    const mat = (color, opts) => new THREE.MeshPhysicalMaterial(Object.assign({ color, roughness: 0.55, clearcoat: 0.25, clearcoatRoughness: 0.6 }, opts || {}));
    const root = new THREE.Group();
    const body = new THREE.Group();
    const head = new THREE.Group();
    root.add(body);
    body.add(head);
    head.position.y = 1.35;

    /* Torso: a rounded hoodie with a hood ring and two green drawstrings. */
    const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.95, 0.9, 12, 32), mat(COLOURS.hoodie, { roughness: 0.8, clearcoat: 0 }));
    torso.scale.set(1.15, 1, 0.8);
    torso.position.y = -0.55;
    body.add(torso);
    const hood = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.17, 16, 40), mat(COLOURS.hoodie, { roughness: 0.85, clearcoat: 0 }));
    hood.rotation.x = Math.PI / 2;
    hood.position.set(0, 0.42, -0.05);
    body.add(hood);
    [-0.22, 0.22].forEach((x) => {
        const s = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.55, 10), mat(COLOURS.string));
        s.position.set(x, 0.05, 0.72);
        s.rotation.x = 0.25;
        body.add(s);
    });

    /* Head: a slightly squashed sphere with ears. */
    const skin = mat(COLOURS.skin, { roughness: 0.5, clearcoat: 0.35, sheen: 0.4, sheenColor: new THREE.Color(0xffd2b0) });
    const skull = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 40), skin);
    skull.scale.set(1.05, 0.95, 0.95);
    head.add(skull);
    [-1, 1].forEach((side) => {
        const ear = new THREE.Mesh(new THREE.SphereGeometry(0.22, 24, 16), skin);
        ear.scale.set(0.6, 1, 0.8);
        ear.position.set(side * 1.02, -0.05, 0);
        head.add(ear);
    });

    /* Cap: a dome with a brim angled forward and to the right, and a button on top. */
    const capMat = mat(COLOURS.cap, { roughness: 0.65, clearcoat: 0.1 });
    const dome = new THREE.Mesh(new THREE.SphereGeometry(1.08, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2.15), capMat);
    dome.position.y = 0.12;
    dome.rotation.x = -0.12;
    head.add(dome);
    const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.75, 0.08, 40, 1, false, -Math.PI / 2, Math.PI), mat(COLOURS.capDark, { roughness: 0.7 }));
    brim.scale.set(1.25, 1, 1.1);
    brim.position.set(0.15, 0.3, 0.72);
    brim.rotation.set(0.12, 0.35, 0);
    head.add(brim);
    const button = new THREE.Mesh(new THREE.SphereGeometry(0.1, 16, 12), capMat);
    button.position.y = 1.17;
    head.add(button);

    /* Eyes: white spheres with pupils and highlights; the eye groups squash to blink. */
    const eyes = [];
    const pupils = [];
    [-0.36, 0.36].forEach((x) => {
        const eye = new THREE.Group();
        eye.position.set(x, 0.0, 0.84);
        const white = new THREE.Mesh(new THREE.SphereGeometry(0.24, 32, 24), mat(COLOURS.eye, { roughness: 0.2, clearcoat: 1 }));
        white.scale.set(1, 1.15, 0.6);
        eye.add(white);
        const pupil = new THREE.Group();
        const iris = new THREE.Mesh(new THREE.SphereGeometry(0.13, 24, 16), mat(COLOURS.pupil, { roughness: 0.15, clearcoat: 1 }));
        iris.scale.set(1, 1.2, 0.5);
        const shine = new THREE.Mesh(new THREE.SphereGeometry(0.04, 12, 8), new THREE.MeshBasicMaterial({ color: 0xffffff }));
        shine.position.set(0.04, 0.05, 0.06);
        pupil.add(iris, shine);
        pupil.position.z = 0.12;
        eye.add(pupil);
        head.add(eye);
        eyes.push(eye);
        pupils.push(pupil);
    });

    /* Cheeks and a small smile. */
    [-0.62, 0.62].forEach((x) => {
        const cheek = new THREE.Mesh(new THREE.SphereGeometry(0.16, 20, 12), new THREE.MeshBasicMaterial({ color: COLOURS.cheek, transparent: true, opacity: 0.55 }));
        cheek.scale.set(1.2, 0.6, 0.3);
        cheek.position.set(x, -0.3, 0.8);
        head.add(cheek);
    });
    const smile = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.035, 10, 24, Math.PI), mat(COLOURS.mouth));
    smile.rotation.z = Math.PI;
    smile.position.set(0, -0.33, 0.93);
    head.add(smile);

    return { root, body, head, eyes, pupils, torso };
}

/* Full-body version for the game: adds legs, shoes and arms that swing from hip and shoulder pivots. */
function addLimbs(THREE, c) {
    const mat = (color, rough) => new THREE.MeshPhysicalMaterial({ color, roughness: rough || 0.7 });
    c.torso.scale.set(0.95, 0.62, 0.7);
    c.torso.position.y = -0.35;
    const limbs = { legs: [], arms: [] };
    [-0.38, 0.38].forEach((x) => {
        const hip = new THREE.Group();
        hip.position.set(x, -1.05, 0);
        const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.24, 0.55, 8, 16), mat(0x2f4b7c));
        leg.position.y = -0.45;
        const shoe = new THREE.Mesh(new THREE.SphereGeometry(0.3, 20, 12), mat(0x14181f, 0.5));
        shoe.scale.set(1, 0.55, 1.4);
        shoe.position.set(0, -0.88, 0.12);
        hip.add(leg, shoe);
        c.body.add(hip);
        limbs.legs.push(hip);
    });
    [-1, 1].forEach((side) => {
        const shoulder = new THREE.Group();
        shoulder.position.set(side * 0.98, 0.05, 0);
        const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.2, 0.55, 8, 16), mat(COLOURS.hoodie, 0.85));
        arm.position.y = -0.42;
        const hand = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 12), mat(COLOURS.skin, 0.5));
        hand.position.y = -0.86;
        shoulder.add(arm, hand);
        shoulder.rotation.z = side * 0.18;
        c.body.add(shoulder);
        limbs.arms.push(shoulder);
    });
    return limbs;
}

function makeStage(THREE, canvas) {
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    const scene = new THREE.Scene();
    scene.add(new THREE.HemisphereLight(0xffffff, 0x4a5d52, 1.6));
    const key = new THREE.DirectionalLight(0xffffff, 2.2);
    key.position.set(3, 4, 5);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0xb07cfa, 1.4);
    rim.position.set(-4, 2, -3);
    scene.add(rim);
    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
    return { renderer, scene, camera };
}

function sizeTo(stage, el) {
    const r = el.getBoundingClientRect();
    stage.renderer.setSize(r.width, r.height, false);
    stage.camera.aspect = r.width / Math.max(1, r.height);
    stage.camera.updateProjectionMatrix();
}

/* Shared blink timer: closes both eyes for 0.14 s every 2.5–6 s. */
function blinker() {
    let next = 2 + Math.random() * 3;
    let t = 0;
    return (dt, eyes) => {
        t += dt;
        let s = 1;
        if (t > next) {
            const k = (t - next) / 0.14;
            s = k < 1 ? Math.max(0.08, Math.abs(1 - 2 * k)) : 1;
            if (k >= 1) { t = 0; next = 2.5 + Math.random() * 3.5; }
        }
        eyes.forEach((e) => { e.scale.y = s; });
    };
}

/* Waiting screen of the game: head peeking up from the bottom-right, following the cursor. */
async function mountPeek() {
    const game = document.getElementById('game');
    if (!game) return;
    const THREE = await loadThree();
    const canvas = document.createElement('canvas');
    canvas.className = 'peek3d';
    canvas.setAttribute('aria-hidden', 'true');
    game.appendChild(canvas);
    const stage = makeStage(THREE, canvas);
    const c = buildCharacter(THREE);
    stage.scene.add(c.root);
    c.root.position.y = -0.75;
    stage.camera.position.set(0, 0.9, 5.2);
    stage.camera.lookAt(0, 0.9, 0);
    window.cq3dPeek = true;
    game.classList.add('has-3d');
    const blink = blinker();
    let rise = 0;
    let visible = true;
    let raf = 0;
    let last = performance.now();
    const turn = { x: 0, y: 0 };

    function frame(now) {
        const dt = Math.min(0.05, (now - last) / 1000);
        last = now;
        const r = canvas.getBoundingClientRect();
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height * 0.45;
        const dx = Math.max(-1, Math.min(1, (pointer.cx - cx) / (innerWidth * 0.45)));
        const dy = Math.max(-1, Math.min(1, (pointer.cy - cy) / (innerHeight * 0.5)));
        const near = pointer.cx > r.left - 60 && pointer.cx < r.right + 60 && pointer.cy > r.top && pointer.cy < r.bottom + 80;
        const k = Math.min(1, dt * 6);
        turn.y += (dx * 0.7 - turn.y) * k;
        turn.x += (dy * 0.35 - turn.x) * k;
        rise += ((near ? 0.35 : 0) - rise) * Math.min(1, dt * 8);
        c.head.rotation.set(turn.x, turn.y, -turn.y * 0.08);
        c.body.rotation.y = turn.y * 0.25;
        c.root.position.y = -0.75 + rise + (reduced ? 0 : Math.sin(now / 900) * 0.03);
        c.pupils.forEach((p) => { p.position.x = dx * 0.05; p.position.y = -dy * 0.05; });
        if (!reduced) blink(dt, c.eyes);
        stage.renderer.render(stage.scene, stage.camera);
        raf = visible && !game.classList.contains('playing') ? requestAnimationFrame(frame) : 0;
    }
    function start() {
        if (!raf && visible && !game.classList.contains('playing')) { last = performance.now(); raf = requestAnimationFrame(frame); }
    }
    sizeTo(stage, canvas);
    addEventListener('resize', () => { sizeTo(stage, canvas); start(); });
    watch(game, (v) => { visible = v; start(); });
    new MutationObserver(start).observe(game, { attributes: true, attributeFilter: ['class'] });
    start();
}

/* Closing art panel: slides in from the left, then turns toward the cursor (Universe's easing). */
async function mountArt() {
    const art = document.querySelector('.cta-art');
    if (!art) return;
    const THREE = await loadThree();
    const canvas = document.createElement('canvas');
    canvas.className = 'art3d';
    canvas.setAttribute('aria-hidden', 'true');
    art.appendChild(canvas);
    const stage = makeStage(THREE, canvas);
    const c = buildCharacter(THREE);
    const holder = new THREE.Group();
    holder.add(c.root);
    stage.scene.add(holder);
    c.root.rotation.y = 0.45 * Math.PI / 2;
    c.root.position.y = -1.1;
    stage.camera.position.set(-0.25, 0.55, 6.6);
    stage.camera.lookAt(-0.25, 0.55, 0);
    art.classList.add('has-3d');
    const blink = blinker();
    const turn = { x: 0, y: 0 };
    let entered = 0;
    let visible = false;
    let raf = 0;
    let last = performance.now();

    function frame(now) {
        const dt = Math.min(0.05, (now - last) / 1000);
        last = now;
        if (entered < 1) entered = reduced ? 1 : Math.min(1, entered + dt / 2.4);
        const ease = (t) => 1 - Math.pow(2, -10 * t);
        holder.position.x = -3.6 * (1 - ease(Math.min(1, entered * 2.4 / 1.4)));
        holder.rotation.y = -0.3 * Math.PI * (1 - ease(entered));
        const k = Math.min(5 * dt, 1);
        turn.x += (-0.2 * pointer.y - turn.x) * k;
        turn.y += ((-1 + (pointer.x * 0.5 + 0.5) * 1.5) - turn.y) * k;
        c.head.rotation.set(-0.08 + turn.x, turn.y * 0.6, 0);
        c.torso.rotation.set(-0.2 * turn.x, -0.2 * turn.y, 0);
        c.pupils.forEach((p) => { p.position.x = (pointer.x * 0.5 + 0.2) * 0.06; p.position.y = -pointer.y * 0.05; });
        if (!reduced) blink(dt, c.eyes);
        stage.renderer.render(stage.scene, stage.camera);
        raf = visible ? requestAnimationFrame(frame) : 0;
    }
    sizeTo(stage, canvas);
    addEventListener('resize', () => sizeTo(stage, canvas));
    watch(art, (v) => {
        visible = v;
        if (v && !raf) { last = performance.now(); raf = requestAnimationFrame(frame); }
    });
}

/* Game sprite: renders the full-body character into a small offscreen canvas on demand,
   posed for standing, walking or jumping and turned toward the direction of travel.
   game.js draws that canvas in place of the pixel sprite when window.cq3dSprite exists. */
async function mountSprite() {
    const THREE = await loadThree();
    const size = 160;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const stage = makeStage(THREE, canvas);
    stage.renderer.setPixelRatio(1);
    stage.renderer.setSize(size, size, false);
    const c = buildCharacter(THREE);
    const limbs = addLimbs(THREE, c);
    stage.scene.add(c.root);
    c.root.scale.setScalar(0.92);
    stage.camera.position.set(0, 0.15, 10);
    stage.camera.lookAt(0, 0.15, 0);
    const blink = blinker();
    let lastT = 0;
    window.cq3dSprite = {
        canvas,
        footY: 0.915,
        render(pose) {
            const t = pose.t || 0;
            /* Same pose as the last call (the trail ghosts reuse the player's frame): skip re-rendering. */
            const key = pose.frame + (pose.facing < 0 ? 'L' : 'R') + Math.round(t * 60);
            if (key === this.lastKey) return canvas;
            this.lastKey = key;
            const swing = pose.frame === 'walk' ? Math.sin(t * 13) * 0.7 : 0;
            c.root.rotation.y = (pose.facing < 0 ? -1 : 1) * 0.6;
            c.root.position.y = pose.frame === 'walk' ? Math.abs(Math.sin(t * 13)) * 0.12 - 0.05 : 0;
            limbs.legs[0].rotation.x = pose.frame === 'jump' ? -0.7 : swing;
            limbs.legs[1].rotation.x = pose.frame === 'jump' ? 0.3 : -swing;
            limbs.arms[0].rotation.x = pose.frame === 'jump' ? -2.6 : -swing * 0.9;
            limbs.arms[1].rotation.x = pose.frame === 'jump' ? -2.6 : swing * 0.9;
            c.head.rotation.set(pose.frame === 'jump' ? -0.15 : 0, 0, 0);
            blink(Math.max(0, Math.min(0.05, t - lastT)), c.eyes);
            lastT = t;
            stage.renderer.render(stage.scene, stage.camera);
            return canvas;
        }
    };
}

/* Load the library only when either place is about to scroll into view. */
if (webglAvailable()) {
    const targets = [['#game', mountPeek], ['#game', mountSprite], ['.cta-art', mountArt]];
    targets.forEach(([sel, mount]) => {
        const el = document.querySelector(sel);
        if (!el) return;
        let done = false;
        watch(el, (v) => {
            if (v && !done) {
                done = true;
                mount().catch(() => { /* keep the pixel version */ });
            }
        }, '300px');
    });
}

window.cqCharacter3d = { loaded: () => !!threePromise };
