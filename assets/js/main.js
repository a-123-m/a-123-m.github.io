document.addEventListener('DOMContentLoaded', function () {
    var root = document.documentElement;
    var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* ---------- Light / dark theme ---------- */
    var themeBtn = document.querySelector('.theme-toggle');
    var themeMeta = document.querySelector('meta[name="theme-color"]');

    function applyThemeLabel() {
        var dark = root.getAttribute('data-theme') === 'dark';
        if (themeBtn) themeBtn.setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme');
        if (themeMeta) themeMeta.setAttribute('content', dark ? '#130B22' : '#F6F4FB');
    }
    applyThemeLabel();

    if (themeBtn) {
        themeBtn.addEventListener('click', function () {
            var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
            root.setAttribute('data-theme', next);
            try { localStorage.setItem('theme', next); } catch (e) {}
            applyThemeLabel();
        });
    }

    /* ---------- Scroll progress bar + header border ---------- */
    var header = document.querySelector('.site-header');
    var bar = document.createElement('div');
    bar.className = 'scroll-progress';
    document.body.appendChild(bar);

    function onScroll() {
        var max = document.documentElement.scrollHeight - window.innerHeight;
        bar.style.width = (max > 0 ? (window.scrollY / max) * 100 : 0) + '%';
        if (header) header.classList.toggle('scrolled', window.scrollY > 8);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    /* ---------- Mobile menu ---------- */
    var navToggle = document.querySelector('.nav-toggle');
    var navLinks = document.querySelectorAll('#site-nav a');

    function setMenu(open) {
        if (!header || !navToggle) return;
        header.classList.toggle('open', open);
        navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        navToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
        navToggle.firstElementChild.className = open ? 'fas fa-xmark' : 'fas fa-bars';
    }
    if (navToggle) {
        navToggle.addEventListener('click', function () {
            setMenu(!header.classList.contains('open'));
        });
        navLinks.forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && header.classList.contains('open')) { setMenu(false); navToggle.focus(); }
        });
    }

    /* ---------- Highlight the nav link of the section in view ---------- */
    if ('IntersectionObserver' in window) {
        var spy = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;
                navLinks.forEach(function (a) {
                    var on = a.getAttribute('href') === '#' + entry.target.id;
                    a.classList.toggle('active', on);
                    if (on) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
                });
            });
        }, { rootMargin: '-45% 0px -50% 0px' });
        navLinks.forEach(function (a) {
            var sec = document.querySelector(a.getAttribute('href'));
            if (sec) spy.observe(sec);
        });
    }

    /* ---------- Hero chart: count up the numbers and grow the bars once ---------- */
    var chart = document.querySelector('.chart-card');
    var counters = document.querySelectorAll('[data-count]');

    function format(n) { return n.toLocaleString('en-US'); }

    function runCounter(el) {
        var end = +el.dataset.count;
        var suffix = el.dataset.suffix || '';
        if (reduceMotion) { el.textContent = format(end) + suffix; return; }
        var start = null;
        function step(t) {
            if (start === null) start = t;
            var p = Math.min((t - start) / 1400, 1);
            var eased = 1 - Math.pow(1 - p, 3);
            el.textContent = format(Math.round(end * eased)) + (p === 1 ? suffix : '');
            if (p < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
    }

    function playChart() {
        if (!chart || chart.classList.contains('is-in')) return;
        chart.classList.add('is-in');
        counters.forEach(runCounter);
    }

    if (chart) {
        if (!reduceMotion) counters.forEach(function (c) { c.textContent = '0'; });
        if ('IntersectionObserver' in window && !reduceMotion) {
            var chartObs = new IntersectionObserver(function (entries, obs) {
                entries.forEach(function (entry) {
                    if (!entry.isIntersecting) return;
                    obs.disconnect();
                    playChart();
                });
            }, { threshold: 0.3 });
            chartObs.observe(chart);
        } else {
            playChart();
        }
    }

    /* ---------- Project filter: buttons are built from the tool badges ---------- */
    var projects = Array.prototype.slice.call(document.querySelectorAll('.project'));
    var list = document.querySelector('.project-list');

    if (list && projects.length) {
        var counts = {}, order = [];
        projects.forEach(function (p) {
            var names = Array.prototype.map.call(p.querySelectorAll('.tool-badges li'), function (li) { return li.textContent.trim(); });
            p.dataset.tools = names.join('|');
            names.forEach(function (n) {
                if (!(n in counts)) { counts[n] = 0; order.push(n); }
                counts[n]++;
            });
        });

        // Only tools used in two or more projects become filters
        var filters = order.filter(function (n) { return counts[n] > 1; })
            .sort(function (a, b) { return counts[b] - counts[a]; });

        var filterBar = document.createElement('div');
        filterBar.className = 'filter-bar';
        filterBar.setAttribute('role', 'group');
        filterBar.setAttribute('aria-label', 'Filter projects by tool');

        var status = document.createElement('p');
        status.className = 'filter-status';
        status.setAttribute('aria-live', 'polite');

        function showStatus(name, shown) {
            if (name === 'All') {
                status.textContent = 'Showing all ' + projects.length + ' projects.';
            } else {
                status.textContent = 'Showing ' + shown + (shown === 1 ? ' project' : ' projects') + ' that use ' + name + '.';
            }
        }

        ['All'].concat(filters).forEach(function (name) {
            var b = document.createElement('button');
            b.type = 'button';
            b.className = 'filter-btn';
            b.setAttribute('aria-pressed', name === 'All' ? 'true' : 'false');

            var label = document.createElement('span');
            label.textContent = name;
            var count = document.createElement('span');
            count.className = 'count';
            count.textContent = name === 'All' ? projects.length : counts[name];
            b.appendChild(label);
            b.appendChild(count);

            b.addEventListener('click', function () {
                filterBar.querySelectorAll('.filter-btn').forEach(function (x) {
                    x.setAttribute('aria-pressed', x === b ? 'true' : 'false');
                });
                var shown = 0;
                projects.forEach(function (p) {
                    var hide = name !== 'All' && p.dataset.tools.split('|').indexOf(name) === -1;
                    p.hidden = hide;
                    if (!hide) shown++;
                });
                showStatus(name, shown);
            });
            filterBar.appendChild(b);
        });

        showStatus('All', projects.length);
        list.parentNode.insertBefore(filterBar, list);
        list.parentNode.insertBefore(status, list);
    }

    /* ---------- Click a dashboard preview to see it full size ---------- */
    var dlg = document.createElement('dialog');
    if (typeof dlg.showModal === 'function') {
        dlg.className = 'lightbox';
        dlg.setAttribute('aria-label', 'Project preview');
        dlg.innerHTML = '<button type="button" class="lightbox-close" aria-label="Close preview">&times;</button><img alt="">';
        document.body.appendChild(dlg);
        var dlgImg = dlg.querySelector('img');

        document.querySelectorAll('.shot').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var img = btn.querySelector('img');
                dlgImg.src = img.src;
                dlgImg.alt = img.alt;
                dlg.showModal();
            });
        });
        dlg.addEventListener('click', function (e) {
            // Clicking the dark backdrop, the image or the close button closes the preview
            dlg.close();
        });
    }

    /* ---------- Contact form: show a sending state ---------- */
    var form = document.querySelector('.contact-form');
    if (form) {
        form.addEventListener('submit', function () {
            var btn = form.querySelector('button[type="submit"]');
            if (btn) { btn.disabled = true; btn.textContent = 'Sending...'; }
        });
    }
});
