// Neon Coast Cover Studio — the editor.
// Wires the controls to the renderer: photo slots, layouts, grades,
// presets, per-panel crop and position, title lettering, undo/redo and
// exact-size PNG export. Photos never leave the machine: uploads are read
// with object URLs and samples are files shipped under app/.
import { drawCover } from './cover.js';
import { LAYOUTS, GRADES, PRESETS, EXPORT_SIZES, defaultState } from './presets.js';
import { runShot } from './shots.js';

const $ = (id) => document.getElementById(id);
const preview = $('preview');
const statusEl = $('status');
const state = defaultState();

/** The photo library: up to four images, by slot index. */
const photos = [null, null, null, null];
const SAMPLES = [
  { id: 'boulevard', label: 'Boulevard', file: 'samples/boulevard.jpg' },
  { id: 'pier', label: 'Pier', file: 'samples/pier.jpg' },
];

let undoStack = [];
let redoStack = [];
let drag = null;

/** Loads an image from a URL, resolving once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`could not load ${url}`));
    img.src = url;
  });
}

function say(message) {
  statusEl.textContent = message;
}

/** Sizes the preview canvas to the chosen export ratio and repaints. */
export function redraw() {
  const size = EXPORT_SIZES.find((s) => s.id === state.size) || EXPORT_SIZES[0];
  // In full-cover screenshot mode, paint at the real export resolution.
  const maxSide = document.body.classList.contains('shot-cover')
    ? Math.max(size.w, size.h) : 960;
  const scale = Math.min(maxSide / size.w, maxSide / size.h);
  preview.width = Math.round(size.w * scale);
  preview.height = Math.round(size.h * scale);
  drawCover(preview, state, photos);
  syncPanelControls();
}

/** Pushes the current state onto the undo stack before a change. */
export function pushHistory() {
  undoStack.push(JSON.stringify(state));
  if (undoStack.length > 60) undoStack.shift();
  redoStack = [];
  syncUndoButtons();
}

export function undo() {
  if (!undoStack.length) return;
  redoStack.push(JSON.stringify(state));
  Object.assign(state, JSON.parse(undoStack.pop()));
  syncAllControls();
  redraw();
  say('Undid the last change.');
}

export function redo() {
  if (!redoStack.length) return;
  undoStack.push(JSON.stringify(state));
  Object.assign(state, JSON.parse(redoStack.pop()));
  syncAllControls();
  redraw();
  say('Redid the change.');
}

function syncUndoButtons() {
  $('undo').disabled = undoStack.length === 0;
  $('redo').disabled = redoStack.length === 0;
}

/** Renders one exact-size PNG and returns its blob. */
export function exportPng(sizeId) {
  const size = EXPORT_SIZES.find((s) => s.id === sizeId) || EXPORT_SIZES[0];
  const canvas = document.createElement('canvas');
  canvas.width = size.w;
  canvas.height = size.h;
  drawCover(canvas, state, photos);
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
}

function downloadBlob(blob, filename) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}

async function exportOne() {
  const blob = await exportPng(state.size);
  const size = EXPORT_SIZES.find((s) => s.id === state.size);
  downloadBlob(blob, `neon-coast-${size.w}x${size.h}.png`);
  say(`Exported neon-coast-${size.w}x${size.h}.png — exactly ${size.w} x ${size.h}.`);
}

async function exportAll() {
  for (const size of EXPORT_SIZES) {
    const blob = await exportPng(size.id);
    downloadBlob(blob, `neon-coast-${size.w}x${size.h}.png`);
    await new Promise((r) => setTimeout(r, 250));
  }
  say('Exported all three sizes: 1080 x 1080, 1080 x 1350 and 1920 x 1080.');
}

/** Loads a shipped sample photo into the first empty slot (or slot 0). */
export async function loadSample(sampleId) {
  const sample = SAMPLES.find((s) => s.id === sampleId) || SAMPLES[0];
  const img = await loadImage(sample.file);
  const slot = photos.findIndex((p) => p === null);
  const target = slot === -1 ? 0 : slot;
  photos[target] = img;
  document.querySelectorAll('.slot').forEach((el, i) => {
    el.classList.toggle('filled', Boolean(photos[i]));
  });
  return img;
}

