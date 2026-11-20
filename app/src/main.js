// Neon Coast Cover Studio — the editor.
// Wires the controls to the renderer: photo slots, layouts, grades,
// presets, per-panel crop and position, title lettering, undo/redo and
// exact-size PNG export. Photos never leave the machine: uploads are read
// with object URLs and samples are files shipped under app/.
//
// v2: four shipped samples instead of two, every look deals a different
// photo to every panel, and a "Deal 4 different photos" button re-deals
// the panels in one tap.
//
// v4: panel swap, cast-tag and callout editing (including drag-to-move
// on the preview), upload straight to the selected panel, drop a file
// on a panel to fill that panel, and one undo step per wheel gesture.
import { drawCover, castTagLayout, calloutLayout } from './cover.js';
import { LAYOUTS, GRADES, PRESETS, EXPORT_SIZES, PHOTO_COUNT, CAST_ROLES, DEFAULT_BILLING, dealPhotos, defaultState } from './presets.js';
import { runShot } from './shots.js';

const $ = (id) => document.getElementById(id);
const preview = $('preview');
const statusEl = $('status');
const state = defaultState();

/** The photo library: one image per slot, by index. */
const photos = [null, null, null, null];
const SAMPLES = [
  { id: 'boulevard', label: 'Boulevard', file: 'samples/boulevard.jpg' },
  { id: 'pier', label: 'Pier', file: 'samples/pier.jpg' },
  { id: 'neon', label: 'Neon', file: 'samples/neon.jpg' },
  { id: 'marina', label: 'Marina', file: 'samples/marina.jpg' },
];

let undoStack = [];
let redoStack = [];
let drag = null;
// v4 editor state: whether a panel swap is armed, which cast tag or
// callout is selected, when the wheel last banked an undo step, and a
// scratch context for measuring tag and callout boxes.
let swapArmed = false;
let activeCast = -1;
let activeCallout = -1;
let lastWheelStamp = 0;
const probeCtx = document.createElement('canvas').getContext('2d');

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

/** Loads every shipped sample, one per library slot, in order. */
export async function loadAllSamples() {
  for (const sample of SAMPLES) {
    const img = await loadImage(sample.file);
    photos[SAMPLES.indexOf(sample)] = img;
  }
  document.querySelectorAll('.slot').forEach((el, i) => {
    el.classList.toggle('filled', Boolean(photos[i]));
  });
}

/** Gives every panel a different photo, cycling the library from `start`. */
export function dealDistinctPhotos(start = 0) {
  pushHistory();
  const layout = LAYOUTS[state.layout];
  const dealt = dealPhotos(layout.panelsCount, start);
  dealt.forEach((photo, i) => { state.panels[i].photo = photo; });
  syncPanelControls();
  redraw();
  say(`Dealt ${dealt.length} different photos — no panel repeats a face.`);
}

/** Applies a one-click look (layout, grade, words, effects, photos). */
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
    titleStyle: preset.titleStyle || 'classic',
    grain: preset.grain,
    vignette: preset.vignette,
    halftone: preset.halftone,
    rays: preset.rays,
    palms: preset.palms,
    billing: preset.billing !== false,
    seal: preset.seal !== false,
  });
  // Copy the look's cast and callouts instead of sharing them, so
  // editing a tag never rewrites the preset definition itself.
  const clone = (rows) => (rows || []).map((row) => ({ ...row }));
  state.cast = clone(preset.cast);
  state.callouts = clone(preset.callouts);
  state.billingText = DEFAULT_BILLING;
  activeCast = -1;
  activeCallout = -1;
  const layout = LAYOUTS[preset.layout];
  (preset.photos || dealPhotos(layout.panelsCount)).forEach((photo, i) => {
    if (i < state.panels.length) state.panels[i].photo = photo;
  });
  renderCastList();
  renderCalloutList();
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
  const layout = LAYOUTS[state.layout];
  dealPhotos(layout.panelsCount, Math.floor(Math.random() * PHOTO_COUNT))
    .forEach((photo, i) => { state.panels[i].photo = photo; });
  syncAllControls();
  redraw();
  say('Random look — keep rolling or undo to go back.');
}

// --- v4: panel swap, cast tags, callouts, upload-to-panel -------------------

