// Плавный скролл (Lenis) и анимации появления (GSAP + ScrollTrigger).
// Работает вместе с Astro View Transitions: инициализируется на каждом astro:page-load
// и очищается перед заменой страницы.
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const EASE = 'expo.out';

let lenis: Lenis | null = null;
let ctx: gsap.Context | null = null;

gsap.ticker.add((t) => lenis?.raf(t * 1000));
gsap.ticker.lagSmoothing(0);

function initLenis() {
  if (reduced()) return;
  lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 0.9 });
  lenis.on('scroll', ScrollTrigger.update);
}

// Отступ под плавающую шапку.
const navOffset = () => -((document.querySelector('.nav')?.getBoundingClientRect().bottom ?? 0) + 24);

function scrollToHash(hash: string, immediate = false) {
  const el = hash.length > 1 ? document.getElementById(decodeURIComponent(hash.slice(1))) : null;
  if (!el) return false;
  if (lenis) lenis.scrollTo(el, { offset: navOffset(), immediate, duration: 1.4 });
  else scrollTo({ top: el.getBoundingClientRect().top + scrollY + navOffset(), behavior: immediate ? 'instant' : 'smooth' });
  return true;
}

// Якоря на текущей странице обрабатываем сами (в фазе захвата, раньше роутера Astro):
// иначе роутер и Lenis прокручивают одновременно и мешают друг другу.
document.addEventListener(
  'click',
  (e) => {
    const a = (e.target as Element).closest<HTMLAnchorElement>('a[href*="#"]');
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) return;
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin || url.pathname !== location.pathname || !url.hash) return;
    if (!scrollToHash(url.hash)) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    history.replaceState(history.state, '', url.hash);
  },
  true,
);

// Слова заголовка выезжают из-под маски одно за другим.
const words = (el: Element) => el.querySelectorAll('.w > span');

function revealSplit(el: Element, delay = 0) {
  // y: 0 обязателен: GSAP читает translateY(115%) из CSS как пиксельный y.
  return gsap.fromTo(words(el), { y: 0, yPercent: 115 }, { y: 0, yPercent: 0, duration: 1.1, ease: EASE, stagger: 0.05, delay });
}

function revealBlocks(els: Element[], stagger = 0.09) {
  return gsap.fromTo(
    els,
    { autoAlpha: 0, y: 48 },
    { autoAlpha: 1, y: 0, duration: 1.15, ease: EASE, stagger, clearProps: 'transform' },
  );
}

function countUp(el: HTMLElement) {
  const raw = el.textContent ?? '';
  const m = raw.match(/^(\d+)(.*)$/);
  if (!m) return;
  const obj = { v: 0 };
  gsap.to(obj, {
    v: Number(m[1]),
    duration: 1.8,
    ease: 'power3.out',
    onUpdate: () => (el.textContent = Math.round(obj.v) + m[2]),
  });
}

function initReveals() {
  ctx = gsap.context(() => {
    // Первый экран — одна последовательная timeline.
    const intro = document.querySelector<HTMLElement>('[data-intro]');
    if (intro && !intro.dataset.shown) {
      const tl = gsap.timeline({ delay: 0.15 });
      intro.querySelectorAll('.split').forEach((el, i) => tl.add(revealSplit(el), i * 0.12));
      tl.add(revealBlocks([...intro.querySelectorAll('[data-intro-item]')], 0.1), 0.35);
      const media = intro.querySelector('[data-intro-media]');
      if (media) {
        tl.fromTo(media, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.4, ease: 'expo.inOut' }, 0.2);
        tl.fromTo(media.querySelector('img'), { scale: 1.25 }, { scale: 1, duration: 1.8, ease: EASE }, 0.2);
      }
      intro.querySelectorAll<HTMLElement>('[data-count]').forEach((el) => tl.add(() => countUp(el), 0.6));
    }

    // Заголовки секций.
    gsap.utils.toArray<HTMLElement>('.split:not([data-intro] .split):not([data-shown])').forEach((el) => {
      ScrollTrigger.create({ trigger: el, start: 'top 90%', once: true, onEnter: () => revealSplit(el) });
    });

    // Блоки появляются пачками, внутри пачки — по очереди.
    ScrollTrigger.batch('[data-reveal]', {
      start: 'top 92%',
      once: true,
      onEnter: (els) => revealBlocks(els.filter((e) => !(e as HTMLElement).dataset.shown)),
    });

    // Лёгкий параллакс картинок в карточках.
    gsap.utils.toArray<HTMLElement>('[data-parallax] img').forEach((img) => {
      gsap.fromTo(img, { yPercent: -2.5 }, {
        yPercent: 2.5,
        ease: 'none',
        scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom top', scrub: true },
      });
    });
  });
}

