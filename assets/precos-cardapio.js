(() => {
  'use strict';

  const elements = [...document.querySelectorAll('[data-price]')];
  const ids = [...new Set(elements.map(element => element.dataset.price))];
  const pastaIds = [...document.querySelectorAll('.menu-dish [data-price]')]
    .map(element => element.dataset.price);
  const wholeReais = new Intl.NumberFormat('pt-BR', {
    style: 'currency', currency: 'BRL', maximumFractionDigits: 0
  });
  const fractionalReais = new Intl.NumberFormat('pt-BR', {
    style: 'currency', currency: 'BRL'
  });
  const format = cents => (cents % 100 ? fractionalReais : wholeReais).format(cents / 100);

  async function updatePrices() {
    const response = await fetch('precos-cardapio.json', { cache: 'no-cache' });
    if (!response.ok) return;
    const prices = await response.json();
    if (!prices || typeof prices !== 'object' || Array.isArray(prices)) return;
    const productIds = ids.filter(id => id !== 'menor-massa');
    if (Object.keys(prices).length !== productIds.length ||
      !productIds.every(id => Object.hasOwn(prices, id) &&
        Number.isInteger(prices[id]) && prices[id] >= 1 && prices[id] <= 999999)) return;

    const minimum = Math.min(...pastaIds.map(id => prices[id]));
    for (const element of elements) {
      const id = element.dataset.price;
      const cents = id === 'menor-massa' ? minimum : prices[id];
      element.textContent = format(cents);
    }
    for (const photo of document.querySelectorAll('[data-price-photo="tiramisu"]')) {
      photo.setAttribute('aria-label', `Tiramisù da casa, ${format(prices.tiramisu)}. Ampliar foto`);
    }
  }

  if (location.protocol === 'http:' || location.protocol === 'https:') {
    // Keep the prices already rendered if the file is unavailable or invalid.
    updatePrices().catch(() => {});
  }
})();