/** Applies a one-click look (layout, grade, words, effects). */
export function applyPreset(presetId) {
  const preset = PRESETS.find((p) => p.id === presetId);
  if (!preset) return;
  pushHistory();
  Object.assign(state, {
    layout: preset.layout,
    grade: preset.grade,
    title: preset.title,
    subtitle: preset.subtitle,
    tagline: preset.tagline,
    badge: preset.badge,
    heat: preset.heat,
    grain: preset.grain,
    vignette: preset.vignette,
    halftone: preset.halftone,
    rays: preset.rays,
    palms: preset.palms,
  });
  syncAllControls();
  redraw();
  say(`Look applied: ${preset.name}.`);
}

/** Picks a random layout, grade and title for a fresh idea. */
export function randomizeLook() {
  const layouts = Object.keys(LAYOUTS);
  const grades = Object.keys(GRADES);
  const titles = ['NEON COAST', 'NIGHT SHIFT', 'PALM GOLD', 'HOT PURSUIT', 'LAST CALL', 'VICE LIGHTS', 'GOLDEN HOUR', 'PIER PRESSURE'];
  pushHistory();
  state.layout = layouts[Math.floor(Math.random() * layouts.length)];
  state.grade = grades[Math.floor(Math.random() * grades.length)];
  state.title = titles[Math.floor(Math.random() * titles.length)];
  syncAllControls();
  redraw();
  say('Random look — keep rolling or undo to go back.');
}

// --- Control builders -------------------------------------------------------

function buildLayoutButtons() {
  const box = $('layouts');
  Object.entries(LAYOUTS).forEach(([id, layout]) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'layout-btn';
    b.dataset.layout = id;
    b.title = layout.blurb;
    b.innerHTML = `<span class="mini mini-${id}"></span>${layout.name}`;
    b.addEventListener('click', () => {
      pushHistory();
      state.layout = id;
      state.selectedPanel = 0;
      syncAllControls();
      redraw();
    });
    box.appendChild(b);
  });
}

function buildGradeSwatches() {
  const box = $('grades');
  Object.entries(GRADES).forEach(([id, grade]) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'grade-btn';
    b.dataset.grade = id;
    b.title = grade.name;
    b.style.background = `linear-gradient(135deg, ${grade.sky[1]}, ${grade.sky[3]}, ${grade.sky[4]})`;
    b.innerHTML = `<span>${grade.name}</span>`;
    b.addEventListener('click', () => {
      pushHistory();
      state.grade = id;
      syncAllControls();
      redraw();
    });
    box.appendChild(b);
  });
}

function buildPresetButtons() {
  const box = $('presets');
  PRESETS.forEach((preset) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'preset-btn';
    b.dataset.preset = preset.id;
    b.textContent = preset.name;
    b.addEventListener('click', () => applyPreset(preset.id));
    box.appendChild(b);
  });
}

function buildSizeRadios() {
  const box = $('sizes');
  EXPORT_SIZES.forEach((size) => {
    const label = document.createElement('label');
    label.className = 'size-radio';
    label.innerHTML = `<input type="radio" name="size" value="${size.id}"> ${size.label}`;
    label.querySelector('input').addEventListener('change', () => {
      pushHistory();
      state.size = size.id;
      redraw();
    });
    box.appendChild(label);
  });
}

function buildPhotoSlots() {
  const box = $('slots');
  for (let i = 0; i < 4; i++) {
    const div = document.createElement('div');
    div.className = 'slot';
    div.innerHTML = `
      <strong>Photo ${i + 1}</strong>
      <label class="upload">Upload <input type="file" accept="image/*" data-slot="${i}" hidden></label>
      <span class="slot-actions">
        <button type="button" data-sample="boulevard" data-slot="${i}">Boulevard</button>
        <button type="button" data-sample="pier" data-slot="${i}">Pier</button>
        <button type="button" data-fill="${i}">Use everywhere</button>
      </span>`;
    div.querySelector('input[type=file]').addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      photos[i] = await loadImage(URL.createObjectURL(file));
      div.classList.add('filled');
      redraw();
      say(`Photo ${i + 1} loaded from your machine — never uploaded anywhere.`);
    });
    div.querySelectorAll('[data-sample]').forEach((b) => b.addEventListener('click', async () => {
      const sample = SAMPLES.find((s) => s.id === b.dataset.sample);
      photos[i] = await loadImage(sample.file);
      div.classList.add('filled');
      redraw();
      say(`Photo ${i + 1} set to the ${sample.label} sample.`);
    }));
    div.querySelector('[data-fill]').addEventListener('click', () => {
      if (!photos[i]) { say('Load a photo into this slot first.'); return; }
      pushHistory();
      state.panels.forEach((p) => { p.photo = i; });
      redraw();
      say(`Every panel now uses Photo ${i + 1}.`);
    });
    box.appendChild(div);
  }
}

