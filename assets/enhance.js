/*
 * Storefront enhancements: bag drawer, predictive search, saved items, product options, zoom, filters.
 * Everything degrades to the normal Shopify pages and forms when JavaScript is unavailable.
 */
(() => {
  'use strict';

  const cfg = window.themeConfig || { currency: 'USD', locale: 'en', routes: {} };
  const R = cfg.routes || {};
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  const store = {
    get(key, fallback) {
      try { const v = JSON.parse(localStorage.getItem(key)); return v ?? fallback; } catch { return fallback; }
    },
    set(key, value) {
      try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage can be disabled */ }
    },
  };

  const announce = (message) => {
    const region = $('[data-announce]');
    if (!region) return;
    region.textContent = '';
    window.setTimeout(() => { region.textContent = message; }, 40);
  };

  const formatMoney = (amount) => {
    try { return new Intl.NumberFormat(cfg.locale, { style: 'currency', currency: cfg.currency }).format(Number(amount)); } catch { return String(amount); }
  };

  /* ---------- dialogs ---------- */
  const openDialog = (dialog) => { if (dialog && !dialog.open) dialog.showModal(); };
  document.addEventListener('click', (event) => {
    const closer = event.target.closest('[data-dialog-close]');
    if (closer) { closer.closest('dialog')?.close(); return; }
    // A click on the backdrop lands on the <dialog> element itself.
    if (event.target instanceof HTMLDialogElement) event.target.close();
  });

  /* ---------- bag drawer ---------- */
  const cartDialog = () => $('[data-cart-drawer]');

  function updateCounts(count) {
    $$('[data-cart-count]').forEach((el) => { el.textContent = `(${count})`; });
    $$('[data-cart-badge]').forEach((el) => { el.textContent = count; el.hidden = count === 0; });
    $$('[data-cart-badge]').forEach((el) => { el.textContent = count; el.hidden = count === 0; });
  }

  function applySections(sections) {
    const html = sections && sections['cart-drawer'];
    if (!html) return false;
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const inner = $('[data-cart-inner]', doc);
    const root = $('[data-cart-root]', doc);
    const current = $('[data-cart-inner]');
    if (!inner || !current) return false;
    current.replaceWith(inner);
    updateCounts(Number(root?.dataset.cartTotal || 0));
    return true;
  }

  function cartError(message) {
    const el = $('[data-cart-error]');
    if (el) el.textContent = message || '';
    if (message) announce(message);
  }

  async function cartRequest(url, body) {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'X-Requested-With': 'XMLHttpRequest', Accept: 'application/json', ...(body instanceof FormData ? {} : { 'Content-Type': 'application/json' }) },
      body: body instanceof FormData ? body : JSON.stringify(body),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.description || data.message || 'We could not update your bag. Please try again.');
    return data;
  }

  async function addToCart(body, form) {
    const button = form && $('[data-add-button]', form);
    const original = button?.textContent;
    if (button) { button.disabled = true; button.textContent = 'Adding...'; }
    try {
      if (body instanceof FormData) body.append('sections', 'cart-drawer');
      else body.sections = 'cart-drawer';
      const data = await cartRequest(`${R.cartAdd}.js`, body);
      if (!applySections(data.sections)) { window.location.assign(R.cart); return; }
      const inner = $('[data-cart-inner]');
      if (inner) {
        const note = document.createElement('p');
        note.className = 'added';
        note.setAttribute('role', 'status');
        note.innerHTML = '<span class="added__check" aria-hidden="true">&#10003;</span><strong>Added to your bag</strong>';
        $('.cart-drawer__head', inner)?.after(note);
      }
      openDialog(cartDialog());
      announce('Added to your bag');
      return true;
    } catch (error) {
      const target = form && $('[data-product-error]', form);
      if (target) target.textContent = error.message; else { openDialog(cartDialog()); cartError(error.message); }
      announce(error.message);
      return false;
    } finally {
      if (button) { button.disabled = false; button.textContent = original; }
    }
  }

  async function changeLine(line, quantity) {
    try {
      const data = await cartRequest(`${R.cartChange}.js`, { line, quantity, sections: 'cart-drawer' });
      applySections(data.sections);
      announce(quantity === 0 ? 'Item removed from your bag' : 'Bag updated');
    } catch (error) {
      cartError(error.message);
    }
  }

  let noteTimer;
  function saveNote() {
    window.clearTimeout(noteTimer);
    noteTimer = window.setTimeout(() => {
      const note = $('[data-cart-note]');
      const gift = $('[data-cart-gift]');
      cartRequest(`${R.cartUpdate}.js`, { note: note ? note.value : '', attributes: { Gift: gift?.checked ? 'Yes' : '' } }).catch(() => {});
    }, 500);
  }

  document.addEventListener('click', async (event) => {
    const open = event.target.closest('[data-cart-open]');
    if (open) {
      event.preventDefault();
      // Refresh so the drawer is never stale after the bag changed in another tab.
      try {
        const res = await fetch(`${R.cart}?sections=cart-drawer`);
        if (res.ok) applySections(await res.json());
      } catch { /* show what we have */ }
      openDialog(cartDialog());
      return;
    }
    const line = event.target.closest('[data-line-set]');
    if (line) { event.preventDefault(); changeLine(Number(line.dataset.lineSet), Number(line.dataset.quantity)); return; }
    const quick = event.target.closest('[data-quick-add]');
    if (quick) {
      event.preventDefault();
      quick.disabled = true;
      await addToCart({ items: [{ id: Number(quick.dataset.quickAdd), quantity: 1 }] });
      quick.disabled = false;
    }
  });
  document.addEventListener('input', (event) => { if (event.target.matches('[data-cart-note]')) saveNote(); });
  document.addEventListener('change', (event) => { if (event.target.matches('[data-cart-gift]')) saveNote(); });

  document.addEventListener('submit', (event) => {
    const form = event.target;
    if (form instanceof HTMLFormElement && form.matches('[data-ajax-cart]')) {
      event.preventDefault();
      const target = $('[data-product-error]', form);
      if (target) target.textContent = '';
      addToCart(new FormData(form), form);
    }
  });

  /* ---------- predictive search ---------- */
  const searchDialog = $('[data-search-dialog]');
  if (searchDialog) {
    const input = $('[data-search-input]', searchDialog);
    const idle = $('[data-search-idle]', searchDialog);
    const results = $('[data-search-results]', searchDialog);
    const recentBox = $('[data-recent]', searchDialog);
    const recentList = $('[data-recent-list]', searchDialog);
    let controller;
    let timer;

    const renderRecent = () => {
      const list = store.get('recent-searches:v1', []);
      recentList.replaceChildren(...list.map((term) => {
        const li = document.createElement('li');
        const b = document.createElement('button');
        b.type = 'button'; b.className = 'chip'; b.textContent = term;
        b.addEventListener('click', () => { input.value = term; run(); input.focus(); });
        li.append(b);
        return li;
      }));
      recentBox.hidden = list.length === 0;
    };

    const remember = (term) => {
      const list = store.get('recent-searches:v1', []).filter((t) => t.toLowerCase() !== term.toLowerCase());
      store.set('recent-searches:v1', [term, ...list].slice(0, 5));
    };

    const thumb = (url, width) => {
      try { const u = new URL(url, location.origin); u.searchParams.set('width', width); return u.toString(); } catch { return url; }
    };

    const message = (text) => {
      const p = document.createElement('p');
      p.className = 'muted';
      p.textContent = text;
      results.replaceChildren(p);
    };

    async function run() {
      const q = input.value.trim();
      window.clearTimeout(timer);
      if (q.length < 2) { results.replaceChildren(); idle.hidden = false; return; }
      idle.hidden = true;
      controller?.abort();
      controller = new AbortController();
      message('Searching...');
      try {
        const url = `${R.suggest}.json?q=${encodeURIComponent(q)}&resources[type]=product,collection&resources[limit]=6&resources[options][unavailable_products]=last`;
        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) throw new Error('search');
        const data = (await res.json()).resources.results;
        const products = data.products || [];
        const collections = data.collections || [];
        if (!products.length && !collections.length) {
          message(`No results for “${q}”. Check the spelling or try a more general word.`);
          idle.hidden = false;
          return;
        }
        const list = document.createElement('ul');
        list.className = 'search-list';
        products.forEach((p) => {
          const li = document.createElement('li');
          const a = document.createElement('a');
          a.href = p.url;
          if (p.featured_image && p.featured_image.url) {
            const img = document.createElement('img');
            img.src = thumb(p.featured_image.url, 160); img.alt = ''; img.width = 56; img.height = 70; img.loading = 'lazy';
            a.append(img);
          }
          const t = document.createElement('span'); t.className = 'search-list__title'; t.textContent = p.title;
          const pr = document.createElement('span'); pr.className = 'search-list__price'; pr.textContent = formatMoney(p.price);
          a.append(t, pr);
          li.append(a);
          list.append(li);
        });
        const nodes = [list];
        if (collections.length) {
          const chips = document.createElement('ul'); chips.className = 'chips';
          collections.forEach((c) => {
            const li = document.createElement('li'); const a = document.createElement('a');
            a.className = 'chip'; a.href = c.url; a.textContent = c.title; li.append(a); chips.append(li);
          });
          nodes.push(chips);
        }
        const all = document.createElement('a');
        all.className = 'text-link'; all.href = `${R.search}?q=${encodeURIComponent(q)}&options[prefix]=last`; all.textContent = 'View all results';
        nodes.push(all);
        results.replaceChildren(...nodes);
        announce(`${products.length} suggestions`);
      } catch (error) {
        if (error.name !== 'AbortError') message('Search is unavailable right now. Press Enter to search the store.');
      }
    }

    input.addEventListener('input', () => { window.clearTimeout(timer); timer = window.setTimeout(run, 220); });
    $('form', searchDialog).addEventListener('submit', () => { if (input.value.trim()) remember(input.value.trim()); });
    $('[data-clear-recent]', searchDialog).addEventListener('click', () => { store.set('recent-searches:v1', []); renderRecent(); });
    searchDialog.addEventListener('close', () => { input.value = ''; results.replaceChildren(); idle.hidden = false; });
    document.addEventListener('click', (event) => {
      if (!event.target.closest('[data-search-open]')) return;
      event.preventDefault();
      renderRecent();
      openDialog(searchDialog);
      input.focus();
    });
  }

  /* ---------- saved items (this browser only) ---------- */
  const WISH_KEY = 'wishlist:v1';
  const wishes = () => store.get(WISH_KEY, []).filter((h) => typeof h === 'string');
  function paintWishes() {
    const list = wishes();
    $$('[data-wish]').forEach((btn) => {
      const on = list.includes(btn.dataset.wish);
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    $$('[data-wish-count]').forEach((el) => { el.textContent = list.length ? `(${list.length})` : ''; });
  }
  document.addEventListener('click', (event) => {
    const btn = event.target.closest('[data-wish]');
    if (!btn) return;
    event.preventDefault();
    const handle = btn.dataset.wish;
    const list = wishes();
    const next = list.includes(handle) ? list.filter((h) => h !== handle) : [...list, handle];
    store.set(WISH_KEY, next);
    paintWishes();
    announce(next.includes(handle) ? 'Saved' : 'Removed from saved');
  });
  paintWishes();

  const savedGrid = $('[data-saved-grid]');
  if (savedGrid) {
    const empty = $('[data-saved-empty]');
    (async () => {
      const list = wishes();
      const cards = await Promise.all(list.map(async (handle) => {
        try {
          const res = await fetch(`${R.root.replace(/\/$/, '')}/products/${encodeURIComponent(handle)}?view=card`);
          return res.ok ? await res.text() : '';
        } catch { return ''; }
      }));
      const html = cards.filter(Boolean).join('');
      savedGrid.innerHTML = html; // same-origin markup rendered by this theme
      empty.hidden = Boolean(html);
      paintWishes();
    })();
  }

  /* ---------- product page ---------- */
  const productSection = $('[data-product-section]');
  if (productSection) {
    const data = JSON.parse($('[data-product-json]')?.textContent || '{"variants":[]}');
    const variants = data.variants;
    const form = $('[data-ajax-cart]', productSection);
    const select = $('[data-variant-select]', productSection);
    const groups = $$('[data-option]', productSection);
    const addBtn = $('[data-add-button]', productSection);
    const priceEl = $('[data-product-price]', productSection);
    const compareEl = $('[data-product-compare]', productSection);
    const skuEl = $('[data-product-sku]', productSection);
    const sticky = $('[data-sticky-atc]', productSection);
    const stickyPrice = $('[data-sticky-price]', productSection);
    const stickyAdd = $('[data-sticky-add]', productSection);
    const galleryItems = $$('[data-gallery-media-id]', productSection);

    function scrollToMedia(mediaId) {
      const item = galleryItems.find((media) => media.dataset.galleryMediaId === String(mediaId));
      item?.scrollIntoView({ block: 'nearest', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    }

    const chosen = () => groups.map((g) => $('input:checked', g)?.value);
    const match = (selection) => variants.find((v) => v.options.every((o, i) => o === selection[i]));

    function paint() {
      const selection = chosen();
      const variant = match(selection);
      groups.forEach((group, gi) => {
        const current = $('[data-option-current]', group);
        if (current) current.textContent = selection[gi] || '';
        $$('input', group).forEach((radio) => {
          const probe = selection.slice();
          probe[gi] = radio.value;
          const exact = match(probe);
          const anyAvailable = variants.some((v) => v.available && v.options.every((o, i) => i === gi ? o === radio.value : true));
          const label = radio.closest('.opt');
          label.classList.toggle('is-soldout', Boolean(exact && !exact.available) || (!exact && !anyAvailable));
          label.classList.toggle('is-unavailable', !exact);
        });
      });
      if (!variant) {
        if (addBtn) { addBtn.disabled = true; addBtn.textContent = 'Unavailable'; }
        if (stickyAdd) { stickyAdd.disabled = true; stickyAdd.textContent = 'Unavailable'; }
        return;
      }
      if (select) select.value = String(variant.id);
      if (priceEl) priceEl.textContent = variant.price;
      if (stickyPrice) stickyPrice.textContent = variant.price;
      if (skuEl) skuEl.textContent = variant.sku || '—';
      if (compareEl) { compareEl.hidden = !variant.compare; if (variant.compare) compareEl.textContent = variant.compare; }
      [addBtn, stickyAdd].forEach((b) => { if (b) { b.disabled = !variant.available; b.textContent = variant.available ? 'Add to bag' : 'Sold out'; } });
      const url = new URL(location.href);
      url.searchParams.set('variant', variant.id);
      history.replaceState(null, '', url);
      if (variant.mediaId) scrollToMedia(variant.mediaId);
    }

    if (groups.length) {
      productSection.classList.add('has-option-buttons');
      groups.forEach((g) => g.addEventListener('change', paint));
      paint();
    }

    // Sticky purchase bar once the main button has scrolled out of view (phones).
    if (sticky && addBtn && 'IntersectionObserver' in window) {
      new IntersectionObserver(([entry]) => { sticky.hidden = entry.isIntersecting || entry.boundingClientRect.top > 0; }).observe(addBtn);
      stickyAdd?.addEventListener('click', () => form?.requestSubmit(addBtn));
    }

    // Size guide
    const guide = $('[data-size-guide-dialog]');
    $('[data-size-guide-open]', productSection)?.addEventListener('click', () => openDialog(guide));

    // Related products
    const recs = $('[data-recommendations]', productSection);
    if (recs && recs.dataset.url) {
      fetch(recs.dataset.url)
        .then((r) => (r.ok ? r.text() : ''))
        .then((html) => {
          const doc = new DOMParser().parseFromString(html, 'text/html');
          const section = $('.recs', doc);
          if (section) { recs.replaceChildren(section); paintWishes(); }
        })
        .catch(() => {});
    }
  }

  /* ---------- image viewer (pinch, wheel, double-tap, drag) ---------- */
  const zoomDialog = $('[data-zoom-dialog]');
  if (zoomDialog) {
    const stage = $('[data-zoom-stage]', zoomDialog);
    const img = $('[data-zoom-img]', zoomDialog);
    const level = $('[data-zoom-level]', zoomDialog);
    const view = { scale: 1, x: 0, y: 0 };
    const pointers = new Map();
    let pinchStart = null;
    let lastTap = 0;
    const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

    const apply = () => {
      const maxX = (stage.clientWidth * (view.scale - 1)) / 2;
      const maxY = (stage.clientHeight * (view.scale - 1)) / 2;
      view.x = clamp(view.x, -maxX, maxX);
      view.y = clamp(view.y, -maxY, maxY);
      img.style.transform = `translate(${view.x}px, ${view.y}px) scale(${view.scale})`;
      stage.dataset.zoomed = view.scale > 1;
      level.textContent = `${Math.round(view.scale * 100)}%`;
    };
    const setScale = (s) => { view.scale = clamp(s, 1, 4); if (view.scale === 1) { view.x = 0; view.y = 0; } apply(); };
    const reset = () => { view.scale = 1; view.x = 0; view.y = 0; apply(); };

    document.addEventListener('click', (event) => {
      const trigger = event.target.closest('[data-zoom-src]');
      if (!trigger) return;
      img.src = trigger.dataset.zoomSrc;
      img.alt = trigger.dataset.zoomAlt || '';
      reset();
      openDialog(zoomDialog);
    });
    zoomDialog.addEventListener('close', () => { img.removeAttribute('src'); });
    $('[data-zoom-in]', zoomDialog).addEventListener('click', () => setScale(view.scale + 0.75));
    $('[data-zoom-out]', zoomDialog).addEventListener('click', () => setScale(view.scale - 0.75));
    stage.addEventListener('wheel', (e) => { e.preventDefault(); setScale(view.scale - e.deltaY * 0.004); }, { passive: false });
    stage.addEventListener('pointerdown', (e) => {
      stage.setPointerCapture(e.pointerId);
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pointers.size === 2) {
        const [a, b] = [...pointers.values()];
        pinchStart = { dist: Math.hypot(a.x - b.x, a.y - b.y), scale: view.scale };
      }
      const now = Date.now();
      if (pointers.size === 1 && now - lastTap < 300) setScale(view.scale > 1 ? 1 : 2.5);
      lastTap = now;
    });
    stage.addEventListener('pointermove', (e) => {
      const prev = pointers.get(e.pointerId);
      if (!prev) return;
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pointers.size === 2 && pinchStart) {
        const [a, b] = [...pointers.values()];
        setScale(pinchStart.scale * (Math.hypot(a.x - b.x, a.y - b.y) / pinchStart.dist));
      } else if (pointers.size === 1 && view.scale > 1) {
        view.x += e.clientX - prev.x;
        view.y += e.clientY - prev.y;
        apply();
      }
    });
    const release = (e) => { pointers.delete(e.pointerId); if (pointers.size < 2) pinchStart = null; };
    stage.addEventListener('pointerup', release);
    stage.addEventListener('pointercancel', release);
  }

  /* ---------- collection filters ---------- */
  const filterForm = $('[data-filter-form]');
  if (filterForm) {
    let timer;
    const apply = (event) => {
      const t = event.target;
      if (!(t instanceof HTMLElement) || !t.hasAttribute('data-auto-submit')) return;
      // Checkboxes and the sort menu apply on change; price boxes apply shortly after typing stops.
      if (event.type === 'input' && t.getAttribute('data-auto-submit') !== 'slow') return;
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        // Do not send empty fields: Shopify rejects blank price parameters.
        $$('input[type="number"]', filterForm).forEach((i) => { if (i.value === '') i.disabled = true; });
        filterForm.submit();
      }, t.getAttribute('data-auto-submit') === 'slow' ? 700 : 0);
    };
    filterForm.addEventListener('change', apply);
    filterForm.addEventListener('input', apply);
  }
})();

/* ---------- visual polish: sticky header state + scroll reveal ---------- */
(() => {
  const header = document.querySelector('.site-header');
  if (header) {
    const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }
  if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const targets = document.querySelectorAll('.section-heading, .product-card, .collection-card, .article-grid > *, .home-story, .editorial-panel');
  if (!targets.length) return;
  document.documentElement.classList.add('js-reveal');
  const io = new IntersectionObserver((entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-visible'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
  targets.forEach((el) => { el.classList.add('reveal'); io.observe(el); });
})();
