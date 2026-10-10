const copyComputedStyles = (source, target) => {
  const computed = window.getComputedStyle(source);
  const declarations = Array.from(computed)
    .map(property => `${property}:${computed.getPropertyValue(property)};`)
    .join('');
  target.setAttribute('style', declarations);

  Array.from(source.children).forEach((child, index) => {
    if (target.children[index]) copyComputedStyles(child, target.children[index]);
  });
};

export const downloadElementAsJpg = async (element, fileName = 'cineverse-ticket.jpg') => {
  if (!element) throw new Error('Ticket is not ready to download.');

  await document.fonts?.ready;
  const bounds = element.getBoundingClientRect();
  const width = Math.ceil(bounds.width);
  const height = Math.ceil(Math.max(bounds.height, element.scrollHeight));
  if (!width || !height) throw new Error('Ticket is not visible. Please try again.');

  const clone = element.cloneNode(true);
  copyComputedStyles(element, clone);
  clone.querySelectorAll('[data-ticket-download-exclude]').forEach(node => node.remove());
  clone.style.setProperty('animation', 'none', 'important');
  clone.style.setProperty('transform', 'none', 'important');
  clone.style.setProperty('opacity', '1', 'important');
  clone.style.setProperty('max-height', 'none', 'important');
  clone.style.setProperty('overflow', 'visible', 'important');
  clone.style.setProperty('width', `${width}px`, 'important');
  clone.style.setProperty('height', 'auto', 'important');
  clone.style.setProperty('margin', '0', 'important');

  await Promise.all(Array.from(clone.querySelectorAll('img')).map(image => image.decode?.().catch(() => undefined)));
  const markup = new XMLSerializer().serializeToString(clone);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><foreignObject width="100%" height="100%"><div xmlns="http://www.w3.org/1999/xhtml" style="width:${width}px;background:#fff">${markup}</div></foreignObject></svg>`;
  const svgUrl = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }));

  try {
    const image = new Image();
    image.src = svgUrl;
    await new Promise((resolve, reject) => {
      image.onload = resolve;
      image.onerror = () => reject(new Error('Could not render the ticket image.'));
    });

    const scale = 2;
    const canvas = document.createElement('canvas');
    canvas.width = width * scale;
    canvas.height = height * scale;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Could not create the ticket image.');
    context.fillStyle = '#fff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.scale(scale, scale);
    context.drawImage(image, 0, 0, width, height);

    const jpg = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.95));
    if (!jpg) throw new Error('Could not create the JPG file.');

    const downloadUrl = URL.createObjectURL(jpg);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = fileName.replace(/[^a-z0-9._-]/gi, '_').replace(/\.jpg$/i, '') + '.jpg';
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
  } finally {
    URL.revokeObjectURL(svgUrl);
  }
};
