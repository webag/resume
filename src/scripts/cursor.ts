// Кольцо с обводкой, которое плавно следует за курсором.
// Над ссылками и кнопками увеличивается, над карточками кейсов показывает подпись.
// После смены страницы (View Transitions) перепривязывается к новому элементу .cursor
// и переносит на него позицию — так кольцо не пропадает при переходах.
import { gsap } from 'gsap';

export function initCursor() {
  if (matchMedia('(pointer: coarse)').matches) {
    document.querySelector('.cursor')?.remove();
    return;
  }
  const dur = matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 0.55;

  let el: HTMLElement | null = null;
  let toX: gsap.QuickToFunc | null = null;
  let toY: gsap.QuickToFunc | null = null;
  const pos = { x: 0, y: 0 };
  let visible = false;

  const bind = () => {
    const next = document.querySelector<HTMLElement>('.cursor');
    if (!next || next === el) return;
    el = next;
    gsap.set(el, { x: pos.x, y: pos.y });
    toX = gsap.quickTo(el, 'x', { duration: dur, ease: 'power3.out' });
    toY = gsap.quickTo(el, 'y', { duration: dur, ease: 'power3.out' });
    el.classList.toggle('is-visible', visible);
  };
  bind();
  document.addEventListener('astro:after-swap', bind);

  addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse' || !el) return;
    pos.x = e.clientX;
    pos.y = e.clientY;
    if (!visible) {
      gsap.set(el, { x: pos.x, y: pos.y });
      visible = true;
      el.classList.add('is-visible');
    }
    toX?.(pos.x);
    toY?.(pos.y);
  });
  document.documentElement.addEventListener('pointerleave', () => {
    visible = false;
    el?.classList.remove('is-visible');
  });
  addEventListener('pointerdown', () => el?.classList.add('is-down'));
  addEventListener('pointerup', () => el?.classList.remove('is-down'));

  // Состояние по элементу под курсором: делегирование, чтобы работало после смены страницы.
  document.addEventListener('pointerover', (e) => {
    if (!el) return;
    const t = e.target as Element;
    const card = t.closest('[data-cursor]');
    const link = t.closest('a, button, [role="button"]');
    el.classList.toggle('is-card', !!card);
    el.classList.toggle('is-link', !card && !!link);
    const label = el.querySelector('.cursor-label');
    if (label) label.textContent = card?.getAttribute('data-cursor') ?? '';
  });
}
