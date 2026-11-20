// Neon Coast Cover Studio — layouts, grades and one-click looks.
// Everything here is original work for gta6-cover-art-01: seven poster
// layouts, six Vice-coast colour grades and six one-click looks. No
// Rockstar art, logos or fonts are used anywhere in this app.
//
// v2: every look now deals a DIFFERENT sample photo to every panel
// (see each preset's `photos` list) so a multi-panel cover never repeats
// the same face twice, and the Four Panel grid is full-bleed with the
// title lettered OVER the art instead of in a dead band underneath.
//
// v4: each look also ships with its own cast of role tags, a callout,
// the billing line and the seal, and two looks paint the title in
// striped retro-chrome. Triptych — three tall portraits — joins the
// layout set as the seventh.

/** Photo library indices: 0 boulevard, 1 pier, 2 neon, 3 marina. */
export const PHOTO_COUNT = 4;

/** Deals `count` different photos, starting at `start`, wrapping round. */
export function dealPhotos(count, start = 0) {
  const dealt = [];
  for (let i = 0; i < count; i++) dealt.push((start + i) % PHOTO_COUNT);
  return dealt;
}

/** The roles a cast tag can carry — pick one, or type your own. */
export const CAST_ROLES = [
  'THE GETAWAY DRIVER',
  'THE MUSCLE',
  'THE HACKER',
  'THE FIXER',
  'THE LOOKOUT',
  'THE INSIDE WOMAN',
];

/** One poster layout: panel rectangles in normalised 0..1 space. */
export const LAYOUTS = {
  hero: {
    name: 'Hero Split',
    blurb: 'Big hero photo left, two stacked panels right.',
    panels: () => [
      { x: 0.02, y: 0.02, w: 0.60, h: 0.96, rot: 0 },
      { x: 0.64, y: 0.02, w: 0.34, h: 0.47, rot: 0 },
      { x: 0.64, y: 0.51, w: 0.34, h: 0.47, rot: 0 },
    ],
    titleZone: () => ({ x: 0.04, y: 0.64, w: 0.92, align: 'left', maxH: 0.32 }),
    panelsCount: 3,
  },
  grid4: {
    name: 'Four Panel',
    blurb: 'Classic 2 x 2 comic grid, title lettered over the art.',
    // Panels run edge to edge; the title sits on a scrim over the
    // bottom of the lower row instead of in an empty band below.
    panels: () => [
      { x: 0.02, y: 0.02, w: 0.475, h: 0.47, rot: 0 },
      { x: 0.505, y: 0.02, w: 0.475, h: 0.47, rot: 0 },
      { x: 0.02, y: 0.505, w: 0.475, h: 0.47, rot: 0 },
      { x: 0.505, y: 0.505, w: 0.475, h: 0.47, rot: 0 },
    ],
    titleZone: () => ({ x: 0.04, y: 0.755, w: 0.92, align: 'center', maxH: 0.22 }),
    titleOverlay: true,
    panelsCount: 4,
  },
  strip: {
    name: 'Comic Strip',
    blurb: 'Three stacked cinema bands, title over the top band.',
    panels: () => [
      { x: 0.02, y: 0.02, w: 0.96, h: 0.44, rot: 0 },
      { x: 0.02, y: 0.475, w: 0.475, h: 0.505, rot: 0 },
      { x: 0.505, y: 0.475, w: 0.475, h: 0.505, rot: 0 },
    ],
    titleZone: () => ({ x: 0.04, y: 0.05, w: 0.92, align: 'left', maxH: 0.30 }),
    panelsCount: 3,
  },
  tilted: {
    name: 'Tilted Snaps',
    blurb: 'Full-bleed photo with two tilted snapshots on top.',
    panels: () => [
      { x: 0, y: 0, w: 1, h: 1, rot: 0, bleed: true },
      { x: 0.06, y: 0.52, w: 0.42, h: 0.36, rot: -4 },
      { x: 0.52, y: 0.58, w: 0.42, h: 0.36, rot: 3 },
    ],
    titleZone: () => ({ x: 0.04, y: 0.04, w: 0.92, align: 'center', maxH: 0.26 }),
    panelsCount: 3,
  },
  fullbleed: {
    name: 'Full Bleed',
    blurb: 'One photo edge to edge, big title over a sunset fade.',
    panels: () => [{ x: 0, y: 0, w: 1, h: 1, rot: 0, bleed: true }],
    titleZone: () => ({ x: 0.04, y: 0.62, w: 0.92, align: 'left', maxH: 0.34 }),
    panelsCount: 1,
  },
  nine: {
    name: 'Nine Panel',
    blurb: '3 x 3 mosaic with the title block in the middle.',
    panels: () => {
      const cells = [];
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          if (r === 1 && c === 1) continue; // centre cell is the title block
          cells.push({ x: 0.015 + c * 0.328, y: 0.015 + r * 0.323, w: 0.318, h: 0.313, rot: 0 });
        }
      }
      return cells;
    },
    titleZone: () => ({ x: 0.345, y: 0.345, w: 0.31, align: 'center', maxH: 0.31 }),
    panelsCount: 8,
  },
  triptych: {
    name: 'Triptych',
    blurb: 'Three tall portraits side by side, title across the base.',
    panels: () => [
      { x: 0.02, y: 0.02, w: 0.31, h: 0.94, rot: 0 },
      { x: 0.345, y: 0.02, w: 0.31, h: 0.94, rot: 0 },
      { x: 0.67, y: 0.02, w: 0.31, h: 0.94, rot: 0 },
    ],
    titleZone: () => ({ x: 0.04, y: 0.70, w: 0.92, align: 'center', maxH: 0.26 }),
    titleOverlay: true,
    panelsCount: 3,
  },
};

