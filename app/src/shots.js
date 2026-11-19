// Neon Coast Cover Studio — fixed screenshot scenes.
// `?shot=cover` draws one cover full-frame (the exported art, at the size
// the query asks for); `?shot=editor` shows the editor with all four
// sample photos loaded. The app sets window.__shotReady once the scene
// has painted, so a screenshot tool knows when to shoot. No photo here
// is a real person without consent: the samples are model-made images
// shipped with the app.
export async function runShot(shot, query, api) {
  const caption = query.get('caption') || 'Neon Coast';
  const layout = query.get('layout') || 'hero';
  const grade = query.get('grade') || 'sunset';
  const preset = query.get('preset') || '';
  const size = query.get('size') || '1920x1080';

  if (shot === 'cover') document.body.classList.add('shot-cover');
  if (preset) {
    api.applyPreset(preset);
  } else {
    api.setLayout(layout);
    api.setGrade(grade);
    api.setTitle(caption);
  }
  // Load every sample, so each panel shows a different photo.
  await api.loadAllSamples();
  if (shot === 'cover') api.setExportSize(size);
  api.redraw();
  await api.fontsReady();
  api.redraw();
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  window.__shotReady = true;
}
