/* Jojo App - quiz logic. No build step, no backend. */
(function () {
  'use strict';

  const $ = sel => document.querySelector(sel);
  const STORAGE_KEY = 'jojoApp.v1';
  const MODEL_VIEWER_SRC = 'https://ajax.googleapis.com/ajax/libs/model-viewer/3.5.0/model-viewer.min.js';

  /* ---------- settings (persisted) ---------- */
  const defaults = {
    count: 'all',
    display: '3d',
    notation: 'universal',
    orientation: 'uniform',
    groups: ['incisors', 'canines', 'premolars', 'molars'],
    arches: ['upper', 'lower'],
  };
  let settings = { ...defaults };
  let best = {};

  function load() {
    try {
      const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      if (raw.settings) settings = { ...defaults, ...raw.settings };
      if (raw.best) best = raw.best;
    } catch (e) { /* ignore */ }
  }
  function save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ settings, best })); } catch (e) { /* ignore */ }
  }

  /* ---------- helpers ---------- */
  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];

  function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.toggle('active', s.id === id));
    window.scrollTo({ top: 0 });
  }

  function formatTime(ms) {
    const s = Math.round(ms / 1000);
    return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, '0')}s`;
  }

  /* ---------- tooth rendering (SVG, image or 3D model) ---------- */
  function assetFor(tooth) {
    const a = window.TOOTH_ASSETS && window.TOOTH_ASSETS[tooth.fdi];
    if (!a || a.missing) return null;
    return (a.sketchfab || a.src) ? a : null;
  }

  /* Sketchfab embed. Every UI element, the title and the annotations are requested hidden
     (honoured only for some owner plans, so the card also clips the edges). The viewer is
     driven through Sketchfab's Viewer API so we know when the model is actually ready:
     until then an opaque, orientation-neutral cover hides the loading screen, whose text
     would otherwise reveal that the view is mirrored or flipped. */
  const SKETCHFAB_API_SRC = 'https://static.sketchfab.com/api/sketchfab-viewer-1.12.1.js';
  const SKETCHFAB_OPTS = {
    autostart: 1, preload: 1, camera: 0, transparent: 1, ui_theme: 'dark', dnt: 1,
    ui_infos: 0, ui_controls: 0, ui_stop: 0, ui_watermark: 0, ui_watermark_link: 0,
    ui_hint: 0, ui_help: 0, ui_settings: 0, ui_inspector: 0, ui_ar: 0, ui_vr: 0,
    ui_fullscreen: 0, ui_annotations: 0, annotations_visible: 0, ui_animations: 0,
  };
  const SKETCHFAB_PARAMS = Object.entries(SKETCHFAB_OPTS).map(([k, v]) => `${k}=${v}`).join('&');
  function sketchfabUrl(uid) { return `https://sketchfab.com/models/${uid}/embed?${SKETCHFAB_PARAMS}`; }

  let sketchfabApiLoading = null;
  function ensureSketchfabApi() {
    if (window.Sketchfab) return Promise.resolve();
    if (!sketchfabApiLoading) {
      sketchfabApiLoading = new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = SKETCHFAB_API_SRC;
        s.onload = resolve; s.onerror = reject;
        document.head.appendChild(s);
      });
    }
    return sketchfabApiLoading;
  }

  /* Check once which manifest files actually exist, so a missing file silently
     falls back to the built-in drawing instead of flashing an error. */
  function verifyAssets() {
    const assets = window.TOOTH_ASSETS || {};
    const bySrc = {};
    for (const key of Object.keys(assets)) {
      const a = assets[key];
      if (!a || !a.src) continue; // sketchfab entries need no file check
      (bySrc[a.src] = bySrc[a.src] || []).push(a);
    }
    if (location.protocol === 'file:') return Promise.resolve(); // HEAD requests are blocked on file://
    return Promise.all(Object.keys(bySrc).map(src =>
      fetch(src, { method: 'HEAD' })
        .then(r => { if (!r.ok) bySrc[src].forEach(a => { a.missing = true; }); })
        .catch(() => { bySrc[src].forEach(a => { a.missing = true; }); })
    ));
  }

  let modelViewerLoading = null;
  function ensureModelViewer() {
    if (customElements.get('model-viewer')) return Promise.resolve();
    if (!modelViewerLoading) {
      modelViewerLoading = new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.type = 'module'; s.src = MODEL_VIEWER_SRC;
        s.onload = resolve; s.onerror = reject;
        document.head.appendChild(s);
      });
    }
    return modelViewerLoading;
  }

  /* Decide how the tooth is displayed.
     mirror: left-side teeth are the mirror image of right-side teeth.
     flip:   crown-down display. */
  function displayTransform(tooth, orientation) {
    let flip = false;
    if (orientation === 'anatomical') flip = tooth.arch === 'upper';
    else if (orientation === 'random') flip = Math.random() < 0.5;
    return { flip };
  }

  /* Renders a tooth into `container`. mode: 'svg' forces the drawing, '3d' uses the
     manifest asset when there is one. Falls back to the drawing on any asset error. */
  function renderTooth(container, tooth, { flip = false, interactive = false, mode = 'svg' } = {}) {
    container.innerHTML = '';
    container.classList.remove('mirror', 'flip', 'card');
    const asset = mode === '3d' ? assetFor(tooth) : null;

    const renderSVG = () => {
      container.classList.remove('mirror', 'flip', 'card');
      container.innerHTML = renderToothSVG(tooth, { mirror: tooth.side === 'left', flip });
    };

    if (!asset) { renderSVG(); return; }

    // "crownUp:false" means the asset is natively crown-down, so invert the decision.
    const nativeCrownUp = asset.crownUp !== false;
    const fileFlip = nativeCrownUp ? flip : !flip;
    const isModel = !!asset.src && /\.(glb|gltf)(\?|$)/i.test(asset.src);
    if (asset.mirror) container.classList.add('mirror');
    if (fileFlip && !isModel) container.classList.add('flip'); // models are rolled in 3D instead

    if (asset.sketchfab) {
      container.classList.add('card');
      const f = document.createElement('iframe');
      f.title = '3D tooth model';
      f.setAttribute('allow', 'autoplay; fullscreen; xr-spatial-tracking');
      f.referrerPolicy = 'no-referrer';
      if (!interactive) f.style.pointerEvents = 'none';
      const cover = document.createElement('div');
      cover.className = 'loading-cover';
      cover.innerHTML = '<span class="spinner"></span>';
      container.append(f, cover);

      let done = false;
      const reveal = () => { if (done) return; done = true; cover.remove(); };
      const fail = () => { if (done) return; done = true; renderSVG(); };
      const plainEmbed = () => {
        // no Viewer API: fall back to a plain embed and reveal a while after the frame loads
        f.addEventListener('load', () => setTimeout(reveal, 4000));
        f.src = sketchfabUrl(asset.sketchfab);
      };
      const giveUp = setTimeout(fail, 30000);

      ensureSketchfabApi().then(() => {
        if (!f.isConnected) return;
        new window.Sketchfab(f).init(asset.sketchfab, {
          ...SKETCHFAB_OPTS,
          success(api) {
            api.addEventListener('viewerready', () => { clearTimeout(giveUp); reveal(); });
            api.start();
          },
          error() { clearTimeout(giveUp); fail(); },
        });
      }).catch(() => { if (f.isConnected) plainEmbed(); });
      return;
    }

    if (isModel) {
      // keep the container empty (no drawing) while loading so nothing hints at the answer
      ensureModelViewer().then(() => {
        if (!container.isConnected) return;
        const mv = document.createElement('model-viewer');
        mv.setAttribute('src', asset.src);
        mv.setAttribute('alt', '3D tooth model');
        mv.setAttribute('loading', 'eager');
        mv.setAttribute('environment-image', 'neutral');
        mv.setAttribute('exposure', '0.9');
        mv.setAttribute('shadow-intensity', '0');
        mv.setAttribute('interaction-prompt', 'none');
        mv.setAttribute('touch-action', 'pan-y');
        if (fileFlip) mv.setAttribute('orientation', '180deg 0deg 0deg'); // roll about the view axis
        if (interactive) mv.setAttribute('camera-controls', '');
        mv.addEventListener('error', renderSVG);
        container.innerHTML = '';
        container.appendChild(mv);
      }).catch(renderSVG);
      return;
    }

    const img = new Image();
    img.alt = 'Tooth';
    img.draggable = false;
    img.onerror = renderSVG;
    img.src = asset.src;
    container.appendChild(img);
  }

  /* Two display slots in the quiz stage: while one shows the current tooth, the other
     already loads the next one (an iframe reloads if moved in the DOM, so we swap
     visibility instead of moving elements). */
  const slots = [];
  let activeSlot = 0;
  let preloaded = null; // { toothId, flip }
  function stageSlots() {
    if (!slots.length) slots.push($('#tooth-view'), $('#tooth-view-alt'));
    return slots;
  }
  function clearStage() {
    stageSlots().forEach(s => { s.innerHTML = ''; s.classList.remove('mirror', 'flip', 'card'); });
    preloaded = null;
    $('#tooth-credit').textContent = '';
  }
  function preloadNext() {
    const q = quiz;
    const next = q && q.sequence[q.index + 1];
    if (!next || settings.display !== '3d' || !assetFor(next)) { preloaded = null; return; }
    const { flip } = displayTransform(next, settings.orientation);
    const other = stageSlots()[1 - activeSlot];
    renderTooth(other, next, { flip, interactive: true, mode: '3d' });
    preloaded = { toothId: next.id, flip };
  }

  /* ---------- quiz state ---------- */
  let quiz = null;

  function selectedPool() {
    return TEETH.filter(t => settings.groups.includes(t.group) && settings.arches.includes(t.arch));
  }

  function buildSequence(pool, count) {
    const n = count === 'all' ? pool.length : Math.min(Number(count), Math.max(pool.length, 1));
    // If more questions than teeth are requested, repeat the pool in new shuffled passes.
    let seq = [];
    while (seq.length < n) {
      let pass = shuffle(pool);
      if (seq.length && pass[0] === seq[seq.length - 1] && pass.length > 1) pass.push(pass.shift());
      seq = seq.concat(pass);
    }
    return seq.slice(0, n);
  }

  /* Correct answer + up to 3 distractors that are deliberately similar. */
  function buildOptions(correct, pool) {
    const others = pool.filter(t => t !== correct);
    const chosen = [];
    const take = list => {
      const c = list.filter(t => !chosen.includes(t));
      if (c.length) chosen.push(pick(c));
    };
    // 1) same tooth type in another quadrant (mirror side or other arch)
    take(others.filter(t => t.pos === correct.pos));
    // 2) neighbouring tooth in the same arch (e.g. first vs second molar)
    take(others.filter(t => t.arch === correct.arch && Math.abs(t.pos - correct.pos) === 1));
    // 3) same group anywhere
    take(others.filter(t => t.group === correct.group));
    // fill with anything
    while (chosen.length < 3 && chosen.length < others.length) take(others);
    return shuffle([correct, ...chosen]);
  }

  function startQuiz(pool, count) {
    const sequence = buildSequence(pool, count);
    quiz = {
      pool, sequence, index: 0, score: 0, answered: false,
      mistakes: [], startedAt: Date.now(), poolKey: poolKey(pool),
    };
    clearStage();
    showScreen('screen-quiz');
    showQuestion();
  }

  function poolKey(pool) {
    return pool.length === TEETH.length ? 'all' : pool.map(t => t.fdi).join(',');
  }

  function showQuestion() {
    const q = quiz;
    q.answered = false;
    const tooth = q.sequence[q.index];
    let { flip } = displayTransform(tooth, settings.orientation);
    const S = stageSlots();
    if (preloaded && preloaded.toothId === tooth.id) {
      flip = preloaded.flip;               // already rendered in the other slot
      activeSlot = 1 - activeSlot;
    } else {
      renderTooth(S[activeSlot], tooth, { flip, interactive: true, mode: settings.display });
    }
    preloaded = null;
    q.currentFlip = flip;
    S.forEach((s, i) => s.classList.toggle('hidden-slot', i !== activeSlot));
    const view = S[activeSlot];
    view.style.animation = 'none'; void view.offsetWidth; view.style.animation = '';
    const asset = settings.display === '3d' ? assetFor(tooth) : null;
    $('#tooth-credit').textContent = asset && asset.credit ? asset.credit : '';
    preloadNext();

    const options = buildOptions(tooth, q.pool);
    const box = $('#options');
    box.innerHTML = '';
    options.forEach((t, i) => {
      const b = document.createElement('button');
      b.className = 'opt';
      b.dataset.id = t.id;
      b.innerHTML = `<span class="key">${i + 1}</span><span>${toothLabel(t, settings.notation)}</span>`;
      b.addEventListener('click', () => answer(t, b));
      box.appendChild(b);
    });

    $('#feedback').textContent = '';
    $('#feedback').className = 'feedback';
    $('#btn-next').classList.add('hidden');
    $('#progress-line').textContent = `${q.index + 1} / ${q.sequence.length}`;
    $('#score-line').textContent = `Score ${q.score}`;
    $('#progress-fill').style.width = `${(q.index / q.sequence.length) * 100}%`;
  }

  function answer(chosen, btn) {
    const q = quiz;
    if (q.answered) return;
    q.answered = true;
    const tooth = q.sequence[q.index];
    const correct = chosen === tooth;
    if (correct) q.score++;
    else q.mistakes.push({ tooth, chosen, flip: q.currentFlip });

    document.querySelectorAll('.opt').forEach(b => {
      b.disabled = true;
      const id = Number(b.dataset.id);
      if (id === tooth.id) b.classList.add('correct');
      else if (b === btn) b.classList.add('wrong');
      else b.classList.add('dim');
    });

    const fb = $('#feedback');
    fb.className = 'feedback ' + (correct ? 'good' : 'bad');
    fb.innerHTML = `<strong>${correct ? 'Correct.' : 'Not quite.'}</strong> ${toothFullName(tooth)}: ${tooth.note}`;

    $('#score-line').textContent = `Score ${q.score}`;
    $('#progress-fill').style.width = `${((q.index + 1) / q.sequence.length) * 100}%`;
    const next = $('#btn-next');
    next.textContent = q.index + 1 >= q.sequence.length ? 'See results' : 'Next';
    next.classList.remove('hidden');
    next.focus();
  }

  function nextQuestion() {
    const q = quiz;
    if (!q || !q.answered) return;
    q.index++;
    if (q.index >= q.sequence.length) finish();
    else showQuestion();
  }

  function finish() {
    const q = quiz;
    const total = q.sequence.length;
    const pct = Math.round((q.score / total) * 100);
    const elapsed = Date.now() - q.startedAt;
    clearStage();

    // best score per pool + question count
    const key = `${q.poolKey}|${total}`;
    const prev = best[key];
    const isBest = !prev || pct > prev.pct || (pct === prev.pct && elapsed < prev.ms);
    if (isBest) { best[key] = { pct, ms: elapsed }; save(); }

    showScreen('screen-results');
    $('#results-title').textContent =
      pct === 100 ? 'Perfect!' : pct >= 80 ? 'Great work' : pct >= 50 ? 'Not bad' : 'Keep practicing';
    $('#ring-sub').textContent = `${q.score} / ${total}`;
    $('#results-meta').textContent = `${formatTime(elapsed)}${isBest ? ' · New best for this setup' : prev ? ` · Best ${prev.pct}%` : ''}`;

    const ring = $('#ring-fg');
    const circumference = 2 * Math.PI * 52;
    ring.style.strokeDashoffset = circumference;
    ring.style.stroke = pct >= 80 ? 'var(--good)' : pct >= 50 ? 'var(--accent)' : 'var(--bad)';
    requestAnimationFrame(() => requestAnimationFrame(() => {
      ring.style.strokeDashoffset = circumference * (1 - pct / 100);
    }));
    // count up the percentage
    const pctEl = $('#ring-pct');
    const t0 = performance.now();
    (function tick(now) {
      const p = Math.min(1, (now - t0) / 900);
      pctEl.textContent = `${Math.round(pct * (1 - Math.pow(1 - p, 3)))}%`;
      if (p < 1) requestAnimationFrame(tick);
    })(t0);

    const box = $('#mistakes');
    box.innerHTML = '';
    if (q.mistakes.length) {
      const h = document.createElement('h3');
      h.textContent = `Missed (${q.mistakes.length})`;
      box.appendChild(h);
      for (const m of q.mistakes) {
        const row = document.createElement('div');
        row.className = 'mistake';
        const thumb = document.createElement('div');
        thumb.className = 'thumb';
        renderTooth(thumb, m.tooth, { flip: m.flip });
        const lines = document.createElement('div');
        lines.className = 'lines';
        lines.innerHTML = `<div class="yes">${toothLabel(m.tooth, settings.notation)}</div>` +
          `<div class="no">You picked: ${toothLabel(m.chosen, settings.notation)}</div>`;
        row.append(thumb, lines);
        box.appendChild(row);
      }
    }
    $('#btn-retry').classList.toggle('hidden', q.mistakes.length < 2);
    updateBestLine();
  }

  /* ---------- start screen ---------- */
  function updateBestLine() {
    const pool = selectedPool();
    const total = settings.count === 'all' ? pool.length : Math.min(Number(settings.count), pool.length);
    const b = best[`${poolKey(pool)}|${total}`];
    $('#best-line').textContent = b ? `Best for this setup: ${b.pct}% in ${formatTime(b.ms)}` : '';
  }

  function syncSettingsUI() {
    document.querySelectorAll('.seg').forEach(seg => {
      const key = seg.dataset.setting;
      seg.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.value === String(settings[key])));
    });
    document.querySelectorAll('.chips').forEach(ch => {
      const key = ch.dataset.setting;
      ch.querySelectorAll('button').forEach(b => b.classList.toggle('on', settings[key].includes(b.dataset.value)));
    });
    updateBestLine();
  }

  function bindSettings() {
    document.querySelectorAll('.seg').forEach(seg => {
      seg.addEventListener('click', e => {
        const b = e.target.closest('button'); if (!b) return;
        settings[seg.dataset.setting] = b.dataset.value;
        save(); syncSettingsUI();
      });
    });
    document.querySelectorAll('.chips').forEach(ch => {
      ch.addEventListener('click', e => {
        const b = e.target.closest('button'); if (!b) return;
        const key = ch.dataset.setting, v = b.dataset.value;
        const list = settings[key].slice();
        const i = list.indexOf(v);
        if (i >= 0) list.splice(i, 1); else list.push(v);
        settings[key] = list;
        save(); syncSettingsUI();
        $('#start-warn').classList.toggle('hidden', selectedPool().length >= 2);
      });
    });
  }

  /* ---------- browse ---------- */
  function renderBrowse() {
    for (const arch of ['upper', 'lower']) {
      const grid = $(`#grid-${arch}`);
      grid.innerHTML = '';
      // show in mouth order: patient's right on the viewer's left
      const teeth = TEETH.filter(t => t.arch === arch).sort((a, b) => {
        const ax = a.side === 'right' ? -a.pos : a.pos, bx = b.side === 'right' ? -b.pos : b.pos;
        return ax - bx;
      });
      for (const t of teeth) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        const thumb = document.createElement('div');
        thumb.className = 'thumb';
        const { flip } = displayTransform(t, settings.orientation === 'random' ? 'uniform' : settings.orientation);
        renderTooth(thumb, t, { flip });
        const num = document.createElement('div');
        num.className = 'num';
        num.textContent = toothNumber(t, settings.notation);
        const name = document.createElement('div');
        name.className = 'name';
        name.textContent = `${t.side === 'left' ? 'L' : 'R'} ${t.typeName}`;
        cell.append(thumb, num, name);
        grid.appendChild(cell);
      }
    }
  }

  /* ---------- wiring ---------- */
  function init() {
    load();
    verifyAssets();
    syncSettingsUI();
    bindSettings();
    $('#hero-tooth').innerHTML = renderToothSVG(TOOTH_BY_ID[16], { mirror: false, flip: false });

    $('#btn-start').addEventListener('click', () => {
      const pool = selectedPool();
      if (pool.length < 2) { $('#start-warn').classList.remove('hidden'); return; }
      startQuiz(pool, settings.count);
    });
    $('#btn-browse').addEventListener('click', () => { renderBrowse(); showScreen('screen-browse'); });
    $('#btn-browse-back').addEventListener('click', () => showScreen('screen-start'));
    $('#btn-next').addEventListener('click', nextQuestion);
    $('#btn-quit').addEventListener('click', () => { quiz = null; clearStage(); showScreen('screen-start'); });
    $('#btn-again').addEventListener('click', () => startQuiz(selectedPool(), settings.count));
    $('#btn-retry').addEventListener('click', () => {
      const pool = [...new Set(quiz.mistakes.map(m => m.tooth))];
      // distractors still come from the full selected pool so options stay meaningful
      const full = selectedPool();
      const sequence = shuffle(pool);
      quiz = { pool: full, sequence, index: 0, score: 0, answered: false, mistakes: [], startedAt: Date.now(), poolKey: 'retry' };
      clearStage();
      showScreen('screen-quiz');
      showQuestion();
    });
    $('#btn-home').addEventListener('click', () => { updateBestLine(); showScreen('screen-start'); });

    document.addEventListener('keydown', e => {
      if (!$('#screen-quiz').classList.contains('active')) return;
      if (e.key >= '1' && e.key <= '4') {
        const b = document.querySelectorAll('.opt')[Number(e.key) - 1];
        if (b && !b.disabled) b.click();
      } else if (e.key === 'Enter' || e.key === ' ') {
        if (quiz && quiz.answered) { e.preventDefault(); nextQuestion(); }
      } else if (e.key === 'Escape') {
        quiz = null; clearStage(); showScreen('screen-start');
      }
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
