// All network access lives here. Every function returns { meals | categories, fromCache }.
import { getCached, setCached } from './cache.js';

const BASE = 'https://www.themealdb.com/api/json/v1/1';

async function getJSON(path) {
  const hit = getCached(path);
  if (hit) return { data: hit, fromCache: true };

  const res = await fetch(`${BASE}/${path}`);
  if (!res.ok) throw new Error(`The server answered with status ${res.status}.`);
  const data = await res.json();

  setCached(path, data);
  return { data, fromCache: false };
}

export async function fetchCategories() {
  const { data, fromCache } = await getJSON('categories.php');
  return { categories: data.categories ?? [], fromCache };
}

export async function searchMeals(query) {
  const { data, fromCache } = await getJSON(`search.php?s=${encodeURIComponent(query)}`);
  return { meals: data.meals ?? [], fromCache }; // the API returns null when nothing matches
}

export async function fetchByCategory(category) {
  const { data, fromCache } = await getJSON(`filter.php?c=${encodeURIComponent(category)}`);
  return { meals: data.meals ?? [], fromCache };
}

export async function fetchMeal(id) {
  const { data, fromCache } = await getJSON(`lookup.php?i=${encodeURIComponent(id)}`);
  return { meal: data.meals?.[0] ?? null, fromCache };
}