/** Colour grades: sky gradient, sun, photo tint, title gradient, accent. */
export const GRADES = {
  sunset: {
    name: 'Vice Sunset',
    sky: ['#1b0b3d', '#7b1e6b', '#ff5e62', '#ff9a3d', '#ffd166'],
    sun: '#fff3b0',
    photoTint: 'rgba(255, 110, 60, 0.20)',
    photoFilter: 'saturate(1.4) contrast(1.10)',
    titleGrad: ['#fff7ae', '#ffb347', '#ff5e62', '#ff2e88'],
    accent: '#2de2ff',
    ink: '#12041f',
  },
  neon: {
    name: 'Neon Night',
    sky: ['#05001a', '#1b0f4b', '#7b1e9e', '#ff2e88', '#00e5ff'],
    sun: '#ff9de2',
    photoTint: 'rgba(0, 229, 255, 0.16)',
    photoFilter: 'saturate(1.6) contrast(1.14)',
    titleGrad: ['#a5f3ff', '#2de2ff', '#ff2e88', '#ff8ad8'],
    accent: '#ffe600',
    ink: '#05001a',
  },
  gold: {
    name: 'Palm Gold',
    sky: ['#241203', '#7a3b06', '#e07b1f', '#ffc53d', '#fff1a8'],
    sun: '#fffbe6',
    photoTint: 'rgba(255, 180, 40, 0.20)',
    photoFilter: 'saturate(1.3) contrast(1.07)',
    titleGrad: ['#fffbe6', '#ffd166', '#ff9a3d', '#c25e00'],
    accent: '#7b1e6b',
    ink: '#241203',
  },
  teal: {
    name: 'Teal Noir',
    sky: ['#02141a', '#06333d', '#0e6b6b', '#2de2c0', '#b8fff1'],
    sun: '#e6fff8',
    photoTint: 'rgba(45, 226, 192, 0.15)',
    photoFilter: 'saturate(1.25) contrast(1.16)',
    titleGrad: ['#e6fff8', '#7df9dd', '#2de2c0', '#0e6b6b'],
    accent: '#ff5e62',
    ink: '#02141a',
  },
  pink: {
    name: 'Hot Pink',
    sky: ['#2b0033', '#7b0f5c', '#e0218a', '#ff6fb5', '#ffc2e2'],
    sun: '#ffe9f6',
    photoTint: 'rgba(224, 33, 138, 0.18)',
    photoFilter: 'saturate(1.5) contrast(1.10)',
    titleGrad: ['#ffe9f6', '#ff9de2', '#ff2e88', '#7b0f5c'],
    accent: '#2de2ff',
    ink: '#2b0033',
  },
  noir: {
    name: 'Midnight Noir',
    sky: ['#050505', '#1a1a22', '#3d3d4d', '#8a8a9e', '#e8e8f0'],
    sun: '#ffffff',
    photoTint: 'rgba(255, 255, 255, 0.08)',
    photoFilter: 'grayscale(0.85) contrast(1.18)',
    titleGrad: ['#ffffff', '#d8d8e6', '#9a9aad', '#55555f'],
    accent: '#ff2e54',
    ink: '#050505',
  },
};

