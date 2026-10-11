// Arc length -> cylinder position -> perspective projection, shared by every pixel.
export function filmSurface(x, width) {
  const radius = Math.max(320, width * .9), camera = Math.max(1100, width * 1.3);
  const distance = x - width / 2, limit = 1.15;
  const angle = Math.max(-limit, Math.min(limit, distance / radius));
  const z = radius * (Math.cos(angle) - 1);
  const scale = camera / (camera - z);
  const horizontal = scale * Math.cos(angle) - radius / camera * scale * scale * Math.sin(angle) ** 2;
  const extension = distance - angle * radius;
  return { x: width / 2 + radius * Math.sin(angle) * scale + extension * horizontal,
    center: 137, scale, horizontal, angle, z, camera, radius };
}

const renderers = new WeakMap();
const frameImages = new WeakMap();
const FILM_HEIGHT = 420;
const STRIP_HEIGHT = 218;
const ARTWORK_SCALE = typeof window === 'undefined' ? 2 : Math.max(2, Math.min(window.devicePixelRatio || 1, 3));

function wrapText(ctx, text, width, limit = 2) {
  const lines = []; let line = '';
  for (const word of text.split(/\s+/)) {
    const next = line ? line + ' ' + word : word;
    if (line && ctx.measureText(next).width > width) { lines.push(line); line = word; }
    else line = next;
  }
  if (line) lines.push(line);
  const visible = lines.slice(0, limit);
  if (lines.length > limit) {
    let last = visible[limit - 1];
    while (last && ctx.measureText(last + '...').width > width) last = last.slice(0, -1);
    visible[limit - 1] = last + '...';
  }
  return visible;
}

function frameImage(card) {
  const image = card.querySelector('img'), button = card.querySelector('.cv-book-button,.movie-book');
  const motionY = Number.parseFloat(button?.style.getPropertyValue('--motion-y')) || 0;
  const motionScale = Number.parseFloat(button?.style.getPropertyValue('--motion-scale')) || 1;
  const signature = [card.textContent, image?.currentSrc, image?.naturalWidth, image?.complete,
    Math.round(motionY * 10), Math.round(motionScale * 1000), document.fonts.status].join('|');
  const previous = frameImages.get(card);
  if (previous?.signature === signature) return previous.canvas;
  const canvas = previous?.canvas || document.createElement('canvas');
  canvas.width = 260 * ARTWORK_SCALE; canvas.height = FILM_HEIGHT * ARTWORK_SCALE;
  const ctx = canvas.getContext('2d');
  ctx.setTransform(ARTWORK_SCALE, 0, 0, ARTWORK_SCALE, 0, 0);
  ctx.imageSmoothingQuality = 'high';
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, 260, STRIP_HEIGHT);
  ctx.fillStyle = '#afb3c2';
  for (let x = 7; x < 260; x += 26) {
    ctx.beginPath(); ctx.roundRect(x, 3, 12, 12, 1.5);
    ctx.roundRect(x, STRIP_HEIGHT - 15, 12, 12, 1.5); ctx.fill();
  }
  if (image?.complete && image.naturalWidth) {
    const cover = Math.max(230 / image.naturalWidth, 170 / image.naturalHeight);
    const sw = 230 / cover, sh = 170 / cover;
    ctx.drawImage(image, (image.naturalWidth - sw) / 2, (image.naturalHeight - sh) * .25, sw, sh, 15, 24, 230, 170);
  } else {
    ctx.fillStyle = '#201c2c'; ctx.fillRect(14, 23, 232, 172);
    ctx.fillStyle = '#ded9ea'; ctx.font = '600 13px Manrope';
    wrapText(ctx, card.querySelector('h3')?.textContent || 'Movie', 200).forEach((text, i) => ctx.fillText(text, 25, 104 + i * 20));
  }
  ctx.strokeStyle = '#555966'; ctx.lineWidth = 1; ctx.strokeRect(14.5, 23.5, 231, 171);
  const info = card.querySelector('.cv-movie-info,.movie-info');
  const rating = info?.querySelector('.cv-movie-rating,.poster-rating');
  const format = rating?.lastElementChild?.textContent || '2D';
  const status = rating?.querySelector('.cv-rating-pending')?.textContent || rating?.textContent?.replace(format, '').trim() || 'Now showing';
  ctx.font = '500 12px Manrope'; ctx.fillStyle = '#b8adc8'; ctx.fillText(status, 16, 229);
  ctx.textAlign = 'right'; ctx.fillText(format, 244, 229); ctx.textAlign = 'left';
  ctx.font = '700 17px Manrope'; ctx.fillStyle = '#f3f3f8';
  wrapText(ctx, card.querySelector('h3')?.textContent || 'Movie', 228).forEach((text, i) => ctx.fillText(text, 16, 254 + i * 21));
  const paragraphs = info?.querySelectorAll('p') || [];
  ctx.font = '500 11px Manrope'; ctx.fillStyle = '#a7adc0';
  wrapText(ctx, paragraphs[0]?.textContent || '', 228, 1).forEach(text => ctx.fillText(text, 16, 306));
  wrapText(ctx, paragraphs[1]?.textContent || '', 228, 1).forEach(text => ctx.fillText(text, 16, 328));
  ctx.save(); ctx.translate(130, 362 + motionY); ctx.scale(motionScale, motionScale);
  const gradient = ctx.createLinearGradient(0, -20, 0, 20);
  gradient.addColorStop(0, '#d84860'); gradient.addColorStop(1, '#c3314d'); ctx.fillStyle = gradient;
  ctx.beginPath(); ctx.roundRect(-114, -20, 228, 40, 6); ctx.fill();
  ctx.font = '650 13px Manrope'; ctx.fillStyle = '#fff8fa';
  ctx.fillText(button?.textContent?.trim() || 'Book tickets', -98, 4);
  ctx.strokeStyle = '#fff8fa'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(92, 4); ctx.lineTo(100, -4); ctx.moveTo(92, -4); ctx.lineTo(100, -4); ctx.lineTo(100, 4); ctx.stroke(); ctx.restore();
  frameImages.set(card, { signature, canvas }); return canvas;
}

