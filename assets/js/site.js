(function () {
  /* Texts and data for this language, written into the page by build.mjs */
  var DATA = JSON.parse(document.getElementById('page-data').textContent);
  var T = DATA.js;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var money = new Intl.NumberFormat(T.numberLocale);
  function cop(n) { return T.copFormat.replace('{n}', money.format(n)); }
  function waUrl(text) { return 'https://wa.me/' + DATA.whatsapp + '?text=' + encodeURIComponent(text); }
  function cap1(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

  /* ---------- Language: remember the visitor's choice ---------- */
  function storeLang(lang) { try { localStorage.setItem('lang', lang); } catch (e) {} }
  document.querySelectorAll('a[data-lang]').forEach(function (a) {
    a.addEventListener('click', function () {
      storeLang(a.getAttribute('data-lang'));
      /* keep the visitor in the same section after switching */
      if (location.hash) a.href = a.href.split('#')[0] + location.hash;
    });
  });
  (function () {
    var saved = null;
    try { saved = localStorage.getItem('lang'); } catch (e) {}
    var cameFromSite = document.referrer && document.referrer.indexOf(location.origin) === 0;
    if (saved && saved !== DATA.lang && !cameFromSite) {
      var target = document.querySelector('.lang a[data-lang="' + saved + '"]');
      if (target) location.replace(target.href + location.hash);
    }
  })();

  /* Split the wordmarks into letters for the letter-by-letter entrance */
  document.querySelectorAll('.split-letters').forEach(function (el) {
    var t = el.textContent;
    el.textContent = '';
    t.split('').forEach(function (c, i) {
      var s = document.createElement('span');
      s.className = 'ch';
      s.style.setProperty('--c', i);
      s.textContent = c;
      el.appendChild(s);
    });
  });
  var footMark = document.querySelector('.foot .wordmark');
  footMark.classList.add('rv');
  footMark.style.opacity = '1';

  /* Zigzag paper edges, cut like a row of teeth */
  function zig(el) {
    var mode = el.getAttribute('data-zig');
    var n = Math.max(10, Math.round(el.offsetWidth / 26));
    var d = 9, pts = [], i, x;
    if (mode === 'both') {
      for (i = 0; i <= n; i++) { x = (i / n) * 100; pts.push(x.toFixed(3) + '% ' + (i % 2 ? d : 0) + 'px'); }
    } else {
      pts.push('0% 0px', '100% 0px');
    }
    for (i = n; i >= 0; i--) { x = (i / n) * 100; pts.push(x.toFixed(3) + '% calc(100% - ' + (i % 2 ? d : 0) + 'px)'); }
    el.style.clipPath = 'polygon(' + pts.join(',') + ')';
  }
  var zigs = document.querySelectorAll('.zig');
  function allZig() { zigs.forEach(zig); }
  allZig();
  window.addEventListener('resize', allZig);

  /* Prices count up once when their group arrives */
  function countUp(group) {
    group.querySelectorAll('b[data-n]').forEach(function (b, k) {
      var end = +b.getAttribute('data-n');
      var start = performance.now() + k * 90;
      var dur = 900;
      function tick(now) {
        var p = Math.min(1, Math.max(0, (now - start) / dur));
        var e = 1 - Math.pow(1 - p, 3);
        b.textContent = money.format(Math.round(end * e / 1000) * 1000);
        if (p < 1) requestAnimationFrame(tick); else b.textContent = money.format(end);
      }
      requestAnimationFrame(tick);
    });
  }

  /* Section entrances */
  var rvs = document.querySelectorAll('.rv');
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('in');
        if (e.target.classList.contains('pgroup')) countUp(e.target);
        io.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    rvs.forEach(function (el) { io.observe(el); });
  } else {
    rvs.forEach(function (el) { el.classList.add('in'); });
  }

  /* The stage: the fixed picture slides to the one for each section */
  var imgs = document.querySelectorAll('.stage-frame img');
  var cap = document.querySelector('.stage-caption');
  var current = 'sonrisa';
  var leaveTimer;
  function show(name) {
    if (name === current) return;
    var prev = current;
    current = name;
    clearTimeout(leaveTimer);
    imgs.forEach(function (im) {
      var p = im.getAttribute('data-photo');
      im.classList.remove('is-leaving');
      if (p === prev) { im.classList.remove('is-on'); im.classList.add('is-leaving'); }
      if (p === name) { im.classList.add('is-on'); }
    });
    leaveTimer = setTimeout(function () {
      imgs.forEach(function (im) { im.classList.remove('is-leaving'); });
    }, 1150);
    cap.classList.add('is-swapping');
    setTimeout(function () { cap.textContent = T.captions[name]; cap.classList.remove('is-swapping'); }, 240);
  }
  /* pick the section that crosses the middle of the screen, on every scroll */
  var photoSections = document.querySelectorAll('.col [data-photo]');
  function pickPhoto() {
    var mid = window.innerHeight / 2, name = null;
    photoSections.forEach(function (sec) {
      var r = sec.getBoundingClientRect();
      if (r.top <= mid && r.bottom > mid) name = sec.getAttribute('data-photo');
    });
    if (name) show(name);
  }
  window.addEventListener('scroll', pickPhoto, { passive: true });
  window.addEventListener('resize', pickPhoto);
  pickPhoto();

  /* Phone menu */
  var bar = document.getElementById('bar');
  var toggle = bar.querySelector('.menu-toggle');
  var links = document.getElementById('nav-links');
  function setMenu(open) {
    bar.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    toggle.textContent = open ? T.menu.close : T.menu.open;
  }
  toggle.addEventListener('click', function () { setMenu(!bar.classList.contains('is-open')); });
  links.addEventListener('click', function (e) { if (e.target.tagName === 'A') setMenu(false); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && bar.classList.contains('is-open')) { setMenu(false); toggle.focus(); } });

  /* Scroll-linked motion for the photographs and the wordmark (works in every browser) */
  if (!reduce) {
    var drift = document.querySelector('.stage-drift');
    var stage = document.querySelector('.stage');
    var heroMark = document.querySelector('.hero .wordmark-inner');
    var parallax = document.querySelectorAll('.prices-side img, .smile-photo-main img, .impl-photo img');
    var footImg = document.querySelector('.foot-photo');
    var ticking = false;
    var target = { y: 0, s: 1.04 }, now = { y: 0, s: 1.065 }, easing = false;
    var ease = function () {
      now.y += (target.y - now.y) * 0.12;
      now.s += (target.s - now.s) * 0.12;
      drift.style.transform = 'translateY(' + now.y.toFixed(3) + '%) scale(' + now.s.toFixed(4) + ')';
      if (Math.abs(target.y - now.y) > 0.01 || Math.abs(target.s - now.s) > 0.0005) {
        if (!easing) { easing = true; requestAnimationFrame(function () { easing = false; ease(); }); }
      }
    };
    var clamp = function (v) { return v < 0 ? 0 : v > 1 ? 1 : v; };
    var progress = function (el) {
      var r = el.getBoundingClientRect(), vh = window.innerHeight;
      return clamp((vh - r.top) / (vh + r.height));
    };
    var frame = function () {
      ticking = false;
      var vh = window.innerHeight, y = window.scrollY;
      if (getComputedStyle(stage).position === 'sticky') {
        /* continuous with the scroll, so it never jumps when the section changes */
        target.y = Math.sin(y / 520) * 3;
        target.s = 1.04 + Math.cos(y / 760) * 0.025;
        ease();
      } else {
        var m = clamp(y / vh);
        drift.style.transform = 'translateY(' + (m * 8).toFixed(2) + '%) scale(' + (1 + m * 0.12).toFixed(3) + ')';
      }
      if (heroMark) {
        var h = clamp(y / vh);
        heroMark.style.display = 'inline-block';
        heroMark.style.transformOrigin = '0 100%';
        heroMark.style.transform = 'translateX(' + (h * -3).toFixed(2) + '%) scale(' + (1 - h * 0.1).toFixed(3) + ')';
      }
      parallax.forEach(function (img) {
        var pr = progress(img.parentNode);
        img.style.transform = 'translateY(' + ((0.5 - pr) * 12).toFixed(2) + '%) scale(1.16)';
      });
      if (footImg) {
        var fr = progress(footImg.parentNode);
        footImg.style.transform = 'scale(' + (1.25 - Math.min(1, fr * 2) * 0.25).toFixed(3) + ')';
      }
    };
    var onScroll = function () { if (!ticking) { ticking = true; requestAnimationFrame(frame); } };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    frame();
  }

  /* ---------- The mouth map: two arches, as seen in a mirror ---------- */
  var NS = 'http://www.w3.org/2000/svg';
  /* width along the arch, depth across it */
  var size = { 1: [26, 21], 2: [21, 20], 3: [23, 24], 4: [24, 25], 5: [24, 25], 6: [34, 33], 7: [32, 32], 8: [29, 29] };
  function kind(p) { return p <= 2 ? 'incisor' : p === 3 ? 'canine' : p <= 5 ? 'premolar' : 'molar'; }
  function toothLabel(q, p) { return T.tooth.label.replace('{name}', T.tooth.names[p]).replace('{zone}', T.tooth.zones[q]); }

  var CX = 200, A = 150, B = 196, GAP = 3.2;
  var UPPER_CY = 250, LOWER_CY = 290;

  /* sample the quarter ellipse to place teeth by arc length */
  function arcTable() {
    var tbl = [{ t: 0, s: 0 }], s = 0, prev = [0, -B], steps = 600;
    for (var i = 1; i <= steps; i++) {
      var t = (i / steps) * (Math.PI * 0.62);
      var pt = [A * Math.sin(t), -B * Math.cos(t)];
      s += Math.hypot(pt[0] - prev[0], pt[1] - prev[1]);
      tbl.push({ t: t, s: s });
      prev = pt;
    }
    return tbl;
  }
  var table = arcTable();
  function tAt(s) {
    for (var i = 1; i < table.length; i++) {
      if (table[i].s >= s) {
        var a = table[i - 1], b = table[i];
        return a.t + (b.t - a.t) * ((s - a.s) / (b.s - a.s));
      }
    }
    return table[table.length - 1].t;
  }
  var tPos = {}, run = GAP / 2;
  for (var p = 1; p <= 8; p++) {
    run += size[p][0] / 2;
    tPos[p] = tAt(run);
    run += size[p][0] / 2 + GAP;
  }
  var gumEnd = tAt(run + 4);

  function gumPath(upper, side) {
    var pts = [], i, t, x, y;
    for (i = 0; i <= 40; i++) {
      t = (i / 40) * gumEnd;
      x = CX + side * A * Math.sin(t);
      y = upper ? UPPER_CY - B * Math.cos(t) : LOWER_CY + B * Math.cos(t);
      pts.push((i ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1));
    }
    return pts.join(' ');
  }
  var gums = document.getElementById('gums');
  [[true, 1], [true, -1], [false, 1], [false, -1]].forEach(function (g) {
    var path = document.createElementNS(NS, 'path');
    path.setAttribute('class', 'gum');
    path.setAttribute('d', gumPath(g[0], g[1]));
    gums.appendChild(path);
  });

  var teethG = document.getElementById('teeth');
  /* mirror view: the patient's right side is on the right of the screen */
  [1, 2, 3, 4].forEach(function (q) {
    var upper = q === 1 || q === 2;
    var side = (q === 1 || q === 4) ? 1 : -1;
    for (var p = 1; p <= 8; p++) {
      var t = tPos[p];
      var x = CX + side * A * Math.sin(t);
      var y = upper ? UPPER_CY - B * Math.cos(t) : LOWER_CY + B * Math.cos(t);
      var dx = side * A * Math.cos(t);
      var dy = (upper ? 1 : -1) * B * Math.sin(t);
      var ang = Math.atan2(dy, dx) * 180 / Math.PI;
      if (side < 0) ang += 180;
      var w = size[p][0], h = size[p][1];
      var g = document.createElementNS(NS, 'g');
      g.setAttribute('class', 'tooth');
      g.setAttribute('transform', 'translate(' + x.toFixed(1) + ' ' + y.toFixed(1) + ') rotate(' + ang.toFixed(1) + ')');
      g.setAttribute('role', 'button');
      g.setAttribute('tabindex', '0');
      g.setAttribute('aria-pressed', 'false');
      g.setAttribute('aria-label', toothLabel(q, p));
      g.dataset.q = q; g.dataset.p = p;
      g.style.setProperty('--k', (p - 1) * 2 + (upper ? 0 : 1));
      var r = document.createElementNS(NS, 'rect');
      r.setAttribute('x', -w / 2); r.setAttribute('y', -h / 2);
      r.setAttribute('width', w); r.setAttribute('height', h);
      var rr = kind(p) === 'molar' ? 9 : kind(p) === 'incisor' ? 6 : 10;
      r.setAttribute('rx', rr); r.setAttribute('ry', rr);
      g.appendChild(r);
      teethG.appendChild(g);
    }
  });

  /* which text and which price go with a tooth and a symptom */
  function plan(p, s) {
    var k = kind(p);
    var front = k === 'incisor' || k === 'canine';
    switch (s) {
      case 'frio': return ['frio', 'resina'];
      case 'morder': return p === 8 ? ['morderCordal', 'cordal'] : ['morder', k === 'molar' ? 'endoMolar' : 'endoUni'];
      case 'roto': return front ? ['rotoFront', 'resinaEstetica'] : ['rotoBack', 'incrustacion'];
      case 'falta': return p === 8 ? ['faltaCordal', 'revisionCordal'] : ['falta', 'implante'];
      case 'estetica': return front ? ['esteticaFront', 'blanqueamiento'] : ['esteticaBack', 'resina'];
      default: return ['revision', 'valoracion'];
    }
  }

  var state = { q: 1, p: 6, s: 'frio' };
  var result = document.getElementById('result');
  function render(animate) {
    document.querySelectorAll('.tooth').forEach(function (t) {
      t.setAttribute('aria-pressed', (+t.dataset.q === state.q && +t.dataset.p === state.p) ? 'true' : 'false');
    });
    var keys = plan(state.p, state.s);
    var r = T.plans[keys[0]];
    var where = toothLabel(state.q, state.p);
    document.getElementById('r-tooth').textContent = cap1(where);
    document.getElementById('r-what').textContent = r.what;
    document.getElementById('r-time').textContent = r.time;
    document.getElementById('r-price').textContent = cop(DATA.cop[keys[1]]);
    document.getElementById('r-note').textContent = r.note + ' ' + T.disclaimer;
    document.getElementById('r-cta').href = waUrl(T.waMap.replace('{zone}', where).replace('{symptom}', cap1(T.symptoms[state.s])));
    if (animate && !reduce) {
      result.classList.remove('is-updating');
      void result.offsetWidth;
      result.classList.add('is-updating');
    }
  }
  function pick(t) {
    state.q = +t.dataset.q; state.p = +t.dataset.p;
    render(true);
  }
  teethG.addEventListener('click', function (e) {
    var t = e.target.closest('.tooth');
    if (t) pick(t);
  });
  teethG.addEventListener('keydown', function (e) {
    var t = e.target.closest('.tooth');
    if (t && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); pick(t); }
  });
  document.querySelectorAll('input[name="sintoma"]').forEach(function (r) {
    r.addEventListener('change', function () { state.s = r.value; render(true); });
  });
  render(false);

  /* ---------- Assessment request: validated here, sent through WhatsApp ---------- */
  var form = document.getElementById('book-form');
  var done = document.getElementById('form-done');
  var submit = document.getElementById('f-submit');
  var interest = document.getElementById('f-interest');

  /* buttons elsewhere on the page preselect what the visitor is interested in */
  document.querySelectorAll('[data-interest]').forEach(function (a) {
    a.addEventListener('click', function () { interest.value = a.getAttribute('data-interest'); });
  });

  function setError(field, message) {
    var input = form.elements[field];
    var out = document.getElementById('e-' + field);
    if (out) out.textContent = message || '';
    if (input && input.setAttribute) {
      if (message) input.setAttribute('aria-invalid', 'true'); else input.removeAttribute('aria-invalid');
    }
    var wrap = input && input.closest ? input.closest('.field') : null;
    if (wrap) wrap.classList.toggle('has-error', !!message);
  }
  function validContact(v) {
    if (v.indexOf('@') !== -1) return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
    return /^[+\d\s().-]+$/.test(v) && v.replace(/\D/g, '').length >= 7;
  }
  function validate() {
    var f = form.elements, errs = [];
    var name = f.name.value.trim(), contact = f.contact.value.trim(), country = f.country.value.trim();
    setError('name', name ? '' : T.form.errName); if (!name) errs.push('name');
    var cErr = !contact ? T.form.errContact : (validContact(contact) ? '' : T.form.errContactFormat);
    setError('contact', cErr); if (cErr) errs.push('contact');
    setError('country', country ? '' : T.form.errCountry); if (!country) errs.push('country');
    setError('consent', f.consent.checked ? '' : T.form.errConsent); if (!f.consent.checked) errs.push('consent');
    return errs;
  }
  ['name', 'contact', 'country'].forEach(function (n) {
    form.elements[n].addEventListener('input', function () { if (form.elements[n].getAttribute('aria-invalid')) validate(); });
  });
  form.elements.consent.addEventListener('change', function () { if (form.elements.consent.checked) setError('consent', ''); });

  function message() {
    var f = form.elements;
    var lines = [T.form.waIntro, ''];
    var add = function (label, v) { v = (v || '').trim(); if (v) lines.push(label + ': ' + v); };
    add(T.form.fName, f.name.value);
    add(T.form.fContact, f.contact.value);
    add(T.form.fCountry, f.country.value);
    add(T.form.fInterest, interest.options[interest.selectedIndex].text);
    add(T.form.fLanguage, f.language.value === 'en' ? 'English' : 'Español');
    add(T.form.fDates, f.dates.value);
    add(T.form.fMessage, f.message.value);
    return lines.join('\n');
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var errs = validate();
    if (errs.length) {
      var first = form.elements[errs[0]];
      if (first && first.focus) first.focus();
      return;
    }
    var url = waUrl(message());
    document.getElementById('form-wa').href = url;
    submit.disabled = true;
    submit.classList.add('is-busy');
    submit.querySelector('.btn-label').textContent = T.form.preparing;
    /* open inside the click so the browser allows the new tab */
    window.open(url, '_blank', 'noopener');
    setTimeout(function () {
      submit.disabled = false;
      submit.classList.remove('is-busy');
      submit.querySelector('.btn-label').textContent = submit.getAttribute('data-label');
      form.classList.add('is-done');
      done.hidden = false;
      done.focus();
    }, 450);
  });
  submit.setAttribute('data-label', submit.querySelector('.btn-label').textContent);
  document.getElementById('form-again').addEventListener('click', function () {
    form.classList.remove('is-done');
    done.hidden = true;
    form.elements.name.focus();
  });
})();
