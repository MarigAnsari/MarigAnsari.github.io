// Progressive enhancement only: every page works with this file absent.
(function () {
  var doc = document.documentElement;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };

  /* theme: data-theme on <html>, saved in localStorage, defaults to the OS setting */
  (function () {
    var group = $('.theme'); if (!group) return;
    var btns = $$('button', group);
    var mq = window.matchMedia ? matchMedia('(prefers-color-scheme: dark)') : null;
    function current() { return doc.getAttribute('data-theme') || (mq && mq.matches ? 'dark' : 'light'); }
    function sync() { var c = current(); btns.forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-t') === c)); }); }
    btns.forEach(function (b) {
      b.addEventListener('click', function () {
        var t = b.getAttribute('data-t');
        doc.setAttribute('data-theme', t);
        try { localStorage.setItem('theme', t); } catch (e) {}
        sync();
      });
    });
    if (mq && mq.addEventListener) mq.addEventListener('change', sync);
    group.hidden = false; sync();
  })();

  /* scroll spy: active zone letter in the header and frame, active nav link; JS fallback for the progress rule */
  (function () {
    var spies = $$('[data-spy]'); if (!spies.length) return;
    var links = {}; $$('.bar nav a').forEach(function (a) { var h = a.getAttribute('href'); if (h && h.indexOf('#') > -1) links[h.split('#')[1]] = a; });
    var zl = $('[data-zl]'), zn = $('[data-zn]'), letters = $$('.frame a'), cur = null, curLink = null;
    var bar = $('.progress'), css = window.CSS && CSS.supports && CSS.supports('animation-timeline: scroll()');
    var ticking = false;
    function update() {
      ticking = false;
      var y = window.innerHeight * 0.4, active = null;
      spies.forEach(function (s) { if (s.getBoundingClientRect().top <= y) active = s; });
      if (active !== cur) {
        cur = active;
        var z = active && active.closest('[data-zone]');
        if (z) {
          if (zl) zl.textContent = z.getAttribute('data-zone');
          if (zn) zn.textContent = z.getAttribute('data-zname');
          letters.forEach(function (a) { if (a.getAttribute('data-z') === z.getAttribute('data-zone')) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); });
        }
        if (curLink) curLink.removeAttribute('aria-current');
        curLink = active ? links[active.id] || null : null;
        if (curLink) curLink.setAttribute('aria-current', 'true');
      }
      if (bar && !css) {
        var max = doc.scrollHeight - window.innerHeight;
        bar.style.setProperty('--p', max > 0 ? Math.min(1, window.scrollY / max).toFixed(4) : 0);
      }
    }
    function req() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }
    window.addEventListener('scroll', req, { passive: true }); window.addEventListener('resize', req); update();
  })();

  /* one-time reveals */
  (function () {
    if (reduce || !('IntersectionObserver' in window)) return;
    var items = $$('.rv'); if (!items.length) return;
    doc.classList.add('rv-on');
    var io = new IntersectionObserver(function (entries) {
      var batch = entries.filter(function (e) { return e.isIntersecting; });
      batch.forEach(function (e, i) {
        var el = e.target; io.unobserve(el);
        el.style.setProperty('--d', Math.min(i, 8) * 40 + 'ms');
        el.classList.add('in');
        setTimeout(function () { el.classList.remove('rv', 'in'); el.style.removeProperty('--d'); }, 700);
      });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.05 });
    items.forEach(function (el) { io.observe(el); });
  })();

  /* work: one filter row over cards for every project. Featured is the default view. Which cards show, and which of them is the
     large one (first and fifth visible), is decided here; without this file all cards show in the same layout. */
  (function () {
    var grid = $('#work-grid'), bar = $('.filters'); if (!grid || !bar) return;
    var cards = $$('.proj', grid), chips = $$('.fchip', bar), more = $('.more'), label = more && $('.more-t', more), count = $('.icount'), head = $('.bar');
    var key = 'featured', total = cards.length;
    function match(c) { return key === 'all' || (key === 'featured' ? c.hasAttribute('data-f') : c.getAttribute('data-g') === key); }
    function render() {
      var n = 0;
      cards.forEach(function (c) {
        var on = match(c); c.hidden = !on;
        if (on) { c.classList.toggle('feat', n === 0 || n === 4); c.classList.toggle('flip', n === 4); n++; }
      });
      chips.forEach(function (c) { c.setAttribute('aria-pressed', String(c.getAttribute('data-g') === key)); });
      if (count) count.textContent = ('0' + n).slice(-2) + ' / ' + ('0' + total).slice(-2);
      if (more) { more.setAttribute('data-state', key === 'all' ? 'all' : 'part'); label.textContent = key === 'all' ? 'Show featured only' : 'Show all ' + total + ' projects'; }
    }
    // filter change: a quick fade, no movement
    function fade() { if (!reduce && grid.animate) grid.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 150, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' }); }
    // keep the top of the chips in view under the sticky header; scroll only when they are not
    function showChips() {
      var top = bar.getBoundingClientRect().top, hb = head ? head.getBoundingClientRect().bottom : 0;
      if (top < hb + 8 || top > window.innerHeight - 120) window.scrollTo({ top: window.scrollY + top - hb - 16 });
    }
    function set(k, scroll) {
      key = k; cards.forEach(function (c) { c.classList.remove('rv', 'in'); });
      render(); fade(); if (scroll) showChips();
    }
    chips.forEach(function (c) { c.addEventListener('click', function () { set(c.getAttribute('data-g'), false); }); });
    if (more) more.addEventListener('click', function () { set(key === 'all' ? 'featured' : 'all', true); });
    cards.forEach(function (c) { if (!c.hasAttribute('data-f')) c.classList.remove('rv', 'in'); });
    render(); grid.setAttribute('data-ready', '');
    bar.hidden = false; if (more) more.hidden = false;
  })();

  /* hero: one-time count-up of the stat numerals. The final value is in the HTML and in a hidden span for readers. */
  (function () {
    var els = $$('.cu [data-to]'); if (!els.length || reduce) return;
    function run() {
      els.forEach(function (el) {
        var to = +el.getAttribute('data-to'), t0 = null; el.textContent = '0';
        (function step(now) {
          if (t0 === null) t0 = now; var p = Math.min(1, (now - t0) / 900);
          el.textContent = String(Math.round(to * (1 - Math.pow(1 - p, 3))));
          if (p < 1) requestAnimationFrame(step);
        })(performance.now());
      });
    }
    var hero = $('.sheet'); if (!hero || !('IntersectionObserver' in window)) { run(); return; }
    var io = new IntersectionObserver(function (en) { if (en[0].isIntersecting) { io.disconnect(); run(); } }, { threshold: 0.3 }); io.observe(hero);
  })();

  /* hero Klann figure: plots itself once, then one orange dot circles the foot path (one lap every 7 s), paused when off screen or the tab is hidden */
  (function () {
    var k = $('.klann'); if (!k) return;
    var dot = $('.k-dot', k), path = $('#kfp', k), hero = $('.sheet');
    var LAP = 7000, len = 0, pos = 0, last = 0, raf = 0, running = false, ready = false, seen = true;
    function put(f) { var p = path.getPointAtLength(f * len); dot.setAttribute('transform', 'translate(' + p.x.toFixed(1) + ' ' + p.y.toFixed(1) + ')'); }
    function frame(now) { if (!running) return; pos = (pos + now - last) % LAP; last = now; put(pos / LAP); raf = requestAnimationFrame(frame); }
    function play() { if (running || !ready || !seen || document.hidden || reduce) return; running = true; last = performance.now(); raf = requestAnimationFrame(frame); }
    function pause() { running = false; cancelAnimationFrame(raf); }
    function start() { if (!path || !dot) return; len = path.getTotalLength(); put(0); dot.style.opacity = '1'; ready = true; play(); }
    function go() { k.classList.add('go'); if (reduce) start(); else setTimeout(start, 2100); }
    if ('IntersectionObserver' in window) {
      var once = new IntersectionObserver(function (en) { if (en[0].isIntersecting) { go(); once.disconnect(); } }, { threshold: 0.2 }); once.observe(k);
      if (hero) new IntersectionObserver(function (en) { seen = en[0].isIntersecting; if (seen) play(); else pause(); }, { threshold: 0 }).observe(hero);
    } else go();
    document.addEventListener('visibilitychange', function () { if (document.hidden) pause(); else play(); });
  })();

  /* copy buttons (email, phone, LinkedIn): copy the plain value, brief "Copied" state, polite announcement */
  (function () {
    if (!navigator.clipboard) return;
    $$('.copy').forEach(function (b) {
      var msg = $('[data-copy-msg]', b.parentNode), lab = $('.cp-t', b) || b, t;
      b.hidden = false;
      b.addEventListener('click', function () {
        navigator.clipboard.writeText(b.getAttribute('data-copy')).then(function () {
          lab.textContent = 'Copied'; b.classList.add('is-done'); if (msg) msg.textContent = b.getAttribute('data-done') || 'Copied';
          clearTimeout(t); t = setTimeout(function () { lab.textContent = 'Copy'; b.classList.remove('is-done'); if (msg) msg.textContent = ''; }, 1800);
        }, function () {});
      });
    });
  })();

  /* floating two-way button: upper half of the page = bottom centre, points down, goes to the bottom;
     lower half = top centre, points up, goes to the top. 45/55 percent hysteresis stops flicker at the midpoint. */
  (function () {
    var b = document.createElement('button'); b.type = 'button'; b.className = 'totop on is-down';
    b.innerHTML = '<svg viewBox="0 0 18 18" aria-hidden="true" focusable="false"><path d="M9 15V3M3.5 8.5L9 3l5.5 5.5"/></svg>';
    document.body.appendChild(b);
    var down = true, ticking = false;
    function apply() {
      b.classList.toggle('is-down', down); b.classList.toggle('is-up', !down);
      b.setAttribute('aria-label', down ? 'Go to bottom' : 'Back to top');
    }
    var bar = $('.bar');
    function update() {
      ticking = false;
      if (bar) b.style.setProperty('--bar-b', bar.getBoundingClientRect().bottom + 'px');
      var max = document.documentElement.scrollHeight - window.innerHeight;
      if (max <= 0) { b.classList.remove('on'); return; }
      b.classList.add('on');
      var p = window.scrollY / max;
      if (down && p > 0.55) { down = false; apply(); } else if (!down && p < 0.45) { down = true; apply(); }
    }
    apply();
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    window.addEventListener('resize', update); update();
    b.addEventListener('click', function (e) {
      var toBottom = down;
      window.scrollTo({ top: toBottom ? document.documentElement.scrollHeight : 0, behavior: reduce ? 'auto' : 'smooth' });
      if (e.detail === 0 && !toBottom) { var m = $('.mark'); if (m) m.focus({ preventScroll: true }); }
    });
  })();

  /* figure lightbox: <dialog>, image at natural size on paper, arrows, Esc, focus trap */
  (function () {
    var links = $$('a[data-fig]');
    if (!links.length || !window.HTMLDialogElement) return;
    var dlg = document.createElement('dialog'); dlg.className = 'lb'; dlg.setAttribute('aria-label', 'Figure viewer');
    dlg.innerHTML = '<div class="plate lb-plate"></div><div class="lb-bar"><p class="lb-cap"><span class="lb-n"></span><span class="lb-t"></span></p>' +
      '<div class="lb-ctl"><span class="lb-pos"></span><button type="button" data-a="prev" aria-label="Previous figure">&larr;</button><button type="button" data-a="next" aria-label="Next figure">&rarr;</button><button type="button" data-a="close">Close</button></div></div>';
    document.body.appendChild(dlg);
    var plate = $('.lb-plate', dlg), img = new Image(), n = $('.lb-n', dlg), t = $('.lb-t', dlg), pos = $('.lb-pos', dlg), i = 0, opener = null;
    function show(k) {
      i = (k + links.length) % links.length; var a = links[i];
      plate.className = 'plate lb-plate ' + (a.getAttribute('data-cls') || '');
      img.src = a.getAttribute('href'); img.alt = a.getAttribute('data-cap') || ''; if (!img.parentNode) plate.appendChild(img);
      n.textContent = a.getAttribute('data-n'); t.textContent = a.getAttribute('data-cap');
      pos.textContent = ('0' + (i + 1)).slice(-2) + ' / ' + ('0' + links.length).slice(-2);
    }
    function open(k, from) { opener = from; show(k); if (!dlg.open) dlg.showModal(); doc.classList.add('lb-open'); $('[data-a="close"]', dlg).focus(); }
    links.forEach(function (a, k) {
      a.addEventListener('click', function (e) { if (e.metaKey || e.ctrlKey || e.shiftKey || e.button) return; e.preventDefault(); open(k, a); });
    });
    dlg.addEventListener('click', function (e) {
      var b = e.target.closest('button');
      if (b) { var act = b.getAttribute('data-a'); if (act === 'close') dlg.close(); else show(i + (act === 'next' ? 1 : -1)); }
      else if (e.target === dlg) dlg.close();
    });
    dlg.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); show(i + 1); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); show(i - 1); }
      else if (e.key === 'Tab') {
        var f = $$('button', dlg), first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
    dlg.addEventListener('close', function () { doc.classList.remove('lb-open'); if (opener) opener.focus(); });
  })();
})();