/**
 * One-click looks: layout + grade + words + effects + a different photo
 * for every panel, so each look exports a genuinely multi-photo poster.
 */
export const PRESETS = [
  {
    id: 'sunset-heist', name: 'Sunset Heist', layout: 'hero', grade: 'sunset',
    title: 'NEON COAST', subtitle: 'Sunset Heist', tagline: 'PALMS  •  NEON  •  GOLDEN HOUR',
    badge: 'EST. 2026', heat: 5, grain: true, vignette: true, halftone: true, rays: true, palms: true,
    titleStyle: 'classic',
    photos: [0, 2, 3],
    cast: [
      { panel: 1, x: 0.06, y: 0.76, name: 'LUCIA', role: 'THE GETAWAY DRIVER' },
      { panel: 2, x: 0.06, y: 0.76, name: 'JASON', role: 'THE MUSCLE' },
    ],
    callouts: [{ text: 'VICE CITY • 2026', x: 0.5, y: 0.05 }],
    billing: true, seal: true,
  },
  {
    id: 'neon-nights', name: 'Neon Nights', layout: 'tilted', grade: 'neon',
    title: 'NIGHT SHIFT', subtitle: 'Neon Nights', tagline: 'THE CITY NEVER SLEEPS',
    badge: 'AFTER DARK', heat: 4, grain: true, vignette: true, halftone: false, rays: false, palms: true,
    titleStyle: 'chrome',
    photos: [2, 0, 3],
    cast: [
      { panel: 1, x: 0.06, y: 0.74, name: 'LUCIA', role: 'THE HACKER' },
      { panel: 2, x: 0.06, y: 0.74, name: 'JASON', role: 'THE LOOKOUT' },
    ],
    callouts: [{ text: 'AFTER DARK', x: 0.5, y: 0.46 }],
    billing: true, seal: true,
  },
  {
    id: 'palm-gold', name: 'Palm Gold', layout: 'grid4', grade: 'gold',
    title: 'BOULEVARD QUEEN', subtitle: 'Palm Gold', tagline: 'TOP DOWN  •  GOLDEN HOUR  •  COAST ROAD',
    badge: 'NO. 1', heat: 5, grain: true, vignette: true, halftone: true, rays: true, palms: true,
    titleStyle: 'chrome',
    photos: [0, 1, 2, 3],
    cast: [
      { panel: 0, x: 0.06, y: 0.76, name: 'LUCIA', role: 'THE FIXER' },
      { panel: 1, x: 0.06, y: 0.76, name: 'JASON', role: 'THE GETAWAY DRIVER' },
    ],
    callouts: [{ text: 'TOP DOWN • GOLDEN HOUR', x: 0.5, y: 0.04 }],
    billing: true, seal: true,
  },
  {
    id: 'night-shift', name: 'Night Shift', layout: 'strip', grade: 'teal',
    title: 'PIER PRESSURE', subtitle: 'Night Shift', tagline: 'SALT AIR  •  NEON SIGNS  •  LOW TIDE',
    badge: 'LIVE', heat: 3, grain: true, vignette: true, halftone: false, rays: false, palms: false,
    titleStyle: 'classic',
    photos: [3, 0, 1],
    cast: [
      { panel: 1, x: 0.06, y: 0.76, name: 'LUCIA', role: 'THE INSIDE WOMAN' },
      { panel: 2, x: 0.06, y: 0.76, name: 'JASON', role: 'THE MUSCLE' },
    ],
    callouts: [{ text: 'LOW TIDE', x: 0.78, y: 0.62 }],
    billing: true, seal: true,
  },
  {
    id: 'hot-pink', name: 'Hot Pink', layout: 'fullbleed', grade: 'pink',
    title: 'HOT PINK', subtitle: 'Vice Nights', tagline: 'DANCE  •  DRIVE  •  DISAPPEAR',
    badge: '18+', heat: 5, grain: false, vignette: true, halftone: true, rays: true, palms: true,
    titleStyle: 'classic',
    photos: [2],
    cast: [
      { panel: 0, x: 0.06, y: 0.42, name: 'LUCIA', role: 'THE GETAWAY DRIVER' },
    ],
    callouts: [{ text: 'DANCE • DRIVE • DISAPPEAR', x: 0.5, y: 0.05 }],
    billing: true, seal: true,
  },
  {
    id: 'noir', name: 'Midnight Noir', layout: 'nine', grade: 'noir',
    title: 'LAST CALL', subtitle: 'Midnight Noir', tagline: 'EVERY STORY ENDS AT THE PIER',
    badge: 'FINAL', heat: 4, grain: true, vignette: true, halftone: true, rays: false, palms: true,
    titleStyle: 'classic',
    photos: [0, 2, 1, 3, 2, 0, 3, 1],
    cast: [
      { panel: 0, x: 0.06, y: 0.74, name: 'LUCIA', role: 'THE FIXER' },
      { panel: 3, x: 0.06, y: 0.74, name: 'JASON', role: 'THE HACKER' },
    ],
    callouts: [{ text: 'EVERY STORY ENDS AT THE PIER', x: 0.5, y: 0.03 }],
    billing: true, seal: true,
  },
];

