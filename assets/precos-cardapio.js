(() => {
  'use strict';

  const categories = ['Entradas', 'Massas', 'Pratos principais', 'Sobremesas', 'Bebidas', 'Extras'];
  const list = document.querySelector('.menu-dishes');
  const dessertCard = document.querySelector('#menu-dialog .dessert-card');
  const oldExtra = document.querySelector('#menu-dialog .menu-extra');
  const teaser = document.querySelector('.dessert-teaser');
  const wholeReais = new Intl.NumberFormat('pt-BR', {
    style: 'currency', currency: 'BRL', maximumFractionDigits: 0
  });
  const fractionalReais = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
  const price = cents => (cents % 100 ? fractionalReais : wholeReais).format(cents / 100);

  function element(tag, text, className) {
    const node = document.createElement(tag);
    if (text) node.textContent = text;
    if (className) node.className = className;
    return node;
  }

  function validCatalog(data) {
    if (data?.version !== 1 || !Array.isArray(data.items) || data.items.length > 300) return false;
    const ids = new Set();
    for (const item of data.items) {
      if (!item || typeof item.id !== 'string' || !/^[a-z0-9-]{1,100}$/.test(item.id) ||
          typeof item.name !== 'string' || !item.name.trim() || item.name.length > 110 ||
          typeof item.description !== 'string' || item.description.length > 600 ||
          !categories.includes(item.category) || typeof item.active !== 'boolean' ||
          !Number.isInteger(item.cents) || item.cents < 1 || item.cents > 999999 || ids.has(item.id)) return false;
      ids.add(item.id);
    }
    return data.items.some(item => item.active);
  }

  function makeDish(item) {
    if (item.id === 'tiramisu') {
      dessertCard.querySelector('h3').textContent = item.name;
      dessertCard.querySelector('h3 + p').textContent = item.description;
      dessertCard.querySelector('h3 + p').hidden = !item.description;
      dessertCard.querySelector('strong').textContent = price(item.cents);
      return dessertCard;
    }
    const article = element('article', '', 'menu-dish');
    const copy = element('div');
    copy.append(element('h4', item.name));
    if (item.description) copy.append(element('p', item.description));
    article.append(copy, element('strong', price(item.cents)));
    return article;
  }

  function updateHighlights(items) {
    const massas = items.filter(item => item.category === 'Massas');
    const dessert = items.find(item => item.id === 'tiramisu');
    const pastaPrice = element('strong', massas.length ? price(Math.min(...massas.map(item => item.cents))) : '');
    const dessertButton = teaser.querySelector('button');
    teaser.replaceChildren();
    if (massas.length) teaser.append('Massas desde ', pastaPrice);
    if (massas.length && dessert) {
      const separator = element('span', ' · ');
      separator.setAttribute('aria-hidden', 'true');
      teaser.append(separator);
    }
    if (dessert) {
      dessertButton.replaceChildren(dessert.name + ' ', element('strong', price(dessert.cents)));
      teaser.append(dessertButton);
    }
    teaser.hidden = !teaser.childNodes.length;
    for (const photo of document.querySelectorAll('[data-price-photo="tiramisu"]')) {
      photo.hidden = !dessert;
      if (!dessert) continue;
      photo.querySelector('.dessert-price').textContent = price(dessert.cents);
      photo.querySelector('.dessert-price').previousElementSibling.textContent = dessert.name;
      photo.setAttribute('aria-label', dessert.name + ', ' + price(dessert.cents) + '. Ampliar foto');
    }
  }

  async function loadCatalog() {
    const response = await fetch('cardapio.json', { cache: 'no-cache' });
    if (!response.ok) return;
    const catalog = await response.json();
    if (!validCatalog(catalog)) return;
    if (catalog.migrationPending === true) {
      const legacy = await fetch('precos-cardapio.json', { cache: 'no-cache' })
        .then(response => response.ok ? response.json() : null)
        .catch(() => null);
      if (legacy && catalog.items.every(item =>
        Number.isInteger(legacy[item.id]) && legacy[item.id] >= 1 && legacy[item.id] <= 999999)) {
        for (const item of catalog.items) item.cents = legacy[item.id];
      }
    }
    const active = catalog.items.filter(item => item.active);
    oldExtra.remove();
    dessertCard.remove();
    list.replaceChildren();
    for (const category of categories) {
      const dishes = active.filter(item => item.category === category);
      if (!dishes.length) continue;
      const group = element('section', '', 'menu-category');
      group.append(element('h3', category), ...dishes.map(makeDish));
      list.append(group);
    }
    updateHighlights(active);
  }

  if (location.protocol === 'http:' || location.protocol === 'https:') {
    // Keep the original menu in the page when the catalog is unavailable or invalid.
    loadCatalog().catch(() => {});
  }
})();
