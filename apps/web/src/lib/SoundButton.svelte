<script lang="ts">
	import { i18n } from './i18n.svelte.ts';
	import { sound } from './sound.svelte.ts';
</script>

<button
	class="soft"
	aria-label={i18n.t.soundEffects}
	aria-pressed={sound.enabled}
	onclick={() => sound.toggle()}
>
	<svg viewBox="0 0 24 24" aria-hidden="true">
		<path d="M4 9.5h3.5L12 6v12l-4.5-3.5H4z" fill="currentColor" stroke="currentColor" />
		{#if sound.enabled}
			<path
				d="M15.5 9.2a4 4 0 0 1 0 5.6M18 6.8a7.5 7.5 0 0 1 0 10.4"
				fill="none"
				stroke="currentColor"
			/>
		{:else}
			<path d="M15.5 9.5l5 5m0-5l-5 5" fill="none" stroke="currentColor" />
		{/if}
	</svg>
</button>

<style>
	button {
		display: grid;
		place-items: center;
		inline-size: 2.75rem;
		block-size: 2.75rem;
		padding: 0;
		border-radius: 50%;
	}

	svg {
		inline-size: 1.375rem;
		stroke-width: 1.8;
		stroke-linecap: round;
		stroke-linejoin: round;
	}

	button[aria-pressed='false'] {
		color: var(--muted);
	}
</style>