/** Trades two panels' photo and crop, so their pictures swap places. */
export function swapPanels(a, b) {
  const layout = LAYOUTS[state.layout];
  if (a === b || a < 0 || b < 0 || a >= layout.panelsCount || b >= layout.panelsCount) return false;
  pushHistory();
  const held = state.panels[a];
  state.panels[a] = state.panels[b];
  state.panels[b] = held;
  state.selectedPanel = b;
  swapArmed = false;
  syncSwapButton();
  syncPanelControls();
  redraw();
  say(`Swapped Panel ${a + 1} with Panel ${b + 1}.`);
  return true;
}

function syncSwapButton() {
  const btn = $('swapMode');
  if (!btn) return;
  btn.classList.toggle('active', swapArmed);
  btn.textContent = swapArmed ? '✕ Cancel swap — click a panel' : '⇄ Swap panels';
}

/** Pins a new cast tag to the selected panel, lower-left corner. */
export function addCastTag(name, role) {
  const who = (name || '').trim().toUpperCase().slice(0, 14) || 'LUCIA';
  const job = (role || '').trim().toUpperCase().slice(0, 24) || 'THE FIXER';
  pushHistory();
  state.cast.push({ name: who, role: job, panel: state.selectedPanel, x: 0.06, y: 0.76 });
  activeCast = state.cast.length - 1;
  activeCallout = -1;
  renderCastList();
  redraw();
  say(`Cast tag added: ${who} — ${job} on Panel ${state.selectedPanel + 1}.`);
  return state.cast.length - 1;
}

export function removeCastTag(index) {
  if (index < 0 || index >= state.cast.length) return;
  pushHistory();
  const gone = state.cast.splice(index, 1)[0];
  activeCast = -1;
  renderCastList();
  redraw();
  say(`Removed cast tag ${gone.name}.`);
}

/** Drops a callout label near the top of the cover. */
export function addCallout(text) {
  const words = (text || '').trim().toUpperCase().slice(0, 40);
  if (!words) return -1;
  pushHistory();
  state.callouts.push({ text: words, x: 0.5, y: 0.05 });
  activeCallout = state.callouts.length - 1;
  activeCast = -1;
  renderCalloutList();
  redraw();
  say(`Callout added: ${words}. Drag it on the preview to move it.`);
  return state.callouts.length - 1;
}

export function removeCallout(index) {
  if (index < 0 || index >= state.callouts.length) return;
  pushHistory();
  const gone = state.callouts.splice(index, 1)[0];
  activeCallout = -1;
  renderCalloutList();
  redraw();
  say(`Removed callout ${gone.text}.`);
}

/**
 * Puts an image file on the selected panel in one step: the file joins
 * the library, then the selected panel points at it with a fresh crop.
 */
export async function uploadToSelectedPanel(file) {
  if (!file || !file.type.startsWith('image/')) return false;
  const img = await loadImage(URL.createObjectURL(file));
  let free = photos.findIndex((p) => p === null);
  if (free === -1) free = state.panels[state.selectedPanel].photo;
  photos[free] = img;
  pushHistory();
  const slot = state.panels[state.selectedPanel];
  slot.photo = free;
  slot.zoom = 1;
  slot.ox = 0;
  slot.oy = 0;
  document.querySelectorAll('.slot').forEach((el, i) => {
    el.classList.toggle('filled', Boolean(photos[i]));
  });
  syncPanelControls();
  redraw();
  say(`Your photo is now on Panel ${state.selectedPanel + 1} (Photo ${free + 1}).`);
  return true;
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
  for (let i = 0; i < PHOTO_COUNT; i++) {
    const div = document.createElement('div');
    div.className = 'slot';
    div.innerHTML = `
      <strong>Photo ${i + 1}</strong>
      <label class="upload">Upload <input type="file" accept="image/*" data-slot="${i}" hidden></label>
      <span class="slot-actions"></span>`;
    const actions = div.querySelector('.slot-actions');
    SAMPLES.forEach((sample) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.dataset.sample = sample.id;
      b.dataset.slot = String(i);
      b.textContent = sample.label;
      b.addEventListener('click', async () => {
        photos[i] = await loadImage(sample.file);
        div.classList.add('filled');
        redraw();
        say(`Photo ${i + 1} set to the ${sample.label} sample.`);
      });
      actions.appendChild(b);
    });
    const fill = document.createElement('button');
    fill.type = 'button';
    fill.dataset.fill = String(i);
    fill.textContent = 'Use everywhere';
    fill.addEventListener('click', () => {
      if (!photos[i]) { say('Load a photo into this slot first.'); return; }
      pushHistory();
      state.panels.forEach((p) => { p.photo = i; });
      redraw();
      say(`Every panel now uses Photo ${i + 1}.`);
    });
    actions.appendChild(fill);
    div.querySelector('input[type=file]').addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      photos[i] = await loadImage(URL.createObjectURL(file));
      div.classList.add('filled');
      redraw();
      say(`Photo ${i + 1} loaded from your machine — never uploaded anywhere.`);
    });
    box.appendChild(div);
  }
}

