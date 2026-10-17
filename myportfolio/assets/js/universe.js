/* Carl Christian Quist portfolio: interactions for the one-page site. */
(function () {
    'use strict';

    var doc = document.documentElement;
    doc.classList.add('js');
    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var finePointer = window.matchMedia('(pointer: fine)').matches;
    var GLYPHS = '-/).+=><*&%$#@!_';
    var PALETTE = ['#0c8a2c', '#19c23f', '#b8a114', '#b07cfa', '#f27bf2', '#1f8ae8', '#d4511d'];

    function $(sel, root) { return (root || document).querySelector(sel); }
    function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

    /* Live Accra time (GMT, no daylight saving) in the top strip. */
    function clock() {
        var el = $('#clock');
        if (!el) return;
        function pad(n) { return (n < 10 ? '0' : '') + n; }
        function tick() {
            var d = new Date();
            el.textContent = pad(d.getUTCHours()) + ' : ' + pad(d.getUTCMinutes()) + ' : ' + pad(d.getUTCSeconds());
        }
        tick();
        setInterval(tick, 1000);
    }

    /* Scale each giant wordmark so it spans the full width of its frame. */
    function fitWordmarks() {
        var marks = $$('[data-fit]');
        if (!marks.length) return;
        function fitNow() {
            marks.forEach(function (h) {
                h.style.fontSize = '';
                var cs = getComputedStyle(h.parentElement);
                var box = h.parentElement.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight) - 8;
                var size = parseFloat(getComputedStyle(h).fontSize);
                h.style.fontSize = (size * box / h.scrollWidth) + 'px';
            });
        }
        fitNow();
        if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitNow);
        window.addEventListener('resize', fitNow);
    }

    /* Wordmark intro, timed like Universe's logo: a green cursor bar drops in at each letter 75 ms
       apart, then the letter scales up from half size; the green slash is assembled from coloured
       pixels that hop into place before it wipes in. */
    var EXPO_OUT = 'cubic-bezier(.16, 1, .3, 1)';

    function wordmarkIntro() {
        var mark = $('#wordmark');
        if (!mark) return;
        var letters = $$('.wl:not(.sp)', mark);
        var tick = $('.tick', mark);
        if (reduced || !mark.animate) {
            mark.classList.add('intro-done');
            return;
        }
        /* Wait for the font so the bars and pixels land on the final letter positions. */
        var ready = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
        ready.then(function () { playWordmark(mark, letters, tick); });
    }

    function playWordmark(mark, letters, tick) {
        var bars = [];
        var box = mark.getBoundingClientRect();
        letters.forEach(function (letter, i) {
            var r = letter.getBoundingClientRect();
            var bar = document.createElement('span');
            bar.className = 'wm-bar';
            bar.setAttribute('aria-hidden', 'true');
            bar.style.left = ((r.left - box.left) / box.width * 100) + '%';
            mark.appendChild(bar);
            bars.push(bar);
            var t = 75 * i;
            bar.animate([{ visibility: 'visible', transform: 'scaleY(.1)' }, { visibility: 'visible', transform: 'scaleY(1)' }],
                { duration: 200, delay: t, easing: EXPO_OUT });
            letter.animate([{ visibility: 'visible', transform: 'scale(.5)' }, { visibility: 'visible', transform: 'scale(1)' }],
                { duration: 700, delay: t + 200, easing: EXPO_OUT, fill: 'forwards' });
        });
        tickIntro(mark, tick, box);
        setTimeout(function () {
            bars.forEach(function (b) { b.remove(); });
            mark.classList.add('intro-done');
            letters.concat(tick).forEach(function (el) { el.getAnimations().forEach(function (a) { a.cancel(); }); });
        }, 3200);
    }

    function tickIntro(mark, tick, box) {
        var r = tick.getBoundingClientRect();
        var n = 2 * Math.floor(box.width * 0.017 / 2);
        /* Measure the slash glyph itself so the 2x2 pixel block lands on its top-right end. */
        var cs = getComputedStyle(tick);
        var ctx = document.createElement('canvas').getContext('2d');
        ctx.font = cs.fontStyle + ' ' + cs.fontWeight + ' ' + cs.fontSize + ' ' + cs.fontFamily;
        var m = ctx.measureText('/');
        var baseline = r.top + (r.height - m.fontBoundingBoxAscent - m.fontBoundingBoxDescent) / 2 + m.fontBoundingBoxAscent;
        var headX = r.left + Math.min(r.width, m.actualBoundingBoxRight) - 2 * n;
        var headY = baseline - m.actualBoundingBoxAscent;
        var layer = document.createElement('span');
        layer.className = 'wm-pixels';
        layer.setAttribute('aria-hidden', 'true');
        layer.style.left = (headX - box.left) + 'px';
        layer.style.top = (headY - box.top) + 'px';
        layer.style.width = layer.style.height = (2 * n) + 'px';
        mark.appendChild(layer);
        var GREEN = cs.color;
        function px(colour) {
            var p = document.createElement('span');
            p.style.width = p.style.height = n + 'px';
            p.style.background = colour;
            layer.appendChild(p);
            return p;
        }
        function at(s, fn) { setTimeout(fn, s * 1000); }
        function go(p, from, to, dur, ease, start) {
            at(start, function () {
                p.animate([{ transform: 'translate(' + from[0] + '%,' + from[1] + '%)' }, { transform: 'translate(' + to[0] + '%,' + to[1] + '%)' }],
                    { duration: dur * 1000, easing: ease || EXPO_OUT, fill: 'forwards' });
            });
        }
        function show(p, s) { at(s, function () { p.style.visibility = 'visible'; }); }
        function paint(p, colour, s) { at(s, function () { p.style.background = colour; }); }
        function hide(p, s) { at(s, function () { p.style.visibility = 'hidden'; }); }

        var line = document.createElement('span');
        line.className = 'wm-bar';
        line.style.left = (headX - box.left) / box.width * 100 + '%';
        mark.appendChild(line);
        line.animate([{ visibility: 'visible', transform: 'scaleY(8)' }, { visibility: 'visible', transform: 'scaleY(1)' }],
            { duration: 300, delay: 200, easing: EXPO_OUT });

        var p1 = px('#ff80f5'), p2 = px('#009cff'), p3 = px('#fd7200'), p4 = px('#c8a900'), p5 = px('#00f384');
        show(p1, 0.4); go(p1, [0, 500], [0, 0], 0.3, null, 0.4);
        paint(p1, '#02cb28', 0.9); paint(p1, '#fd7200', 1.7); paint(p1, '#00f384', 1.9); paint(p1, GREEN, 2.1);
        show(p2, 0.5); go(p2, [100, 500], [100, 300], 0.3, null, 0.5); hide(p2, 0.8);
        show(p2, 2); go(p2, [100, 300], [100, 0], 0.5, 'cubic-bezier(.34, 1.56, .64, 1)', 2); paint(p2, GREEN, 2.2);
        show(p3, 0.6); go(p3, [0, 500], [0, 100], 0.2, null, 0.5); paint(p3, '#6a40ff', 0.8); paint(p3, GREEN, 2.2);
        show(p4, 0.6); go(p4, [100, 500], [100, 300], 0.2, 'linear', 0.6); go(p4, [100, 300], [0, 300], 0.2, null, 0.8);
        go(p4, [0, 300], [0, 100], 0.2, null, 1); paint(p4, '#00f384', 1.3); paint(p4, GREEN, 1.8);
        show(p5, 1.15); go(p5, [0, 500], [0, 300], 0.2, null, 1.15); go(p5, [0, 300], [100, 300], 0.2, 'cubic-bezier(.33, 1, .68, 1)', 1.35);
        paint(p5, '#6a40ff', 1.35); go(p5, [100, 300], [0, 300], 0.2, 'cubic-bezier(.33, 1, .68, 1)', 1.55); paint(p5, '#01b000', 1.55);
        go(p5, [0, 300], [0, 0], 0.2, null, 1.75); paint(p5, GREEN, 1.75);

        /* The slash itself wipes in from the top as the pixels settle, then the pixels go. */
        at(1.7, function () {
            tick.animate([{ visibility: 'visible', clipPath: 'inset(0 0 100% 0)' }, { visibility: 'visible', clipPath: 'inset(0 0 0 0)' }],
                { duration: 1000, easing: EXPO_OUT, fill: 'forwards' });
        });
        at(2.6, function () { layer.remove(); line.remove(); });
    }

    /* Phone menu: the nav cells fold behind a menu button. */
    function menu() {
        var nav = $('.nav');
        var btn = $('.menu-btn');
        if (!nav || !btn) return;
        btn.addEventListener('click', function () {
            var open = nav.classList.toggle('open');
            btn.setAttribute('aria-expanded', String(open));
            btn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
            document.body.classList.toggle('menu-open', open);
        });
        $$('.nav .link').forEach(function (a) {
            a.addEventListener('click', function () {
                nav.classList.remove('open');
                btn.setAttribute('aria-expanded', 'false');
                btn.setAttribute('aria-label', 'Open menu');
                document.body.classList.remove('menu-open');
            });
        });
    }

    /* Monospace labels type themselves out, with a short tail of random characters
       running ahead of the text, then settle. */
    function scramble(el) {
        var html = el.getAttribute('data-html') || el.innerHTML;
        var text = el.getAttribute('data-text') || el.textContent;
        el.setAttribute('data-html', html);
        el.setAttribute('data-text', text);
        var i = 0;
        function step() {
            i += Math.max(1, Math.round(text.length / 28));
            var tail = '';
            for (var k = 0; k < 3 && i + k < text.length; k++) tail += GLYPHS.charAt(Math.floor(Math.random() * GLYPHS.length));
            el.textContent = text.slice(0, i) + tail;
            if (i < text.length) setTimeout(step, 32);
            else { el.innerHTML = html; el.classList.remove('scrambling'); }
        }
        el.classList.add('scrambling');
        el.textContent = '';
        step();
    }

    /* Fade sections up as they arrive, and start their one-off effects. */
    function reveal() {
        var targets = $$('.rv, [data-scramble], [data-count], .repo-list, [data-build]');
        function run(el) {
            el.classList.add('in');
            if (el.hasAttribute('data-scramble')) scramble(el);
            if (el.hasAttribute('data-count')) countUp(el);
            if (el.classList.contains('repo-list')) fillBars(el);
            if (el.hasAttribute('data-build')) el.classList.add('built');
        }
        if (reduced || !('IntersectionObserver' in window)) {
            targets.forEach(function (el) {
                el.classList.add('in');
                if (el.hasAttribute('data-build')) el.classList.add('built');
                if (el.classList.contains('repo-list')) fillBars(el);
            });
            return;
        }
        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (e) {
                if (!e.isIntersecting) return;
                run(e.target);
                io.unobserve(e.target);
            });
        }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
        targets.forEach(function (el) { io.observe(el); });
    }

    function countUp(el) {
        var target = parseInt(el.getAttribute('data-count'), 10);
        var start = performance.now();
        var dur = 1400;
        function frame(now) {
            var t = Math.min(1, (now - start) / dur);
            var eased = 1 - Math.pow(1 - t, 3);
            el.textContent = Math.round(target * eased).toLocaleString('en-US');
            if (t < 1) requestAnimationFrame(frame);
        }
        requestAnimationFrame(frame);
    }

    function fillBars(list) {
        $$('.fill', list).forEach(function (f, i) {
            setTimeout(function () { f.style.width = f.getAttribute('data-w'); }, reduced ? 0 : i * 60);
        });
    }

    /* The cursor lights up 20px grid blocks in the palette colours; some carry a code character.
       Each block pops in, holds briefly and shrinks away. */
    /* Cursor trail: a pool of ten 20px blocks that snap to the grid under the
       pointer, only over the empty parts of trail areas (never over text,
       links, buttons or anything marked .trail-ignore). */
    var TRAIL_COLOURS = ['#ae85ff', '#f73678', '#c05200', '#583af7', '#5fed83', '#bba00a'];
    var TRAIL_GLYPHS = ['-', '/', ')', '.', '+', '=', '>', '<', '*', '&', '('];

    function trail() {
        if (reduced || !finePointer) return;
        var size = 20;
        var count = 10;
        var pool = [];
        for (var i = 0; i < count; i++) {
            var block = document.createElement('div');
            block.className = 'trail';
            block.setAttribute('aria-hidden', 'true');
            var colour = document.createElement('div');
            block.appendChild(colour);
            document.body.appendChild(block);
            pool.push({ el: block, colour: colour, id: -1 });
        }
        var lastX = 0, lastY = 0, index = 0, nextId = 0, blocked = false;

        function move(e) {
            if (blocked) return;
            var target = e.target;
            if (!(target instanceof Element) || target.closest('.trail-ignore')) return;
            var area = e.currentTarget.getBoundingClientRect();
            var cx = e.clientX, cy = e.clientY;
            if (cx < area.left || cx > area.right || cy < area.top || cy > area.bottom) return;
            var x = size * Math.floor(cx / size);
            var y = size * Math.floor(cy / size);
            var text = (target.textContent || '').trim();
            if (target.children.length === 0 && text !== '') return;
            if (target.tagName === 'BUTTON' || target.tagName === 'A') return;
            if (x === lastX && y === lastY) return;
            lastX = x;
            lastY = y;
            index = (index + 1) % count;
            var slot = pool[index];
            var id = nextId++;
            slot.id = id;
            slot.el.style.transform = 'translate(' + x + 'px, ' + y + 'px)';
            slot.colour.style.backgroundColor = TRAIL_COLOURS[Math.floor(Math.random() * TRAIL_COLOURS.length)];
            slot.colour.textContent = Math.random() < 0.3 ? ' ' : TRAIL_GLYPHS[Math.floor(Math.random() * TRAIL_GLYPHS.length)];
            slot.el.classList.add('on');
            setTimeout(function () {
                if (slot.id === id) slot.el.classList.remove('on');
            }, 100 + 300 * Math.random());
        }

        $$('.trail-area').forEach(function (area) {
            area.addEventListener('mousemove', move, { passive: true });
        });
        $$('.trail-ignore').forEach(function (el) {
            el.addEventListener('mouseenter', function () { blocked = true; });
            el.addEventListener('mouseleave', function () { blocked = false; });
        });
    }

    /* Nav links briefly unscramble on hover. */
    function navUnscramble() {
        if (reduced) return;
        $$('.nav .link, .nav .cta').forEach(function (a) { unscrambleOnHover(a, a); });
        /* Stack cards: the label unscrambles when the card is hovered, like Universe's speaker cards. */
        $$('.stack-cell').forEach(function (cell) { unscrambleOnHover(cell, $('.cap > span', cell)); });
    }

    function unscrambleOnHover(trigger, el) {
        var node = el && el.firstChild;
        if (!node || node.nodeType !== 3) return;
        var text = node.textContent;
        var timer = 0;
        trigger.addEventListener('mouseenter', function () {
            var frame = 0;
            clearInterval(timer);
            timer = setInterval(function () {
                frame++;
                var out = '';
                for (var i = 0; i < text.length; i++) {
                    var ch = text.charAt(i);
                    out += i < frame - 2 || ch === ' ' ? ch : GLYPHS.charAt(Math.floor(Math.random() * GLYPHS.length));
                }
                node.textContent = out;
                if (frame > text.length + 2) { clearInterval(timer); node.textContent = text; }
            }, 30);
        });
    }

    /* Stack cards rise in one after another (0.15 s apart) as they reach the viewport. */
    function stackRise() {
        var cells = $$('.stack-cell');
        if (reduced || !cells.length || !('IntersectionObserver' in window)) return;
        cells.forEach(function (cell, i) {
            cell.classList.add('rise');
            cell.style.transitionDelay = (window.innerWidth < 768 ? 0 : 0.15 * i) + 's';
        });
        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;
                io.unobserve(entry.target);
                entry.target.classList.add('risen');
                setTimeout(function () { entry.target.style.transitionDelay = ''; }, 1400 + 150 * cells.length);
            });
        }, { rootMargin: '0px 0px 10% 0px' });
        cells.forEach(function (cell) { io.observe(cell); });
    }

    function onVisible(el, cb) {
        if (!('IntersectionObserver' in window)) { cb(true); return; }
        new IntersectionObserver(function (entries) { cb(entries[0].isIntersecting); }).observe(el);
    }

    /* Type a caption out with a thin blinking cursor after it. */
    function typeCaption(el, text) {
        clearTimeout(el._t);
        var i = 0;
        el.innerHTML = '<span></span><i class="cur" aria-hidden="true"></i>';
        var span = el.firstChild;
        if (reduced) { span.textContent = text; return; }
        el.classList.add('typing');
        (function step() {
            span.textContent = text.slice(0, ++i);
            if (i < text.length) el._t = setTimeout(step, 35);
            else el.classList.remove('typing');
        })();
    }

    /* Screenshot carousels: cross-fading slides, a typed caption and arrow buttons. */
    function carousels() {
        $$('.carousel').forEach(function (box) {
            var slides = $$('.slide', box);
            var cap = $('.cap', box);
            var current = 0;
            function show(i) {
                current = (i + slides.length) % slides.length;
                slides.forEach(function (s, j) { s.classList.toggle('on', j === current); });
                var img = $('img', slides[current]);
                if (img && img.loading === 'lazy') img.loading = 'eager';
                if (cap) typeCaption(cap, slides[current].getAttribute('data-cap'));
            }
            var prev = $('[data-car="prev"]', box);
            var next = $('[data-car="next"]', box);
            if (prev) prev.addEventListener('click', function (e) { e.preventDefault(); show(current - 1); });
            if (next) next.addEventListener('click', function (e) { e.preventDefault(); show(current + 1); });
            if (cap) {
                cap.textContent = '';
                onVisible(box, function (v) { if (v && !box._typed) { box._typed = true; show(current); } });
            }
            if (box.hasAttribute('data-auto') && !reduced && slides.length > 1) {
                var visible = false;
                var paused = false;
                onVisible(box, function (v) { visible = v; });
                box.addEventListener('mouseenter', function () { paused = true; });
                box.addEventListener('mouseleave', function () { paused = false; });
                setInterval(function () { if (visible && !paused) show(current + 1); }, 5000);
            }
        });
    }

    /* proof/ carousel: one fact at a time, each with its own colour bar. */
    function proof() {
        var box = $('.proof');
        if (!box) return;
        var items = $$('.proof-item', box);
        var current = 0;
        var cap = $('.proof-cap', box);
        function show(i) {
            current = (i + items.length) % items.length;
            items.forEach(function (it, j) {
                it.hidden = j !== current;
                it.classList.toggle('enter', j === current);
            });
            box.style.setProperty('--c', items[current].getAttribute('data-c'));
            var lbl = $('.proof-label', items[current]);
            if (lbl && !reduced) scramble(lbl);
            if (cap && box._typed) typeCaption(cap, 'dev.proof-of-work()');
        }
        if (cap) {
            cap.textContent = '';
            onVisible(box, function (v) { if (v && !box._typed) { box._typed = true; typeCaption(cap, 'dev.proof-of-work()'); } });
        }
        $('[data-proof="prev"]', box).addEventListener('click', function () { show(current - 1); });
        $('[data-proof="next"]', box).addEventListener('click', function () { show(current + 1); });
        show(0);
    }

    /* Services tabs: one panel at a time, with arrow-key movement between tabs. */
    function tabs() {
        var list = $$('.tabs .tab');
        if (!list.length) return;
        function select(tab, focus) {
            list.forEach(function (t) {
                var on = t === tab;
                t.setAttribute('aria-selected', String(on));
                t.tabIndex = on ? 0 : -1;
                var panel = document.getElementById(t.getAttribute('aria-controls'));
                panel.hidden = !on;
                if (on) {
                    panel.classList.remove('enter');
                    void panel.offsetWidth;
                    panel.classList.add('enter');
                }
            });
            if (focus) tab.focus();
        }
        list.forEach(function (t, i) {
            t.addEventListener('click', function () { select(t); });
            t.addEventListener('keydown', function (e) {
                if (e.key === 'ArrowRight') select(list[(i + 1) % list.length], true);
                if (e.key === 'ArrowLeft') select(list[(i - 1 + list.length) % list.length], true);
            });
        });
    }

    /* Stack cards open a pop-up with the tool's details, like Universe's speaker cards. */
    function stackDialog() {
        var dialog = $('#stack-dialog');
        var data = $('#stack-data');
        if (!dialog || !data || typeof dialog.showModal !== 'function') return;
        var items = JSON.parse(data.textContent);
        $$('[data-stack]').forEach(function (card) {
            card.addEventListener('click', function () {
                var it = items[parseInt(card.getAttribute('data-stack'), 10)];
                $('#sd-art').innerHTML = it.art;
                dialog.style.setProperty('--accent', it.accent);
                dialog.style.setProperty('--brand', it.brand);
                $('#sd-name').innerHTML = it.name;
                $('#sd-role').textContent = it.role;
                $('#sd-text').innerHTML = it.body.map(function (b) { return '<p>' + b + '</p>'; }).join('');
                $('#sd-projects').innerHTML = it.projects.map(function (n) { return '<li>' + n + '</li>'; }).join('');
                dialog.showModal();
            });
        });
        $('.sd-close', dialog).addEventListener('click', function () { dialog.close(); });
        $('#sd-link').addEventListener('click', function () { dialog.close(); });
        dialog.addEventListener('click', function (e) { if (e.target === dialog) dialog.close(); });
    }

    /* Work filters. */
    function filters() {
        var buttons = $$('.filter');
        var cards = $$('.work-card');
        buttons.forEach(function (b) {
            b.addEventListener('click', function () {
                var f = b.getAttribute('data-filter');
                buttons.forEach(function (o) {
                    o.classList.toggle('on', o === b);
                    o.setAttribute('aria-pressed', String(o === b));
                });
                cards.forEach(function (card) {
                    card.classList.toggle('hide', f !== 'all' && card.getAttribute('data-cat') !== f);
                });
            });
        });
    }

    /* Project demos playlist: the list drives the player; a video plays when its file exists,
       otherwise the poster says the demo is on its way. */
    function demos() {
        var data = $('#demo-data');
        if (!data) return;
        var items = JSON.parse(data.textContent);
        var buttons = $$('.pl-item');
        var player = $('.pl-player');
        var poster = $('#pl-poster');
        var title = $('#pl-title');
        var meta = $('#pl-meta');
        var desc = $('#pl-desc');
        var links = $('#pl-links');
        var note = $('#pl-note');
        var playlist = $('.playlist');
        var list = $('.pl-list');
        var view = $('.pl-view');
        var current = 0;

        /* Rows and the player rise in as they reach the viewport. */
        buttons.concat(view).forEach(function (el) {
            onVisible(el, function (v) { if (v) el.classList.add('shown'); });
        });

        /* Once the visitor picks a demo, the chosen row and the player take that row's colour. */
        function pick() {
            playlist.classList.add('picked');
            list.classList.add('picked');
            view.style.setProperty('--active', buttons[current].style.getPropertyValue('--fill'));
        }

        function stop() {
            var v = $('video', player);
            if (v) v.remove();
            player.classList.remove('playing');
            note.hidden = true;
        }

        function show(i) {
            stop();
            current = (i + items.length) % items.length;
            var p = items[current];
            buttons.forEach(function (b, j) {
                b.classList.toggle('on', j === current);
                b.setAttribute('aria-selected', String(j === current));
            });
            poster.src = 'images/' + p.img + '.jpg';
            poster.alt = 'Screenshot of ' + p.alt;
            title.innerHTML = p.title;
            meta.textContent = p.file;
            desc.innerHTML = p.desc;
            links.innerHTML = p.links.map(function (l, k) {
                return '<a class="btn btn-sm ' + (k === 0 ? 'btn-green' : 'btn-grey') + '" href="' + l[1] +
                    '" target="_blank" rel="noopener">' + l[0] + ' <span class="arrow">\u2197</span></a>';
            }).join('');
        }

        function play() {
            var p = items[current];
            stop();
            var v = document.createElement('video');
            v.src = p.video;
            v.controls = true;
            v.playsInline = true;
            v.poster = poster.src;
            v.addEventListener('error', function () {
                v.remove();
                player.classList.remove('playing');
                note.hidden = false;
            });
            player.appendChild(v);
            player.classList.add('playing');
            var started = v.play();
            if (started && started.catch) started.catch(function () { /* the error event above handles a missing file */ });
        }

        buttons.forEach(function (b, i) { b.addEventListener('click', function () { show(i); pick(); }); });
        $('.pl-play').addEventListener('click', function () { pick(); play(); });
        $('[data-pl="prev"]').addEventListener('click', function () { show(current - 1); pick(); });
        $('[data-pl="next"]').addEventListener('click', function () { show(current + 1); pick(); });
    }

    /* The closing art panel: pieces build in and the character slides in when it arrives; then the head
       turns toward the cursor (eased each frame), the body turns slightly the other way, and the pupils follow. */
    function ctaArt() {
        var art = $('.cta-art');
        if (!art) return;
        var svg = $('svg', art);
        var head = $('.head', art);
        var torso = $('.torso', art);
        var pupils = $$('.pupil', art);
        var step = parseFloat(svg.getAttribute('data-px')) || 16;
        var mouse = { x: 0, y: 0 };
        var turn = { x: 0, y: 0 };
        var visible = false;
        var raf = 0;
        var last = 0;

        onVisible(art, function (v) {
            visible = v;
            if (v) art.classList.add('in');
            if (v && !raf && !reduced) { last = performance.now(); raf = requestAnimationFrame(tick); }
        });
        if (reduced || !head) return;

        window.addEventListener('pointermove', function (e) {
            mouse.x = e.clientX / window.innerWidth * 2 - 1;
            mouse.y = e.clientY / window.innerHeight * 2 - 1;
        }, { passive: true });

        function tick(now) {
            var dt = Math.min(0.05, (now - last) / 1000);
            last = now;
            var k = Math.min(5 * dt, 1);
            var targetY = -1 + (mouse.x * 0.5 + 0.5) * 1.5;
            turn.x += (-0.2 * mouse.y - turn.x) * k;
            turn.y += (targetY - turn.y) * k;
            var t = turn.y + 0.25;
            head.style.transform = 'translate(' + (t * 14).toFixed(2) + 'px,' + (-turn.x * 40).toFixed(2) + 'px) rotate(' + (t * 8).toFixed(2) + 'deg) skewY(' + (t * -3).toFixed(2) + 'deg)';
            if (torso) torso.style.transform = 'translate(' + (t * -2.8).toFixed(2) + 'px,0) rotate(' + (t * -1.6).toFixed(2) + 'deg)';
            var r = svg.getBoundingClientRect();
            var scale = r.width / 850;
            var cx = r.left + 190 * scale;
            var cy = r.top + 280 * scale;
            var px = (window.innerWidth / 2 + mouse.x * window.innerWidth / 2 - cx) / 200;
            var py = (window.innerHeight / 2 + mouse.y * window.innerHeight / 2 - cy) / 160;
            pupils.forEach(function (p) {
                p.setAttribute('transform', 'translate(' + Math.round(Math.max(-1, Math.min(1, px))) * step + ' ' + Math.round(Math.max(-1, Math.min(1, py))) * step + ')');
            });
            raf = visible ? requestAnimationFrame(tick) : 0;
        }
    }

    /* Activity year switch. */
    function years() {
        var buttons = $$('.years button');
        buttons.forEach(function (b) {
            b.addEventListener('click', function () {
                var y = b.getAttribute('data-year');
                buttons.forEach(function (o) {
                    o.classList.toggle('on', o === b);
                    o.setAttribute('aria-pressed', String(o === b));
                });
                $$('[data-year-panel]').forEach(function (p) {
                    p.hidden = p.getAttribute('data-year-panel') !== y;
                });
            });
        });
    }

    /* Contact form opens the visitor's email app with the message filled in. */
    function contactForm() {
        var form = $('#contact-form');
        if (!form) return;
        var status = $('#form-status');
        form.addEventListener('submit', function (e) {
            e.preventDefault();
            function val(n) { return form.elements.namedItem(n).value.trim(); }
            var name = val('name');
            var email = val('email');
            var message = val('message');
            if (!name || !email || !message) {
                status.textContent = 'please fill in your name, email and message.';
                return;
            }
            var subject = val('topic') + ' from ' + name;
            var body = message + '\n\n' + name + '\n' + email;
            window.location.href = 'mailto:equalizerjr@gmail.com?subject=' + encodeURIComponent(subject) +
                '&body=' + encodeURIComponent(body);
            status.textContent = 'opening your email app...';
        });
    }

    function year() {
        var el = $('#year');
        if (el) el.textContent = new Date().getFullYear();
    }

    clock();
    fitWordmarks();
    wordmarkIntro();
    menu();
    reveal();
    trail();
    carousels();
    ctaArt();
    navUnscramble();
    stackRise();
    proof();
    filters();
    tabs();
    stackDialog();
    demos();
    years();
    contactForm();
    year();
})();