// --- Syncing controls with state -------------------------------------------

function syncAllControls() {
  $('title').value = state.title;
  $('subtitle').value = state.subtitle;
  $('tagline').value = state.tagline;
  $('badge').value = state.badge;
  $('heat').value = String(state.heat);
  $('titleScale').value = String(state.titleScale);
  document.querySelectorAll('.layout-btn').forEach((b) => b.classList.toggle('active', b.dataset.layout === state.layout));
  document.querySelectorAll('.grade-btn').forEach((b) => b.classList.toggle('active', b.dataset.grade === state.grade));
  document.querySelectorAll('.size-radio input').forEach((r) => { r.checked = r.value === state.size; });
  document.querySelectorAll('.toggle input').forEach((t) => { t.checked = Boolean(state[t.dataset.key]); });
  syncUndoButtons();
  syncPanelControls();
}

function syncPanelControls() {
  const layout = LAYOUTS[state.layout];
  const count = layout.panelsCount;
  const sel = Math.min(state.selectedPanel, count - 1);
  state.selectedPanel = sel;
  const slot = state.panels[sel] || { photo: 0, zoom: 1, ox: 0, oy: 0 };
  $('panelLabel').textContent = `Panel ${sel + 1} of ${count}`;
  $('panelPhoto').value = String(slot.photo);
  $('zoom').value = String(slot.zoom);
  $('panX').value = String(slot.ox);
  $('panY').value = String(slot.oy);
  $('panelDots').innerHTML = '';
  for (let i = 0; i < count; i++) {
    const d = document.createElement('button');
    d.type = 'button';
    d.className = 'panel-dot' + (i === sel ? ' active' : '');
    d.textContent = String(i + 1);
    d.addEventListener('click', () => { state.selectedPanel = i; syncPanelControls(); redraw(); });
    $('panelDots').appendChild(d);
  }
  // Outline the selected panel on the preview.
  preview.dataset.selected = String(sel);
}

function bindTextAndToggles() {
  const bindText = (id, key) => {
    $(id).addEventListener('input', () => { state[key] = $(id).value; redraw(); });
    $(id).addEventListener('change', () => pushHistory());
  };
  bindText('title', 'title');
  bindText('subtitle', 'subtitle');
  bindText('tagline', 'tagline');
  bindText('badge', 'badge');
  $('heat').addEventListener('input', () => { state.heat = Number($('heat').value); redraw(); });
  $('heat').addEventListener('change', () => pushHistory());
  $('titleScale').addEventListener('input', () => { state.titleScale = Number($('titleScale').value); redraw(); });
  $('titleScale').addEventListener('change', () => pushHistory());
  document.querySelectorAll('.toggle input').forEach((t) => {
    t.addEventListener('change', () => {
      pushHistory();
      state[t.dataset.key] = t.checked;
      redraw();
    });
  });
  $('panelPhoto').addEventListener('change', () => {
    pushHistory();
    state.panels[state.selectedPanel].photo = Number($('panelPhoto').value);
    redraw();
  });
  const bindPanelSlider = (id, key) => {
    $(id).addEventListener('input', () => {
      state.panels[state.selectedPanel][key] = Number($(id).value);
      redraw();
    });
    $(id).addEventListener('change', () => pushHistory());
  };
  bindPanelSlider('zoom', 'zoom');
  bindPanelSlider('panX', 'ox');
  bindPanelSlider('panY', 'oy');
}

// --- Preview interaction: click to select a panel, drag to pan, wheel to zoom ---

function canvasPoint(e) {
  const rect = preview.getBoundingClientRect();
  return {
    x: ((e.clientX - rect.left) / rect.width) * preview.width,
    y: ((e.clientY - rect.top) / rect.height) * preview.height,
  };
}

