<script lang="ts">
	import type { ReversiCell, Seat } from '@asobo/games';
	import { i18n } from './i18n.svelte.ts';
	import { FLIP_MS, rippleDelay, type LastMove } from './reversi-ui.ts';

	interface Props {
		board: readonly ReversiCell[];
		/** Whose turn it is; that player's chip is ringed. */
		turn: Seat | null;
		score: readonly [number, number];
		/** Name shown on each player's chip. */
		names: readonly [string, string];
		/** Squares that can be tapped right now. Empty when it is not this device's move. */
		legal: ReadonlySet<number>;
		last: LastMove | null;
		onplay: (square: number) => void;
	}

	let { board, turn, score, names, legal, last, onplay }: Props = $props();

	const COLUMNS = 'ABCDEFGH';
	const stoneNames = $derived([i18n.t.cocoa, i18n.t.cream] as const);

	function label(square: number): string {
		const cell = board[square];
		const where = `${COLUMNS[square % 8]}${Math.floor(square / 8) + 1}`;
		const what = cell === null || cell === undefined ? i18n.t.empty : stoneNames[cell];
		return legal.has(square) ? `${where}, ${what}, ${i18n.t.canPlayHere}` : `${where}, ${what}`;
	}
</script>

<div class="score">
	{#each [0, 1] as const as seat (seat)}
		<div class="chip soft" class:active={turn === seat}>
			<i class="stone {seat === 0 ? 'cocoa' : 'cream'}"></i>
			<span class="name">{names[seat]}</span>
			<span class="n">{score[seat]}</span>
		</div>
	{/each}
</div>

<div class="board" role="group" aria-label={i18n.t.board}>
	{#each board as cell, square (square)}
		<button
			class="cell"
			class:legal={legal.has(square)}
			disabled={!legal.has(square)}
			aria-label={label(square)}
			onclick={() => onplay(square)}
		>
			{#if cell !== null}
				{#key cell}
					<i
						class="stone {cell === 0 ? 'cocoa' : 'cream'}"
						class:placed={last?.placed === square}
						class:flipped={last?.flipped.has(square)}
						style:--delay="{last ? rippleDelay(last.placed, square) : 0}ms"
						style:--flip-ms="{FLIP_MS}ms"
						style:--from={cell === 0 ? 'var(--cream)' : 'var(--cocoa)'}
						style:--from-eye={cell === 0 ? 'var(--cocoa)' : 'var(--cream)'}
						style:--to={cell === 0 ? 'var(--cocoa)' : 'var(--cream)'}
						style:--to-eye={cell === 0 ? 'var(--cream)' : 'var(--cocoa)'}
					></i>
				{/key}
			{:else if legal.has(square)}
				<i class="hint"></i>
			{/if}
		</button>
	{/each}
</div>

<style>
	.score {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.75rem;
	}

	.chip {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 0.875rem 0.625rem 0.625rem;
		border-radius: 999px;
		font-weight: 700;
		outline: 3px solid transparent;
		transition: outline-color 150ms ease-out;
	}

	.chip.active {
		outline-color: var(--accent);
	}

	.chip .stone {
		inline-size: 1.75rem;
		flex: none;
	}

	.name {
		min-inline-size: 0;
	}

	.n {
		margin-inline-start: auto;
		font-size: 1.25rem;
		font-weight: 900;
		font-variant-numeric: tabular-nums;
	}

	.board {
		display: grid;
		grid-template: repeat(8, 1fr) / repeat(8, 1fr);
		gap: 4px;
		aspect-ratio: 1;
		/* Never taller than the screen, so the whole board is always reachable. */
		inline-size: min(100%, 100dvb - 19rem);
		min-inline-size: 15rem;
		justify-self: center;
		font-size: clamp(1.25rem, 9vw, 3rem);
	}

	.cell {
		display: grid;
		place-items: center;
		min-block-size: 0;
		min-inline-size: 0;
		padding: 0;
		border: 0;
		border-radius: 22%;
		background: var(--felt);
		box-shadow: inset 0 -3px 0 var(--felt-shade);
	}

	.cell.legal {
		cursor: pointer;
	}

	.cell.legal:active {
		translate: 0 2px;
		box-shadow: inset 0 -1px 0 var(--felt-shade);
	}

	.cell :global(.stone) {
		font-size: 0.5em;
	}

	.hint {
		inline-size: 26%;
		aspect-ratio: 1;
		border-radius: 50%;
		background: var(--accent);
	}

	/* A new stone drops in and squishes as it lands. */
	.stone.placed {
		animation: land 340ms ease-out backwards;
	}

	/*
	 * A trapped stone crouches, hops, spins round in the air to show its other
	 * colour, then lands with a squish and a wobble.
	 */
	.stone.flipped {
		animation: hop var(--flip-ms) cubic-bezier(0.4, 0, 0.5, 1) var(--delay) backwards;
	}

	@keyframes land {
		0% {
			translate: 0 -45%;
			scale: 0.7 0.9;
			opacity: 0;
		}
		45% {
			translate: 0 0;
			scale: 1.22 0.78;
			opacity: 1;
		}
		72% {
			scale: 0.94 1.08;
		}
		100% {
			scale: 1 1;
		}
	}

	@keyframes hop {
		0% {
			translate: 0 0;
			scale: 1 1;
			background-color: var(--from);
			--eye: var(--from-eye);
		}
		14% {
			translate: 0 4%;
			scale: 1.16 0.82;
		}
		34% {
			translate: 0 -38%;
			scale: 0.86 1.14;
		}
		45.9% {
			background-color: var(--from);
			--eye: var(--from-eye);
		}
		46% {
			translate: 0 -46%;
			scale: 0.06 1.16;
			background-color: var(--to);
			--eye: var(--to-eye);
		}
		58% {
			translate: 0 -38%;
			scale: 0.86 1.14;
		}
		76% {
			translate: 0 0;
			scale: 1.24 0.76;
		}
		88% {
			translate: 0 -5%;
			scale: 0.95 1.07;
		}
		100% {
			translate: 0 0;
			scale: 1 1;
			background-color: var(--to);
			--eye: var(--to-eye);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.stone.placed,
		.stone.flipped {
			animation: none;
		}
	}
</style>
