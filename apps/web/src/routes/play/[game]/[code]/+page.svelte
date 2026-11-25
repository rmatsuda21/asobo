<script lang="ts">
	import { page } from '$app/state';
	import { isOffered, registry } from '#lib/games/registry.ts';
	import NoSuchGame from '#lib/NoSuchGame.svelte';
	import OnlineGame from '#lib/OnlineGame.svelte';

	const id = $derived(page.params.game ?? '');
	const code = $derived(page.params.code ?? '');
</script>

{#if isOffered(id)}
	{#key `${id}/${code}`}
		<OnlineGame {id} {code} ui={registry[id]} />
	{/key}
{:else}
	<NoSuchGame />
{/if}