/** Draws the cast-tag list: name, role, panel picker and remove button. */
export function renderCastList() {
  const list = $('castList');
  if (!list) return;
  list.innerHTML = '';
  state.cast.forEach((tag, i) => {
    const el = document.createElement('div');
    el.className = 'cast-row' + (i === activeCast ? ' selected' : '');
    el.innerHTML = `
      <input type="text" class="cast-name" maxlength="14" value="${tag.name.replace(/"/g, '&quot;')}" aria-label="Cast name">
      <input type="text" class="cast-role" maxlength="24" value="${tag.role.replace(/"/g, '&quot;')}" aria-label="Cast role">
      <select class="cast-panel" aria-label="Panel">
        ${Array.from({ length: LAYOUTS[state.layout].panelsCount }, (_, p) => `<option value="${p}"${p === tag.panel ? ' selected' : ''}>P${p + 1}</option>`).join('')}
      </select>
      <button type="button" class="cast-remove" aria-label="Remove cast tag">✕</button>`;
    el.addEventListener('click', () => {
      activeCast = i;
      activeCallout = -1;
      state.selectedPanel = tag.panel;
      renderCastList();
      syncPanelControls();
      redraw();
    });
    el.querySelector('.cast-name').addEventListener('input', (e) => {
      tag.name = e.target.value.toUpperCase();
      redraw();
    });
    el.querySelector('.cast-name').addEventListener('change', () => pushHistory());
    el.querySelector('.cast-role').addEventListener('input', (e) => {
      tag.role = e.target.value.toUpperCase();
      redraw();
    });
    el.querySelector('.cast-role').addEventListener('change', () => pushHistory());
    el.querySelector('.cast-panel').addEventListener('change', (e) => {
      pushHistory();
      tag.panel = Number(e.target.value);
      state.selectedPanel = tag.panel;
      syncPanelControls();
      redraw();
    });
    el.querySelector('.cast-remove').addEventListener('click', (e) => {
      e.stopPropagation();
      removeCastTag(i);
    });
    list.appendChild(el);
  });
  if (!state.cast.length) {
    list.innerHTML = '<p class="hint">No cast tags yet — add one below.</p>';
  }
}

function buildCastPanel() {
  const addBtn = $('addCast');
  if (!addBtn) return;
  addBtn.addEventListener('click', () => {
    addCastTag($('castName').value, $('castRole').value);
    $('castName').value = '';
  });
  renderCastList();
}

/** Draws the callout list: label text and remove button. */
export function renderCalloutList() {
  const list = $('calloutList');
  if (!list) return;
  list.innerHTML = '';
  state.callouts.forEach((callout, i) => {
    const el = document.createElement('div');
    el.className = 'cast-row' + (i === activeCallout ? ' selected' : '');
    el.innerHTML = `
      <input type="text" class="callout-text" maxlength="40" value="${callout.text.replace(/"/g, '&quot;')}" aria-label="Callout text">
      <button type="button" class="cast-remove" aria-label="Remove callout">✕</button>`;
    el.addEventListener('click', () => {
      activeCallout = i;
      activeCast = -1;
      renderCalloutList();
      redraw();
    });
    el.querySelector('.callout-text').addEventListener('input', (e) => {
      callout.text = e.target.value.toUpperCase();
      redraw();
    });
    el.querySelector('.callout-text').addEventListener('change', () => pushHistory());
    el.querySelector('.cast-remove').addEventListener('click', (e) => {
      e.stopPropagation();
      removeCallout(i);
    });
    list.appendChild(el);
  });
  if (!state.callouts.length) {
    list.innerHTML = '<p class="hint">No callouts yet — add one below.</p>';
  }
}

