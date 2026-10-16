(function () {
    "use strict";

    var root = document.documentElement;
    var STORAGE_KEY = "cq-theme";

    function currentTheme() {
        var set = root.getAttribute("data-theme");
        if (set) return set;
        return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }

    // Theme toggle: flips between light and dark and remembers the choice.
    var toggle = document.getElementById("theme-toggle");
    if (toggle) {
        toggle.addEventListener("click", function () {
            var next = currentTheme() === "dark" ? "light" : "dark";
            root.setAttribute("data-theme", next);
            try {
                localStorage.setItem(STORAGE_KEY, next);
            } catch (e) {
                /* storage unavailable; the choice lasts for this page only */
            }
        });
    }

    // Project filters on projects.html.
    var filters = document.querySelectorAll("[data-filter]");
    var groups = document.querySelectorAll("[data-group]");
    if (filters.length && groups.length) {
        filters.forEach(function (button) {
            button.addEventListener("click", function () {
                var value = button.getAttribute("data-filter");
                filters.forEach(function (b) {
                    b.setAttribute("aria-pressed", String(b === button));
                });
                groups.forEach(function (group) {
                    group.hidden = value !== "all" && group.getAttribute("data-group") !== value;
                });
            });
        });
    }

    // Copy buttons on contact.html.
    document.querySelectorAll("[data-copy]").forEach(function (button) {
        button.addEventListener("click", function () {
            var text = button.getAttribute("data-copy");
            var label = button.textContent;
            function done(message) {
                button.textContent = message;
                setTimeout(function () {
                    button.textContent = label;
                }, 1600);
            }
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(text).then(function () {
                    done("Copied");
                }, function () {
                    done("Select and copy");
                });
            } else {
                done("Select and copy");
            }
        });
    });

    // Contact form: no server, so it opens the visitor's email app with the message filled in.
    var form = document.getElementById("contact-form");
    if (form) {
        var status = document.getElementById("form-status");
        form.addEventListener("submit", function (event) {
            event.preventDefault();
            if (!form.checkValidity()) {
                form.reportValidity();
                return;
            }
            var name = form.elements.name.value.trim();
            var email = form.elements.email.value.trim();
            var topic = form.elements.topic.value;
            var message = form.elements.message.value.trim();
            var subject = topic + " from " + name;
            var body = message + "\n\n" + name + "\n" + email;
            window.location.href = "mailto:equalizerjr@gmail.com?subject=" +
                encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
            if (status) {
                status.hidden = false;
                status.textContent = "Your email app should open with the message ready to send. If nothing opened, email equalizerjr@gmail.com directly.";
            }
        });
    }

    // Print button on resume.html.
    var printButton = document.getElementById("print-resume");
    if (printButton) {
        printButton.addEventListener("click", function () {
            window.print();
        });
    }
})();
