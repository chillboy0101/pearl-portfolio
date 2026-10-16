(function () {
    "use strict";

    var canvas = document.getElementById("hero-canvas");
    if (!canvas || typeof THREE === "undefined") return;
    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    var renderer;
    try {
        renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
    } catch (e) {
        return; // No WebGL: the gradient hero still looks complete.
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(0, 0, 9);

    var world = new THREE.Group();
    scene.add(world);

    var ORANGE = new THREE.Color("#ed8936");
    var WARM = new THREE.Color("#fbd38d");
    var BLUE = new THREE.Color("#90cdf4");

    // Globe of points on a Fibonacci sphere.
    var COUNT = 700;
    var RADIUS = 2.6;
    var positions = new Float32Array(COUNT * 3);
    var colors = new Float32Array(COUNT * 3);
    var points = [];
    for (var i = 0; i < COUNT; i++) {
        var y = 1 - (i / (COUNT - 1)) * 2;
        var r = Math.sqrt(1 - y * y);
        var theta = Math.PI * (3 - Math.sqrt(5)) * i;
        var v = new THREE.Vector3(Math.cos(theta) * r, y, Math.sin(theta) * r).multiplyScalar(RADIUS);
        points.push(v);
        positions.set([v.x, v.y, v.z], i * 3);
        var c = Math.random() < 0.18 ? ORANGE : (Math.random() < 0.5 ? WARM : BLUE);
        colors.set([c.r, c.g, c.b], i * 3);
    }
    var globeGeo = new THREE.BufferGeometry();
    globeGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    globeGeo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    var dotTexture = (function () {
        var c = document.createElement("canvas");
        c.width = c.height = 64;
        var g = c.getContext("2d");
        var grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
        grad.addColorStop(0, "rgba(255,255,255,1)");
        grad.addColorStop(0.4, "rgba(255,255,255,0.6)");
        grad.addColorStop(1, "rgba(255,255,255,0)");
        g.fillStyle = grad;
        g.fillRect(0, 0, 64, 64);
        return new THREE.CanvasTexture(c);
    })();
    var globe = new THREE.Points(globeGeo, new THREE.PointsMaterial({
        size: 0.09, map: dotTexture, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending
    }));
    world.add(globe);

    // Network lines between near neighbours.
    var linePos = [];
    for (var a = 0; a < COUNT; a += 2) {
        for (var b = a + 1; b < Math.min(a + 40, COUNT); b++) {
            if (points[a].distanceTo(points[b]) < 0.42 && Math.random() < 0.5) {
                linePos.push(points[a].x, points[a].y, points[a].z, points[b].x, points[b].y, points[b].z);
            }
        }
    }
    var lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute("position", new THREE.Float32BufferAttribute(linePos, 3));
    var lines = new THREE.LineSegments(lineGeo, new THREE.LineBasicMaterial({
        color: 0x90cdf4, transparent: true, opacity: 0.16, blending: THREE.AdditiveBlending
    }));
    world.add(lines);

    // Inner glow sphere.
    var core = new THREE.Mesh(
        new THREE.SphereGeometry(RADIUS * 0.97, 48, 48),
        new THREE.MeshBasicMaterial({ color: 0x13233a, transparent: true, opacity: 0.55 })
    );
    world.add(core);

    // Orbit rings with travelling satellites.
    var rings = [];
    [[3.3, 0.5, 0xed8936], [3.8, -0.9, 0x90cdf4], [4.3, 1.2, 0xfbd38d]].forEach(function (cfg, idx) {
        var ring = new THREE.Mesh(
            new THREE.TorusGeometry(cfg[0], 0.006, 8, 180),
            new THREE.MeshBasicMaterial({ color: cfg[2], transparent: true, opacity: 0.35 })
        );
        ring.rotation.x = Math.PI / 2 + cfg[1] * 0.4;
        ring.rotation.y = cfg[1];
        var sat = new THREE.Mesh(
            new THREE.SphereGeometry(0.07, 16, 16),
            new THREE.MeshBasicMaterial({ color: cfg[2] })
        );
        ring.add(sat);
        world.add(ring);
        rings.push({ ring: ring, sat: sat, r: cfg[0], speed: 0.35 + idx * 0.12, offset: idx * 2 });
    });

    // Floating wireframe shapes.
    var floaters = [];
    // Positions are relative to the globe, so the shapes stay on its side of the hero.
    [
        [new THREE.IcosahedronGeometry(0.32, 0), 0xed8936, [-2.9, 2.4, -1]],
        [new THREE.OctahedronGeometry(0.28, 0), 0x90cdf4, [3.1, -2.2, -0.5]],
        [new THREE.TetrahedronGeometry(0.3, 0), 0xfbd38d, [-2.6, -2.7, 0.4]],
        [new THREE.BoxGeometry(0.34, 0.34, 0.34), 0xed8936, [3.3, 2.5, -1.2]]
    ].forEach(function (f, idx) {
        var m = new THREE.Mesh(f[0], new THREE.MeshBasicMaterial({ color: f[1], wireframe: true, transparent: true, opacity: 0.7 }));
        m.position.set(f[2][0], f[2][1], f[2][2]);
        scene.add(m);
        floaters.push({ mesh: m, x: f[2][0], base: f[2][1], phase: idx * 1.7 });
    });

    // Background star dust.
    var dust = new Float32Array(500 * 3);
    for (var d = 0; d < 500; d++) {
        dust.set([(Math.random() - 0.5) * 30, (Math.random() - 0.5) * 18, -6 - Math.random() * 10], d * 3);
    }
    var dustGeo = new THREE.BufferGeometry();
    dustGeo.setAttribute("position", new THREE.BufferAttribute(dust, 3));
    scene.add(new THREE.Points(dustGeo, new THREE.PointsMaterial({
        size: 0.05, map: dotTexture, color: 0xffffff, transparent: true, opacity: 0.5, depthWrite: false
    })));

    // Layout: globe sits right of the text on wide screens, centred behind it on narrow ones.
    function resize() {
        var w = canvas.clientWidth, h = canvas.clientHeight;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        var wide = w > 900;
        world.position.x = wide ? 2.9 : 0;
        world.position.y = wide ? 0 : 0.6;
        var s = wide ? 1 : 0.85;
        world.scale.set(s, s, s);
        globe.material.opacity = wide ? 1 : 0.55;
        floaters.forEach(function (f) {
            f.mesh.position.x = f.x + world.position.x;
            f.mesh.visible = wide;
        });
        lines.material.opacity = wide ? 0.16 : 0.08;
    }
    window.addEventListener("resize", resize);
    resize();

    var mouse = { x: 0, y: 0 };
    window.addEventListener("pointermove", function (e) {
        mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        mouse.y = (e.clientY / window.innerHeight) * 2 - 1;
    }, { passive: true });

    var visible = true;
    if ("IntersectionObserver" in window) {
        new IntersectionObserver(function (entries) {
            visible = entries[0].isIntersecting;
        }).observe(canvas);
    }

    var clock = new THREE.Clock();
    function render() {
        var t = clock.getElapsedTime();
        world.rotation.y = t * 0.12 + mouse.x * 0.35;
        world.rotation.x = 0.25 + mouse.y * 0.2;
        rings.forEach(function (o) {
            var ang = t * o.speed + o.offset;
            o.sat.position.set(Math.cos(ang) * o.r, Math.sin(ang) * o.r, 0);
        });
        floaters.forEach(function (f) {
            f.mesh.rotation.x = t * 0.4 + f.phase;
            f.mesh.rotation.y = t * 0.3 + f.phase;
            f.mesh.position.y = f.base + world.position.y + Math.sin(t + f.phase) * 0.25;
        });
        camera.position.x += (mouse.x * 0.4 - camera.position.x) * 0.04;
        camera.position.y += (-mouse.y * 0.3 - camera.position.y) * 0.04;
        camera.lookAt(0, 0, 0);
        renderer.render(scene, camera);
    }

    if (reduceMotion) {
        render();
        return;
    }
    (function loop() {
        requestAnimationFrame(loop);
        if (visible && !document.hidden) render();
    })();
})();
