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
            else el.innerHTML = html;
        }
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
    var TRAIL_COLOURS = ['#f73678', '#c05200', '#bba00a', '#ae85ff', '#12bf3e', '#178ffb', '#ff7ded', '#08872b'];
    function trail() {
        if (reduced || !finePointer) return;
        var size = 20;
        var lastKey = '';
        window.addEventListener('mousemove', function (e) {
            var cx = Math.floor(e.clientX / size);
            var cy = Math.floor(e.clientY / size);
            var key = cx + ',' + cy;
            if (key === lastKey) return;
            lastKey = key;
            var block = document.createElement('span');
            block.className = 'trail';
            block.setAttribute('aria-hidden', 'true');
            block.style.transform = 'translate(' + cx * size + 'px,' + cy * size + 'px)';
            var colour = document.createElement('span');
            colour.style.backgroundColor = TRAIL_COLOURS[Math.floor(Math.random() * TRAIL_COLOURS.length)];
            if (Math.random() < 0.4) colour.textContent = GLYPHS.charAt(Math.floor(Math.random() * 10));
            block.appendChild(colour);
            document.body.appendChild(block);
            requestAnimationFrame(function () { block.classList.add('on'); });
            setTimeout(function () { block.classList.remove('on'); }, 260);
            setTimeout(function () { block.remove(); }, 520);
        }, { passive: true });
    }

    /* Nav links briefly unscramble on hover. */
    function navUnscramble() {
        if (reduced) return;
        $$('.nav .link, .nav .cta').forEach(function (a) {
            var node = a.firstChild;
            if (!node || node.nodeType !== 3) return;
            var text = node.textContent;
            var timer = 0;
            a.addEventListener('mouseenter', function () {
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
        });
    }

    function onVisible(el, cb) {
        if (!('IntersectionObserver' in window)) { cb(true); return; }
        new IntersectionObserver(function (entries) { cb(entries[0].isIntersecting); }).observe(el);
    }

    /* Type a caption out with a blinking block cursor after it. */
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
        function show(i) {
            current = (i + items.length) % items.length;
            items.forEach(function (it, j) { it.hidden = j !== current; });
            box.style.setProperty('--c', items[current].getAttribute('data-c'));
            var lbl = $('.proof-label', items[current]);
            if (lbl && !reduced) scramble(lbl);
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
        var current = 0;

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

        buttons.forEach(function (b, i) { b.addEventListener('click', function () { show(i); }); });
        $('.pl-play').addEventListener('click', play);
        $('[data-pl="prev"]').addEventListener('click', function () { show(current - 1); });
        $('[data-pl="next"]').addEventListener('click', function () { show(current + 1); });
    }

    /* The closing art panel: pieces build in when it arrives, and the character's eyes follow the cursor. */
    function ctaArt() {
        var art = $('.cta-art');
        if (!art) return;
        var pupils = $$('.pupil', art);
        var svg = $('svg', art);
        var step = parseFloat(svg.getAttribute('data-px')) || 16;
        onVisible(art, function (v) { if (v) art.classList.add('in'); });
        if (!pupils.length) return;
        window.addEventListener('pointermove', function (e) {
            var r = svg.getBoundingClientRect();
            var scale = r.width / 850;
            var cx = r.left + 180 * scale;
            var cy = r.top + 200 * scale;
            var dx = Math.max(-1, Math.min(1, (e.clientX - cx) / 200));
            var dy = Math.max(-1, Math.min(1, (e.clientY - cy) / 160));
            pupils.forEach(function (p) {
                p.setAttribute('transform', 'translate(' + Math.round(dx) * step + ' ' + Math.round(dy) * step + ')');
            });
        }, { passive: true });
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
    menu();
    reveal();
    trail();
    carousels();
    ctaArt();
    navUnscramble();
    proof();
    filters();
    tabs();
    stackDialog();
    demos();
    years();
    contactForm();
    year();
})();
