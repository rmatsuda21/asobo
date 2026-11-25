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
		/** Set when the game is over: the winner's stones cheer (both colours on a draw). */
		winner?: Seat | 'draw' | null;
		/** Whether to throw confetti with the cheer. */
		confetti?: boolean;
		/** A player who is away; their stones doze until they come back. */
		asleep?: Seat | null;
		onplay: (square: number) => void;
	}

	let {
		board,
		turn,
		score,
		names,
		legal,
		last,
		winner = null,
		confetti = false,
		asleep = null,
		onplay
	}: Props = $props();

	/** True once the last move has finished animating and the celebration can start. */
	let cheering = $state(false);

	$effect(() => {
		if (winner === null) {
			cheering = false;
			return;
		}
		const settle = last
			? Math.max(0, ...[...last.flipped].map((i) => rippleDelay(last.placed, i))) + FLIP_MS + 200
			: 0;
		const timer = setTimeout(() => (cheering = true), settle);
		return () => clearTimeout(timer);
	});

	const cheers = (cell: ReversiCell) =>
		cheering && cell !== null && (winner === 'draw' || winner === cell);

	// Confetti pieces are laid out from their index, so they look scattered but never jump around.
	const CONFETTI_COLOURS = ['var(--accent)', '#f5d77a', '#b9d7f0', 'var(--cream)', 'var(--cocoa)'];
	const pieces = Array.from({ length: 32 }, (_, i) => ({
		left: (i * 37 + 11) % 100,
		delay: ((i * 53) % 17) * 70,
		duration: 1700 + ((i * 29) % 9) * 130,
		size: 0.3 + ((i * 7) % 4) * 0.08,
		sway: ((i * 13) % 7) - 3,
		round: i % 3 !== 0,
		colour: CONFETTI_COLOURS[i % CONFETTI_COLOURS.length]
	}));

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
			<i
				class="stone {seat === 0 ? 'cocoa' : 'cream'}"
				class:asleep={asleep === seat}
				class:happy={cheers(seat)}
			></i>
			{#if asleep === seat}
				<span class="zzz" aria-hidden="true"><b>z</b><b>z</b><b>z</b></span>
			{/if}
			<span class="name">{names[seat]}</span>
			<span class="n">{score[seat]}</span>
		</div>
	{/each}
</div>

<div class="table">
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
						class:asleep={asleep === cell && !cheering}
						class:happy={cheers(cell)}
						class:cheer={cheers(cell)}
						style:--wave="{((square % 8) + Math.floor(square / 8)) * 55}ms"
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
{#if cheering && confetti}
	<div class="confetti" aria-hidden="true">
		{#each pieces as piece, i (i)}
			<i
				class:round={piece.round}
				style:left="{piece.left}%"
				style:background={piece.colour}
				style:font-size="{piece.size}em"
				style:--sway="{piece.sway}em"
				style:animation-delay="{piece.delay}ms"
				style:animation-duration="{piece.duration}ms"
			></i>
		{/each}
	</div>
{/if}
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
		position: relative;
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

	/* The winner's stones bounce in a wave that rolls across the board. */
	.stone.cheer {
		animation: cheer 720ms ease-in-out var(--wave) 3 backwards;
	}

	@keyframes cheer {
		0%,
		100% {
			translate: 0 0;
			scale: 1 1;
		}
		18% {
			translate: 0 3%;
			scale: 1.14 0.86;
		}
		48% {
			translate: 0 -34%;
			scale: 0.92 1.1;
		}
		78% {
			translate: 0 0;
			scale: 1.16 0.84;
		}
		90% {
			scale: 0.97 1.04;
		}
	}

	/* A dozing stone breathes slowly. */
	.stone.asleep {
		animation: breathe 3.2s ease-in-out infinite;
	}

	@keyframes breathe {
		0%,
		100% {
			scale: 1 1;
		}
		50% {
			scale: 1.05 0.93;
			translate: 0 3%;
		}
	}

	/* Three little z's drift up from the sleeping player's chip. */
	.zzz {
		position: absolute;
		inset-inline-start: 1.9rem;
		inset-block-start: -0.35rem;
		display: flex;
		align-items: flex-end;
		gap: 0.05rem;
		color: var(--muted);
		font-weight: 900;
		line-height: 1;
		pointer-events: none;
	}

	.zzz b {
		opacity: 0;
		animation: drift 2.4s ease-out infinite;
	}

	.zzz b:nth-child(1) {
		font-size: 0.625rem;
	}

	.zzz b:nth-child(2) {
		font-size: 0.75rem;
		animation-delay: 0.5s;
	}

	.zzz b:nth-child(3) {
		font-size: 0.9375rem;
		animation-delay: 1s;
	}

	@keyframes drift {
		0% {
			opacity: 0;
			translate: 0 0.3rem;
		}
		30% {
			opacity: 1;
		}
		100% {
			opacity: 0;
			translate: 0.2rem -0.5rem;
		}
	}

	.confetti {
		position: absolute;
		inset: -12% 0 0;
		overflow: hidden;
		pointer-events: none;
	}

	.confetti i {
		position: absolute;
		inset-block-start: 0;
		inline-size: 1em;
		block-size: 1em;
		border-radius: 22%;
		opacity: 0;
		animation: fall linear 1 both;
	}

	.confetti i.round {
		border-radius: 50%;
	}

	@keyframes fall {
		0% {
			opacity: 0;
			translate: 0 -100%;
			rotate: 0turn;
		}
		8% {
			opacity: 1;
		}
		50% {
			translate: var(--sway) 22em;
		}
		85% {
			opacity: 1;
		}
		100% {
			opacity: 0;
			translate: 0 46em;
			rotate: 1.5turn;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.stone.placed,
		.stone.flipped,
		.stone.cheer,
		.stone.asleep,
		.zzz b {
			animation: none;
		}

		.zzz b {
			opacity: 1;
		}

		.confetti {
			display: none;
		}
	}
</style>
