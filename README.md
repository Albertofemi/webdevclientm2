# Async Odyssey

Recipe finder built with Vite and vanilla JS. It consumes the public [TheMealDB](https://www.themealdb.com/api.php) API (no key needed).

## Run it

```bash
npm install
npm run dev      # development server
npm run build    # production build in dist/
```

## What it covers

- `fetch` + `async/await` in `src/api.js` (with `res.ok` check and error handling)
- ES modules: `api.js`, `cache.js`, `ui.js`, `main.js`
- Array methods: `map`, `filter`, `sort`, `reduce`, `Array.from`
- Loading, error (with retry), and empty states in the DOM
- Race-condition guard (`requestId`) and debounced search
- BONUS: localStorage cache with a 24 h TTL (`src/cache.js`); the footer shows whether the last request came from cache

---

## AI usage

**Author:** Alberto Fernández · **Mission:** M2 · Async Odyssey

| | |
|---|---|
| Tool | Claude (Anthropic), via the claude.ai chat interface |
| Input I gave it | The mission brief, pasted verbatim (Vite app, public API, `fetch` + `async/await`, ES modules, array methods, loading and error states, bonus localStorage cache) |
| Choices made by the AI | API (TheMealDB), app concept (recipe finder with categories, search, sort and detail dialog), file structure, visual design, cache design (24 h TTL) |
| What the AI generated | The whole project: `index.html`, `src/api.js`, `src/cache.js`, `src/ui.js`, `src/main.js`, `src/style.css`, `package.json` and this README |
| What the AI did *not* do | It did not run `npm install`, start Vite, open the app in a browser or call the real API (its sandbox had no network access) |

**TODO (Alberto): complete this part honestly before submitting.**
- What I changed or rewrote myself:
- What I tested by hand (browser, offline mode, empty search, cache hit/miss):
- Parts I can explain without the AI's help:

## AI autopsy

A post-mortem of the AI-assisted work: what held up, what is unverified, and where the AI could be wrong.

### What worked well
- The code is split into small modules with one job each (network in `api.js`, storage in `cache.js`, DOM helpers in `ui.js`).
- Elements are built with `textContent` instead of `innerHTML`, so API data cannot inject markup.
- A `requestId` counter ignores responses that arrive after a newer request, which avoids stale results when typing quickly.
- The footer shows whether the last request came from cache or network, which makes the bonus easy to demonstrate.

### What was NOT verified
- **No runtime test.** The only check was `node --check` (syntax) on the JS files. Nothing was executed in a browser. Visual layout, dark mode, the `<dialog>` behaviour and the Vite build are untested.
- **API details came from the model's memory, not from a live request.** Endpoints (`categories.php`, `search.php?s=`, `filter.php?c=`, `lookup.php?i=`), the `strIngredient1..20` / `strMeasure1..20` fields, the free test key `1` in the URL, and the thumbnail size suffix `/medium` were all recalled from training data. If the API changed, these are the first things to break.
- **Behaviour on failure was reasoned, not observed.** The error path (network down, HTTP error) and the "no results" path (the API returns `null`) are handled in code but were never triggered.

### Known weaknesses and limitations
- The cache is only invalidated by its 24 h TTL. There is no size limit; if the ~5 MB localStorage quota fills up, writes fail silently and the app just stops caching.
- No pagination or virtual scrolling; large categories render every card at once.
- Fonts load from Google Fonts, so there is a third-party request and a fallback font offline.
- The free test API key is shared and unauthenticated; rate limits are unknown.
- No automated tests and no linting configuration.

### Risks of relying on AI here
- The generated code only teaches me something if I can explain it. The parts worth being able to defend: how `getJSON` combines cache and fetch, why the `requestId` guard exists, why the DOM is built with `h()` instead of `innerHTML`, and how the debounce works.
- The mission asks for a *real* API; confirm in the browser's Network tab that requests actually reach TheMealDB and that a repeated request does not.

### Verification checklist (to run myself)
- [ ] `npm install && npm run dev` starts without errors
- [ ] Categories load and the first one is selected
- [ ] Search finds a meal; a nonsense query shows the empty message
- [ ] Network tab: a repeated category/search produces no new request
- [ ] DevTools offline mode shows the error message and "Try again" works
- [ ] Detail dialog opens, closes with the button, Escape and backdrop click
- [ ] `npm run build` succeeds
