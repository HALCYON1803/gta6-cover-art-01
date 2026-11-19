// Neon Coast Cover Studio — presets, layouts and colour grades.
// Everything here is original work for gta6-cover-art-01: six poster layouts,
// six Vice-coast colour grades and six one-click looks. No Rockstar art,
// logos or fonts are used anywhere in this app.

/** One poster layout: panel rectangles in normalised 0..1 space. */
export const LAYOUTS = {
  hero: {
    name: 'Hero Split',
    blurb: 'Big hero photo left, two stacked panels right.',
    panels: (w, h) => {
      const gap = 0.012;
      return [
        { x: 0.02, y: 0.02, w: 0.60, h: 0.96, rot: 0 },
        { x: 0.64, y: 0.02, w: 0.34, h: 0.47, rot: 0 },
        { x: 0.64, y: 0.51, w: 0.34, h: 0.47, rot: 0 },
      ];
    },
    titleZone: () => ({ x: 0.04, y: 0.68, w: 0.92, align: 'left', maxH: 0.28 }),
    panelsCount: 3,
  },
  grid4: {
    name: 'Four Panel',
    blurb: 'Classic 2 x 2 comic grid, title band across the foot.',
    panels: () => {
      const g = 0.014;
      return [
        { x: 0.02, y: 0.02, w: 0.475, h: 0.40, rot: 0 },
        { x: 0.505, y: 0.02, w: 0.475, h: 0.40, rot: 0 },
        { x: 0.02, y: 0.435, w: 0.475, h: 0.40, rot: 0 },
        { x: 0.505, y: 0.435, w: 0.475, h: 0.40, rot: 0 },
      ];
    },
    titleZone: () => ({ x: 0.04, y: 0.845, w: 0.92, align: 'center', maxH: 0.14 }),
    panelsCount: 4,
  },
  strip: {
    name: 'Comic Strip',
    blurb: 'Three stacked cinema bands, title over the top band.',
    panels: () => [
      { x: 0.02, y: 0.02, w: 0.96, h: 0.44, rot: 0 },
      { x: 0.02, y: 0.475, w: 0.475, h: 0.25, rot: 0 },
      { x: 0.505, y: 0.475, w: 0.475, h: 0.25, rot: 0 },
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
};

/** Colour grades: sky gradient, sun, photo tint, title gradient, accent. */
export const GRADES = {
  sunset: {
    name: 'Vice Sunset',
    sky: ['#1b0b3d', '#7b1e6b', '#ff5e62', '#ff9a3d', '#ffd166'],
    sun: '#fff3b0',
    photoTint: 'rgba(255, 110, 60, 0.16)',
    photoFilter: 'saturate(1.35) contrast(1.08)',
    titleGrad: ['#fff7ae', '#ffb347', '#ff5e62', '#ff2e88'],
    accent: '#2de2ff',
    ink: '#12041f',
  },
  neon: {
    name: 'Neon Night',
    sky: ['#05001a', '#1b0f4b', '#7b1e9e', '#ff2e88', '#00e5ff'],
    sun: '#ff9de2',
    photoTint: 'rgba(0, 229, 255, 0.14)',
    photoFilter: 'saturate(1.5) contrast(1.12)',
    titleGrad: ['#a5f3ff', '#2de2ff', '#ff2e88', '#ff8ad8'],
    accent: '#ffe600',
    ink: '#05001a',
  },
  gold: {
    name: 'Palm Gold',
    sky: ['#241203', '#7a3b06', '#e07b1f', '#ffc53d', '#fff1a8'],
    sun: '#fffbe6',
    photoTint: 'rgba(255, 180, 40, 0.18)',
    photoFilter: 'saturate(1.25) contrast(1.05)',
    titleGrad: ['#fffbe6', '#ffd166', '#ff9a3d', '#c25e00'],
    accent: '#7b1e6b',
    ink: '#241203',
  },
  teal: {
    name: 'Teal Noir',
    sky: ['#02141a', '#06333d', '#0e6b6b', '#2de2c0', '#b8fff1'],
    sun: '#e6fff8',
    photoTint: 'rgba(45, 226, 192, 0.13)',
    photoFilter: 'saturate(1.2) contrast(1.14)',
    titleGrad: ['#e6fff8', '#7df9dd', '#2de2c0', '#0e6b6b'],
    accent: '#ff5e62',
    ink: '#02141a',
  },
  pink: {
    name: 'Hot Pink',
    sky: ['#2b0033', '#7b0f5c', '#e0218a', '#ff6fb5', '#ffc2e2'],
    sun: '#ffe9f6',
    photoTint: 'rgba(224, 33, 138, 0.16)',
    photoFilter: 'saturate(1.45) contrast(1.08)',
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

/** One-click looks: layout + grade + words + effects in a single tap. */
export const PRESETS = [
  {
    id: 'sunset-heist', name: 'Sunset Heist', layout: 'hero', grade: 'sunset',
    title: 'NEON COAST', subtitle: 'Sunset Heist', tagline: 'PALMS  •  NEON  •  GOLDEN HOUR',
    badge: 'EST. 2026', heat: 5, grain: true, vignette: true, halftone: true, rays: true, palms: true,
  },
  {
    id: 'neon-nights', name: 'Neon Nights', layout: 'tilted', grade: 'neon',
    title: 'NIGHT SHIFT', subtitle: 'Neon Nights', tagline: 'THE CITY NEVER SLEEPS',
    badge: 'AFTER DARK', heat: 4, grain: true, vignette: true, halftone: false, rays: false, palms: true,
  },
  {
    id: 'palm-gold', name: 'Palm Gold', layout: 'grid4', grade: 'gold',
    title: 'BOULEVARD QUEEN', subtitle: 'Palm Gold', tagline: 'TOP DOWN  •  GOLDEN HOUR  •  COAST ROAD',
    badge: 'NO. 1', heat: 5, grain: true, vignette: true, halftone: true, rays: true, palms: true,
  },
  {
    id: 'night-shift', name: 'Night Shift', layout: 'strip', grade: 'teal',
    title: 'PIER PRESSURE', subtitle: 'Night Shift', tagline: 'SALT AIR  •  NEON SIGNS  •  LOW TIDE',
    badge: 'LIVE', heat: 3, grain: true, vignette: true, halftone: false, rays: false, palms: false,
  },
  {
    id: 'hot-pink', name: 'Hot Pink', layout: 'fullbleed', grade: 'pink',
    title: 'HOT PINK', subtitle: 'Vice Nights', tagline: 'DANCE  •  DRIVE  •  DISAPPEAR',
    badge: '18+', heat: 5, grain: false, vignette: true, halftone: true, rays: true, palms: true,
  },
  {
    id: 'noir', name: 'Midnight Noir', layout: 'nine', grade: 'noir',
    title: 'LAST CALL', subtitle: 'Midnight Noir', tagline: 'EVERY STORY ENDS AT THE PIER',
    badge: 'FINAL', heat: 4, grain: true, vignette: true, halftone: true, rays: false, palms: true,
  },
];

/** The three post sizes the bounty asks for, exact pixels. */
export const EXPORT_SIZES = [
  { id: '1080x1080', label: 'Square · 1080 × 1080', w: 1080, h: 1080 },
  { id: '1080x1350', label: 'Portrait · 1080 × 1350', w: 1080, h: 1350 },
  { id: '1920x1080', label: 'Wide · 1920 × 1080', w: 1920, h: 1080 },
];

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
    grain: true,
    vignette: true,
    halftone: true,
    rays: true,
    palms: true,
    frame: true,
    selectedPanel: 0,
    // one slot per possible panel (max 8); each picks a photo index and a crop.
    panels: Array.from({ length: 8 }, (_, i) => ({
      photo: i % 2, zoom: 1, ox: 0, oy: 0,
    })),
  };
}
