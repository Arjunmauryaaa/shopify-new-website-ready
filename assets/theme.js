(() => {
  const root = document.documentElement;
  const meta = document.querySelector('meta[name="theme-color"]');
  const update = (theme, persist = true) => {
    if (theme === 'dark') root.dataset.theme = 'dark';
    else delete root.dataset.theme;
    if (meta) meta.content = theme === 'dark' ? '#141413' : '#ffffff';
    document.querySelectorAll('[data-theme-label]').forEach((label) => {
      label.textContent = theme === 'dark' ? 'Light mode' : 'Dark mode';
    });
    document.querySelectorAll('[data-theme-toggle]').forEach((button) => {
      button.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
      button.setAttribute('aria-pressed', theme === 'dark' ? 'true' : 'false');
    });
    if (persist) {
      try { localStorage.setItem('arjunta-theme', theme); } catch (error) { /* Storage can be disabled. */ }
    }
  };

  update(root.dataset.theme === 'dark' ? 'dark' : 'light', false);
  document.querySelectorAll('[data-theme-toggle]').forEach((button) => {
    button.addEventListener('click', () => update(root.dataset.theme === 'dark' ? 'light' : 'dark'));
  });

  const variantSelect = document.querySelector('[data-variant-select]');
  if (variantSelect) {
    const price = document.querySelector('[data-product-price]');
    const addButton = document.querySelector('[data-add-button]');
    const syncVariant = () => {
      const option = variantSelect.selectedOptions[0];
      if (!option) return;
      if (price && option.dataset.price) price.textContent = option.dataset.price;
      if (addButton) {
        const available = option.dataset.available === 'true';
        addButton.disabled = !available;
        addButton.textContent = available ? 'Add to bag' : 'Sold out';
      }
    };
    variantSelect.addEventListener('change', syncVariant);
    syncVariant();
  }
})();