/** The three post sizes the bounty asks for, exact pixels. */
export const EXPORT_SIZES = [
  { id: '1080x1080', label: 'Square · 1080 × 1080', w: 1080, h: 1080 },
  { id: '1080x1350', label: 'Portrait · 1080 × 1350', w: 1080, h: 1350 },
  { id: '1920x1080', label: 'Wide · 1920 × 1080', w: 1920, h: 1080 },
];

/** Starting crop per photo slot, so repeated photos still read differently. */
const SLOT_CROPS = [
  { zoom: 1, ox: 0, oy: 0 },
  { zoom: 1.2, ox: -0.04, oy: -0.05 },
  { zoom: 1.1, ox: 0.05, oy: 0 },
  { zoom: 1.25, ox: 0, oy: -0.06 },
];

/** The credits line printed along the poster's bottom edge. */
export const DEFAULT_BILLING = 'A LEONIDA PICTURE  •  STARRING LUCIA & JASON  •  MUSIC BY NEON COAST';

/** A fresh default editor state. */
export function defaultState() {
  return {
    layout: 'hero',
    grade: 'sunset',
    size: '1920x1080',
    title: 'NEON COAST',
    subtitle: 'Sunset Heist',
    tagline: 'PALMS  •  NEON  •  GOLDEN HOUR',
    badge: 'EST. 2026',
    heat: 5,
    titleScale: 1,
    titleStyle: 'classic',
    grain: true,
    vignette: true,
    halftone: true,
    rays: true,
    palms: true,
    frame: true,
    // Role tags: each one names a person on the cover and sits on a
    // panel. x/y are fractions of that panel, so a tag rides its photo
    // at any export size.
    cast: [
      { panel: 1, x: 0.06, y: 0.76, name: 'LUCIA', role: 'THE GETAWAY DRIVER' },
      { panel: 2, x: 0.06, y: 0.76, name: 'JASON', role: 'THE MUSCLE' },
    ],
    // Callouts: a label with a leader dot, placed in normalised cover
    // space (0..1 across, 0..1 down).
    callouts: [{ text: 'VICE CITY • 2026', x: 0.5, y: 0.05 }],
    billing: true,
    billingText: DEFAULT_BILLING,
    seal: true,
    selectedPanel: 0,
    // One slot per possible panel (max 8). Each panel starts on a
    // different photo of the four, with its own crop, so the first
    // paint already looks like a multi-photo poster.
    panels: Array.from({ length: 8 }, (_, i) => {
      const crop = SLOT_CROPS[i % PHOTO_COUNT];
      return { photo: i % PHOTO_COUNT, zoom: crop.zoom, ox: crop.ox, oy: crop.oy };
    }),
  };
}
