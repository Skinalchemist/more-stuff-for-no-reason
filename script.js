// Replace with the brand's real inbox before going live. Orders and contact messages open an email to this address.
const STORE_EMAIL = 'hello@example.com';
const CART_KEY = 'f01-order';

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

function loadCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY)) || {};
  } catch {
    return {};
  }
}

function saveCart() {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  } catch {
    // Storage blocked: the order still works until the page is closed.
  }
}

function mailto(subject, body) {
  return `mailto:${STORE_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

let cart = loadCart();
let lastFocus = null;

const drawer = $('.drawer');
const backdrop = $('.drawer-backdrop');
const items = $('[data-cart-items]');
const send = $('[data-cart-send]');

function renderCart() {
  const entries = Object.entries(cart);
  const count = entries.reduce((total, [, qty]) => total + qty, 0);
  $$('[data-cart-count]').forEach((el) => { el.textContent = count; });

  items.replaceChildren();
  if (!entries.length) {
    const empty = document.createElement('p');
    empty.className = 'drawer-empty';
    empty.textContent = 'Nothing here yet.';
    items.append(empty);
  }
  for (const [name, qty] of entries) {
    const row = document.createElement('div');
    row.className = 'drawer-item';
    const label = document.createElement('span');
    label.textContent = name;
    const controls = document.createElement('div');
    controls.className = 'qty';
    const less = document.createElement('button');
    less.type = 'button';
    less.textContent = '−';
    less.setAttribute('aria-label', `One fewer ${name}`);
    less.addEventListener('click', () => changeQty(name, -1));
    const amount = document.createElement('span');
    amount.textContent = qty;
    const more = document.createElement('button');
    more.type = 'button';
    more.textContent = '+';
    more.setAttribute('aria-label', `One more ${name}`);
    more.addEventListener('click', () => changeQty(name, 1));
    controls.append(less, amount, more);
    row.append(label, controls);
    items.append(row);
  }

  const lines = entries.map(([name, qty]) => `${qty} x ${name}`).join('\n');
  send.href = entries.length ? mailto('Formula Zero One order', `Hi, I'd like to order:\n\n${lines}\n\nName:\nDelivery address:\n`) : '#';
  send.setAttribute('aria-disabled', String(!entries.length));
}

function changeQty(name, delta) {
  const qty = (cart[name] || 0) + delta;
  if (qty > 0) cart[name] = qty;
  else delete cart[name];
  saveCart();
  renderCart();
}

function openDrawer() {
  lastFocus = document.activeElement;
  drawer.classList.add('open');
  drawer.removeAttribute('inert');
  drawer.setAttribute('aria-hidden', 'false');
  backdrop.hidden = false;
  $('.drawer-close').focus();
}

function closeDrawer() {
  drawer.classList.remove('open');
  drawer.setAttribute('inert', '');
  drawer.setAttribute('aria-hidden', 'true');
  backdrop.hidden = true;
  lastFocus?.focus();
}

$$('[data-cart-open]').forEach((el) => el.addEventListener('click', openDrawer));
$$('[data-cart-close]').forEach((el) => el.addEventListener('click', closeDrawer));
$$('[data-add-to-order]').forEach((el) => el.addEventListener('click', () => {
  changeQty(el.dataset.addToOrder, 1);
  openDrawer();
}));
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && drawer.classList.contains('open')) closeDrawer();
});

const toggle = $('.menu-toggle');
const nav = $('.site-nav');
toggle.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  toggle.setAttribute('aria-expanded', String(open));
});
nav.addEventListener('click', (e) => {
  if (e.target.closest('a')) {
    nav.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
  }
});

$('[data-contact-form]').addEventListener('submit', (e) => {
  e.preventDefault();
  const form = new FormData(e.target);
  location.href = mailto(`Message from ${form.get('name')}`, form.get('message'));
});

$('[data-year]').textContent = new Date().getFullYear();
renderCart();