// Invert the same cylinder once per viewport size, not on every animation frame.
function projectedColumns(width, ratio) {
  const columns = [], geometry = filmSurface(width / 2, width);
  const inverse = px => {
    const target = px - width / 2; let angle = target / geometry.radius;
    for (let i = 0; i < 6; i++) {
      const scale = geometry.camera / (geometry.camera + geometry.radius * (1 - Math.cos(angle)));
      const derivative = geometry.radius * (Math.cos(angle) * scale - geometry.radius / geometry.camera * scale * scale * Math.sin(angle) ** 2);
      angle = Math.max(-1.15, Math.min(1.15, angle - (geometry.radius * Math.sin(angle) * scale - target) / derivative));
    }
    return width / 2 + angle * geometry.radius;
  };
  // Pixel-aligned columns avoid gaps and keep text, buttons and poster art together.
  for (let pixel = 0; pixel < Math.round(width * ratio); pixel += ratio) {
    const x = pixel / ratio, left = inverse(x), right = inverse(x + 1);
    columns.push({ x, world: left, span: right - left, scale: filmSurface((left + right) / 2, width).scale });
  }
  return columns;
}

export function drawFilmRail(canvas, width, position, cards = []) {
  if (!canvas || !width || !cards.length) return;
  const ratio = Math.max(2, Math.min(window.devicePixelRatio || 1, 3)), height = 480;
  let state = renderers.get(canvas);
  if (!state) { state = { flat: document.createElement('canvas'), signature: '' }; renderers.set(canvas, state); }
  if (state.width !== width || state.ratio !== ratio) {
    state.width = width; state.ratio = ratio; state.columns = projectedColumns(width, ratio);
    canvas.width = Math.round(width * ratio); canvas.height = height * ratio;
  }
  const first = Math.max(0, Math.floor((position - width * .25) / 260) - 1);
  const frameCount = Math.ceil(width * 1.5 / 260) + 3;
  const selected = Array.from(cards).slice(first, first + frameCount);
  const frames = selected.map(frameImage);
  const signature = first + ':' + frames.map((frame, i) => frameImages.get(selected[i]).signature).join('|');
  if (state.signature !== signature) {
    state.flat.width = frameCount * 260 * ARTWORK_SCALE; state.flat.height = FILM_HEIGHT * ARTWORK_SCALE;
    const ctx = state.flat.getContext('2d'); frames.forEach((frame, i) => ctx.drawImage(frame, i * 260 * ARTWORK_SCALE, 0));
    state.signature = signature;
  }
  const ctx = canvas.getContext('2d'); ctx.setTransform(ratio, 0, 0, ratio, 0, 0); ctx.clearRect(0, 0, width, height); ctx.imageSmoothingQuality = 'high';
  const offset = position - first * 260;
  for (const column of state.columns) {
    const source = column.world + offset;
    if (source < 0 || (source + column.span) * ARTWORK_SCALE > state.flat.width) continue;
    ctx.drawImage(state.flat, source * ARTWORK_SCALE, 0, column.span * ARTWORK_SCALE, FILM_HEIGHT * ARTWORK_SCALE,
      column.x, 137 - 109 * column.scale, 1, FILM_HEIGHT * column.scale);
  }
}

export function releaseFilmRail(canvas) { renderers.delete(canvas); }
