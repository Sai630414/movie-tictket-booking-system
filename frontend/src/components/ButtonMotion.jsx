import { useEffect } from 'react';

export default function ButtonMotion() {
  useEffect(() => {
    const states = new Map();
    const selector = 'button:not(:disabled), a.btn-primary, a.btn-secondary, a.btn-outline, a[data-motion], .cv-nav-links a';
    let pointer = { x: -1, y: -1, type: 'mouse' }, hovered = null, pressed = null, frame, last = 0;
    const stateFor = element => {
      if (!states.has(element)) { element.classList.add('cv-motion'); states.set(element, { x: 0, y: 0, scale: 1, tx: 0, ty: 0, targetScale: 1 }); }
      return states.get(element);
    };
    const reset = element => { if (!element) return; const state = stateFor(element); state.tx = 0; state.ty = 0; state.targetScale = 1; element.classList.remove('cv-motion-hover'); };
    const tick = time => {
      const delta = Math.min((time - (last || time)) / 1000, .05); last = time;
      const hit = pointer.type === 'touch' ? null : document.elementFromPoint(pointer.x, pointer.y)?.closest(selector);
      if (hit !== hovered) { reset(hovered); hovered = hit; }
      if (hovered) {
        const state = stateFor(hovered), rect = hovered.getBoundingClientRect();
        const x = Math.max(-1, Math.min(1, (pointer.x - rect.left - rect.width / 2) / (rect.width / 2)));
        state.tx = x * 1.6; state.ty = -3; state.targetScale = 1.015;
        hovered.classList.add('cv-motion-hover');
      }
      if (pressed) { const state = stateFor(pressed); state.tx = 0; state.ty = .5; state.targetScale = .975; }
      const blend = 1 - Math.exp(-19 * delta);
      for (const [element, state] of states) {
        if (!element.isConnected) { states.delete(element); continue; }
        state.x += (state.tx - state.x) * blend; state.y += (state.ty - state.y) * blend; state.scale += (state.targetScale - state.scale) * blend;
        element.style.setProperty('--motion-x', `${state.x.toFixed(3)}px`); element.style.setProperty('--motion-y', `${state.y.toFixed(3)}px`); element.style.setProperty('--motion-scale', state.scale.toFixed(5));
        if (element !== hovered && element !== pressed && Math.abs(state.x) < .01 && Math.abs(state.y) < .01 && Math.abs(state.scale - 1) < .0001) {
          for (const name of ['--motion-x', '--motion-y', '--motion-scale']) element.style.removeProperty(name);
          states.delete(element);
        }
      }
      frame = requestAnimationFrame(tick);
    };
    const onMove = event => { pointer = { x: event.clientX, y: event.clientY, type: event.pointerType }; };
    const onDown = event => { onMove(event); pressed = event.target.closest(selector); if (pressed) stateFor(pressed); };
    const onUp = () => { reset(pressed); pressed = null; };
    const onLeave = () => { pointer = { x: -1, y: -1, type: 'mouse' }; onUp(); };
    document.addEventListener('pointermove', onMove); document.addEventListener('pointerdown', onDown); document.addEventListener('pointerup', onUp); document.addEventListener('pointercancel', onUp); document.documentElement.addEventListener('pointerleave', onLeave); window.addEventListener('blur', onLeave);
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame); document.removeEventListener('pointermove', onMove); document.removeEventListener('pointerdown', onDown); document.removeEventListener('pointerup', onUp); document.removeEventListener('pointercancel', onUp); document.documentElement.removeEventListener('pointerleave', onLeave); window.removeEventListener('blur', onLeave);
      for (const [element] of states) { element.classList.remove('cv-motion', 'cv-motion-hover'); for (const name of ['--motion-x', '--motion-y', '--motion-scale']) element.style.removeProperty(name); }
    };
  }, []);
  return null;
}
