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
            btn.textContent = open ? 'close' : 'menu';
        });
        $$('.nav .link').forEach(function (a) {
            a.addEventListener('click', function () {
                nav.classList.remove('open');
                btn.setAttribute('aria-expanded', 'false');
                btn.textContent = 'menu';
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
        var targets = $$('.rv, [data-scramble], [data-count], .repo-list');
        function run(el) {
            el.classList.add('in');
            if (el.hasAttribute('data-scramble')) scramble(el);
            if (el.hasAttribute('data-count')) countUp(el);
            if (el.classList.contains('repo-list')) fillBars(el);
        }
        if (reduced || !('IntersectionObserver' in window)) {
            targets.forEach(function (el) {
                el.classList.add('in');
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

    /* The cursor drops small green squares holding code characters. */
    function trail() {
        if (reduced || !finePointer) return;
        var last = 0;
        var lx = 0;
        var ly = 0;
        window.addEventListener('mousemove', function (e) {
            var now = performance.now();
            var dist = Math.abs(e.clientX - lx) + Math.abs(e.clientY - ly);
            if (now - last < 45 || dist < 22) return;
            last = now;
            lx = e.clientX;
            ly = e.clientY;
            var s = document.createElement('span');
            s.className = 'trail';
            s.setAttribute('aria-hidden', 'true');
            s.textContent = GLYPHS.charAt(Math.floor(Math.random() * 10));
            s.style.left = (Math.round(e.clientX / 20) * 20 - 10) + 'px';
            s.style.top = (Math.round(e.clientY / 20) * 20 - 10) + 'px';
            document.body.appendChild(s);
            setTimeout(function () { s.remove(); }, 720);
        }, { passive: true });
    }

    /* Size a canvas to its box at device resolution. */
    function fit(canvas) {
        var r = canvas.getBoundingClientRect();
        var dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.max(1, Math.round(r.width * dpr));
        canvas.height = Math.max(1, Math.round(r.height * dpr));
        var ctx = canvas.getContext('2d');
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        return { ctx: ctx, w: r.width, h: r.height };
    }

    function onVisible(el, cb) {
        if (!('IntersectionObserver' in window)) { cb(true); return; }
        new IntersectionObserver(function (entries) { cb(entries[0].isIntersecting); }).observe(el);
    }

    /* Pixel mosaics: blocky bands of the palette that slowly reshuffle. */
    function mosaic(canvas, opts) {
        var size = opts.size;
        var c;
        var grid = [];
        var cols = 0;
        var rows = 0;
        var visible = true;

        function colourAt(x, y) {
            var band = (x / cols + (opts.tilt ? y / rows * 0.35 : 0)) * opts.colours.length;
            var i = Math.floor(band + (Math.random() - 0.5) * 1.4);
            return opts.colours[Math.max(0, Math.min(opts.colours.length - 1, i))];
        }

        function build() {
            c = fit(canvas);
            cols = Math.ceil(c.w / size);
            rows = Math.ceil(c.h / size);
            grid = [];
            for (var y = 0; y < rows; y++) {
                for (var x = 0; x < cols; x++) grid.push(colourAt(x, y));
            }
            draw();
        }

        function draw() {
            for (var y = 0; y < rows; y++) {
                for (var x = 0; x < cols; x++) {
                    c.ctx.fillStyle = grid[y * cols + x];
                    c.ctx.fillRect(x * size, y * size, size + 0.5, size + 0.5);
                }
            }
        }

        function shuffle() {
            if (!visible) return;
            for (var n = 0; n < Math.ceil(grid.length / 40); n++) {
                var i = Math.floor(Math.random() * grid.length);
                grid[i] = colourAt(i % cols, Math.floor(i / cols));
            }
            draw();
        }

        build();
        window.addEventListener('resize', build);
        if (reduced) return;
        onVisible(canvas, function (v) { visible = v; });
        setInterval(shuffle, 140);
    }

    function mosaics() {
        $$('canvas[data-mosaic]').forEach(function (cv) {
            var kind = cv.getAttribute('data-mosaic');
            if (kind === 'cta') {
                mosaic(cv, { size: 24, tilt: true, colours: ['#e9edec', '#19c23f', '#0c8a2c', '#1f883d', '#0b5d22'] });
            } else {
                mosaic(cv, { size: 24, tilt: false, colours: ['#0c8a2c', '#19c23f', '#b8a114', '#e9edec', '#b07cfa', '#f27bf2'] });
            }
        });
    }

    /* Small screenshot slideshows with square page buttons; they advance on their own while in view. */
    function slideshows() {
        $$('.slides').forEach(function (box) {
            var slides = $$('.slide', box);
            var dots = $$('.dots button', box);
            if (slides.length < 2) return;
            var current = 0;
            var paused = false;
            var visible = false;
            function show(i) {
                current = (i + slides.length) % slides.length;
                slides.forEach(function (s, j) { s.classList.toggle('on', j === current); });
                dots.forEach(function (d, j) { d.setAttribute('aria-current', j === current ? 'true' : 'false'); });
            }
            dots.forEach(function (d, j) { d.addEventListener('click', function () { show(j); }); });
            box.addEventListener('mouseenter', function () { paused = true; });
            box.addEventListener('mouseleave', function () { paused = false; });
            if (reduced) return;
            onVisible(box, function (v) { visible = v; });
            setInterval(function () { if (visible && !paused) show(current + 1); }, 4500);
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

    /* Highlights playlist: list on the left drives the large preview on the right. */
    function playlist() {
        var data = $('#pl-data');
        if (!data) return;
        var items = JSON.parse(data.textContent);
        var buttons = $$('.pl-item');
        var img = $('#pl-img');
        var title = $('#pl-title');
        var meta = $('#pl-meta');
        var desc = $('#pl-desc');
        var links = $('#pl-links');
        var tag = $('#pl-tag');
        var current = 0;

        function show(i) {
            current = (i + items.length) % items.length;
            var p = items[current];
            buttons.forEach(function (b, j) {
                b.classList.toggle('on', j === current);
                b.setAttribute('aria-selected', String(j === current));
            });
            img.src = 'images/' + p.img + '.jpg';
            img.alt = 'Screenshot of ' + p.alt;
            tag.textContent = p.url;
            title.innerHTML = p.title;
            meta.textContent = p.meta;
            meta.setAttribute('data-text', p.meta);
            if (!reduced) scramble(meta);
            desc.innerHTML = p.desc;
            links.innerHTML = p.links.map(function (l, k) {
                return '<a class="btn btn-sm ' + (k === 0 ? 'btn-green' : 'btn-grey') + '" href="' + l[1] +
                    '" target="_blank" rel="noopener">' + l[0] + ' <span class="arrow">↗</span></a>';
            }).join('');
        }

        buttons.forEach(function (b, i) { b.addEventListener('click', function () { show(i); }); });
        $('[data-pl="prev"]').addEventListener('click', function () { show(current - 1); });
        $('[data-pl="next"]').addEventListener('click', function () { show(current + 1); });
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
    slideshows();
    proof();
    mosaics();
    filters();
    playlist();
    years();
    contactForm();
    year();
})();
