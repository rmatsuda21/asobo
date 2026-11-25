<script lang="ts">
	import { page } from '$app/state';
	import { isOffered, registry } from '#lib/games/registry.ts';
	import LocalGame from '#lib/LocalGame.svelte';
	import NoSuchGame from '#lib/NoSuchGame.svelte';

	const id = $derived(page.params.game ?? '');
</script>

{#if isOffered(id)}
	{#key id}
		<LocalGame {id} ui={registry[id]} />
	{/key}
{:else}
	<NoSuchGame />
{/if}
