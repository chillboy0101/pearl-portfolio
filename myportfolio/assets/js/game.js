/* Super Carl: an endless platformer that lives in the hero's grid cell.
   World units are grid cells; y grows upwards from the floor. */
(function () {
    'use strict';

    var root = document.getElementById('game');
    if (!root) return;

    var canvas = root.querySelector('canvas');
    var ctx = canvas.getContext('2d');
    var hud = root.querySelector('.game-hud');
    var livesEl = root.querySelector('.game-lives');
    var scoreEl = root.querySelector('.game-score b');
    var controlsEl = root.querySelector('.game-controls');
    var superEl = root.querySelector('.game-super');
    var soundBtn = root.querySelector('.game-sound');
    var pad = root.querySelector('.game-pad');
    var label = document.getElementById('game-label');
    var button = document.getElementById('game-btn');

    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var coarse = window.matchMedia('(pointer: coarse)').matches;
    var HIGH_KEY = 'cq:super-carl:high';
    var MUTE_KEY = 'cq:super-carl:muted';

    var ROWS = 26;
    var GRAVITY = 64;
    var JUMP = 30;
    var MOVE = 21;
    var PW = 1.9;
    var PH = 2.5;
    var SPRITE_W = 2.7;
    var BLOCK = '#57615b';
    var GRID = '#d9dfdb';
    var STEP = 1 / 120;
    var BUG_W = 1.9;
    var BUG_H = 1.7;
    var GAME_KEYS = { ArrowLeft: 1, ArrowRight: 1, KeyA: 1, KeyD: 1, Space: 1 };
    var GLYPHS = ['/', '=', '+', '<', '>', '{', '}', ';'];
    var PICKUP_COLOURS = ['#b07cfa', '#5b3dfa', '#f73678', '#5fed83', '#bba00a', '#c05200'];
    var MEGA_COLOURS = ['#c05200', '#bba00a', '#f73678', '#ae85ff'];
    /* 3x5 pixel digits for score pop-ups and the scoreboard. */
    var DIGITS = {
        0: ['111', '101', '101', '101', '111'], 1: ['010', '110', '010', '010', '111'], 2: ['111', '001', '111', '100', '111'],
        3: ['111', '001', '111', '001', '111'], 4: ['101', '101', '111', '001', '001'], 5: ['111', '100', '111', '001', '111'],
        6: ['111', '100', '111', '101', '111'], 7: ['111', '001', '001', '001', '001'], 8: ['111', '101', '111', '101', '111'],
        9: ['111', '101', '111', '001', '111'], '+': ['000', '010', '111', '010', '000']
    };

    function store(key, value) {
        try {
            if (value === undefined) return window.localStorage.getItem(key);
            window.localStorage.setItem(key, value);
        } catch (e) { /* storage blocked: the game still works, it just forgets */ }
        return null;
    }

    /* ---------------------------------------------------------------- sprites */

    var PAL = {
        G: '#1f883d', S: '#8d5524', K: '#14181f', H: '#24292f', B: '#2f4b7c', W: '#ffffff',
        P: '#b07cfa', L: '#f27bf2', Y: '#f5c518', O: '#d4511d'
    };

    var HEAD = ['....GGGG....', '...GGGGGGG..', '...SSSSSS...', '..SSKSSKSS..', '..SSSSSSSS..', '...SSSSSS...', '....SSSS....'];
    var SPRITES = {
        stand: HEAD.concat(['..HHHHHHHH..', '.HHHGHHGHHH.', '.SHHHHHHHHS.', '..HHHHHHHH..', '..BBB..BBB..', '..BBB..BBB..', '.KKK....KKK.']),
        walk: HEAD.concat(['..HHHHHHHH..', '.HHHGHHGHHH.', '.SHHHHHHHHS.', '..HHHHHHHH..', '...BBBBBB...', '..BB....BB..', '.KK......KK.']),
        jump: HEAD.concat(['S.HHHHHHHH.S', 'SHHHGHHGHHHS', '..HHHHHHHH..', '..HHHHHHHH..', '...BB..BB...', '..BBK..KBB..', '............']),
        bugA: ['..K....K..', '...K..K...', '..PPPPPP..', '.PWKPPWKP.', 'PPPPPPPPPP', 'PLPPLPPLPP', '.PPPPPPPP.', '.K.K..K.K.'],
        bugB: ['..K....K..', '...K..K...', '..PPPPPP..', '.PWKPPWKP.', 'PPPPPPPPPP', 'PLPPLPPLPP', '.PPPPPPPP.', 'K..K..K..K'],
        bugFlat: ['..........', '..........', '..........', '..........', '..........', '.PPPPPPPP.', 'PLPPLPPLPP', 'K.K.KK.K.K'],
        duck: ['...YYY...', '..YYYYY..', '..YKYYYOO', '..YYYYY..', 'YYYYYYYY.', 'YYYYYYYYY', '.YYYYYYY.', '..YYYYY..']
    };

    /* The big peeking head shown while the game waits; pupils are drawn separately so they can follow the cursor. */
    var PEEK = [
        '.......GGGGGGGG.......', '.....GGGGGGGGGGGG.....', '....GGGGGGGGGGGGGG....', '...GGGGGGGGGGGGGGGGGGG',
        '...SSSSSSSSSSSSSSSS...', '..SSSSSSSSSSSSSSSSSS..', '..SSWWWWSSSSSSWWWWSS..', '..SSWWWWSSSSSSWWWWSS..',
        '..SSWWWWSSSSSSWWWWSS..', '..SSWWWWSSSSSSWWWWSS..', '.SSSSSSSSSSSSSSSSSSSS.', '.SSPPSSSSSSSSSSSSPPSS.',
        '.SSSSSSSKSSSSKSSSSSSS.', '.SSSSSSSSKKKKSSSSSSSS.', '..SSSSSSSSSSSSSSSSSS..', '...HHHHHHHHHHHHHHHH...',
        '..HHHHHHHHHHHHHHHHHH..', '.HHHHHHHGHHHHGHHHHHHH.'
    ];
    var PEEK_PAL = { G: '#1f883d', S: '#c68a5a', W: '#ffffff', P: '#f27bf2', K: '#14181f', H: '#24292f' };
    var pointer = null;
    var peek = { rise: 0, blinkAt: 2, blinkT: 0 };

    var HEART = ['.XX.XX.', 'XXXXXXX', 'XXXXXXX', '.XXXXX.', '..XXX..', '...X...'];

    var FONT = {
        G: ['.###.', '#...#', '#....', '#.###', '#...#', '#...#', '.###.'],
        A: ['.###.', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
        M: ['#...#', '##.##', '#.#.#', '#.#.#', '#...#', '#...#', '#...#'],
        E: ['#####', '#....', '#....', '####.', '#....', '#....', '#####'],
        O: ['.###.', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
        V: ['#...#', '#...#', '#...#', '#...#', '#...#', '.#.#.', '..#..'],
        R: ['####.', '#...#', '#...#', '####.', '#.#..', '#..#.', '#...#'],
        S: ['.####', '#....', '#....', '.###.', '....#', '....#', '####.'],
        C: ['.###.', '#...#', '#....', '#....', '#....', '#...#', '.###.'],
        0: ['.###.', '#...#', '#..##', '#.#.#', '##..#', '#...#', '.###.'],
        1: ['..#..', '.##..', '..#..', '..#..', '..#..', '..#..', '.###.'],
        2: ['.###.', '#...#', '....#', '...#.', '..#..', '.#...', '#####'],
        3: ['####.', '....#', '....#', '.###.', '....#', '....#', '####.'],
        4: ['...#.', '..##.', '.#.#.', '#..#.', '#####', '...#.', '...#.'],
        5: ['#####', '#....', '####.', '....#', '....#', '#...#', '.###.'],
        6: ['.###.', '#....', '#....', '####.', '#...#', '#...#', '.###.'],
        7: ['#####', '....#', '...#.', '..#..', '.#...', '.#...', '.#...'],
        8: ['.###.', '#...#', '#...#', '.###.', '#...#', '#...#', '.###.'],
        9: ['.###.', '#...#', '#...#', '.####', '....#', '....#', '.###.']
    };

    function heartSvg() {
        var rects = '';
        HEART.forEach(function (row, y) {
            for (var x = 0; x < row.length; x++) if (row[x] === 'X') rects += '<rect x="' + x + '" y="' + y + '" width="1" height="1"/>';
        });
        return '<svg viewBox="0 0 7 6" width="21" height="18" aria-hidden="true" shape-rendering="crispEdges">' + rects + '</svg>';
    }

    /* ---------------------------------------------------------------- sound */

    var Sound = {
        ctx: null,
        muted: store(MUTE_KEY) === '1',
        unlock: function () {
            if (this.ctx) return;
            var AC = window.AudioContext || window.webkitAudioContext;
            if (AC) this.ctx = new AC();
        },
        tone: function (freq, end, type, dur, gain, delay) {
            if (this.muted || !this.ctx) return;
            var t = this.ctx.currentTime + (delay || 0);
            var o = this.ctx.createOscillator();
            var g = this.ctx.createGain();
            o.type = type;
            o.frequency.setValueAtTime(freq, t);
            if (end) o.frequency.exponentialRampToValueAtTime(end, t + dur);
            g.gain.setValueAtTime(gain, t);
            g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
            o.connect(g).connect(this.ctx.destination);
            o.start(t);
            o.stop(t + dur + 0.02);
        },
        play: function (name, superMode) {
            var up = superMode ? 1.5 : 1;
            var s = this;
            switch (name) {
                case 'jump': s.tone(440 * up, 880 * up, 'triangle', 0.14, 0.12); break;
                case 'jump2': s.tone(620 * up, 1240 * up, 'triangle', 0.14, 0.12); break;
                case 'collect': s.tone(660 * up, 0, 'square', 0.06, 0.05); s.tone(990 * up, 0, 'square', 0.1, 0.05, 0.06); break;
                case 'mega': [523, 659, 784, 1047, 1319].forEach(function (f, i) { s.tone(f, 0, 'square', 0.1, 0.05, i * 0.07); }); break;
                case 'bump': s.tone(180, 90, 'square', 0.08, 0.08); break;
                case 'squash': s.tone(260, 70, 'square', 0.14, 0.09); break;
                case 'hit': s.tone(320, 110, 'sawtooth', 0.3, 0.08); break;
                case 'duck': s.tone(880, 0, 'triangle', 0.08, 0.1); s.tone(1175, 0, 'triangle', 0.12, 0.1, 0.08); break;
                case 'duckLeave': s.tone(1175, 0, 'triangle', 0.08, 0.08); s.tone(880, 0, 'triangle', 0.12, 0.08, 0.08); break;
                case 'superEnd': [784, 659, 523].forEach(function (f, i) { s.tone(f, 0, 'triangle', 0.1, 0.06, i * 0.07); }); break;
                case 'over': [392, 330, 262, 196].forEach(function (f, i) { s.tone(f, 0, 'square', 0.2, 0.06, i * 0.18); }); break;
            }
        }
    };

    /* ---------------------------------------------------------------- world */

    var view = { w: 0, h: 0, cell: 16, cols: 60, dpr: 1 };
    var G;
    var state = 'idle';
    var keys = {};
    var moved = false;
    var jumped = false;
    var raf = 0;
    var last = 0;
    var visible = true;

    function rng(seed) {
        return function () {
            seed = (seed * 16807) % 2147483647;
            return (seed - 1) / 2147483646;
        };
    }

    function newWorld() {
        var r = rng(1 + Math.floor(Math.random() * 2147483645));
        G = {
            rand: r,
            blocks: {},
            blockList: [],
            pickups: [],
            bugs: [],
            popups: [],
            debris: [],
            fx: [],
            trail: [],
            shake: 0,
            wipe: 0,
            rows: [
                { nextX: 16, y: 4 + Math.floor(r() * 5), minY: 4, maxY: 12 },
                { nextX: 24, y: 17 + Math.floor(r() * 3), minY: 17, maxY: 19 }
            ],
            nextGroundBugX: 28,
            nextMegaAt: 8,
            nextDuckAt: 12,
            elapsed: 0,
            time: 0,
            scrollX: 0,
            scrolling: false,
            lives: 3,
            score: 0,
            superT: 0,
            over: false,
            overT: 0,
            overShown: false,
            overShownAt: 0,
            overDone: false,
            player: { x: 6, y: 0, vy: 0, jumps: 2, facing: 1, moving: false, inv: 0, step: 0, land: 0 },
            duck: { state: 'hidden', x: 0, y: 0, t: 0, homeX: 0, homeY: 0 }
        };
        generate(view.cols + 12);
    }

    function speed() {
        return Math.min(20, 2 + 0.2 * G.elapsed);
    }

    function powerMultiplier() {
        return 1 - (speed() - 2) / 18 * 0.5;
    }

    function pickInt(min, max) {
        return min + Math.floor(G.rand() * (max - min + 1));
    }

    function solid(x, y) {
        return G.blocks[x + ',' + y] === true;
    }

    function addBlock(x, y) {
        var k = x + ',' + y;
        if (G.blocks[k]) return;
        G.blocks[k] = true;
        G.blockList.push({ x: x, y: y });
    }

    function removeBlock(x, y) {
        delete G.blocks[x + ',' + y];
        G.blockList = G.blockList.filter(function (b) { return b.x !== x || b.y !== y; });
    }

    function run(x, y, len) {
        for (var i = 0; i < len; i++) addBlock(x + i, y);
        return { x: x, y: y, len: len };
    }

    function generateRow(row, until) {
        while (row.nextX < until) {
            var r = G.rand();
            var seg;
            var endX;
            if (r < 0.18) {
                var steps = pickInt(2, 3);
                var dir = G.rand() < 0.5 ? 1 : -1;
                if (row.y + dir * 2 * steps > row.maxY || row.y + dir * 2 * steps < row.minY) dir = -dir;
                for (var s = 0; s < steps; s++) {
                    var sy = Math.max(row.minY, Math.min(row.maxY, row.y + dir * 2 * s));
                    seg = run(row.nextX + s * 4, sy, 4);
                }
                row.y = seg.y;
                endX = row.nextX + steps * 4;
            } else {
                var long = r < 0.55;
                var len = long ? pickInt(9, 14) + Math.floor((speed() - 2) * 0.5) : pickInt(4, 6);
                if (G.rand() < 0.5) row.y += (G.rand() < 0.5 ? -1 : 1) * pickInt(2, 3);
                row.y = Math.max(row.minY, Math.min(row.maxY, row.y));
                seg = run(row.nextX, row.y, len);
                endX = row.nextX + len;
            }
            decorate(seg);
            var g = G.rand();
            row.nextX = endX + (g < 0.45 ? pickInt(3, 5) : g < 0.8 ? pickInt(6, 9) : pickInt(10, 13));
        }
    }

    function decorate(seg) {
        if (G.elapsed >= G.nextMegaAt && seg.x > G.scrollX + view.cols * 0.6 && seg.len >= 4) {
            addPickup(seg.x + Math.floor(seg.len / 2) - 1, seg.y + 1.6, true);
            G.nextMegaAt = G.elapsed + 20;
        } else if (G.rand() < 0.55) {
            var n = Math.min(seg.len - 1, pickInt(1, 3));
            var start = seg.x + Math.floor((seg.len - n) / 2);
            for (var i = 0; i < n; i++) addPickup(start + i, seg.y + 1.6, false);
        }
        if (seg.len > 3 && G.rand() < 0.25) {
            addBug(seg.x + G.rand() * (seg.len - 2), seg.y + 1, seg.x, seg.x + seg.len);
        }
    }

    function addPickup(x, y, mega) {
        G.pickups.push({
            x: x + (mega ? 0 : 0.2), y: y, size: mega ? 1.8 : 0.9, mega: mega,
            glyph: GLYPHS[Math.floor(G.rand() * GLYPHS.length)],
            colour: PICKUP_COLOURS[Math.floor(G.rand() * PICKUP_COLOURS.length)],
            pulled: false, born: G.time, shown: null
        });
    }

    function addBug(x, y, minX, maxX) {
        G.bugs.push({ x: x, y: y, vy: 0, dir: G.rand() < 0.5 ? -1 : 1, minX: minX, maxX: maxX, state: 'walk', t: 0, vx: 0, rot: 0, shown: null });
    }

    function generate(until) {
        G.rows.forEach(function (row) { generateRow(row, until); });
        while (G.nextGroundBugX < until) {
            var x = G.nextGroundBugX;
            if (G.rand() < 0.5) addBug(x, 0, x - 6, x + 8);
            else if (G.rand() < 0.5) addPickup(x, 1.2, false);
            G.nextGroundBugX += pickInt(20, 28);
        }
    }

    function cleanup() {
        var edge = G.scrollX - 6;
        if (G.blockList.length && G.blockList[0].x < edge) {
            G.blockList = G.blockList.filter(function (b) {
                if (b.x >= edge) return true;
                delete G.blocks[b.x + ',' + b.y];
                return false;
            });
        }
        G.pickups = G.pickups.filter(function (p) { return p.x + p.size > edge; });
        G.bugs = G.bugs.filter(function (b) { return b.maxX + 2 > edge && b.y > -4; });
    }

    /* ---------------------------------------------------------------- physics */

    function overlap(a, b) {
        return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
    }

    function playerBox() {
        return { x: G.player.x, y: G.player.y, w: PW, h: PH };
    }

    function moveX(x, y, w, h, nx) {
        var r0 = Math.floor(y + 0.01);
        var r1 = Math.floor(y + h - 0.01);
        var c;
        var r;
        if (nx > x) {
            for (c = Math.floor(x + w); c <= Math.floor(nx + w - 0.001); c++) {
                for (r = r0; r <= r1; r++) if (solid(c, r) && c >= x + w - 0.001) return c - w;
            }
        } else if (nx < x) {
            for (c = Math.floor(x - 0.001); c >= Math.floor(nx); c--) {
                for (r = r0; r <= r1; r++) if (solid(c, r) && c + 1 <= x + 0.001) return c + 1;
            }
        }
        return nx;
    }

    /* Returns { y, landed, bumped: {x, y} } after vertical movement. */
    function moveY(x, y, w, h, ny) {
        var c0 = Math.floor(x + 0.05);
        var c1 = Math.floor(x + w - 0.05);
        var c;
        var r;
        if (ny < y) {
            for (r = Math.floor(y + 0.001) - 1; r >= Math.floor(ny); r--) {
                for (c = c0; c <= c1; c++) if (solid(c, r)) return { y: r + 1, landed: true };
            }
            if (ny <= 0) return { y: 0, landed: true };
        } else if (ny > y) {
            for (r = Math.ceil(y + h - 0.001); r <= Math.floor(ny + h); r++) {
                var hit = null;
                var best = 9;
                var mid = x + w / 2;
                for (c = c0; c <= c1; c++) {
                    if (solid(c, r) && Math.abs(c + 0.5 - mid) < best) { hit = c; best = Math.abs(c + 0.5 - mid); }
                }
                if (hit !== null) return { y: r - h, bumped: { x: hit, y: r } };
            }
        }
        return { y: ny };
    }

    function addScore(points, x, y) {
        var p = points * (G.superT > 0 ? 2 : 1);
        G.score += p;
        G.popups.push({ text: '+' + p, x: x, y: y, t: 0, gold: G.superT > 0 });
        scoreEl.textContent = G.score;
    }

    function jump() {
        var p = G.player;
        if (p.jumps <= 0) return;
        var second = p.jumps === 1;
        p.vy = JUMP;
        p.jumps--;
        Sound.play(second ? 'jump2' : 'jump', G.superT > 0);
    }

    function bump(b) {
        removeBlock(b.x, b.y);
        Sound.play('bump');
        addScore(10, b.x + 0.5, b.y + 1);
        /* The block hops up first, then breaks into four spinning pieces. */
        G.fx.push({ type: 'hop', x: b.x, y: b.y, t: 0 });
        if (G.rand() < 0.35) addPickup(b.x, b.y + 0.05, false);
        G.bugs.forEach(function (bug) {
            if (bug.state === 'walk' && Math.abs(bug.y - (b.y + 1)) < 0.05 && bug.x < b.x + 1 && bug.x + BUG_W > b.x) {
                knockOut(bug, bug.x + BUG_W / 2 >= b.x + 0.5 ? 1 : -1);
                addScore(25, bug.x + 1, bug.y + BUG_H);
            }
        });
    }

    function breakBlock(x, y) {
        for (var i = 0; i < 4; i++) {
            G.debris.push({ x: x + 0.25 + (i % 2) * 0.5, y: y + 0.25 + Math.floor(i / 2) * 0.5, vx: (i % 2 ? 1 : -1) * (3 + G.rand() * 3),
                vy: 12 + G.rand() * 8, rot: 0, vr: (i % 2 ? 1 : -1) * (6 + G.rand() * 6) });
        }
    }

    function knockOut(bug, dir) {
        bug.state = 'out';
        bug.vy = JUMP * 0.45;
        bug.vx = dir * 5;
        Sound.play('squash', G.superT > 0);
    }

    function updatePlayer(dt) {
        var p = G.player;
        var dir = (keys.ArrowRight || keys.KeyD ? 1 : 0) - (keys.ArrowLeft || keys.KeyA ? 1 : 0);
        if (dir) p.facing = dir;
        p.moving = dir !== 0;
        if (p.moving) p.step += dt;

        var nx = p.x + dir * MOVE * dt;
        nx = moveX(p.x, p.y, PW, PH, nx);
        nx = Math.max(G.scrollX, Math.min(G.scrollX + view.cols - PW, nx));
        p.x = nx;

        p.vy -= GRAVITY * dt;
        var res = moveY(p.x, p.y, PW, PH, p.y + p.vy * dt);
        p.y = res.y;
        if (res.landed) {
            if (p.vy < -4) p.land = 0.1;
            if (p.vy < 0) { p.vy = 0; p.jumps = 2; }
        } else if (res.bumped) {
            p.vy = 0;
            bump(res.bumped);
        } else if (p.jumps === 2 && p.vy < -2) {
            p.jumps = 1;
        }
        if (p.y + PH > ROWS + 3) { p.y = ROWS + 3 - PH; p.vy = 0; }
        if (p.inv > 0) p.inv -= dt;
        if (p.land > 0) p.land -= dt;

        if (G.superT > 0) {
            G.trail.unshift({ x: p.x, y: p.y, facing: p.facing, frame: frameName(p) });
            if (G.trail.length > 20) G.trail.pop();
        } else if (G.trail.length) {
            G.trail.pop();
        }
    }

    function updatePickups(dt) {
        var box = playerBox();
        var p = G.player;
        var duckOn = G.duck.state === 'follow';
        for (var i = G.pickups.length - 1; i >= 0; i--) {
            var k = G.pickups[i];
            if (!k.mega && duckOn && Math.hypot(k.x - p.x, k.y - p.y) < 7) k.pulled = true;
            if (k.pulled) {
                var dx = p.x + PW / 2 - (k.x + k.size / 2);
                var dy = p.y + PH / 2 - (k.y + k.size / 2);
                var d = Math.hypot(dx, dy) || 1;
                var step = Math.min(d, (18 + speed()) * dt);
                k.x += dx / d * step;
                k.y += dy / d * step;
            }
            if (overlap(box, { x: k.x, y: k.y, w: k.size, h: k.size })) {
                G.pickups.splice(i, 1);
                G.fx.push({ type: 'collect', pickup: k, t: 0 });
                if (k.mega) {
                    Sound.play('mega');
                    addScore(100, k.x + 1, k.y + 2);
                    G.superT = 10 * powerMultiplier();
                } else {
                    Sound.play('collect', G.superT > 0);
                    addScore(50, k.x + 0.5, k.y + 1);
                }
            }
        }
    }

    function updateBugs(dt) {
        var bugSpeed = 3 + (speed() - 2) * 0.15;
        var box = playerBox();
        var p = G.player;
        for (var i = G.bugs.length - 1; i >= 0; i--) {
            var b = G.bugs[i];
            b.t += dt;
            if (b.state === 'flat') {
                if (b.t > 0.45) G.bugs.splice(i, 1);
                continue;
            }
            if (b.state === 'out') {
                b.rot += b.vx * 2.4 * dt;
                b.vy -= GRAVITY * dt;
                b.y += b.vy * dt;
                b.x += b.vx * dt;
                continue;
            }
            var nx = b.x + b.dir * bugSpeed * dt;
            var blocked = moveX(b.x, b.y, BUG_W, BUG_H, nx) !== nx;
            if (blocked || nx < b.minX || nx + BUG_W > b.maxX) b.dir = -b.dir;
            else b.x = nx;
            b.vy -= GRAVITY * dt;
            var res = moveY(b.x, b.y, BUG_W, BUG_H, b.y + b.vy * dt);
            b.y = res.y;
            if (res.landed) b.vy = 0;

            if (state !== 'playing' || G.over) continue;
            if (!overlap(box, { x: b.x + 0.15, y: b.y, w: BUG_W - 0.3, h: BUG_H - 0.2 })) continue;
            var stomp = p.vy < 0 && p.y > b.y + BUG_H / 2;
            if (stomp) {
                b.state = 'flat';
                b.t = 0;
                Sound.play('squash', G.superT > 0);
                addScore(25, b.x + 1, b.y + BUG_H);
                p.vy = JUMP * 0.6;
                p.jumps = 1;
            } else if (G.superT > 0) {
                knockOut(b, b.x >= p.x ? 1 : -1);
                addScore(25, b.x + 1, b.y + BUG_H);
            } else if (p.inv <= 0) {
                p.inv = 1.5;
                p.vy = 0;
                G.lives--;
                if (!reduced) G.shake = 0.2;
                loseHeart();
                if (G.lives <= 0) {
                    G.over = true;
                    G.overT = 0;
                    Sound.play('over');
                } else {
                    Sound.play('hit');
                }
            }
        }
    }

    function updateDuck(dt) {
        var d = G.duck;
        var p = G.player;
        d.t += dt;
        if (d.state === 'hidden') {
            if (G.elapsed < G.nextDuckAt) return;
            var spots = G.blockList.filter(function (b) {
                return b.y <= 12 && b.x >= G.scrollX + view.cols / 2 && b.x < G.scrollX + view.cols - 2 && !solid(b.x, b.y + 1) && !solid(b.x, b.y + 2);
            });
            if (!spots.length) return;
            var s = spots[Math.floor(G.rand() * spots.length)];
            d.state = 'wait';
            d.homeX = s.x;
            d.homeY = s.y + 1.2;
            d.x = d.homeX;
            d.y = d.homeY;
            d.t = 0;
        } else if (d.state === 'wait') {
            d.y = d.homeY + 0.25 * Math.sin(d.t * 5);
            if (overlap(playerBox(), { x: d.x, y: d.y, w: 1.6, h: 1.4 })) {
                d.state = 'follow';
                d.t = 0;
                d.life = 10 * powerMultiplier();
                Sound.play('duck');
            } else if (d.x + 2 < G.scrollX) {
                hideDuck();
            }
        } else if (d.state === 'follow') {
            var tx = p.x - 2.2 * p.facing;
            var ty = p.y + PH + 0.6 + 0.3 * Math.sin(d.t * 6);
            d.x += (tx - d.x) * Math.min(1, dt * 6);
            d.y += (ty - d.y) * Math.min(1, dt * 6);
            if (d.t > d.life) {
                d.state = 'leave';
                Sound.play('duckLeave');
            }
        } else if (d.state === 'leave') {
            d.x += 10 * dt;
            d.y += 12 * dt;
            if (d.y > ROWS + 3) hideDuck();
        }
    }

    function hideDuck() {
        G.duck.state = 'hidden';
        G.nextDuckAt = G.elapsed + 12 + 8 * G.rand();
    }

    function update(dt) {
        G.time += dt;
        if (G.wipe < 1) G.wipe = Math.min(1, G.wipe + dt / 0.5);
        if (state === 'over') { if (G.time - G.overShownAt > 2.2) G.overDone = true; return; }
        if (G.shake > 0) G.shake -= dt;
        if (G.over) {
            G.overT += dt;
            if (G.overT > 1.65 && !G.overShown) showGameOver();
            if (G.overShown && G.time - G.overShownAt > 2.2) G.overDone = true;
            return;
        }
        if (state === 'playing') {
            if (G.scrolling) {
                G.elapsed += dt;
                G.scrollX += speed() * dt;
            }
            updatePlayer(dt);
            updatePickups(dt);
            updateDuck(dt);
            if (G.superT > 0) {
                G.superT -= dt;
                superEl.hidden = false;
                superEl.textContent = 'super ' + Math.max(1, Math.ceil(G.superT));
                if (G.superT <= 0) {
                    G.superT = 0;
                    superEl.hidden = true;
                    Sound.play('superEnd');
                }
            }
            generate(G.scrollX + view.cols + 12);
            cleanup();
        }
        updateBugs(dt);
        G.popups = G.popups.filter(function (s) { s.t += dt; return s.t < 0.8; });
        G.fx = G.fx.filter(function (f) {
            f.t += dt;
            if (f.type === 'hop' && f.t >= 0.1) { breakBlock(f.x, f.y); return false; }
            return f.t < 0.3;
        });
        G.debris = G.debris.filter(function (d) {
            d.rot += d.vr * dt;
            d.vy -= GRAVITY * dt;
            d.x += d.vx * dt;
            d.y += d.vy * dt;
            return d.y > -2;
        });
    }

    /* ---------------------------------------------------------------- drawing */

    function sx(x) { return Math.round((x - G.scrollX) * view.cell); }
    function sy(y) { return Math.round((ROWS - y) * view.cell); }

    /* Draws a pixel map with its bottom-centre at world (x + width/2, y).
       opt: alpha, tint, sx/sy (scale about the bottom-centre), rot (radians), centre (pivot at the middle instead). */
    function drawSprite(map, x, y, widthCells, flip, opt) {
        opt = opt || {};
        var cell = view.cell;
        var px = widthCells * cell / map[0].length;
        var w = widthCells * cell;
        var h = map.length * px;
        var cx = (x - G.scrollX) * cell + w / 2;
        var by = (ROWS - y) * cell;
        var pivotY = opt.centre ? h / 2 : 0;
        ctx.save();
        ctx.globalAlpha = opt.alpha === undefined ? 1 : opt.alpha;
        ctx.translate(cx, by - pivotY);
        if (opt.rot) ctx.rotate(opt.rot);
        if (opt.sx || opt.sy) ctx.scale(opt.sx || 1, opt.sy || 1);
        for (var r = 0; r < map.length; r++) {
            var row = map[r];
            for (var c = 0; c < row.length; c++) {
                var ch = row[flip ? row.length - 1 - c : c];
                if (ch === '.') continue;
                ctx.fillStyle = opt.tint || PAL[ch];
                ctx.fillRect(-w / 2 + c * px, -h + pivotY + r * px, px + 0.6, px + 0.6);
            }
        }
        ctx.restore();
    }

    function easeOutBack(t) {
        var c = 1.70158;
        t = Math.min(1, Math.max(0, t)) - 1;
        return 1 + (c + 1) * t * t * t + c * t * t;
    }

    /* Scale for something that pops in the first time it scrolls into view. */
    function popIn(obj) {
        if (reduced) return 1;
        if (obj.shown === null) {
            if (obj.x > G.scrollX + view.cols) return 0;
            obj.shown = G.time;
        }
        return easeOutBack((G.time - obj.shown) / 0.3);
    }

    function frameName(p) {
        if (p.y > 0.01 && !onGround(p)) return 'jump';
        if (p.moving && Math.floor(p.step * 10) % 2) return 'walk';
        return 'stand';
    }

    function onGround(p) {
        if (p.y <= 0.001) return true;
        var r = Math.round(p.y) - 1;
        if (Math.abs(p.y - (r + 1)) > 0.01) return false;
        for (var c = Math.floor(p.x + 0.05); c <= Math.floor(p.x + PW - 0.05); c++) if (solid(c, r)) return true;
        return false;
    }

    function drawGrid() {
        var cell = view.cell;
        var off = -((G.scrollX % 1) + 1) % 1 * cell;
        ctx.strokeStyle = GRID;
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (var x = off; x <= view.w; x += cell) {
            ctx.moveTo(Math.round(x) + 0.5, 0);
            ctx.lineTo(Math.round(x) + 0.5, view.h);
        }
        for (var y = 0; y <= view.h; y += cell) {
            ctx.moveTo(0, Math.round(y) + 0.5);
            ctx.lineTo(view.w, Math.round(y) + 0.5);
        }
        ctx.stroke();
    }

    function drawText(text, x, y, colour, size) {
        ctx.font = '500 ' + size + 'px "JetBrains Mono", ui-monospace, monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = colour;
        ctx.fillText(text, x, y);
    }

    function drawPixelWord(word, centreX, topY, px, colour) {
        var width = word.length * 6 * px - px;
        var left = Math.round(centreX - width / 2);
        ctx.fillStyle = colour;
        for (var i = 0; i < word.length; i++) {
            var glyph = FONT[word[i]];
            if (!glyph) continue;
            for (var r = 0; r < 7; r++) {
                for (var c = 0; c < 5; c++) {
                    if (glyph[r][c] === '#') ctx.fillRect(left + (i * 6 + c) * px, topY + r * px, px - 1, px - 1);
                }
            }
        }
    }

    /* Waiting screen: a grid that fades out to the right and a head peeking up from the bottom edge. */
    function drawIdle(dt) {
        ctx.clearRect(0, 0, view.w, view.h);
        var grad = ctx.createLinearGradient(0, 0, view.w, 0);
        grad.addColorStop(0, 'rgba(196, 205, 200, 1)');
        grad.addColorStop(0.45, 'rgba(196, 205, 200, 0.55)');
        grad.addColorStop(0.75, 'rgba(196, 205, 200, 0.12)');
        grad.addColorStop(1, 'rgba(196, 205, 200, 0)');
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (var x = 0; x <= view.w; x += view.cell) {
            ctx.moveTo(Math.round(x) + 0.5, 0);
            ctx.lineTo(Math.round(x) + 0.5, view.h);
        }
        for (var y = 0; y <= view.h; y += view.cell) {
            ctx.moveTo(0, Math.round(y) + 0.5);
            ctx.lineTo(view.w, Math.round(y) + 0.5);
        }
        ctx.stroke();

        var px = Math.max(6, Math.round(view.h / 40));
        var w = PEEK[0].length * px;
        var left = Math.round(view.w - w - Math.max(24, view.w * 0.07));
        var r = canvas.getBoundingClientRect();
        var near = pointer && pointer.x > r.left + left - 60 && pointer.x < r.left + left + w + 60 && pointer.y > r.top + view.h - 16 * px - 60 && pointer.y < r.bottom;
        var target = near ? -3 * px : 0;
        peek.rise += (target - peek.rise) * (reduced ? 1 : Math.min(1, (dt || 0.016) * 10));
        var top = Math.round(view.h - 14 * px + peek.rise);

        peek.blinkT += dt || 0;
        var blinking = !reduced && peek.blinkT > peek.blinkAt && peek.blinkT < peek.blinkAt + 0.14;
        if (peek.blinkT > peek.blinkAt + 0.14) { peek.blinkT = 0; peek.blinkAt = 2.5 + Math.random() * 3.5; }

        for (var row = 0; row < PEEK.length; row++) {
            for (var col = 0; col < PEEK[row].length; col++) {
                var ch = PEEK[row][col];
                if (ch === '.') continue;
                if (blinking && ch === 'W') ch = row === 8 ? 'K' : 'S';
                ctx.fillStyle = PEEK_PAL[ch];
                ctx.fillRect(left + col * px, top + row * px, px, px);
            }
        }
        if (!blinking) {
            var ox = 1;
            var oy = 1;
            if (pointer) {
                var dx = pointer.x - (r.left + left + w / 2);
                var dy = pointer.y - (r.top + top + 8 * px);
                ox = 1 + Math.max(-1, Math.min(1, Math.round(dx / 160)));
                oy = 1 + Math.max(-1, Math.min(1, Math.round(dy / 120)));
            }
            ctx.fillStyle = PEEK_PAL.K;
            [4, 14].forEach(function (ex) {
                ctx.fillRect(left + (ex + ox) * px, top + (6 + oy) * px, 2 * px, 2 * px);
            });
        }
    }

    /* Draws a string of 3x5 pixel digits centred on (cx, cy). */
    function drawDigits(text, cx, cy, px, colour) {
        var width = text.length * 4 * px - px;
        var left = Math.round(cx - width / 2);
        var top = Math.round(cy - 2.5 * px);
        ctx.fillStyle = colour;
        for (var i = 0; i < text.length; i++) {
            var g = DIGITS[text[i]];
            if (!g) continue;
            for (var r = 0; r < 5; r++) {
                for (var c = 0; c < 3; c++) if (g[r][c] === '1') ctx.fillRect(left + (i * 4 + c) * px, top + r * px, px, px);
            }
        }
    }

    /* Game-over scoreboard: a notched grey panel with Carl running (with a colour trail) and the score. */
    function drawScoreboard(since, count) {
        var cell = view.cell;
        var w = Math.min(view.w - 2 * cell, Math.round(17 * cell));
        var h = Math.round(7.5 * cell);
        var left = Math.round(view.w / 2 - w / 2);
        var top = Math.round(1.2 * cell);
        var n = Math.max(3, Math.round(cell * 0.35));
        ctx.fillStyle = '#dfe5e2';
        ctx.fillRect(left + n, top, w - 2 * n, h);
        ctx.fillRect(left, top + n, w, h - 2 * n);
        var px = h * 0.55 / SPRITES.stand.length;
        var hop = reduced ? 0 : Math.max(0, Math.sin(since * Math.PI / 0.45)) * 0.35 * cell;
        var frameMap = Math.floor(since * 8) % 2 ? SPRITES.walk : SPRITES.stand;
        var sxp = left + w * 0.12;
        var syp = top + h * 0.2 - hop;
        for (var t = 4; t >= 0; t--) {
            var off = t * px * 1.4;
            for (var r = 0; r < frameMap.length; r++) {
                for (var c = 0; c < frameMap[r].length; c++) {
                    var ch = frameMap[r][c];
                    if (ch === '.') continue;
                    ctx.globalAlpha = t ? 0.55 - t * 0.08 : 1;
                    ctx.fillStyle = t ? PICKUP_COLOURS[(t + Math.floor(since * 10)) % PICKUP_COLOURS.length] : PAL[ch];
                    ctx.fillRect(sxp - off + c * px, syp + r * px, px + 0.5, px + 0.5);
                }
            }
        }
        ctx.globalAlpha = 1;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
        ctx.fillStyle = '#14181f';
        ctx.font = '700 ' + Math.max(9, Math.round(cell * 0.62)) + 'px "Mona Sans", sans-serif';
        var tx = left + w * 0.38;
        ctx.fillText('YOUR SCORE', tx, top + h * 0.38);
        ctx.font = '600 ' + Math.max(18, Math.round(cell * 1.75)) + 'px "Mona Sans", sans-serif';
        ctx.fillText(String(count), tx, top + h * 0.8);
    }

    /* Start of play: a purple panel with a pink band sweeps up and off, revealing the level. */
    function drawWipe() {
        if (reduced || G.wipe >= 1) return;
        var t = G.wipe;
        var band = Math.round(view.cell);
        var eased = t * t * (3 - 2 * t);
        var top = Math.round(-eased * (view.h + band * 2));
        ctx.fillStyle = '#ae85ff';
        ctx.fillRect(0, top + band, view.w, view.h + band);
        ctx.fillStyle = '#f73678';
        ctx.fillRect(0, top, view.w, band);
        ctx.fillStyle = '#5fed83';
        ctx.fillRect(0, top + view.h + band, view.w, band);
    }

    function drawGameOver() {
        var cell = view.cell;
        var since = G.time - G.overShownAt;
        var count = reduced ? G.score : Math.round(G.score * Math.min(1, since / 0.8));
        drawScoreboard(since, count);
        /* GAME OVER built from grid blocks, appearing letter by letter. */
        var word = 'GAME OVER';
        var size = Math.max(1, Math.min(Math.floor((view.cols - 4) / (word.length * 6)), Math.floor(ROWS * 0.36 / 7)));
        var letters = reduced ? word.length : Math.min(word.length, Math.floor(since / 0.07) + 1);
        var unit = size * cell;
        var leftPx = Math.round((view.w - (word.length * 6 - 1) * unit) / 2 / cell) * cell;
        var topPx = Math.round((view.h - 7 * unit - 1.5 * cell) / cell) * cell;
        ctx.fillStyle = BLOCK;
        for (var i = 0; i < letters; i++) {
            var glyph = FONT[word[i]];
            if (!glyph) continue;
            for (var r = 0; r < 7; r++) {
                for (var c = 0; c < 5; c++) {
                    if (glyph[r][c] !== '#') continue;
                    for (var yy = 0; yy < size; yy++) {
                        for (var xx = 0; xx < size; xx++) {
                            var gx = leftPx + ((i * 6 + c) * size + xx) * cell;
                            var gy = topPx + (r * size + yy) * cell;
                            ctx.fillRect(Math.round(gx) + 1, Math.round(gy) + 1, Math.ceil(cell) - 1, Math.ceil(cell) - 1);
                        }
                    }
                }
            }
        }
    }

    function draw(dt) {
        var cell = view.cell;
        if (state === 'idle') { drawIdle(dt); return; }
        ctx.clearRect(0, 0, view.w, view.h);
        drawGrid();

        if (G.overShown) { drawGameOver(); return; }
        /* After the last life the whole world flashes six times before the game-over screen. */
        if (G.over && (G.overT > 1.2 || Math.floor(G.overT / 0.2) % 2)) return;

        ctx.save();
        if (G.shake > 0) ctx.translate((Math.random() - 0.5) * 8 * G.shake / 0.2, (Math.random() - 0.5) * 8 * G.shake / 0.2);

        ctx.fillStyle = BLOCK;
        G.blockList.forEach(function (b) {
            var x = sx(b.x);
            if (x < -cell || x > view.w) return;
            ctx.fillRect(x + 1, sy(b.y + 1) + 1, cell - 1, cell - 1);
        });

        G.fx.forEach(function (f) {
            if (f.type !== 'hop') return;
            var lift = 0.3 * Math.sin(Math.PI * Math.min(1, f.t / 0.1));
            ctx.fillStyle = BLOCK;
            ctx.fillRect(sx(f.x) + 1, sy(f.y + 1 + lift) + 1, cell - 1, cell - 1);
        });

        G.debris.forEach(function (d) {
            var half = Math.ceil(cell / 2);
            ctx.save();
            ctx.translate(sx(d.x) + half / 2, sy(d.y) + half / 2);
            ctx.rotate(d.rot);
            ctx.fillStyle = BLOCK;
            ctx.fillRect(-half / 2, -half / 2, half, half);
            ctx.restore();
        });

        var duck = G.duck;
        if (duck.state === 'follow') {
            ctx.save();
            ctx.setLineDash([3, 4]);
            ctx.strokeStyle = 'rgba(245, 197, 24, 0.8)';
            ctx.lineWidth = 2;
            G.pickups.forEach(function (k) {
                if (!k.pulled) return;
                ctx.beginPath();
                ctx.moveTo(sx(duck.x + 0.9), sy(duck.y + 0.8));
                ctx.lineTo(sx(k.x + k.size / 2), sy(k.y + k.size / 2));
                ctx.stroke();
            });
            ctx.restore();
        }

        function drawPickup(k, scale, alpha) {
            var bob = reduced ? 0 : 0.12 * Math.sin((G.time - k.born) * 4 + k.x);
            var size = k.size * cell * scale;
            var cxp = (k.x + k.size / 2 - G.scrollX) * cell;
            var cyp = (ROWS - (k.y + k.size / 2 + bob)) * cell;
            var left = Math.round(cxp - size / 2);
            var top = Math.round(cyp - size / 2);
            ctx.globalAlpha = alpha;
            if (k.mega) {
                var half = size / 2;
                var turn = Math.floor(G.time * 6);
                for (var q = 0; q < 4; q++) {
                    ctx.fillStyle = MEGA_COLOURS[(q + turn) % 4];
                    ctx.fillRect(left + (q % 2) * half, top + Math.floor(q / 2) * half, Math.ceil(half), Math.ceil(half));
                }
            } else {
                ctx.fillStyle = k.colour;
                ctx.fillRect(left, top, Math.round(size), Math.round(size));
                var dot = Math.max(1, Math.round(size / 5));
                ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
                ctx.fillRect(Math.round(cxp - dot / 2), Math.round(cyp - dot / 2), dot, dot);
            }
            ctx.globalAlpha = 1;
        }

        G.pickups.forEach(function (k) {
            var x = sx(k.x);
            if (x < -cell * 2 || x > view.w + cell) return;
            var scale = popIn(k);
            if (k.mega && !reduced) scale *= 1 + 0.08 * Math.sin(G.time * 10);
            if (scale > 0) drawPickup(k, scale, 1);
        });
        G.fx.forEach(function (f) {
            if (f.type === 'collect') drawPickup(f.pickup, 1 + f.t / 0.3 * 0.8, Math.max(0, 1 - f.t / 0.3));
        });

        G.bugs.forEach(function (b) {
            if (sx(b.x) < -cell * 3 || sx(b.x) > view.w + cell) return;
            var map = b.state === 'flat' ? SPRITES.bugFlat : (Math.floor(b.t * 6) % 2 ? SPRITES.bugA : SPRITES.bugB);
            var opt = {};
            if (b.state === 'flat') opt.alpha = Math.max(0, 1 - b.t / 0.45);
            if (b.state === 'out') { opt.rot = b.rot; opt.centre = true; }
            if (b.state === 'walk') { var pop = popIn(b); if (pop <= 0) return; opt.sx = pop; opt.sy = pop; }
            drawSprite(map, b.x - 0.1, b.y, BUG_W + 0.2, b.dir < 0, opt);
        });

        if (duck.state !== 'hidden') {
            var wobble = duck.state === 'wait' && !reduced ? 0.15 * Math.sin(duck.t * 6) : 0;
            drawSprite(SPRITES.duck, duck.x, duck.y, 1.8, duck.state === 'follow' && G.player.facing < 0, { rot: wobble });
        }

        var p = G.player;
        var off = (SPRITE_W - PW) / 2;
        /* Super mode: ten ghost copies, each a little further behind, cycling through the palette. */
        for (var gi = G.trail.length - 1; gi >= 1; gi -= 2) {
            var t = G.trail[gi];
            var shade = PICKUP_COLOURS[(Math.floor(G.time * 12) + (gi >> 1)) % PICKUP_COLOURS.length];
            drawSprite(SPRITES[t.frame], t.x - off, t.y, SPRITE_W, t.facing < 0, { alpha: 0.85 - gi * 0.03, tint: shade });
        }
        var blink = p.inv > 0 && Math.floor(p.inv * 12) % 2;
        if (!blink) {
            var frame = frameName(p);
            var opt = {};
            if (!reduced) {
                if (p.land > 0) { opt.sx = 1.15; opt.sy = 0.82; }
                else if (frame === 'jump') {
                    var stretch = Math.max(-0.08, Math.min(0.15, p.vy / 200));
                    opt.sy = 1 + stretch;
                    opt.sx = 1 - stretch * 0.6;
                    if (p.moving) opt.rot = p.facing * 0.08;
                }
            }
            drawSprite(SPRITES[frame], p.x - off, p.y, SPRITE_W, p.facing < 0, opt);
        }

        G.popups.forEach(function (s) {
            var k = s.t / 0.8;
            var rise = 2.5 * (1 - Math.pow(1 - k, 3));
            var colour = s.gold ? (Math.floor(G.time * 12) % 2 ? '#e1c600' : '#f5e36b') : '#9d9d9d';
            ctx.globalAlpha = 1 - k * k;
            drawDigits(s.text, sx(s.x), sy(s.y + rise), Math.max(2, Math.round(cell * 0.2)), colour);
            ctx.globalAlpha = 1;
        });
        ctx.restore();
        drawWipe();
    }

    /* ---------------------------------------------------------------- loop & sizing */

    function resize() {
        var r = canvas.getBoundingClientRect();
        view.dpr = Math.min(window.devicePixelRatio || 1, 2);
        view.w = r.width;
        view.h = r.height;
        view.cell = view.h / ROWS;
        view.cols = Math.ceil(view.w / view.cell);
        canvas.width = Math.round(view.w * view.dpr);
        canvas.height = Math.round(view.h * view.dpr);
        ctx.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
        if (G) {
            generate(G.scrollX + view.cols + 12);
            draw();
        }
    }

    var acc = 0;

    /* Physics runs in fixed 1/120 s steps so movement and collisions stay steady whatever the frame rate. */
    function frame(now) {
        raf = 0;
        var dt = Math.min(0.05, (now - last) / 1000 || 0);
        last = now;
        if (state === 'idle') {
            update(dt);
        } else {
            acc += dt;
            while (acc >= STEP) { update(STEP); acc -= STEP; }
        }
        draw(dt);
        schedule();
    }

    function schedule() {
        var animateIdle = state === 'idle' && !reduced;
        var animateOver = state === 'over' && G && !G.overDone;
        if (!raf && visible && !document.hidden && (state === 'playing' || animateIdle || animateOver)) {
            last = performance.now();
            raf = requestAnimationFrame(frame);
        }
    }

    /* ---------------------------------------------------------------- HUD & flow */

    function renderLives() {
        var html = '';
        for (var i = 0; i < G.lives; i++) html += heartSvg();
        livesEl.innerHTML = html;
        livesEl.setAttribute('aria-label', G.lives + (G.lives === 1 ? ' life' : ' lives'));
    }

    function renderLabel() {
        var high = parseInt(store(HIGH_KEY) || '0', 10);
        var text = high > 0 ? 'super-carl / your high score: ' : 'play_super-carl_while_you_wait/';
        label.innerHTML = '';
        label.appendChild(document.createTextNode(text));
        if (high > 0) {
            var b = document.createElement('b');
            b.textContent = high;
            label.appendChild(b);
        }
    }

    function loseHeart() {
        var hearts = livesEl.querySelectorAll('svg:not(.lost)');
        var last = hearts[hearts.length - 1];
        livesEl.setAttribute('aria-label', G.lives + (G.lives === 1 ? ' life' : ' lives'));
        if (!last) return;
        if (reduced) { last.remove(); return; }
        last.classList.add('lost');
        setTimeout(function () { last.remove(); }, 450);
    }

    function renderSound() {
        soundBtn.setAttribute('aria-pressed', String(!Sound.muted));
        soundBtn.setAttribute('aria-label', Sound.muted ? 'Turn sound on' : 'Turn sound off');
        soundBtn.classList.toggle('muted', Sound.muted);
    }

    function setButton(text) {
        button.textContent = text;
    }

    function start() {
        Sound.unlock();
        newWorld();
        state = 'playing';
        moved = false;
        jumped = false;
        keys = {};
        root.classList.add('playing');
        hud.hidden = false;
        controlsEl.classList.remove('gone');
        superEl.hidden = true;
        scoreEl.textContent = '0';
        renderLives();
        pad.hidden = !coarse;
        setButton('Exit game');
        button.blur();
        addInput();
        root.scrollIntoView({ block: 'center', behavior: reduced ? 'auto' : 'smooth' });
        schedule();
    }

    function exit() {
        state = 'idle';
        removeInput();
        root.classList.remove('playing');
        hud.hidden = true;
        pad.hidden = true;
        setButton('Play');
        newWorld();
        draw();
        schedule();
    }

    function showGameOver() {
        G.overShown = true;
        G.overShownAt = G.time;
        var high = parseInt(store(HIGH_KEY) || '0', 10);
        if (G.score > high) store(HIGH_KEY, String(G.score));
        renderLabel();
        hud.hidden = true;
        pad.hidden = true;
        removeInput();
        setButton('Play again');
        state = 'over';
        schedule();
    }

    function onKeyDown(e) {
        if (!GAME_KEYS[e.code] || e.target.closest && e.target.closest('input, textarea, select')) {
            if (e.code === 'Escape') exit();
            return;
        }
        e.preventDefault();
        if (G.over) return;
        G.scrolling = true;
        if (e.code === 'Space') {
            if (!keys.Space) jump();
            jumped = true;
        } else {
            moved = true;
        }
        keys[e.code] = true;
        if (moved && jumped) controlsEl.classList.add('gone');
    }

    function onKeyUp(e) {
        delete keys[e.code];
    }

    function onBlur() {
        keys = {};
    }

    function addInput() {
        window.addEventListener('keydown', onKeyDown);
        window.addEventListener('keyup', onKeyUp);
        window.addEventListener('blur', onBlur);
    }

    function removeInput() {
        window.removeEventListener('keydown', onKeyDown);
        window.removeEventListener('keyup', onKeyUp);
        window.removeEventListener('blur', onBlur);
        keys = {};
    }

    function padInput() {
        Array.prototype.forEach.call(pad.querySelectorAll('button'), function (b) {
            var code = b.getAttribute('data-key');
            b.addEventListener('pointerdown', function (e) {
                e.preventDefault();
                if (state !== 'playing' || G.over) return;
                G.scrolling = true;
                if (code === 'Space') jump();
                keys[code] = true;
            });
            ['pointerup', 'pointerleave', 'pointercancel'].forEach(function (ev) {
                b.addEventListener(ev, function () { delete keys[code]; });
            });
        });
    }

    button.addEventListener('click', function () {
        if (state === 'playing') exit();
        else start();
    });

    soundBtn.addEventListener('click', function () {
        Sound.muted = !Sound.muted;
        store(MUTE_KEY, Sound.muted ? '1' : '0');
        Sound.unlock();
        renderSound();
    });

    if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (entries) {
            visible = entries[0].isIntersecting;
            schedule();
        }).observe(root);
    }
    document.addEventListener('visibilitychange', schedule);
    window.addEventListener('pointermove', function (e) {
        pointer = { x: e.clientX, y: e.clientY };
        if (state === 'idle' && reduced && visible) draw(0);
    }, { passive: true });
    window.addEventListener('resize', resize);

    padInput();
    renderSound();
    renderLabel();
    setButton('Play');
    resize();
    newWorld();
    draw();
    schedule();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { draw(); });

    /* A small hook for automated checks; it does not change gameplay. */
    window.superCarl = {
        state: function () {
            return { state: state, score: G.score, lives: G.lives, over: G.over, x: G.player.x, y: G.player.y, scrollX: G.scrollX, jumps: G.player.jumps, superT: G.superT };
        },
        world: function () { return G; }
    };
})();
