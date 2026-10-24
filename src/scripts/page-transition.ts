// Переход «круг из точки клика»: по клику на ссылку с data-circle из точки клика
// разрастается заливка акцентным цветом с названием кейса, затем роутер Astro
// меняет страницу, и новая страница раскрывается кругом из центра (CSS, html[data-vt="circle"]).
// Заливка не переживает смену DOM, но попадает в «старый» снимок View Transition,
// поэтому раскрытие новой страницы идёт поверх неё.
import { gsap } from 'gsap';
import { navigate } from 'astro:transitions/client';

let pending = false;

function cover(x: number, y: number, label: string) {
  const el = document.createElement('div');
  el.className = 'vt-overlay';
  el.innerHTML = `<div class="vt-overlay__inner"><span class="vt-overlay__eyebrow">Кейс</span><span class="vt-overlay__title"></span></div>`;
  el.querySelector('.vt-overlay__title')!.textContent = label;
  document.body.append(el);

  // Радиус до самого дальнего угла экрана.
  const r = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
  const tl = gsap.timeline();
  // Стартуем с размера кольца курсора над карточкой — заливка продолжает его.
  tl.fromTo(el, { clipPath: `circle(52px at ${x}px ${y}px)` }, { clipPath: `circle(${r}px at ${x}px ${y}px)`, duration: 0.75, ease: 'power3.inOut' });
  tl.fromTo(el.querySelector('.vt-overlay__inner'), { y: 40, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.6, ease: 'expo.out' }, 0.35);
  return tl;
}

document.addEventListener(
  'click',
  (e) => {
    const a = (e.target as Element).closest<HTMLAnchorElement>('a[data-circle]');
    if (!a || pending || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    e.preventDefault();
    e.stopImmediatePropagation();

    // С клавиатуры координат клика нет — берём центр ссылки.
    let { clientX: x, clientY: y } = e;
    if (!x && !y) {
      const r = a.getBoundingClientRect();
      x = r.left + r.width / 2;
      y = r.top + r.height / 2;
    }
    pending = true;
    const href = a.href;
    cover(x, y, a.dataset.circle || '').then(() => navigate(href));
  },
  true,
);

document.addEventListener('astro:after-swap', () => {
  if (!pending) return;
  document.documentElement.dataset.vt = 'circle';
  pending = false;
});
