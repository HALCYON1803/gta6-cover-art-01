// Neon Coast Cover Studio — the cover renderer.
// Draws the whole poster onto any 2D canvas at any size: sky and sun,
// halftone sky, photo panels with crop and grade, palm silhouettes,
// gradient title lettering with a neon script subtitle, badge, heat
// stars, grain and vignette. The same function paints the live preview
// and the exported PNG, so what you see is exactly what you share.
//
// v2: the halftone is painted on the sky BEFORE the panels, so its dots
// never read as noise on a face, and layouts whose title sits over the
// art get a dark scrim behind the lettering to keep it readable.
//
// v4: role tags pinned to panels, callouts with leader dots, a credits
// strip and a seal stamp along the bottom, and a striped retro-chrome
// title. Tag and callout boxes are measured by layout functions the
// editor reuses for hit-testing, so a drag grabs exactly what is drawn.
import { LAYOUTS, GRADES } from './presets.js';

/** Tiny deterministic PRNG so grain looks the same on every export. */
export function seededRandom(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Splits a title into at most two lines that fit `maxWidth` at `fontPx`. */
export function fitTitleLines(ctx, text, fontPx, maxWidth) {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  const lines = [''];
  for (const word of words) {
    const trial = lines[lines.length - 1] ? `${lines[lines.length - 1]} ${word}` : word;
    if (ctx.measureText(trial).width <= maxWidth || !lines[lines.length - 1]) {
      lines[lines.length - 1] = trial;
    } else if (lines.length < 2) {
      lines.push(word);
    } else {
      lines[1] += ` ${word}`;
    }
  }
  return lines.filter(Boolean);
}

/** Halftone dots fading out across a band of the sky. */
export function paintHalftone(ctx, x, y, w, h, colour, maxR) {
  const step = Math.max(10, maxR * 2.4);
  ctx.save();
  ctx.fillStyle = colour;
  for (let yy = y; yy < y + h; yy += step) {
    const fade = 1 - (yy - y) / h;
    for (let xx = x; xx < x + w; xx += step) {
      const r = Math.max(0.6, maxR * fade);
      ctx.globalAlpha = 0.20 * fade + 0.04;
      ctx.beginPath();
      ctx.arc(xx + step / 2, yy + step / 2, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}


/** Draws one photo into a rectangle, cover-fit, with zoom and pan offsets. */
export function paintPhoto(ctx, img, x, y, w, h, zoom, ox, oy, filter) {
  if (!img || !img.naturalWidth) return false;
  const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight) * zoom;
  const pw = img.naturalWidth * scale;
  const ph = img.naturalHeight * scale;
  const dx = x + (w - pw) / 2 + ox * w;
  // Cover-fit crops the photo's long side: bias a tall photo's crop toward
  // its top third, so a person's head survives a wide, short panel.
  const topBias = ph > h ? (ph - h) * 0.30 : 0;
  const dy = y + (h - ph) / 2 + oy * h + topBias;
  ctx.save();
  ctx.filter = filter || 'none';
  ctx.drawImage(img, dx, dy, pw, ph);
  ctx.restore();
  return true;
}

/** One palm silhouette: a leaning trunk and six filled drooping fronds. */
export function paintPalm(ctx, x, y, s, lean, colour) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(lean);
  ctx.fillStyle = colour;
  ctx.strokeStyle = colour;
  // Tapered trunk: a thick curve from the base up to the crown.
  ctx.lineWidth = Math.max(3, s * 0.055);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(s * 0.10, -s * 0.50, s * 0.03, -s * 0.92);
  ctx.stroke();
  const topX = s * 0.03;
  const topY = -s * 0.92;
  // Each frond is a filled leaf blade: out along an arc, drooping at the tip.
  for (let i = 0; i < 6; i++) {
    const a = (-165 + i * 30) * (Math.PI / 180);
    const len = s * (0.46 + (i % 2) * 0.07);
    const tipX = topX + Math.cos(a) * len;
    const tipY = topY + Math.sin(a) * len + s * 0.30;
    const midX = topX + Math.cos(a) * len * 0.55;
    const midY = topY + Math.sin(a) * len * 0.55 - s * 0.10;
    const px = -Math.sin(a);
    const py = Math.cos(a);
    ctx.beginPath();
    ctx.moveTo(topX, topY);
    ctx.quadraticCurveTo(midX + px * s * 0.07, midY + py * s * 0.07, tipX, tipY);
    ctx.quadraticCurveTo(midX - px * s * 0.02, midY - py * s * 0.02, topX, topY);
    ctx.closePath();
    ctx.fill();
  }
  ctx.beginPath();
  ctx.arc(topX, topY, s * 0.05, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** A jagged starburst badge with centred text. */
export function paintStarburst(ctx, cx, cy, r, text, fill, ink) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.beginPath();
  const points = 14;
  for (let i = 0; i < points * 2; i++) {
    const a = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
    const rr = i % 2 === 0 ? r : r * 0.78;
    const px = Math.cos(a) * rr;
    const py = Math.sin(a) * rr;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.lineWidth = Math.max(2, r * 0.06);
  ctx.strokeStyle = ink;
  ctx.stroke();
  ctx.fillStyle = ink;
  const textSize = Math.min(r * 0.34, (r * 1.55) / Math.max(1, text.length));
  ctx.font = `bold ${textSize}px Anton, 'Arial Black', sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 0, r * 0.03);
  ctx.restore();
}

/** Five heat stars, `filled` of them lit. */
export function paintHeatStars(ctx, x, y, size, filled, lit, dim) {
  ctx.save();
  ctx.translate(x, y);
  for (let i = 0; i < 5; i++) {
    const cx = i * size * 1.25;
    ctx.beginPath();
    for (let p = 0; p < 10; p++) {
      const a = (p / 10) * Math.PI * 2 - Math.PI / 2;
      const rr = p % 2 === 0 ? size / 2 : size / 4.5;
      const px = cx + Math.cos(a) * rr;
      const py = Math.sin(a) * rr;
      if (p === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fillStyle = i < filled ? lit : dim;
    ctx.fill();
    ctx.lineWidth = Math.max(1.5, size * 0.06);
    ctx.strokeStyle = 'rgba(0,0,0,0.55)';
    ctx.stroke();
  }
  ctx.restore();
}

// --- v4: role tags, callouts, credits strip, seal stamp --------------------

/**
 * On-canvas boxes for every cast tag, in canvas pixels. `ctx` only
 * measures text, so the editor can run this on a scratch context and
 * hit-test the very boxes the painter draws.
 * Returns [{ tag, index, x, y, w, h, nameSize, roleSize, inset, stripe, accent }].
 */
export function castTagLayout(ctx, state, W, H) {
  const layout = LAYOUTS[state.layout] || LAYOUTS.hero;
  const rects = layout.panels(W, H);
  const grade = GRADES[state.grade] || GRADES.sunset;
  const found = [];
  const tags = state.cast || [];
  for (let index = 0; index < tags.length; index++) {
    const tag = tags[index];
    const r = rects[tag.panel];
    if (!r) continue;
    const px = r.x * W;
    const py = r.y * H;
    const pw = r.w * W;
    const ph = r.h * H;
    const nameSize = Math.max(13, Math.min(W, H) * 0.020);
    const roleSize = Math.max(9, Math.min(W, H) * 0.0115);
    const inset = nameSize * 0.45;
    const stripe = nameSize * 0.30;
    ctx.save();
    ctx.font = `${nameSize}px Anton, 'Arial Black', sans-serif`;
    const nameW = ctx.measureText((tag.name || 'CAST').toUpperCase()).width;
    ctx.font = `bold ${roleSize}px 'Arial Narrow', Arial, sans-serif`;
    const roleW = ctx.measureText((tag.role || '').toUpperCase()).width;
    ctx.restore();
    const w = stripe + inset * 2 + Math.max(nameW, roleW);
    const h = inset * 2 + nameSize * 1.05 + roleSize * 1.15 + nameSize * 0.12;
    // Anchor by panel fraction, then pull the pill back inside its panel.
    let x = px + (tag.x ?? 0.06) * pw;
    let y = py + (tag.y ?? 0.76) * ph;
    if (x + w > px + pw - 4) x = px + pw - w - 4;
    if (y + h > py + ph - 4) y = py + ph - h - 4;
    if (x < px + 4) x = px + 4;
    if (y < py + 4) y = py + 4;
    found.push({ tag, index, x, y, w, h, nameSize, roleSize, inset, stripe, accent: grade.accent });
  }
  return found;
}

/** Paints one cast tag pill inside the box `castTagLayout` measured. */
export function paintCastTag(ctx, geom) {
  const { tag, x, y, w, h, nameSize, roleSize, inset, stripe, accent } = geom;
  ctx.save();
  // Dark pill, accent stripe down the left edge, name above role.
  ctx.fillStyle = 'rgba(8,2,16,0.82)';
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, Math.max(3, h * 0.18));
  ctx.fill();
  ctx.fillStyle = accent;
  ctx.fillRect(x, y, stripe, h);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#ffffff';
  ctx.font = `${nameSize}px Anton, 'Arial Black', sans-serif`;
  ctx.fillText((tag.name || 'CAST').toUpperCase(), x + stripe + inset, y + inset + nameSize * 0.95);
  ctx.fillStyle = '#ffd166';
  ctx.font = `bold ${roleSize}px 'Arial Narrow', Arial, sans-serif`;
  ctx.fillText((tag.role || '').toUpperCase(), x + stripe + inset, y + inset + nameSize * 1.05 + roleSize * 1.05);
  ctx.restore();
}

/**
 * On-canvas boxes for every callout label, in canvas pixels.
 * Returns [{ callout, index, dotX, dotY, x, y, w, h, labelSize, inset }].
 */
export function calloutLayout(ctx, state, W, H) {
  const scale = Math.min(W, H) / 1000;
  const found = [];
  const notes = state.callouts || [];
  for (let index = 0; index < notes.length; index++) {
    const callout = notes[index];
    const dotX = (callout.x ?? 0.5) * W;
    const dotY = (callout.y ?? 0.05) * H;
    const labelSize = Math.max(12, Math.min(W, H) * 0.016);
    const inset = labelSize * 0.55;
    ctx.save();
    ctx.font = `bold ${labelSize}px 'Arial Narrow', Arial, sans-serif`;
    const textW = ctx.measureText((callout.text || '').toUpperCase()).width;
    ctx.restore();
    const w = textW + inset * 2;
    const h = labelSize * 1.9;
    // The label floats above-right of its dot, clamped onto the canvas.
    let x = dotX + 20 * scale;
    let y = dotY - h - 10 * scale;
    if (x + w > W - 8) x = W - w - 8;
    if (y < 8) y = dotY + 12 * scale;
    if (x < 8) x = 8;
    found.push({ callout, index, dotX, dotY, x, y, w, h, labelSize, inset });
  }
  return found;
}

/** Paints one callout: leader dot, connecting line and label pill. */
export function paintCallout(ctx, geom) {
  const { callout, dotX, dotY, x, y, w, h, labelSize, inset } = geom;
  ctx.save();
  // Line from the dot to the label's lower edge.
  ctx.strokeStyle = 'rgba(255,255,255,0.9)';
  ctx.lineWidth = Math.max(1.5, h * 0.05);
  ctx.beginPath();
  ctx.moveTo(dotX, dotY);
  ctx.lineTo(x + 6, y + h);
  ctx.stroke();
  // The dot itself, ringed in dark ink.
  ctx.fillStyle = '#ffe600';
  ctx.beginPath();
  ctx.arc(dotX, dotY, Math.max(3, h * 0.14), 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.6)';
  ctx.lineWidth = Math.max(1.5, h * 0.05);
  ctx.stroke();
  // The label pill.
  ctx.fillStyle = 'rgba(8,2,16,0.85)';
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, Math.max(3, h * 0.3));
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${labelSize}px 'Arial Narrow', Arial, sans-serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText((callout.text || '').toUpperCase(), x + inset, y + h / 2 + labelSize * 0.05);
  ctx.restore();
}

/** The movie-credits strip along the bottom edge. */
export function paintBilling(ctx, state, W, H) {
  if (!state.billing || !state.billingText) return;
  // It sits just above the comic frame's bottom stroke (painted
  // later), so the frame never covers the credits' lower half.
  const scale = Math.min(W, H) / 1000;
  const framePx = state.frame ? Math.max(4, 10 * scale) : 0;
  const bandH = Math.max(16, H * 0.026);
  const typeSize = Math.max(9, bandH * 0.42);
  const y = H - bandH - framePx;
  ctx.save();
  ctx.fillStyle = 'rgba(5,0,12,0.78)';
  ctx.fillRect(0, y, W, bandH);
  ctx.fillStyle = 'rgba(255,255,255,0.88)';
  ctx.font = `bold ${typeSize}px 'Arial Narrow', Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  if ('letterSpacing' in ctx) ctx.letterSpacing = `${Math.max(1, typeSize * 0.08)}px`;
  ctx.fillText(state.billingText.toUpperCase(), W / 2, y + bandH / 2 + typeSize * 0.06);
  ctx.restore();
}

/** The round "EST. 2026" seal stamp, bottom-right above the billing strip. */
export function paintSeal(ctx, state, W, H) {
  if (!state.seal) return;
  const scale = Math.min(W, H) / 1000;
  const framePx = state.frame ? Math.max(4, 10 * scale) : 0;
  const bandH = state.billing && state.billingText ? Math.max(16, H * 0.026) : 0;
  const radius = Math.max(22, Math.min(W, H) * 0.042);
  const centerX = W - radius - Math.max(10, W * 0.012);
  const centerY = H - bandH - framePx - radius - Math.max(8, H * 0.012);
  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.rotate(-0.18);
  ctx.fillStyle = 'rgba(8,2,16,0.72)';
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#ffd166';
  ctx.lineWidth = Math.max(2, radius * 0.07);
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.92, 0, Math.PI * 2);
  ctx.stroke();
  ctx.lineWidth = Math.max(1, radius * 0.035);
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.72, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = '#ffd166';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `bold ${radius * 0.24}px 'Arial Narrow', Arial, sans-serif`;
  ctx.fillText('★ EST. ★', 0, -radius * 0.22);
  ctx.font = `${radius * 0.34}px Anton, 'Arial Black', sans-serif`;
  ctx.fillStyle = '#ffffff';
  ctx.fillText('2026', 0, radius * 0.28);
  ctx.restore();
}

/**
 * The classic title: grade gradient fill, ink outline, soft shadow.
 * Pulled out of drawCover so the chrome variant can sit beside it.
 */
function paintClassicTitle(ctx, grade, lines, fontPx, lineH, anchorX, zy, u) {
  const wash = ctx.createLinearGradient(0, zy, 0, zy + lineH * lines.length);
  grade.titleGrad.forEach((c, i) => wash.addColorStop(i / (grade.titleGrad.length - 1), c));
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.65)';
  ctx.shadowBlur = Math.max(4, 10 * u);
  ctx.shadowOffsetY = Math.max(3, 6 * u);
  ctx.lineJoin = 'round';
  ctx.strokeStyle = grade.ink;
  ctx.lineWidth = Math.max(3, fontPx * 0.07);
  ctx.fillStyle = wash;
  lines.forEach((line, i) => {
    const y = zy + lineH * (i + 1) - lineH * 0.12;
    ctx.strokeText(line, anchorX, y);
    ctx.fillText(line, anchorX, y);
  });
  ctx.restore();
}

/**
 * The retro-chrome title: silver-and-gold lettering with printed
 * horizontal stripes. The letters are painted to a scratch canvas and
 * striped with source-atop, so the stripes only land on ink — never on
 * the photo behind. The scratch canvas is stamped on, then the ink
 * outline is stroked over the top on the main canvas.
 */
function paintChromeTitle(ctx, grade, lines, fontPx, lineH, zx, zy, zw, anchorX, align, u) {
  const off = document.createElement('canvas');
  const offW = Math.max(2, Math.ceil(zw));
  const offH = Math.max(2, Math.ceil(lineH * lines.length));
  off.width = offW;
  off.height = offH;
  const octx = off.getContext('2d');
  const chrome = octx.createLinearGradient(0, 0, 0, offH);
  chrome.addColorStop(0, '#ffffff');
  chrome.addColorStop(0.30, '#cfcfdd');
  chrome.addColorStop(0.48, '#ffd166');
  chrome.addColorStop(0.62, '#ff9a3d');
  chrome.addColorStop(0.78, '#fff7ae');
  chrome.addColorStop(1, '#e8e8f0');
  octx.save();
  octx.font = `${fontPx}px Anton, 'Arial Black', sans-serif`;
  octx.textAlign = align;
  octx.textBaseline = 'alphabetic';
  octx.fillStyle = chrome;
  const offX = align === 'left' ? 0 : align === 'right' ? offW : offW / 2;
  lines.forEach((line, i) => {
    octx.fillText(line, offX, lineH * (i + 1) - lineH * 0.12);
  });
  octx.globalCompositeOperation = 'source-atop';
  octx.fillStyle = 'rgba(10,2,20,0.28)';
  const stripeH = Math.max(2, fontPx * 0.045);
  for (let yy = fontPx * 0.22; yy < offH; yy += fontPx * 0.20) {
    octx.fillRect(0, yy, offW, stripeH);
  }
  octx.restore();
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.7)';
  ctx.shadowBlur = Math.max(4, 12 * u);
  ctx.shadowOffsetY = Math.max(3, 7 * u);
  ctx.drawImage(off, zx, zy - lineH * 0.12);
  ctx.restore();
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.strokeStyle = grade.ink;
  ctx.lineWidth = Math.max(3, fontPx * 0.07);
  ctx.font = `${fontPx}px Anton, 'Arial Black', sans-serif`;
  lines.forEach((line, i) => {
    const y = zy + lineH * (i + 1) - lineH * 0.12;
    ctx.strokeText(line, anchorX, y);
  });
  ctx.restore();
}

/**
 * Draws the full cover.
 * @param {HTMLCanvasElement} canvas - target canvas (its own pixel size).
 * @param {object} state - editor state from presets.js `defaultState()`.
 * @param {Array} photos - image elements (or null) by library index.
 */
export function drawCover(canvas, state, photos) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;
  const u = Math.min(W, H) / 1000; // unit: 1 at a 1000px square
  const grade = GRADES[state.grade] || GRADES.sunset;
  const layout = LAYOUTS[state.layout] || LAYOUTS.hero;
  const rng = seededRandom(20261119 + state.title.length * 97 + state.layout.length);

  // --- Sky: sunset gradient with a low sun and optional rays. ---
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  grade.sky.forEach((c, i) => sky.addColorStop(i / (grade.sky.length - 1), c));
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);

  const sunX = W * 0.72;
  const sunY = H * 0.30;
  const sunR = Math.min(W, H) * 0.16;
  if (state.rays) {
    ctx.save();
    ctx.translate(sunX, sunY);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.10)';
    for (let i = 0; i < 12; i++) {
      ctx.rotate((Math.PI * 2) / 12);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(sunR * 2.6, -sunR * 0.10);
      ctx.lineTo(sunR * 2.6, sunR * 0.10);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }
  const glow = ctx.createRadialGradient(sunX, sunY, sunR * 0.2, sunX, sunY, sunR * 2.4);
  glow.addColorStop(0, grade.sun);
  glow.addColorStop(0.35, grade.sun + '55');
  glow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(sunX - sunR * 2.4, sunY - sunR * 2.4, sunR * 4.8, sunR * 4.8);
  ctx.fillStyle = grade.sun;
  ctx.beginPath();
  ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2);
  ctx.fill();

  // --- Halftone dots on the SKY, before the panels go on, so no dot
  // ever lands on a face. Where a panel covers the sky it hides the
  // dots; where sky shows through, the dots read as print texture.
  if (state.halftone) {
    paintHalftone(ctx, 0, H * 0.02, W, H * 0.12, '#ffffff', Math.max(3, 7 * u));
  }

  // --- Photo panels, each with white comic border and ink shadow. ---
  const rects = layout.panels(W, H);
  const border = Math.max(3, 7 * u);
  rects.forEach((r, i) => {
    const px = r.x * W;
    const py = r.y * H;
    const pw = r.w * W;
    const ph = r.h * H;
    const slot = state.panels[i] || { photo: 0, zoom: 1, ox: 0, oy: 0 };
    const img = photos[slot.photo] || null;
    ctx.save();
    if (r.rot) {
      ctx.translate(px + pw / 2, py + ph / 2);
      ctx.rotate((r.rot * Math.PI) / 180);
      ctx.translate(-pw / 2, -ph / 2);
    } else {
      ctx.translate(px, py);
    }
    // Ink drop shadow, then the white frame.
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(border * 0.9, border * 1.1, pw, ph);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, pw, ph);
    ctx.save();
    ctx.beginPath();
    ctx.rect(border, border, pw - border * 2, ph - border * 2);
    ctx.clip();
    const inner = { x: border, y: border, w: pw - border * 2, h: ph - border * 2 };
    if (img) {
      paintPhoto(ctx, img, inner.x, inner.y, inner.w, inner.h, slot.zoom, slot.ox, slot.oy, grade.photoFilter);
    } else {
      const empty = ctx.createLinearGradient(0, inner.y, 0, inner.y + inner.h);
      empty.addColorStop(0, '#3a2a55');
      empty.addColorStop(1, '#12041f');
      ctx.fillStyle = empty;
      ctx.fillRect(inner.x, inner.y, inner.w, inner.h);
      ctx.fillStyle = 'rgba(255,255,255,0.75)';
      ctx.font = `${Math.max(14, 22 * u)}px Anton, 'Arial Black', sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('ADD A PHOTO', inner.x + inner.w / 2, inner.y + inner.h / 2);
    }
    // Grade tint over the photo.
    ctx.globalCompositeOperation = 'overlay';
    ctx.fillStyle = grade.photoTint;
    ctx.fillRect(inner.x, inner.y, inner.w, inner.h);
    ctx.globalCompositeOperation = 'source-over';
    // Bottom fade inside the panel so captions stay readable.
    const fade = ctx.createLinearGradient(0, inner.y + inner.h * 0.55, 0, inner.y + inner.h);
    fade.addColorStop(0, 'rgba(10,2,20,0)');
    fade.addColorStop(1, 'rgba(10,2,20,0.45)');
    ctx.fillStyle = fade;
    ctx.fillRect(inner.x, inner.y, inner.w, inner.h);
    ctx.restore();
    ctx.restore();
  });

  // --- Palm silhouettes along the bottom edge. ---
  if (state.palms) {
    const palmColour = 'rgba(8,2,16,0.88)';
    const base = H * 0.985;
    paintPalm(ctx, W * 0.03, base, Math.min(W, H) * 0.20, -0.10, palmColour);
    paintPalm(ctx, W * 0.97, base, Math.min(W, H) * 0.17, 0.12, palmColour);
    paintPalm(ctx, W * 0.90, base, Math.min(W, H) * 0.11, 0.05, palmColour);
  }

  // --- Role tags pinned to their panels, then callouts (v4). ---
  castTagLayout(ctx, state, W, H).forEach((geom) => paintCastTag(ctx, geom));
  calloutLayout(ctx, state, W, H).forEach((geom) => paintCallout(ctx, geom));

  // --- Title block: gradient Anton lettering, ink stroke, neon subtitle. ---
  const zone = layout.titleZone(W, H);
  const zx = zone.x * W;
  const zy = zone.y * H;
  const zw = zone.w * W;
  const zoneH = zone.maxH * H;
  const align = zone.align || 'center';
  const anchorX = align === 'left' ? zx : align === 'right' ? zx + zw : zx + zw / 2;
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';

  // Layouts whose title sits over the art get a dark scrim behind the
  // lettering first, so the words stay readable on any photo.
  if (layout.titleOverlay) {
    const scrim = ctx.createLinearGradient(0, zy - zoneH * 0.25, 0, zy + zoneH * 1.15);
    scrim.addColorStop(0, 'rgba(10,2,20,0)');
    scrim.addColorStop(0.45, 'rgba(10,2,20,0.52)');
    scrim.addColorStop(1, 'rgba(10,2,20,0.78)');
    ctx.fillStyle = scrim;
    ctx.fillRect(0, zy - zoneH * 0.25, W, zoneH * 1.4);
  }

  const titleText = (state.title || 'NEON COAST').toUpperCase();
  let fontPx = Math.min(zoneH * 0.52, zw * 0.24) * (state.titleScale || 1);
  ctx.font = `${fontPx}px Anton, 'Arial Black', sans-serif`;
  let lines = fitTitleLines(ctx, titleText, fontPx, zw);
  while (lines.length > 2 && fontPx > 16) {
    fontPx *= 0.92;
    ctx.font = `${fontPx}px Anton, 'Arial Black', sans-serif`;
    lines = fitTitleLines(ctx, titleText, fontPx, zw);
  }
  const lineH = fontPx * 1.02;
  // Classic gradient or striped retro-chrome, picked by the editor.
  if (state.titleStyle === 'chrome') {
    paintChromeTitle(ctx, grade, lines, fontPx, lineH, zx, zy, zw, anchorX, align, u);
  } else {
    paintClassicTitle(ctx, grade, lines, fontPx, lineH, anchorX, zy, u);
  }

  // Neon script subtitle under the title: white lettering with an
  // accent-coloured glow, so it reads on any photo or scrim.
  const subY = zy + lineH * lines.length + fontPx * 0.30;
  if (state.subtitle) {
    const subPx = Math.max(18, fontPx * 0.42);
    ctx.save();
    ctx.font = `${subPx}px Pacifico, cursive`;
    ctx.textAlign = align;
    ctx.shadowColor = grade.accent;
    ctx.shadowBlur = Math.max(10, 26 * u);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(state.subtitle, anchorX, subY);
    ctx.shadowBlur = 0;
    ctx.fillText(state.subtitle, anchorX, subY);
    ctx.restore();
  }

  // Tagline in letterspaced capitals.
  if (state.tagline) {
    const tagPx = Math.max(11, Math.min(W, H) * 0.016);
    ctx.save();
    ctx.font = `bold ${tagPx}px 'Arial Narrow', Arial, sans-serif`;
    ctx.textAlign = align;
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    ctx.shadowColor = 'rgba(0,0,0,0.6)';
    ctx.shadowBlur = Math.max(2, 4 * u);
    ctx.fillText(state.tagline.toUpperCase(), anchorX, subY + fontPx * 0.34);
    ctx.restore();
  }

  // Badge starburst top-right and heat stars top-left of the cover.
  if (state.badge) {
    const br = Math.max(26, Math.min(W, H) * 0.052);
    paintStarburst(ctx, W - br * 1.25, br * 1.25, br, state.badge.toUpperCase().slice(0, 10), '#ffe600', grade.ink);
  }
  if (state.heat > 0) {
    const starSize = Math.max(14, Math.min(W, H) * 0.024);
    paintHeatStars(ctx, W * 0.035, H * 0.03, starSize, state.heat, '#ffe600', 'rgba(255,255,255,0.25)');
  }

  // --- Credits strip and seal stamp (v4), above the grain so they stay crisp. ---
  paintBilling(ctx, state, W, H);
  paintSeal(ctx, state, W, H);

  // --- Grain and vignette finish the poster look. ---
  if (state.grain) {
    ctx.save();
    const dots = Math.floor((W * H) / 260);
    for (let i = 0; i < dots; i++) {
      const gx = rng() * W;
      const gy = rng() * H;
      ctx.globalAlpha = 0.05 + rng() * 0.09;
      ctx.fillStyle = rng() > 0.5 ? '#ffffff' : '#000000';
      ctx.fillRect(gx, gy, Math.max(1, 1.6 * u), Math.max(1, 1.6 * u));
    }
    ctx.restore();
  }
  if (state.vignette) {
    const vig = ctx.createRadialGradient(
      W / 2, H / 2, Math.min(W, H) * 0.42,
      W / 2, H / 2, Math.max(W, H) * 0.75,
    );
    vig.addColorStop(0, 'rgba(0,0,0,0)');
    vig.addColorStop(1, 'rgba(5,0,15,0.42)');
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, W, H);
  }

  // --- Outer comic frame. ---
  if (state.frame) {
    ctx.save();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = Math.max(4, 10 * u);
    ctx.strokeRect(ctx.lineWidth / 2, ctx.lineWidth / 2, W - ctx.lineWidth, H - ctx.lineWidth);
    ctx.strokeStyle = grade.ink;
    ctx.lineWidth = Math.max(2, 3 * u);
    ctx.strokeRect(Math.max(4, 10 * u) + ctx.lineWidth, Math.max(4, 10 * u) + ctx.lineWidth,
      W - 2 * (Math.max(4, 10 * u) + ctx.lineWidth), H - 2 * (Math.max(4, 10 * u) + ctx.lineWidth));
    ctx.restore();
  }
}
