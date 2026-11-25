<script lang="ts">
	import { i18n } from './i18n.svelte.ts';

	/** A newer version that has downloaded and is waiting for a reload. */
	let waiting = $state.raw<ServiceWorker | null>(null);
	let reloading = false;

	$effect(() => {
		if (!('serviceWorker' in navigator)) return;
		let registration: ServiceWorkerRegistration | undefined;

		const track = (worker: ServiceWorker | null) => {
			if (!worker) return;
			const check = () => {
				// With no controller this is the very first install, not an update.
				if (worker.state === 'installed' && navigator.serviceWorker.controller) waiting = worker;
			};
			check();
			worker.addEventListener('statechange', check);
		};

		void navigator.serviceWorker.ready.then((ready) => {
			registration = ready;
			// Tell the worker which font files this page already loaded, so it can keep them offline.
			const fonts = performance
				.getEntriesByType('resource')
				.map((entry) => entry.name)
				.filter((name) => /\.woff2?$/.test(new URL(name).pathname));
			if (fonts.length > 0) ready.active?.postMessage({ cacheFonts: fonts });
			track(ready.waiting);
			ready.addEventListener('updatefound', () => track(ready.installing));
		});

		// An installed app can stay open for days; look for a new version whenever it comes back into view.
		const recheck = () => {
			if (document.visibilityState === 'visible') void registration?.update().catch(() => {});
		};
		const reload = () => {
			if (reloading) location.reload();
		};
		document.addEventListener('visibilitychange', recheck);
		navigator.serviceWorker.addEventListener('controllerchange', reload);
		return () => {
			document.removeEventListener('visibilitychange', recheck);
			navigator.serviceWorker.removeEventListener('controllerchange', reload);
		};
	});

	function update() {
		reloading = true;
		waiting?.postMessage('skip-waiting');
	}
</script>

{#if waiting}
	<div class="prompt soft" role="status">
		<span>{i18n.t.updateReady}</span>
		<button class="soft" onclick={update}>{i18n.t.reload}</button>
	</div>
{/if}

<style>
	.prompt {
		position: fixed;
		inset-inline: max(var(--gutter), env(safe-area-inset-left, 0px))
			max(var(--gutter), env(safe-area-inset-right, 0px));
		inset-block-end: max(1rem, env(safe-area-inset-bottom, 0px));
		max-inline-size: 26rem;
		margin-inline: auto;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
		padding: 0.625rem 0.625rem 0.75rem 1.125rem;
		border-radius: 999px;
		font-weight: 700;
		font-size: 0.9375rem;
	}

	button {
		min-block-size: 2.5rem;
		padding-inline: 1.125rem;
		border-radius: 999px;
		background: var(--accent);
		color: var(--accent-ink);
		box-shadow: inset 0 -3px 0 var(--accent-shade);
		font-weight: 700;
		white-space: nowrap;
	}
</style>
