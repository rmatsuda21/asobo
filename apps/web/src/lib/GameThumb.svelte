<script lang="ts">
	import type { GameId } from '@asobo/games';

	/** A tiny picture of each game's board for the home screen. */
	let { id }: { id: GameId } = $props();

	// x = cocoa, o = cream, . = empty.
	const pictures: Record<GameId, { columns: number; cells: string }> = {
		reversi: { columns: 4, cells: '.....ox..xxx....' },
		four: { columns: 4, cells: '......x..xo.xoxo' }
	};
	const picture = $derived(pictures[id]);
</script>

<div class="thumb {id}" style:--columns={picture.columns} aria-hidden="true">
	{#each picture.cells as cell, i (i)}
		<span class="cell">
			{#if cell !== '.'}<i class="stone {cell === 'x' ? 'cocoa' : 'cream'}"></i>{/if}
		</span>
	{/each}
</div>

<style>
	.thumb {
		display: grid;
		grid-template-columns: repeat(var(--columns), 1fr);
		gap: 3px;
		aspect-ratio: 1;
	}

	.cell {
		display: grid;
		place-items: center;
		aspect-ratio: 1;
		border-radius: 0.375rem;
		background: var(--felt);
		box-shadow: inset 0 -2px 0 var(--felt-shade);
	}

	/* Four in a Row is a frame with round holes, not separate tiles. */
	.four {
		gap: 2px;
		padding: 4px 4px 6px;
		border-radius: 0.75rem;
		background: var(--felt);
		box-shadow: inset 0 -3px 0 var(--felt-shade);
	}

	.four .cell {
		border-radius: 50%;
		background: var(--bg);
		box-shadow: inset 0 2px 0 rgb(0 0 0 / 0.1);
	}

	.four .stone {
		inline-size: 92%;
	}
</style>
