import './style.css';
import { fetchCategories, searchMeals, fetchByCategory, fetchMeal } from './api.js';
import { clearCache, cacheStats } from './cache.js';
import { h, clear, showLoading, showMessage, showError, clearStatus } from './ui.js';

const grid = document.querySelector('#grid');
const nav = document.querySelector('#categories');
const form = document.querySelector('#search-form');
const searchInput = document.querySelector('#search');
const sortSelect = document.querySelector('#sort');
const detail = document.querySelector('#detail');

const state = { meals: [], category: null, sort: 'asc' };
let requestId = 0; // lets us ignore responses that arrive after a newer request

const friendlyError = (err) =>
  err instanceof TypeError
    ? 'Could not reach TheMealDB. Check your connection.'
    : err.message;

// ---------- Loading a list of meals ----------
async function loadMeals(loader, emptyMessage) {
  const id = ++requestId;
  clear(grid);
  showLoading('Fetching meals…');
  try {
    const { meals, fromCache } = await loader();
    if (id !== requestId) return; // a newer request replaced this one
    state.meals = meals;
    renderMeals(emptyMessage);
    updateFooter(fromCache);
  } catch (err) {
    if (id !== requestId) return;
    showError(friendlyError(err), () => loadMeals(loader, emptyMessage));
  }
}

function renderMeals(emptyMessage) {
  const sorted = [...state.meals].sort((a, b) =>
    state.sort === 'asc'
      ? a.strMeal.localeCompare(b.strMeal)
      : b.strMeal.localeCompare(a.strMeal)
  );

  if (sorted.length === 0) {
    clear(grid);
    showMessage(emptyMessage);
    return;
  }

  clearStatus();
  grid.replaceChildren(
    ...sorted.map((meal) =>
      h(
        'button',
        { class: 'card', type: 'button', onclick: () => openDetail(meal.idMeal) },
        h('img', { src: `${meal.strMealThumb}/medium`, alt: '', loading: 'lazy', width: 500, height: 500 }),
        h('span', { class: 'card-name' }, meal.strMeal)
      )
    )
  );
}

// ---------- Categories ----------
function renderCategories(categories) {
  nav.replaceChildren(
    ...categories.map(({ strCategory }) =>
      h(
        'button',
        {
          type: 'button',
          class: 'chip',
          'aria-pressed': String(strCategory === state.category),
          onclick: () => selectCategory(strCategory),
        },
        strCategory
      )
    )
  );
}

function selectCategory(category) {
  state.category = category;
  searchInput.value = '';
  nav.querySelectorAll('.chip').forEach((chip) =>
    chip.setAttribute('aria-pressed', String(chip.textContent === category))
  );
  loadMeals(() => fetchByCategory(category), `No meals found in ${category}.`);
}

// ---------- Search (debounced) ----------
let debounce;
searchInput.addEventListener('input', () => {
  clearTimeout(debounce);
  debounce = setTimeout(runSearch, 350);
});
form.addEventListener('submit', (e) => {
  e.preventDefault();
  clearTimeout(debounce);
  runSearch();
});

function runSearch() {
  const query = searchInput.value.trim();
  if (!query) {
    if (state.category) selectCategory(state.category);
    return;
  }
  state.category = null;
  nav.querySelectorAll('.chip').forEach((chip) => chip.setAttribute('aria-pressed', 'false'));
  loadMeals(() => searchMeals(query), `No meals match “${query}”. Try another name.`);
}

sortSelect.addEventListener('change', () => {
  state.sort = sortSelect.value;
  if (state.meals.length) renderMeals('');
});

// ---------- Detail dialog ----------
async function openDetail(id) {
  detail.replaceChildren(h('p', { class: 'dialog-status' }, 'Loading recipe…'));
  detail.showModal();
  try {
    const { meal, fromCache } = await fetchMeal(id);
    if (!meal) throw new Error('This recipe no longer exists.');
    renderDetail(meal);
    updateFooter(fromCache);
  } catch (err) {
    detail.replaceChildren(
      h('p', { class: 'dialog-status is-error' }, friendlyError(err)),
      h('div', { class: 'dialog-actions' },
        h('button', { type: 'button', onclick: () => openDetail(id) }, 'Try again'),
        h('button', { type: 'button', onclick: () => detail.close() }, 'Close'))
    );
  }
}

function getIngredients(meal) {
  return Array.from({ length: 20 }, (_, i) => ({
    name: meal[`strIngredient${i + 1}`]?.trim(),
    measure: meal[`strMeasure${i + 1}`]?.trim(),
  })).filter((item) => item.name);
}

function renderDetail(meal) {
  const steps = (meal.strInstructions ?? '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  detail.replaceChildren(
    h('img', { class: 'detail-img', src: `${meal.strMealThumb}/medium`, alt: meal.strMeal }),
    h('div', { class: 'detail-body' },
      h('h2', { id: 'detail-title' }, meal.strMeal),
      h('p', { class: 'meta' }, [meal.strCategory, meal.strArea].filter(Boolean).join(', ')),
      h('h3', {}, 'Ingredients'),
      h('ul', { class: 'ingredients' },
        ...getIngredients(meal).map(({ name, measure }) =>
          h('li', {}, h('span', {}, measure || ''), name))),
      h('h3', {}, 'Method'),
      h('div', { class: 'method' }, ...steps.map((s) => h('p', {}, s))),
      h('div', { class: 'dialog-actions' },
        h('button', { type: 'button', onclick: () => detail.close() }, 'Close'))
    )
  );
}

detail.addEventListener('click', (e) => {
  if (e.target === detail) detail.close(); // click on the backdrop
});

// ---------- Footer: cache transparency ----------
function updateFooter(fromCache) {
  const { entries, kb } = cacheStats();
  document.querySelector('#source').textContent = fromCache
    ? 'Last request: served from cache'
    : 'Last request: fetched from the network';
  document.querySelector('#cache-info').textContent = `${entries} cached ${entries === 1 ? 'entry' : 'entries'} (${kb} KB)`;
}

document.querySelector('#clear-cache').addEventListener('click', () => {
  clearCache();
  updateFooter(false);
  document.querySelector('#source').textContent = 'Cache cleared';
});

// ---------- Boot ----------
async function init() {
  updateFooter(false);
  document.querySelector('#source').textContent = '';
  try {
    const { categories } = await fetchCategories();
    state.category = categories[0]?.strCategory ?? null;
    renderCategories(categories);
    if (state.category) selectCategory(state.category);
  } catch (err) {
    showError(friendlyError(err), init);
  }
}

init();
