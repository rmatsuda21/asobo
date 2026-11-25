<script lang="ts">
	import '@fontsource/zen-maru-gothic/500.css';
	import '@fontsource/zen-maru-gothic/700.css';
	import '@fontsource/zen-maru-gothic/900.css';
	import '../app.css';
	import { i18n } from '#lib/i18n.svelte.ts';
	import Logo from '#lib/Logo.svelte';
	import UpdatePrompt from '#lib/UpdatePrompt.svelte';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();

	$effect(() => {
		document.documentElement.lang = i18n.locale;
	});
</script>

<div class="shell">
	<header>
		<a class="wordmark" href="/"><Logo /></a>
		<button class="lang soft" onclick={() => i18n.toggle()} aria-label={i18n.t.switchLanguageLabel}>
			{i18n.t.switchLanguage}
		</button>
	</header>

	<main>
		{@render children()}
	</main>
</div>

<UpdatePrompt />

<style>
	.shell {
		min-block-size: 100dvb;
		max-inline-size: 34rem;
		margin-inline: auto;
		display: flex;
		flex-direction: column;
		padding-block: max(0.75rem, env(safe-area-inset-top, 0px))
			max(1.5rem, env(safe-area-inset-bottom, 0px));
		padding-inline: max(var(--gutter), env(safe-area-inset-left, 0px))
			max(var(--gutter), env(safe-area-inset-right, 0px));
	}

	header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		min-block-size: 3rem;
	}

	.wordmark {
		display: flex;
		align-items: center;
		block-size: 2.75rem;
		padding-block: 0.375rem;
		color: inherit;
	}

	.lang {
		padding-inline: 1rem;
		border-radius: 999px;
		font-size: 0.875rem;
		font-weight: 700;
	}

	main {
		flex: 1;
		padding-block-start: 1.25rem;
	}
</style>