function initFilters() {
  const buttons = document.querySelectorAll<HTMLButtonElement>('.filter');
  const cards = [...document.querySelectorAll<HTMLElement>('.card')];
  buttons.forEach((btn) =>
    btn.addEventListener('click', () => {
      const f = btn.dataset.filter;
      buttons.forEach((b) => b.classList.toggle('is-active', b === btn));
      cards.forEach((c) => (c.hidden = f !== 'all' && c.dataset.type !== f));
      const visible = cards.filter((c) => !c.hidden);
      visible.forEach((c) => (c.dataset.shown = '1'));
      if (!reduced()) revealBlocks(visible.slice(0, 12), 0.05);
      ScrollTrigger.refresh();
    }),
  );
}

const INDEX = import.meta.env.BASE_URL;

// Что известно о последней навигации роутера.
let navType: string = 'load'; // push | replace | traverse; при traverse позицию восстанавливает роутер
let cameFromIndex = false; // текущую страницу открыли прямо с главной
let goingToIndex = false;
document.addEventListener('astro:before-preparation', (e) => {
  const ev = e as Event & { navigationType: string; from: URL; to: URL };
  navType = ev.navigationType;
  cameFromIndex = ev.from.pathname === INDEX && ev.to.pathname !== INDEX;
  goingToIndex = ev.to.pathname === INDEX && ev.from.pathname !== INDEX;
});

// «Все кейсы»: если кейс открыли прямо с главной — возвращаемся назад по истории,
// чтобы восстановилась позиция скролла и обложка «улетела» обратно в карточку.
// Иначе (например, перешли из кейса в кейс) — обычный переход к #cases.
function initBackLinks() {
  document.querySelectorAll<HTMLAnchorElement>('[data-back]').forEach((a) =>
    a.addEventListener('click', (e) => {
      if (!cameFromIndex) return;
      e.preventDefault();
      history.back();
    }),
  );
}

document.addEventListener('astro:after-swap', () => {
  // Направление для CSS: обратный переход на главную анимируется быстрее.
  document.documentElement.dataset.vt = goingToIndex ? 'back' : 'forward';
  // При возврате на главную всё показываем сразу: морф обложки должен «приземлиться»
  // в видимую карточку, а повторно проигрывать интро незачем.
  if (!document.querySelector('[data-intro]')) return;
  document.querySelectorAll<HTMLElement>('[data-intro], [data-reveal], .split').forEach((el) => (el.dataset.shown = '1'));
});

function setup() {
  initLenis();
  initFilters();
  initBackLinks();
  // Переход по ссылке вида /#ai с другой страницы или открытие такой ссылки: учесть шапку.
  if (location.hash && navType !== 'traverse') requestAnimationFrame(() => scrollToHash(location.hash, true));
  if (reduced()) {
    document.documentElement.classList.add('no-motion');
    return;
  }
  initReveals();
  // Пересчитать позиции после загрузки шрифтов и картинок.
  document.fonts?.ready.then(() => ScrollTrigger.refresh());
}

function teardown() {
  ctx?.revert();
  ctx = null;
  ScrollTrigger.getAll().forEach((t) => t.kill());
  lenis?.destroy();
  lenis = null;
}

document.addEventListener('astro:page-load', setup);
document.addEventListener('astro:before-swap', teardown);
