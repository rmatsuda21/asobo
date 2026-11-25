/// <reference lib="webworker" />
import { version } from '$app/env';
import { assets, immutable } from '$app/manifest';

/**
 * Makes the app open without a connection.
 *
 * The app's own code is downloaded up front, one cache per deployed version, so
 * a cached page always gets the scripts it was built with. Font files are
 * different: Japanese fonts are split into hundreds of pieces and a page only
 * needs a few, so each piece is cached the first time it is used.
 */
const sw = self as unknown as ServiceWorkerGlobalScope;

const APP_CACHE = `asobo-app-${version}`;
const FONT_CACHE = 'asobo-fonts';
/** The single HTML page; every route in the app is rendered from it. */
const SHELL = '/';

const isFont = (path: string) => /\.woff2?$/.test(path);
const absolute = (path: string) => new URL(path, sw.location.origin + '/').pathname;

const precached = new Set([
	...immutable.map((file) => absolute(file.path)).filter((path) => !isFont(path)),
	...assets.map((file) => absolute(file.path))
]);

sw.addEventListener('install', (event) => {
	event.waitUntil(
		(async () => {
			const cache = await caches.open(APP_CACHE);
			// Skip the browser's HTTP cache so the page saved is the one from this version.
			await cache.add(new Request(SHELL, { cache: 'reload' }));
			await cache.addAll([...precached]);
		})()
	);
});

sw.addEventListener('activate', (event) => {
	event.waitUntil(
		(async () => {
			for (const name of await caches.keys()) {
				if (name.startsWith('asobo-app-') && name !== APP_CACHE) await caches.delete(name);
			}
			await sw.clients.claim();
		})()
	);
});

// A new version waits until the person agrees to reload, so a game is never interrupted.
sw.addEventListener('message', (event) => {
	if (event.data === 'skip-waiting') {
		void sw.skipWaiting();
		return;
	}
	// On a first visit the page loads its fonts before this worker is in charge.
	// The page reports them afterwards so they are saved for offline use too.
	const fonts: unknown = event.data?.cacheFonts;
	if (Array.isArray(fonts)) {
		const urls = fonts
			.filter((url): url is string => typeof url === 'string')
			.map((url) => new URL(url, sw.location.origin))
			.filter((url) => url.origin === sw.location.origin && isFont(url.pathname))
			.map((url) => url.pathname);
		event.waitUntil(caches.open(FONT_CACHE).then((cache) => cache.addAll(urls).catch(() => {})));
	}
});

sw.addEventListener('fetch', (event) => {
	const { request } = event;
	if (request.method !== 'GET') return;
	const url = new URL(request.url);
	// The room server and anything on another site always go to the network.
	if (url.origin !== sw.location.origin || url.pathname.startsWith('/api/')) return;

	if (request.mode === 'navigate') {
		event.respondWith(
			(async () => (await caches.match(SHELL, { cacheName: APP_CACHE })) ?? fetch(request))()
		);
		return;
	}

	if (precached.has(url.pathname)) {
		event.respondWith(
			(async () => (await caches.match(request, { cacheName: APP_CACHE })) ?? fetch(request))()
		);
		return;
	}

	if (isFont(url.pathname)) {
		event.respondWith(
			(async () => {
				const cache = await caches.open(FONT_CACHE);
				const hit = await cache.match(request);
				if (hit) return hit;
				const response = await fetch(request);
				if (response.ok) void cache.put(request, response.clone());
				return response;
			})()
		);
	}
});
