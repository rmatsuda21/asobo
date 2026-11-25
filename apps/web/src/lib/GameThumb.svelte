<script lang="ts">
	import type { GameId } from '@asobo/games';

	/** A tiny picture of each game's board for the home screen. */
	let { id }: { id: GameId } = $props();

	// x = cocoa, o = cream, . = empty.
	const pictures: Partial<Record<GameId, { columns: number; cells: string }>> = {
		reversi: { columns: 4, cells: '.....ox..xxx....' },
		four: { columns: 4, cells: '......x..xo.xoxo' }
	};
	const picture = $derived(pictures[id]);
</script>

{#if picture}
	<div class="thumb {id}" style:--columns={picture.columns} aria-hidden="true">
		{#each picture.cells as cell, i (i)}
			<span class="cell">
				{#if cell !== '.'}<i class="stone {cell === 'x' ? 'cocoa' : 'cream'}"></i>{/if}
			</span>
		{/each}
	</div>
{:else if id === 'dots'}
	<!-- Dots and Boxes: a few drawn lines and one claimed box. -->
	<div class="thumb dots" aria-hidden="true">
		<svg viewBox="0 0 100 100">
			<g class="track">
				<path d="M14 14H86M14 50H86M14 86H86M14 14V86M50 14V86M86 14V86" />
			</g>
			<g class="drawn">
				<path d="M14 14H50V50H14ZM50 50H86M50 50V86" />
			</g>
			{#each [14, 50, 86] as y (y)}
				{#each [14, 50, 86] as x (x)}
					<circle cx={x} cy={y} r="5.5" />
				{/each}
			{/each}
		</svg>
		<i class="stone cocoa"></i>
	</div>
{:else if id === 'flick'}
	<!-- Mochi Flick: a round tray with a few mochi on it. -->
	<div class="thumb flick" aria-hidden="true">
		<i class="stone cocoa" style:left="20%" style:top="50%"></i>
		<i class="stone cocoa" style:left="52%" style:top="58%"></i>
		<i class="stone cream" style:left="34%" style:top="16%"></i>
	</div>
{/if}

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

	.flick {
		position: relative;
		display: block;
		border-radius: 50%;
		background: var(--felt);
		box-shadow: inset 0 -3px 0 var(--felt-shade);
	}

	.flick .stone {
		position: absolute;
		inline-size: 28%;
	}

	.dots {
		position: relative;
		display: block;
		border-radius: 0.75rem;
		background: var(--felt);
		box-shadow: inset 0 -3px 0 var(--felt-shade);
	}

	.dots svg {
		display: block;
		fill: var(--cocoa);
	}

	.dots path {
		fill: none;
		stroke-width: 5;
		stroke-linecap: round;
		stroke-linejoin: round;
	}

	.dots .track path {
		stroke: var(--felt-shade);
	}

	.dots .drawn path {
		stroke: var(--cocoa);
	}

	.dots .stone {
		position: absolute;
		inset-inline-start: 19%;
		inset-block-start: 19%;
		inline-size: 26%;
	}
</style>
