# PWA Notes — a minimal Progressive Web App

A tiny offline-capable notes app, built to be **read alongside its own code**.
Every concept below points at the actual file and lines that implement it.

```
pwa-notes/
├── index.html      the app shell (markup + manifest link + meta tags)
├── style.css        styling, incl. safe-area handling for installed apps
├── app.js            notes logic, install prompt, SW registration, online/offline
├── sw.js             the service worker (offline caching)
├── manifest.json     the Web App Manifest (installability metadata)
└── icons/            app icons, incl. a "maskable" variant
```

## Run it locally

Service workers require either **HTTPS** or `localhost` — they refuse to
register over plain HTTP on any other host. The simplest way to serve this
folder locally:

```bash
cd pwa-notes
python3 -m http.server 8080
# then open http://localhost:8080 in Chrome or Edge
```

---

## 1. What actually makes an app a "PWA"?

There's no special file format — a PWA is just a regular website that adds
three things:

1. **Served over HTTPS** (or localhost) — required, because service workers
   can intercept and rewrite network traffic, so browsers won't allow it
   over insecure connections.
2. **A Web App Manifest** (`manifest.json`) — metadata that lets the browser
   treat your site as an installable app.
3. **A Service Worker** (`sw.js`) — a background script that lets the app
   work offline and control caching.

That's it. Everything else (install prompts, offline mode, push
notifications) is built on top of those three things.

## 2. The Web App Manifest (`manifest.json`)

This is a JSON file describing your app the way an app-store listing would.
Linked from `index.html` via:

```html
<link rel="manifest" href="manifest.json" />
```

Key fields used in this project:

| Field | Purpose |
| --- | --- |
| `name` / `short_name` | Full name vs. the name shown under the home-screen icon |
| `start_url` | Page to open when launched from the home screen |
| `display: "standalone"` | Hides the browser chrome (address bar, tabs) so it looks like a native app |
| `background_color` | Shown as a splash screen while the app boots |
| `theme_color` | Tints the OS status bar / title bar |
| `icons` | Multiple sizes for different contexts (home screen, splash screen, task switcher) |

Notice the `"purpose": "maskable"` icon. Android adapts installed icons to
different shapes (circle, squircle, rounded square) depending on the device
launcher. A maskable icon has extra padding so it doesn't get cropped badly —
that's why `icons/icon-512-maskable.png` was generated with a safe margin.

iOS Safari still doesn't fully honor the manifest spec, which is why
`index.html` also has Apple-specific tags (`apple-mobile-web-app-capable`,
`apple-touch-icon`, etc.) as a fallback.

## 3. The Service Worker (`sw.js`)

This is the part that makes offline mode possible, and it's the most
different-from-normal-web-dev concept here. A service worker is a script
that:

- Runs **separately from the page**, in its own thread, with no DOM access.
- Can **stay alive after the tab is closed** (which is what enables push
  notifications and background sync, though this demo doesn't use those).
- Sits **between your app and the network**, able to intercept every
  `fetch()` request the page makes.

It has a lifecycle with distinct events:

- **`install`** — fires once, when the browser first downloads the service
  worker (or a changed version of it). In `sw.js`, this is where we
  pre-cache the "app shell" (HTML/CSS/JS/manifest/icons) via `cache.addAll()`.
- **`activate`** — fires once the new worker is ready to take control. This
  is the right place to clean up old caches from previous versions, which
  `sw.js` does by deleting any cache whose name doesn't match `CACHE_NAME`.
- **`fetch`** — fires on *every* network request the page makes, letting the
  worker decide: answer from cache, go to the network, or some mix of both.

### Caching strategy

`sw.js` uses **cache-first, falling back to network**: check the cache
first, and only hit the network if there's no cached match (then cache that
response for next time). This is a good fit for an app shell that rarely
changes. Two other common strategies worth knowing about:

- **Network-first** — try the network, fall back to cache on failure. Better
  for content that changes often (e.g. a news feed), where staleness is
  worse than a slightly slower load.
- **Stale-while-revalidate** — serve the cached version immediately *and*
  fetch a fresh copy in the background for next time. A balance between
  speed and freshness.

### Registering it

The service worker isn't active just because the file exists — the page has
to register it, which happens in `app.js`:

```js
navigator.serviceWorker.register("sw.js")
```

This is guarded by `if ("serviceWorker" in navigator)` since older browsers
don't support the API at all — a PWA should always degrade gracefully into
a normal website.

## 4. Installability ("Add to Home Screen")

Chrome/Edge/Android decide a site is installable once it has a valid
manifest, a registered service worker, and is served over HTTPS. When that
happens, they fire a `beforeinstallprompt` event instead of showing their
own default install UI — which lets `app.js` intercept it and show a custom
banner (`#install-banner`) at a moment of its own choosing, rather than
whenever Chrome feels like nagging the user:

```js
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();        // stop the default mini-infobar
  deferredPrompt = e;        // save it to trigger later
  installBanner.classList.remove("hidden");
});
```

Calling `deferredPrompt.prompt()` later (on the button click) shows the
real, native install dialog. This whole flow is Chromium-specific — Safari
and Firefox don't fire this event, so `app.js` never assumes it will happen.
(On iOS, installing is a manual "Share → Add to Home Screen" action with no
programmatic prompt at all.)

Once installed, `display: "standalone"` makes the app open in its own
window with no browser UI, and the `appinstalled` event fires so you can
react to it (e.g. hide the install banner for good).

## 5. Working offline

Two independent things combine to make this feel offline-first:

1. **The service worker** serves cached HTML/CSS/JS even with no network
   at all, so the app *loads* offline.
2. **`localStorage`** (in `app.js`'s `loadNotes`/`saveNotes`) persists the
   actual notes data on-device, so the app *works* offline, not just loads.

A real-world app with a backend would typically go further — queuing writes
locally and syncing them when connectivity returns (the Background Sync
API), which is a natural next step from this project but is out of scope
here to keep the example focused.

The `online`/`offline` browser events (also wired up in `app.js`) just
drive the little status pill in the header — a nice UX touch so users know
*why* something might not be syncing, even though in this app's case,
everything already works locally either way.

## 6. Updating the app

Because assets are cached, users won't automatically get new versions just
by reloading. The flow is:

1. You change a file and bump `CACHE_NAME` in `sw.js` (e.g. `v1` → `v2`).
2. The browser detects the service worker file itself has changed, downloads
   it, and fires `install` again — but the **old** service worker stays in
   control of open tabs until they're closed.
3. `app.js` listens for `updatefound` and tells the user a new version is
   ready, so they know to reload.

This two-version-coexisting behavior is intentional and prevents a page
from switching logic mid-session out from under the user.

## 7. Checking your work: Lighthouse

Chrome DevTools has a built-in **Lighthouse** audit with a dedicated PWA
checklist (installability, offline support, manifest validity, HTTPS,
etc.). Worth running against this project once it's served locally — it's
the standard way real teams verify a PWA meets the baseline requirements.

---

## Ideas to extend this project

- **Push notifications** — needs a Push API subscription plus a server to
  send them; a good follow-up once service workers feel familiar.
- **Background Sync** — queue note creation while offline and flush it to a
  real backend once connectivity returns.
- **`stale-while-revalidate`** — swap the caching strategy in `sw.js` and
  compare the perceived load speed.
- **Workbox** — Google's library that generates a lot of this `sw.js`
  boilerplate for you; worth trying once you understand what it's doing
  under the hood.
