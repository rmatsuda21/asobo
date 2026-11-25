<script lang="ts">
	import { count, type ReversiCell, type ReversiMove, type ReversiState } from '@asobo/games';
	import Confetti from './Confetti.svelte';
	import { FLIP_MS, flippedBy, rippleDelay, settleTime } from './games/reversi.ts';
	import type { TableProps } from './games/types.ts';
	import { i18n } from './i18n.svelte.ts';
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
	}: TableProps<ReversiState, ReversiMove> = $props();

	const COLUMNS = 'ABCDEFGH';
	const stoneNames = $derived([i18n.t.cocoa, i18n.t.cream] as const);
	const score = $derived(count(game.board));
	const canPlay = $derived(new Set(legal));
	/** The stone just placed and the stones it flipped, so only those animate. */
	const placed = $derived(last?.move ?? null);
	const flipped = $derived(
		last ? flippedBy(last.before.board, game.board, last.move) : new Set<number>()
	);

	/** True once the last move has finished animating and the celebration can start. */
	let cheering = $state(false);

	$effect(() => {
		if (winner === null) {
			cheering = false;
			return;
		}
		const wait = placed === null ? 0 : settleTime(placed, flipped) + 200;
		const timer = setTimeout(() => (cheering = true), wait);
		return () => clearTimeout(timer);
	});

	const cheers = (cell: ReversiCell) =>
		cheering && cell !== null && (winner === 'draw' || winner === cell);

	function label(square: number): string {
		const cell = game.board[square];
		const where = `${COLUMNS[square % 8]}${Math.floor(square / 8) + 1}`;
		const what = cell === null || cell === undefined ? i18n.t.empty : stoneNames[cell];
		return canPlay.has(square) ? `${where}, ${what}, ${i18n.t.canPlayHere}` : `${where}, ${what}`;
	}
</script>

<PlayerChips {names} turn={game.turn} {score} {asleep} happy={[cheers(0), cheers(1)]} />

<div class="table">
	<div class="board" role="group" aria-label={i18n.t.board}>
		{#each game.board as cell, square (square)}
			<button
				class="cell"
				class:legal={canPlay.has(square)}
				disabled={!canPlay.has(square)}
				aria-label={label(square)}
				onclick={() => onplay(square)}
			>
				{#if cell !== null}
					{#key cell}
						<i
							class="stone {cell === 0 ? 'cocoa' : 'cream'}"
							class:placed={!cheering && placed === square}
							class:flipped={!cheering && flipped.has(square)}
							class:asleep={asleep === cell && !cheering}
							class:happy={cheers(cell)}
							class:cheer={cheers(cell)}
							style:--wave="{((square % 8) + Math.floor(square / 8)) * 55}ms"
							style:--delay="{placed === null ? 0 : rippleDelay(placed, square)}ms"
							style:--flip-ms="{FLIP_MS}ms"
							style:--from={cell === 0 ? 'var(--cream)' : 'var(--cocoa)'}
							style:--from-eye={cell === 0 ? 'var(--cocoa)' : 'var(--cream)'}
							style:--to={cell === 0 ? 'var(--cocoa)' : 'var(--cream)'}
							style:--to-eye={cell === 0 ? 'var(--cream)' : 'var(--cocoa)'}
						></i>
					{/key}
				{:else if canPlay.has(square)}
					<i class="hint"></i>
				{/if}
			</button>
		{/each}
	</div>
	{#if cheering && confetti}<Confetti />{/if}
</div>

<style>
	.table {
		position: relative;
		display: grid;
		/* Never taller than the screen, so the whole board is always reachable. */
		inline-size: min(100%, 100dvb - 19rem);
		min-inline-size: 15rem;
		justify-self: center;
		font-size: clamp(1.25rem, 9vw, 3rem);
	}

	.board {
		display: grid;
		grid-template: repeat(8, 1fr) / repeat(8, 1fr);
		gap: 4px;
		aspect-ratio: 1;
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

	.cell .stone {
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
