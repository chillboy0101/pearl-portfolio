(function () {
    "use strict";

    document.documentElement.classList.add("js");
    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Navigation: turns solid once the page scrolls past the hero.
    var nav = document.querySelector(".site-nav");
    function updateNav() {
        if (nav) nav.classList.toggle("solid", window.scrollY > 40);
    }
    updateNav();
    window.addEventListener("scroll", updateNav, { passive: true });

    var toggle = document.querySelector(".menu-toggle");
    var links = document.querySelector(".nav-links");
    if (toggle && links) {
        toggle.addEventListener("click", function () {
            var open = links.classList.toggle("open");
            toggle.setAttribute("aria-expanded", String(open));
            toggle.innerHTML = open ? '<i class="fas fa-times"></i>' : '<i class="fas fa-bars"></i>';
        });
        links.addEventListener("click", function (e) {
            if (e.target.tagName === "A") {
                links.classList.remove("open");
                toggle.setAttribute("aria-expanded", "false");
                toggle.innerHTML = '<i class="fas fa-bars"></i>';
            }
        });
    }

    // Count-up numbers, run once when they come into view.
    function countUp(el) {
        var target = parseInt(el.getAttribute("data-count"), 10);
        if (isNaN(target)) return;
        if (reduceMotion) {
            el.textContent = target.toLocaleString();
            return;
        }
        var start = null;
        var duration = 1600;
        function frame(ts) {
            if (!start) start = ts;
            var p = Math.min((ts - start) / duration, 1);
            var eased = 1 - Math.pow(1 - p, 3);
            el.textContent = Math.round(target * eased).toLocaleString();
            if (p < 1) requestAnimationFrame(frame);
        }
        requestAnimationFrame(frame);
    }

    // Repository bars grow to their share when visible.
    function fillBar(el) {
        el.style.width = el.getAttribute("data-width");
    }

    // Reveal on scroll.
    var observed = document.querySelectorAll(".reveal, [data-count], .fill[data-width]");
    if ("IntersectionObserver" in window) {
        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;
                var el = entry.target;
                if (el.classList.contains("reveal")) el.classList.add("in");
                if (el.hasAttribute("data-count")) countUp(el);
                if (el.hasAttribute("data-width")) fillBar(el);
                io.unobserve(el);
            });
        }, { threshold: 0.15, rootMargin: "0px 0px -40px 0px" });
        observed.forEach(function (el) { io.observe(el); });
    } else {
        observed.forEach(function (el) {
            el.classList.add("in");
            if (el.hasAttribute("data-count")) el.textContent = Number(el.getAttribute("data-count")).toLocaleString();
            if (el.hasAttribute("data-width")) fillBar(el);
        });
    }

    // Typing effect for the hero line.
    var typed = document.querySelector("[data-typed]");
    if (typed) {
        var words = JSON.parse(typed.getAttribute("data-typed"));
        if (reduceMotion) {
            typed.textContent = words[0];
        } else {
            var w = 0, i = 0, deleting = false;
            (function tick() {
                var word = words[w];
                i += deleting ? -1 : 1;
                typed.textContent = word.slice(0, i);
                var delay = deleting ? 40 : 85;
                if (!deleting && i === word.length) { deleting = true; delay = 1700; }
                else if (deleting && i === 0) { deleting = false; w = (w + 1) % words.length; delay = 300; }
                setTimeout(tick, delay);
            })();
        }
    }

    // 3D tilt on cards that follow the pointer.
    if (!reduceMotion && window.matchMedia("(hover: hover)").matches) {
        document.querySelectorAll("[data-tilt]").forEach(function (card) {
            card.addEventListener("mousemove", function (e) {
                var r = card.getBoundingClientRect();
                var x = (e.clientX - r.left) / r.width - 0.5;
                var y = (e.clientY - r.top) / r.height - 0.5;
                card.style.transform = "perspective(900px) rotateX(" + (-y * 7) + "deg) rotateY(" + (x * 9) + "deg) translateY(-6px)";
            });
            card.addEventListener("mouseleave", function () {
                card.style.transform = "";
            });
        });
    }

    // Project filters on the Work page.
    var filters = document.querySelectorAll(".filter");
    if (filters.length) {
        filters.forEach(function (btn) {
            btn.addEventListener("click", function () {
                var value = btn.getAttribute("data-filter");
                filters.forEach(function (b) {
                    b.classList.toggle("active", b === btn);
                    b.setAttribute("aria-pressed", String(b === btn));
                });
                document.querySelectorAll(".project[data-cat]").forEach(function (card) {
                    var show = value === "all" || card.getAttribute("data-cat").indexOf(value) !== -1;
                    card.classList.toggle("hide", !show);
                    if (show) card.classList.add("in");
                });
            });
        });
    }

    // Year switch for the activity chart.
    var tabs = document.querySelectorAll(".year-tabs button");
    if (tabs.length) {
        tabs.forEach(function (tab) {
            tab.addEventListener("click", function () {
                var year = tab.getAttribute("data-year");
                tabs.forEach(function (t) {
                    t.classList.toggle("active", t === tab);
                    t.setAttribute("aria-pressed", String(t === tab));
                });
                document.querySelectorAll("[data-year-panel]").forEach(function (panel) {
                    panel.hidden = panel.getAttribute("data-year-panel") !== year;
                });
            });
        });
    }

    // Contact form: opens the visitor's email app with the message filled in.
    var form = document.getElementById("contact-form");
    if (form) {
        form.addEventListener("submit", function (e) {
            e.preventDefault();
            if (!form.checkValidity()) {
                form.reportValidity();
                return;
            }
            var f = form.elements;
            var subject = f.topic.value + " from " + f.name.value.trim();
            var body = f.message.value.trim() + "\n\n" + f.name.value.trim() + "\n" + f.email.value.trim();
            window.location.href = "mailto:equalizerjr@gmail.com?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
            var note = document.getElementById("form-status");
            if (note) note.textContent = "Your email app should now open with your message ready to send.";
        });
    }

    var year = document.getElementById("year");
    if (year) year.textContent = new Date().getFullYear();
})();
