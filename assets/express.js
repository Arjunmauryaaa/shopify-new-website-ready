/*
 * Ad checkout page (product.express). Builds an order from the main product plus any recommended add-ons,
 * then sends the shopper straight to Shopify's secure checkout. Totals here are estimates for display only;
 * Shopify checkout calculates the real price, shipping, taxes and discounts.
 * Without JavaScript the form still works: it adds the selected variant and goes to checkout.
 */
(() => {
  'use strict';
  const root = document.querySelector('[data-express]');
  if (!root) return;

  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));
  const cfg = window.themeConfig || { currency: 'USD', locale: 'en', routes: {} };
  const R = cfg.routes || {};
  let data;
  try { data = JSON.parse($('[data-ex-json]').textContent); } catch { return; }

  /* ---------- money ---------- */
  const withDelimiters = (cents, decimals, thousands = ',', dot = '.') => {
    const [whole, frac] = (cents / 100).toFixed(decimals).split('.');
    return whole.replace(/(\d)(?=(\d\d\d)+(?!\d))/g, `$1${thousands}`) + (frac ? dot + frac : '');
  };
  const money = (cents) => {
    // Use the store's own money format when the shopper sees the store currency; otherwise let Intl format it.
    if (data.moneyFormat && cfg.currency === data.shopCurrency) {
      const stripped = data.moneyFormat.replace(/<[^>]*>/g, '');
      return stripped.replace(/\{\{\s*(\w+)\s*\}\}/, (_, name) => {
        switch (name) {
          case 'amount': return withDelimiters(cents, 2);
          case 'amount_no_decimals': return withDelimiters(cents, 0);
          case 'amount_with_comma_separator': return withDelimiters(cents, 2, '.', ',');
          case 'amount_no_decimals_with_comma_separator': return withDelimiters(cents, 0, '.', ',');
          case 'amount_with_apostrophe_separator': return withDelimiters(cents, 2, "'", '.');
          case 'amount_no_decimals_with_space_separator': return withDelimiters(cents, 0, ' ');
          case 'amount_with_space_separator': return withDelimiters(cents, 2, ' ', ',');
          default: return withDelimiters(cents, 2);
        }
      });
    }
    try { return new Intl.NumberFormat(cfg.locale, { style: 'currency', currency: cfg.currency }).format(cents / 100); } catch { return String(cents / 100); }
  };

  /* ---------- state ---------- */
  const form = $('[data-express-form]');
  const variantInput = $('[data-ex-variant]', form);
  const qtyOut = $('[data-ex-qty]', form);
  const qtyInput = $('[data-ex-qty-input]', form);
  const linesEl = $('[data-ex-lines]', form);
  const payBtn = $('[data-ex-pay]', form);
  const payLabel = $('[data-ex-pay-label]', form);
  const errorEl = $('[data-ex-error]', form);
  const bar = $('[data-ex-bar]');
  const barPay = $('[data-ex-bar-pay]');
  const variants = data.variants;
  const addOns = new Map(); // variant id -> { id, title, label, img, price, compare, qty }
  const initialQty = Math.max(1, Math.min(10, Number(new URLSearchParams(location.search).get('qty')) || 1));
  const state = { variant: variants.find((v) => String(v.id) === variantInput.value) || variants[0], qty: initialQty };

  const setText = (selector, text, scope = document) => { $$(selector, scope).forEach((el) => { el.textContent = text; }); };

  function render() {
    const v = state.variant;
    variantInput.value = v.id;
    qtyOut.textContent = state.qty;
    qtyInput.value = state.qty;
    setText('[data-ex-price]', money(v.price));
    const compare = $('[data-ex-compare]');
    const save = $('[data-ex-save]');
    const badge = $('[data-ex-badge]');
    const pct = v.compare > v.price ? Math.round(((v.compare - v.price) / v.compare) * 100) : 0;
    if (compare) { compare.hidden = !pct; compare.textContent = pct ? money(v.compare) : ''; }
    if (save) { save.hidden = !pct; save.textContent = pct ? `You save ${pct}%` : ''; }
    if (badge) { badge.hidden = !pct; badge.textContent = pct ? `Save ${pct}%` : ''; }

    let subtotal = v.price * state.qty;
    let saved = v.compare > v.price ? (v.compare - v.price) * state.qty : 0;
    const rows = [];
    if (addOns.size) {
      rows.push({ main: true, title: data.title, label: data.single ? '' : v.label, img: data.image, price: v.price * state.qty, qty: state.qty });
      addOns.forEach((a) => {
        subtotal += a.price * a.qty;
        if (a.compare > a.price) saved += (a.compare - a.price) * a.qty;
        rows.push({ id: a.id, title: a.title, label: a.label, img: a.img, price: a.price * a.qty, qty: a.qty });
      });
    }
    linesEl.replaceChildren(...rows.map((r) => {
      const li = document.createElement('li');
      li.className = 'ex__line';
      const img = document.createElement('img');
      img.alt = '';
      if (r.img) img.src = r.img;
      const name = document.createElement('span');
      name.textContent = r.title + (r.qty > 1 ? ` × ${r.qty}` : '');
      if (r.label) { const small = document.createElement('small'); small.textContent = r.label; name.append(small); }
      const right = document.createElement('span');
      right.textContent = money(r.price);
      if (!r.main) {
        const rm = document.createElement('button');
        rm.type = 'button';
        rm.textContent = 'Remove';
        rm.dataset.exRemove = r.id;
        rm.setAttribute('aria-label', `Remove ${r.title}`);
        right.append(rm);
      }
      li.append(img, name, right);
      return li;
    }));
    setText('[data-ex-subtotal]', money(subtotal));
    setText('[data-ex-total]', money(subtotal));
    setText('[data-ex-bar-total]', money(subtotal));
    const savedRow = $('[data-ex-saved-row]');
    if (savedRow) { savedRow.hidden = saved <= 0; setText('[data-ex-saved]', `-${money(saved)}`); }
    payBtn.disabled = !v.available;
    payLabel.textContent = v.available ? data.payLabel : 'Sold out';
    if (barPay) barPay.disabled = !v.available;
    $('[data-ex-minus]', form).disabled = state.qty <= 1;
    $('[data-ex-plus]', form).disabled = state.qty >= 10;
    syncOptions();
    showSlide(v.mediaId);
    // Keep a shareable URL so a refresh or a copied link keeps the chosen option.
    try { const u = new URL(location.href); u.searchParams.set('variant', v.id); history.replaceState(null, '', u); } catch { /* ignore */ }
  }

  /* ---------- options ---------- */
  function syncOptions() {
    const groups = $$('[data-ex-option]', form);
    groups.forEach((group, i) => {
      $$('input', group).forEach((input) => {
        // A value is only offered when some available variant matches the other chosen options.
        input.disabled = !variants.some((v) => v.available && v.options.every((o, k) => k === i ? o === input.value : o === state.variant.options[k]));
        input.checked = state.variant.options[i] === input.value;
      });
    });
  }
  form.addEventListener('change', (event) => {
    const input = event.target.closest('[data-ex-option] input');
    if (!input) return;
    const index = Number(input.closest('[data-ex-option]').dataset.exOption);
    const chosen = state.variant.options.slice();
    chosen[index] = input.value;
    const match = variants.find((v) => v.options.every((o, k) => o === chosen[k]))
      || variants.find((v) => v.available && v.options[index] === input.value)
      || variants.find((v) => v.options[index] === input.value);
    if (match) { state.variant = match; errorEl.textContent = ''; render(); }
  });

  /* ---------- quantity ---------- */
  $('[data-ex-minus]', form).addEventListener('click', () => { state.qty = Math.max(1, state.qty - 1); render(); });
  $('[data-ex-plus]', form).addEventListener('click', () => { state.qty = Math.min(10, state.qty + 1); render(); });

  /* ---------- gallery ---------- */
  function showSlide(id) {
    if (id == null) return;
    const slide = $(`[data-slide="${id}"]`);
    if (!slide) return;
    $$('[data-slide]').forEach((s) => s.classList.toggle('is-active', s === slide));
    $$('[data-thumb]').forEach((t) => { if (t.dataset.thumb === String(id)) t.setAttribute('aria-current', 'true'); else t.removeAttribute('aria-current'); });
  }
  document.addEventListener('click', (event) => {
    const thumb = event.target.closest('[data-thumb]');
    if (thumb) showSlide(thumb.dataset.thumb);
  });

  /* ---------- add-ons ---------- */
  const readCard = (card) => {
    const select = $('[data-up-variant]', card);
    const option = select ? select.selectedOptions[0] : null;
    return {
      id: select ? select.value : card.dataset.variant,
      title: card.dataset.title,
      label: option ? option.dataset.label : card.dataset.label,
      img: card.dataset.img,
      price: Number(option ? option.dataset.price : card.dataset.price),
      compare: Number(option ? option.dataset.compare : card.dataset.compare),
      qty: 1,
    };
  };
  const syncCard = (card) => {
    const info = readCard(card);
    const price = $('[data-up-price]', card);
    if (price) price.textContent = money(info.price);
    const compare = $('[data-up-compare]', card);
    if (compare) { compare.textContent = info.compare > info.price ? money(info.compare) : ''; compare.hidden = !(info.compare > info.price); }
    const btn = $('[data-up-add]', card);
    const on = addOns.has(String(info.id));
    btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    btn.textContent = on ? '✓ Added' : 'Add to my order';
  };
  const syncAllCards = () => $$('[data-up]').forEach(syncCard);

  document.addEventListener('click', (event) => {
    const add = event.target.closest('[data-up-add]');
    if (add) {
      const card = add.closest('[data-up]');
      const info = readCard(card);
      // A card may have been added under another variant; keep one entry per card.
      addOns.forEach((a, key) => { if (a.card === card) addOns.delete(key); });
      if (addOns.has(String(info.id)) && addOns.get(String(info.id)).card === card) addOns.delete(String(info.id));
      else addOns.set(String(info.id), { ...info, card });
      syncAllCards();
      render();
      return;
    }
    const remove = event.target.closest('[data-ex-remove]');
    if (remove) { addOns.delete(String(remove.dataset.exRemove)); syncAllCards(); render(); }
  });
  document.addEventListener('change', (event) => {
    const select = event.target.closest('[data-up-variant]');
    if (!select) return;
    const card = select.closest('[data-up]');
    // Changing the option of an added card swaps the line for the new option.
    let wasAdded = false;
    addOns.forEach((a, key) => { if (a.card === card) { addOns.delete(key); wasAdded = true; } });
    if (wasAdded) { const info = readCard(card); addOns.set(String(info.id), { ...info, card }); }
    syncCard(card);
    render();
  });

  /* ---------- recommendations ---------- */
  const recs = $('[data-ex-recs]');
  async function loadRecs() {
    if (!recs) { syncAllCards(); return; }
    const base = recs.dataset.url;
    const fetchGrid = async (intent) => {
      const res = await fetch(`${base}&intent=${intent}`, { headers: { Accept: 'text/html' } });
      if (!res.ok) return null;
      const doc = new DOMParser().parseFromString(await res.text(), 'text/html');
      return $('[data-ex-recs-ready]', doc);
    };
    try {
      const grid = (await fetchGrid('complementary')) || (await fetchGrid('related'));
      if (grid) { recs.replaceWith(grid); syncAllCards(); } else { recs.closest('.ex-more')?.setAttribute('hidden', ''); }
    } catch { recs.closest('.ex-more')?.setAttribute('hidden', ''); }
  }

  /* ---------- pay ---------- */
  async function pay(event) {
    if (event) event.preventDefault();
    if (!state.variant.available) return;
    errorEl.textContent = '';
    [payBtn, barPay].forEach((b) => { if (b) b.disabled = true; });
    payLabel.textContent = 'Taking you to secure checkout…';
    const post = (path, body) => fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(body) });
    try {
      // Start from an empty cart so a previous visit cannot add surprise items to this order.
      await post(`${R.cart || '/cart'}/clear.js`, {});
      const items = [{ id: Number(state.variant.id), quantity: state.qty }];
      addOns.forEach((a) => items.push({ id: Number(a.id), quantity: a.qty }));
      const res = await post(`${R.cartAdd || '/cart/add'}.js`, { items });
      if (!res.ok) {
        let message = 'We could not add this to your order. Please try again.';
        try { const body = await res.json(); if (body.description) message = body.description; } catch { /* keep default */ }
        throw new Error(message);
      }
      window.location.href = '/checkout';
    } catch (error) {
      errorEl.textContent = error instanceof Error ? error.message : 'Something went wrong. Please try again.';
      payLabel.textContent = data.payLabel;
      render();
    }
  }
  form.addEventListener('submit', pay);
  if (barPay) barPay.addEventListener('click', pay);

  /* ---------- sticky pay bar (phones) ---------- */
  if (bar && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver(([entry]) => {
      const show = !entry.isIntersecting;
      bar.classList.toggle('is-on', show);
      bar.setAttribute('aria-hidden', show ? 'false' : 'true');
      if (barPay) barPay.tabIndex = show ? 0 : -1;
    }, { threshold: 0 });
    io.observe(payBtn);
  }

  render();
  loadRecs();
})();
