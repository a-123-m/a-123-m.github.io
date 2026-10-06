document.addEventListener('DOMContentLoaded', function () {
    var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* Scroll progress bar + back-to-top button */
    var bar = document.createElement('div');
    bar.className = 'scroll-progress';
    document.body.appendChild(bar);

    var toTop = document.createElement('button');
    toTop.className = 'to-top';
    toTop.setAttribute('aria-label', 'Back to top');
    toTop.innerHTML = '<i class="fas fa-arrow-up" aria-hidden="true"></i>';
    toTop.addEventListener('click', function () {
        window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    });
    document.body.appendChild(toTop);

    function onScroll() {
        var max = document.documentElement.scrollHeight - window.innerHeight;
        bar.style.width = (max > 0 ? (window.scrollY / max) * 100 : 0) + '%';
        toTop.classList.toggle('show', window.scrollY > 600);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    /* Highlight the nav link of the section in view */
    var links = document.querySelectorAll('nav ul li a');
    if ('IntersectionObserver' in window) {
        var spy = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;
                links.forEach(function (a) {
                    a.classList.toggle('active', a.getAttribute('href') === '#' + entry.target.id);
                });
            });
        }, { rootMargin: '-45% 0px -50% 0px' });
        links.forEach(function (a) {
            var sec = document.querySelector(a.getAttribute('href'));
            if (sec) spy.observe(sec);
        });

        /* Count-up numbers (runs once when the stats strip is seen) */
        var counters = document.querySelectorAll('[data-count]');
        var counted = new IntersectionObserver(function (entries, obs) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;
                obs.unobserve(entry.target);
                var el = entry.target, end = +el.dataset.count, suffix = el.dataset.suffix || '';
                if (reduceMotion) { el.textContent = end.toLocaleString('en-IN') + suffix; return; }
                var start = null;
                (function step(t) {
                    start = start || t;
                    var p = Math.min((t - start) / 1400, 1);
                    el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3))).toLocaleString('en-IN') + (p === 1 ? suffix : '');
                    if (p < 1) requestAnimationFrame(step);
                })(performance.now());
            });
        }, { threshold: 0.6 });
        counters.forEach(function (c) { counted.observe(c); });
    }

    /* Project filter: buttons are built from the tool badges on each card */
    var cards = document.querySelectorAll('.project-card');
    var grid = document.querySelector('.projects-grid');
    if (grid && cards.length) {
        var tools = [];
        cards.forEach(function (card) {
            var names = Array.prototype.map.call(card.querySelectorAll('.tool-badges li'), function (li) { return li.textContent.trim(); });
            card.dataset.tools = names.join('|');
            names.forEach(function (n) { if (tools.indexOf(n) === -1) tools.push(n); });
        });
        var filterBar = document.createElement('div');
        filterBar.className = 'filter-bar';
        filterBar.setAttribute('role', 'group');
        filterBar.setAttribute('aria-label', 'Filter projects by tool');
        ['All'].concat(tools).forEach(function (name) {
            var b = document.createElement('button');
            b.type = 'button';
            b.className = 'filter-btn';
            b.textContent = name;
            b.setAttribute('aria-pressed', name === 'All' ? 'true' : 'false');
            b.addEventListener('click', function () {
                filterBar.querySelectorAll('.filter-btn').forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
                cards.forEach(function (card) {
                    card.hidden = name !== 'All' && card.dataset.tools.split('|').indexOf(name) === -1;
                });
            });
            filterBar.appendChild(b);
        });
        grid.parentNode.insertBefore(filterBar, grid);
    }

    /* Click a dashboard preview to see it full size */
    var box = document.createElement('div');
    box.className = 'lightbox';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-modal', 'true');
    box.setAttribute('aria-label', 'Project preview');
    box.innerHTML = '<button type="button" aria-label="Close preview">&times;</button><img alt="">';
    document.body.appendChild(box);
    var boxImg = box.querySelector('img');
    function closeBox() { box.classList.remove('open'); }
    document.querySelectorAll('.project-card img').forEach(function (img) {
        img.addEventListener('click', function () {
            boxImg.src = img.src;
            boxImg.alt = img.alt;
            box.classList.add('open');
            box.querySelector('button').focus();
        });
    });
    box.addEventListener('click', closeBox);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeBox(); });

    /* Contact form: show a sending state so people know it worked */
    var form = document.querySelector('.contact-form');
    if (form) {
        form.addEventListener('submit', function () {
            var btn = form.querySelector('button[type="submit"]');
            if (btn) { btn.disabled = true; btn.textContent = 'Sending...'; }
        });
    }
});