function panelAt(x, y) {
  const layout = LAYOUTS[state.layout];
  const rects = layout.panels(preview.width, preview.height);
  for (let i = rects.length - 1; i >= 0; i--) {
    const r = rects[i];
    if (x >= r.x * preview.width && x <= (r.x + r.w) * preview.width
      && y >= r.y * preview.height && y <= (r.y + r.h) * preview.height) return i;
  }
  return -1;
}

preview.addEventListener('pointerdown', (e) => {
  const p = canvasPoint(e);
  const hit = panelAt(p.x, p.y);
  if (hit >= 0) {
    state.selectedPanel = hit;
    syncPanelControls();
    drag = { x: p.x, y: p.y, moved: false };
    preview.setPointerCapture(e.pointerId);
  }
});
preview.addEventListener('pointermove', (e) => {
  if (!drag) return;
  const p = canvasPoint(e);
  const dx = (p.x - drag.x) / preview.width;
  const dy = (p.y - drag.y) / preview.height;
  if (Math.abs(dx) + Math.abs(dy) > 0.002) drag.moved = true;
  if (drag.moved) {
    const slot = state.panels[state.selectedPanel];
    slot.ox = Math.max(-0.6, Math.min(0.6, slot.ox + dx));
    slot.oy = Math.max(-0.6, Math.min(0.6, slot.oy + dy));
    drag.x = p.x;
    drag.y = p.y;
    $('panX').value = String(slot.ox);
    $('panY').value = String(slot.oy);
    redraw();
  }
});
preview.addEventListener('pointerup', () => {
  if (drag && drag.moved) pushHistory();
  drag = null;
});
preview.addEventListener('wheel', (e) => {
  e.preventDefault();
  const slot = state.panels[state.selectedPanel];
  pushHistory();
  slot.zoom = Math.max(1, Math.min(3, slot.zoom * (e.deltaY < 0 ? 1.08 : 0.93)));
  $('zoom').value = String(slot.zoom);
  redraw();
}, { passive: false });

// --- Drag and drop anywhere on the page ------------------------------------
document.addEventListener('dragover', (e) => e.preventDefault());
document.addEventListener('drop', async (e) => {
  e.preventDefault();
  const file = e.dataTransfer.files[0];
  if (!file || !file.type.startsWith('image/')) return;
  const slot = photos.findIndex((p) => p === null);
  const target = slot === -1 ? 0 : slot;
  photos[target] = await loadImage(URL.createObjectURL(file));
  document.querySelectorAll('.slot')[target].classList.add('filled');
  redraw();
  say(`Dropped photo loaded into Photo ${target + 1}.`);
});

// --- Buttons ----------------------------------------------------------------
$('export').addEventListener('click', exportOne);
$('exportAll').addEventListener('click', exportAll);
$('undo').addEventListener('click', undo);
$('redo').addEventListener('click', redo);
$('random').addEventListener('click', randomizeLook);
$('reset').addEventListener('click', () => {
  pushHistory();
  const fresh = defaultState();
  Object.keys(fresh).forEach((k) => { state[k] = fresh[k]; });
  syncAllControls();
  redraw();
  say('Reset to the Sunset Heist starting look.');
});

// --- Boot -------------------------------------------------------------------
buildLayoutButtons();
buildGradeSwatches();
buildPresetButtons();
buildSizeRadios();
buildPhotoSlots();
bindTextAndToggles();
syncAllControls();
syncUndoButtons();

const shot = new URLSearchParams(location.search).get('shot');
if (shot) {
  runShot(shot, new URLSearchParams(location.search), {
    applyPreset,
    setLayout: (id) => { state.layout = id; },
    setGrade: (id) => { state.grade = id; },
    setTitle: (t) => { state.title = t; $('title').value = t; },
    loadSample,
    setExportSize: (id) => { state.size = id; },
    redraw,
    fontsReady: () => document.fonts.ready,
  }).catch((err) => { statusEl.textContent = `Shot failed: ${err.message}`; });
} else {
  // Load the two samples so the first paint already looks like a cover.
  Promise.all([loadSample('boulevard'), loadSample('pier')])
    .then(() => { syncAllControls(); redraw(); })
    .catch(() => redraw());
  redraw();
}

// Handle for automated tests and screenshot tooling.
window.__coverApp = { state, photos, exportPng, redraw, applyPreset, loadSample };