function buildCalloutPanel() {
  const addBtn = $('addCallout');
  if (!addBtn) return;
  addBtn.addEventListener('click', () => {
    addCallout($('calloutText').value);
    $('calloutText').value = '';
  });
  renderCalloutList();
}

// --- Syncing controls with state -------------------------------------------

function syncAllControls() {
  $('title').value = state.title;
  $('subtitle').value = state.subtitle;
  $('tagline').value = state.tagline;
  $('badge').value = state.badge;
  $('heat').value = String(state.heat);
  $('titleScale').value = String(state.titleScale);
  $('titleStyle').value = state.titleStyle || 'classic';
  $('billingText').value = state.billingText || '';
  document.querySelectorAll('.layout-btn').forEach((b) => b.classList.toggle('active', b.dataset.layout === state.layout));
  document.querySelectorAll('.grade-btn').forEach((b) => b.classList.toggle('active', b.dataset.grade === state.grade));
  document.querySelectorAll('.size-radio input').forEach((r) => { r.checked = r.value === state.size; });
  document.querySelectorAll('.toggle input').forEach((t) => { t.checked = Boolean(state[t.dataset.key]); });
  syncUndoButtons();
  syncSwapButton();
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
  // Swap target picker: every panel except the selected one.
  const swapSel = $('swapWith');
  if (swapSel) {
    swapSel.innerHTML = '';
    for (let i = 0; i < count; i++) {
      if (i === sel) continue;
      const opt = document.createElement('option');
      opt.value = String(i);
      opt.textContent = `Panel ${i + 1}`;
      swapSel.appendChild(opt);
    }
    swapSel.value = String(Math.min(1, count - 1));
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
  $('titleStyle').addEventListener('change', () => {
    pushHistory();
    state.titleStyle = $('titleStyle').value;
    redraw();
    say(state.titleStyle === 'chrome' ? 'Retro-chrome striped title on.' : 'Classic gradient title on.');
  });
  bindText('billingText', 'billingText');
  // Panel swap: arm it, then click the panel to trade with — or pick
  // the target from the menu instead.
  $('swapMode').addEventListener('click', () => {
    swapArmed = !swapArmed;
    activeCast = -1;
    activeCallout = -1;
    syncSwapButton();
    renderCastList();
    renderCalloutList();
    say(swapArmed ? `Swap armed — click another panel to swap with Panel ${state.selectedPanel + 1}.` : 'Swap cancelled.');
  });
  $('swapWith').addEventListener('change', () => {
    const target = Number($('swapWith').value);
    if (target !== state.selectedPanel) swapPanels(state.selectedPanel, target);
    $('swapWith').value = String(state.selectedPanel);
  });
  $('uploadPanel').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (file) await uploadToSelectedPanel(file);
    e.target.value = '';
  });
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

/** The tag or callout box under a canvas point, if any. */
function overlayAt(p) {
  for (const g of castTagLayout(probeCtx, state, preview.width, preview.height)) {
    if (p.x >= g.x && p.x <= g.x + g.w && p.y >= g.y && p.y <= g.y + g.h) return { kind: 'tag', index: g.index };
  }
  for (const g of calloutLayout(probeCtx, state, preview.width, preview.height)) {
    if (p.x >= g.x && p.x <= g.x + g.w && p.y >= g.y && p.y <= g.y + g.h) return { kind: 'callout', index: g.index };
  }
  return null;
}

