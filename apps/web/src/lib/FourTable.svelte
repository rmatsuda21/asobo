<script lang="ts">
	import {
		FOUR_COLUMNS,
		landingRow,
		winningLine,
		type FourMove,
		type FourState
	} from '@asobo/games';
	import Confetti from './Confetti.svelte';
	import { dropTime } from './games/four.ts';
	import type { TableProps } from './games/types.ts';
	import { fill, i18n } from './i18n.svelte.ts';
	import PlayerChips from './PlayerChips.svelte';

	let {
		state: game,
		names,
		legal,
		last,
		winner,
		confetti,
		asleep,
		onplay
	}: TableProps<FourState, FourMove> = $props();

	const columns = Array.from({ length: FOUR_COLUMNS }, (_, i) => i);
	const canPlay = $derived(new Set(legal));
	const row = (cell: number) => Math.floor(cell / FOUR_COLUMNS);

	/** The cell the last piece landed in, so only that piece falls. */
	const placed = $derived.by(() => {
		if (!last) return null;
		const landed = landingRow(last.before.board, last.move);
		return landed === null ? null : landed * FOUR_COLUMNS + last.move;
	});

	/** Where a piece would land in each column that can be played, shown as a dot. */
	const landings = $derived(
		new Set(
			legal.map((column) => (landingRow(game.board, column) ?? 0) * FOUR_COLUMNS + column)
		)
	);

	const line = $derived(new Set(winningLine(game.board) ?? []));

	/** True once the last piece has landed and the celebration can start. */
	let cheering = $state(false);

	$effect(() => {
		if (winner === null) {
			cheering = false;
			return;
		}
		const wait = placed === null ? 0 : dropTime(row(placed)) + 150;
		const timer = setTimeout(() => (cheering = true), wait);
		return () => clearTimeout(timer);
	});

	// The four in a row celebrate; on a draw everyone does.
	const cheers = (cell: number) => cheering && (winner === 'draw' || line.has(cell));
	const happy = (seat: 0 | 1) => cheering && (winner === 'draw' || winner === seat);
</script>

<PlayerChips {names} turn={game.turn} {asleep} happy={[happy(0), happy(1)]} />

<div class="table">
	<div class="frame" role="group" aria-label={i18n.t.board}>
		{#each game.board as cell, i (i)}
			<div class="hole">
				{#if cell !== null}
					<div
						class="slot"
						class:dropping={!cheering && placed === i}
						style:--rows={row(i) + 1}
						style:--drop-ms="{dropTime(row(i))}ms"
					>
						<i
							class="stone {cell === 0 ? 'cocoa' : 'cream'}"
							class:asleep={asleep === cell && !cheering}
							class:happy={cheers(i)}
							class:cheer={cheers(i)}
							style:--wave="{(i % FOUR_COLUMNS) * 70}ms"
						></i>
					</div>
				{:else if landings.has(i)}
					<i class="hint"></i>
				{/if}
			</div>
		{/each}

		<!-- One tall button per column sits over the board, so the whole column is the target. -->
		<div class="columns">
			{#each columns as column (column)}
				<button
					disabled={!canPlay.has(column)}
					aria-label={fill(i18n.t.column, { n: String(column + 1) })}
					onclick={() => onplay(column)}
				></button>
			{/each}
		</div>
	</div>
	{#if cheering && confetti}<Confetti />{/if}
</div>

<style>
	.table {
		position: relative;
		display: grid;
		/* Never taller than the screen, so the whole board is always reachable. */
		inline-size: min(100%, (100dvb - 19rem) * 7 / 6);
		min-inline-size: 15rem;
		justify-self: center;
		font-size: clamp(1.25rem, 9vw, 3rem);
	}

	.frame {
		--gap: 6px;
		position: relative;
		display: grid;
		grid-template: repeat(6, 1fr) / repeat(7, 1fr);
		gap: var(--gap);
		aspect-ratio: 7 / 6;
		padding: 10px 10px 14px;
		border-radius: 1.375rem;
		background: var(--felt);
		box-shadow: inset 0 -5px 0 var(--felt-shade);
		/* Falling pieces come in over the top edge. */
		overflow: hidden;
	}

	.hole {
		display: grid;
		place-items: center;
		border-radius: 50%;
		background: var(--bg);
		box-shadow: inset 0 3px 0 rgb(0 0 0 / 0.1);
	}

	.slot {
		display: grid;
		place-items: center;
		inline-size: 100%;
		block-size: 100%;
	}

	.slot .stone {
		inline-size: 92%;
		font-size: 0.5em;
	}

	.hint {
		inline-size: 24%;
		aspect-ratio: 1;
		border-radius: 50%;
		background: var(--accent);
	}

	/* The piece falls from above the board, squishes on landing and bounces once. */
	.slot.dropping {
		animation: drop var(--drop-ms) cubic-bezier(0.5, 0, 0.9, 0.5) backwards;
	}

	@keyframes drop {
		0% {
			translate: 0 calc((100% + var(--gap)) * -1 * var(--rows));
			scale: 0.94 1.08;
			animation-timing-function: cubic-bezier(0.5, 0, 1, 0.6);
		}
		70% {
			translate: 0 0;
			scale: 1.2 0.78;
			animation-timing-function: ease-out;
		}
		85% {
			translate: 0 -9%;
			scale: 0.96 1.05;
		}
		100% {
			translate: 0 0;
			scale: 1 1;
		}
	}

	.columns {
		position: absolute;
		inset: 0;
		display: grid;
		grid-template-columns: repeat(7, 1fr);
		padding-inline: 7px;
	}

	.columns button {
		min-inline-size: 0;
		min-block-size: 0;
		padding: 0;
		border: 0;
		border-radius: 999px;
		background: transparent;
	}

	.columns button:enabled {
		cursor: pointer;
	}

	.columns button:enabled:active {
		background: rgb(255 255 255 / 0.35);
	}

	@media (hover: hover) {
		.columns button:enabled:hover {
			background: rgb(255 255 255 / 0.22);
		}
	}

	.columns button:focus-visible {
		outline-offset: -3px;
	}

	@media (prefers-reduced-motion: reduce) {
		.slot.dropping {
			animation: none;
		}
	}
</style>
