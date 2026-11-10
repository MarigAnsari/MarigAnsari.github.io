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
        if (t === current()) return;
        function apply() { doc.setAttribute('data-theme', t); sync(); }
        try { localStorage.setItem('theme', t); } catch (e) {}
        if (document.startViewTransition) document.startViewTransition(apply);
        else { doc.classList.add('tx'); apply(); setTimeout(function () { doc.classList.remove('tx'); }, 350); }
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

  /* one-time reveals: headings, cards, rows. Under reduced motion the CSS drops the movement and keeps a 200ms fade. */
  (function () {
    if (!('IntersectionObserver' in window)) return;
    $$('.zhead').forEach(function (h) { h.classList.add('rv', 'zh'); });
    var items = $$('.rv'); if (!items.length) return;
    doc.classList.add('rv-on');
    var io = new IntersectionObserver(function (entries) {
      var batch = entries.filter(function (e) { return e.isIntersecting; });
      batch.forEach(function (e, i) {
        var el = e.target; io.unobserve(el);
        var d = Math.min(i, 8) * 50;
        el.style.setProperty('--d', d + 'ms');
        el.classList.add('in');
        setTimeout(function () { el.classList.remove('rv', 'in'); el.style.removeProperty('--d'); }, 900 + d);
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
          if (t0 === null) t0 = now + 80; var p = Math.max(0, Math.min(1, (now - t0) / 900));
          el.textContent = String(Math.round(to * (1 - Math.pow(1 - p, 3))));
          if (p < 1) requestAnimationFrame(step);
        })(performance.now());
      });
    }
    var hero = $('.sheet'); if (!hero || !('IntersectionObserver' in window)) { run(); return; }
    var io = new IntersectionObserver(function (en) { if (en[0].isIntersecting) { io.disconnect(); run(); } }, { threshold: 0.15 }); io.observe(hero);
  })();

  /* hero Klann figure: plots itself once, then one gold dot circles the foot path (one lap every 7 s), paused when off screen or the tab is hidden */
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

  /* pointer glow (text and number boxes only, never over pictures): one passive listener, one rAF per frame. Boxes under the cursor get .lit and --mx/--my; CSS draws the glow (pointer-fine only).
     A card's stretched link sits over its image and meta box, so those are hit-tested by position. */
  (function () {
    if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    var SEL = '.tblock,.stat,.skgroup,.contact>li,.paper,.tb>div,.spec,.eq', ev, raf = 0, lit = [];
    function paint(clear) {
      raf = 0;
      var t = ev.target, els = [], el = t.closest && t.closest(SEL), card = t.closest && t.closest('.proj');
      for (; el; el = el.parentElement && el.parentElement.closest(SEL)) els.push(el);
      if (card) $$('.tblock', card).forEach(function (n) { if (els.indexOf(n) < 0) els.push(n); });
      var on = [];
      els.map(function (n) { return n.getBoundingClientRect(); }).forEach(function (r, i) {
        if (clear !== true && ev.clientX >= r.left && ev.clientX <= r.right && ev.clientY >= r.top && ev.clientY <= r.bottom) {
          els[i].style.setProperty('--mx', ev.clientX - r.left + 'px'); els[i].style.setProperty('--my', ev.clientY - r.top + 'px'); on.push(els[i]);
        }
      });
      lit.forEach(function (n) { if (on.indexOf(n) < 0) n.classList.remove('lit'); });
      on.forEach(function (n) { n.classList.add('lit'); });
      lit = on;
    }
    addEventListener('pointermove', function (e) { ev = e; if (!raf) raf = requestAnimationFrame(paint); }, { passive: true });
    doc.addEventListener('mouseleave', function () { if (ev) paint(true); });
  })();

  /* header nav: one rule slides to the hovered link, and rests on the current section's link */
  (function () {
    var nav = $('.bar nav'); if (!nav) return;
    var ink = document.createElement('i'), hov = null, shown = false;
    ink.className = 'nav-ink'; ink.setAttribute('aria-hidden', 'true'); nav.appendChild(ink); nav.classList.add('ink-on');
    function place() {
      var a = hov || $('a[aria-current]', nav);
      if (!a || !a.offsetWidth) { ink.style.opacity = 0; shown = false; return; }
      if (!shown) ink.style.transition = 'none';
      ink.style.transform = 'translateX(' + a.offsetLeft + 'px) scaleX(' + a.offsetWidth + ')'; ink.style.opacity = 1;
      if (!shown) { void ink.offsetWidth; ink.style.transition = ''; shown = true; }
    }
    function over(e) { hov = e.target.closest('a'); place(); }
    function out() { hov = null; place(); }
    nav.addEventListener('pointerover', over); nav.addEventListener('focusin', over);
    nav.addEventListener('pointerleave', out); nav.addEventListener('focusout', out);
    if (window.MutationObserver) new MutationObserver(place).observe(nav, { attributes: true, subtree: true, attributeFilter: ['aria-current'] });
    window.addEventListener('resize', place); if (document.fonts) document.fonts.ready.then(place); place();
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
    var sub = document.body.classList.contains('sub');
    var b = document.createElement('button'); b.type = 'button'; b.className = sub ? 'totop is-up' : 'totop on is-down';
    b.innerHTML = '<svg viewBox="0 0 18 18" aria-hidden="true" focusable="false"><path d="M9 15V3M3.5 8.5L9 3l5.5 5.5"/></svg>';
    document.body.appendChild(b);
    if (sub) {
      /* project pages: Back to top only, shown after about 40 percent of the page */
      b.setAttribute('aria-label', 'Back to top');
      var tk = false;
      var upd = function () {
        tk = false;
        var mx = document.documentElement.scrollHeight - window.innerHeight, on = mx > 0 && window.scrollY / mx > 0.4;
        b.classList.toggle('on', on);
      };
      window.addEventListener('scroll', function () { if (!tk) { tk = true; requestAnimationFrame(upd); } }, { passive: true });
      window.addEventListener('resize', upd); upd();
      b.addEventListener('click', function (e) {
        window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
        if (e.detail === 0) { var m = $('.mark'); if (m) m.focus({ preventScroll: true }); }
      });
      return;
    }
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

  /* project pages, On this page: the same scroll-spy as the section rail. The section whose heading has reached the anchor landing line (scroll-padding-top) is current
     (the last one once the page is at its end); the phone strip scrolls sideways to keep the current link in view. Jumps are plain anchors. */
  (function () {
    var links = $$('[data-toc]'); if (!links.length) return;
    var secs = []; links.forEach(function (a) { var id = a.getAttribute('href').slice(1); if (secs.indexOf(id) < 0) secs.push(id); });
    var els = secs.map(function (id) { return document.getElementById(id); }), cur = null, ticking = false;
    function mark(id) {
      links.forEach(function (a) {
        var on = a.getAttribute('href') === '#' + id;
        if (on) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
        var ul = on && a.closest('.pstrip ul');
        if (ul && ul.offsetParent) ul.scrollTo({ left: a.offsetLeft - (ul.clientWidth - a.offsetWidth) / 2, behavior: reduce ? 'auto' : 'smooth' });
      });
    }
    function update() {
      ticking = false;
      var y = (parseFloat(getComputedStyle(doc).scrollPaddingTop) || 120) + 16, id = null;   // just under where an anchor jump lands a heading
      els.forEach(function (el, i) { if (el && el.getBoundingClientRect().top <= y) id = secs[i]; });
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) id = secs[secs.length - 1];
      if (id !== cur) { cur = id; mark(id); }
    }
    function req() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }
    window.addEventListener('scroll', req, { passive: true }); window.addEventListener('resize', req); update();
  })();

  /* figure lightbox: <dialog>, image at natural size on paper, arrows, Esc, focus trap */
  (function () {
    var all = $$('a[data-fig]'), links = all;
    if (!all.length || !window.HTMLDialogElement) return;
    function visible() { return all.filter(function (a) { return a.offsetParent !== null; }); }   // phones show a second copy of the hero figure; only the visible ones are in the viewer
    var dlg = document.createElement('dialog'); dlg.className = 'lb'; dlg.setAttribute('aria-label', 'Figure viewer');
    dlg.innerHTML = '<div class="plate lb-plate"></div><div class="lb-bar"><p class="lb-cap"><span class="lb-n"></span><span class="lb-t"></span></p>' +
      '<div class="lb-ctl"><span class="lb-pos"></span><button type="button" data-a="prev" aria-label="Previous figure">&larr;</button><button type="button" data-a="next" aria-label="Next figure">&rarr;</button><button type="button" data-a="close">Close</button></div></div>';
    document.body.appendChild(dlg);
    var plate = $('.lb-plate', dlg), img = new Image(), n = $('.lb-n', dlg), t = $('.lb-t', dlg), pos = $('.lb-pos', dlg), i = 0, opener = null;
    function show(k) {
      i = (k + links.length) % links.length; var a = links[i];
      plate.className = 'plate lb-plate ' + (a.getAttribute('data-cls') || '');
      img.src = a.getAttribute('href'); img.alt = a.getAttribute('data-cap') || ''; if (!img.parentNode) plate.appendChild(img);
      n.textContent = a.getAttribute('data-n'); t.textContent = (a.getAttribute('data-cap') || '').replace(/([A-Za-z0-9])-(?=[A-Za-z0-9])/g, '$1‑');   // no break at a hyphen inside a word
      pos.textContent = ('0' + (i + 1)).slice(-2) + ' / ' + ('0' + links.length).slice(-2);
    }
    function open(k, from) { opener = from; links = visible(); show(k); if (!dlg.open) dlg.showModal(); doc.classList.add('lb-open'); $('[data-a="close"]', dlg).focus(); }
    all.forEach(function (a) {
      a.addEventListener('click', function (e) { if (e.metaKey || e.ctrlKey || e.shiftKey || e.button) return; e.preventDefault(); open(visible().indexOf(a), a); });
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
