/*
 * Wellness storefront effects: staggered scroll reveal, product carousel arrows, hero parallax.
 * Everything is optional polish; the page works without it.
 */
(() => {
  'use strict';
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- staggered reveal ---------- */
  const targets = '.wn__tile, .template-index .product-card, .wb__item, .wr__card, .trust-bar__item, .wf details, .section-heading, .wv__copy, .wb__media';
  if ('IntersectionObserver' in window && !reduce) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    $$(targets).forEach((el) => {
      const siblings = el.parentElement ? Array.from(el.parentElement.children).filter((c) => c.matches(targets)) : [el];
      el.style.setProperty('--i', Math.min(siblings.indexOf(el), 6));
      el.setAttribute('data-rv', '');
      io.observe(el);
    });
  }

  /* ---------- carousel ---------- */
  $$('[data-carousel]').forEach((track) => {
    const section = track.closest('section');
    const prev = section && section.querySelector('[data-carousel-prev]');
    const next = section && section.querySelector('[data-carousel-next]');
    if (!prev || !next) return;
    const step = () => Math.max(track.clientWidth * 0.8, 240);
    const sync = () => {
      prev.disabled = track.scrollLeft < 4;
      next.disabled = track.scrollLeft + track.clientWidth >= track.scrollWidth - 4;
    };
    prev.addEventListener('click', () => track.scrollBy({ left: -step(), behavior: reduce ? 'auto' : 'smooth' }));
    next.addEventListener('click', () => track.scrollBy({ left: step(), behavior: reduce ? 'auto' : 'smooth' }));
    track.addEventListener('scroll', sync, { passive: true });
    window.addEventListener('resize', sync);
    sync();
  });

  /* ---------- hero parallax (pointer devices only) ---------- */
  const stage = document.querySelector('[data-parallax]');
  if (stage && !reduce && window.matchMedia('(hover: hover)').matches) {
    const media = stage.querySelector('.wh-hero__frame img, .wh-hero__frame video');
    const chips = $$('.wh-chip', stage);
    let frame = 0;
    stage.closest('.wh-hero').addEventListener('pointermove', (event) => {
      const r = stage.getBoundingClientRect();
      const x = (event.clientX - (r.left + r.width / 2)) / r.width;
      const y = (event.clientY - (r.top + r.height / 2)) / r.height;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (media) media.style.transform = `scale(1.08) translate(${x * -14}px, ${y * -14}px)`;
        chips.forEach((chip, i) => { chip.style.transform = `translate(${x * (i ? 22 : -22)}px, ${y * (i ? 16 : -16)}px)`; });
      });
    });
  }
})();