preview.addEventListener('pointerdown', (e) => {
  const p = canvasPoint(e);
  // A tag or callout under the pointer is grabbed first, so the
  // overlay can be dragged to a new spot instead of panning a panel.
  const over = overlayAt(p);
  if (over) {
    if (over.kind === 'tag') {
      activeCast = over.index;
      activeCallout = -1;
      renderCastList();
    } else {
      activeCallout = over.index;
      activeCast = -1;
      renderCalloutList();
    }
    drag = { kind: over.kind, index: over.index, x: p.x, y: p.y, moved: false };
    preview.setPointerCapture(e.pointerId);
    return;
  }
  const hit = panelAt(p.x, p.y);
  if (hit >= 0) {
    // With a swap armed, a click trades the two panels' pictures.
    if (swapArmed) {
      swapPanels(state.selectedPanel, hit);
      return;
    }
    state.selectedPanel = hit;
    syncPanelControls();
    drag = { kind: 'panel', x: p.x, y: p.y, moved: false };
    preview.setPointerCapture(e.pointerId);
  }
});
preview.addEventListener('pointermove', (e) => {
  if (!drag) return;
  const p = canvasPoint(e);
  const dx = (p.x - drag.x) / preview.width;
  const dy = (p.y - drag.y) / preview.height;
  if (Math.abs(dx) + Math.abs(dy) > 0.002) drag.moved = true;
  if (!drag.moved) return;
  if (drag.kind === 'tag') {
    const tag = state.cast[drag.index];
    if (!tag) return;
    const rect = LAYOUTS[state.layout].panels(preview.width, preview.height)[tag.panel];
    if (!rect) return;
    tag.x = Math.max(0, Math.min(0.95, tag.x + dx / rect.w));
    tag.y = Math.max(0, Math.min(0.95, tag.y + dy / rect.h));
    drag.x = p.x;
    drag.y = p.y;
    redraw();
    return;
  }
  if (drag.kind === 'callout') {
    const note = state.callouts[drag.index];
    if (!note) return;
    note.x = Math.max(0.02, Math.min(0.98, note.x + dx));
    note.y = Math.max(0.02, Math.min(0.98, note.y + dy));
    drag.x = p.x;
    drag.y = p.y;
    redraw();
    return;
  }
  const slot = state.panels[state.selectedPanel];
  slot.ox = Math.max(-0.6, Math.min(0.6, slot.ox + dx));
  slot.oy = Math.max(-0.6, Math.min(0.6, slot.oy + dy));
  drag.x = p.x;
  drag.y = p.y;
  $('panX').value = String(slot.ox);
  $('panY').value = String(slot.oy);
  redraw();
});
preview.addEventListener('pointerup', () => {
  if (drag && drag.moved) pushHistory();
  drag = null;
});
preview.addEventListener('wheel', (e) => {
  e.preventDefault();
  const slot = state.panels[state.selectedPanel];
  // One undo step per wheel gesture, not one per tick — the old code
  // banked a history entry on every wheel event and flooded undo.
  const stamp = Date.now();
  if (stamp - lastWheelStamp > 800) {
    pushHistory();
    lastWheelStamp = stamp;
  }
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
  const img = await loadImage(URL.createObjectURL(file));
  // Dropping on a panel in the preview puts the photo on THAT panel.
  const rect = preview.getBoundingClientRect();
  const px = ((e.clientX - rect.left) / rect.width) * preview.width;
  const py = ((e.clientY - rect.top) / rect.height) * preview.height;
  const hit = px >= 0 && px <= preview.width && py >= 0 && py <= preview.height
    ? panelAt(px, py) : -1;
  let free = photos.findIndex((p) => p === null);
  if (free === -1) free = hit >= 0 ? state.panels[hit].photo : 0;
  photos[free] = img;
  document.querySelectorAll('.slot')[free].classList.add('filled');
  if (hit >= 0) {
    pushHistory();
    state.panels[hit].photo = free;
    state.selectedPanel = hit;
    syncPanelControls();
    redraw();
    say(`Dropped photo loaded onto Panel ${hit + 1} (Photo ${free + 1}).`);
  } else {
    redraw();
    say(`Dropped photo loaded into Photo ${free + 1}.`);
  }
});

// --- Buttons ----------------------------------------------------------------
$('export').addEventListener('click', exportOne);
$('exportAll').addEventListener('click', exportAll);
$('undo').addEventListener('click', undo);
$('redo').addEventListener('click', redo);
$('random').addEventListener('click', randomizeLook);
$('dealPhotos').addEventListener('click', () => dealDistinctPhotos(
  Math.floor(Math.random() * PHOTO_COUNT),
));
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
buildCastPanel();
buildCalloutPanel();
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
    loadAllSamples,
    setExportSize: (id) => { state.size = id; },
    redraw,
    fontsReady: () => document.fonts.ready,
  }).catch((err) => { statusEl.textContent = `Shot failed: ${err.message}`; });
} else {
  // Load all four samples so the first paint already looks like a cover.
  loadAllSamples()
    .then(() => { syncAllControls(); redraw(); })
    .catch(() => redraw());
  redraw();
}

// Handle for automated tests and screenshot tooling.
window.__coverApp = { state, photos, exportPng, redraw, applyPreset, loadSample, loadAllSamples, dealDistinctPhotos, swapPanels, addCastTag, removeCastTag, addCallout, removeCallout, uploadToSelectedPanel, castTagLayout, calloutLayout };
