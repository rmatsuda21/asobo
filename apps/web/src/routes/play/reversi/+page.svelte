<script lang="ts">
	import { count, flips, reversi, type ReversiState, type Seat } from '@asobo/games';
	import { fill, i18n } from '#lib/i18n.svelte.ts';
	import { sound } from '#lib/sound.svelte.ts';

	const STORAGE_KEY = 'asobo:reversi:local';
	const COLUMNS = 'ABCDEFGH';

	/** What the last move changed, so only those stones animate. */
	interface LastMove {
		placed: number;
		flipped: Set<number>;
	}

	function load(): ReversiState | null {
		try {
			const saved: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null');
			if (typeof saved !== 'object' || saved === null) return null;
			const { board, turn } = saved as Record<string, unknown>;
			const validCell = (c: unknown) => c === 0 || c === 1 || c === null;
			if (!Array.isArray(board) || board.length !== 64 || !board.every(validCell)) return null;
			if (!validCell(turn)) return null;
			return { board, turn: turn as Seat | null };
		} catch {
			return null;
		}
	}

	function save(state: ReversiState) {
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
		} catch {
			// Without storage the game still works; it just won't survive a reload.
		}
	}

	let game = $state.raw<ReversiState>(load() ?? reversi.setup());
	let last = $state.raw<LastMove | null>(null);
	/** The player who just had to pass, until the next move. */
	let passed = $state<Seat | null>(null);
	let confirmingReset = $state(false);

	const names = $derived([i18n.t.cocoa, i18n.t.cream] as const);
	const score = $derived(count(game.board));
	const legal = $derived(new Set(game.turn === null ? [] : reversi.legalMoves(game, game.turn)));
	const result = $derived(reversi.result(game));
	const started = $derived(score[0] + score[1] > 4);

	const status = $derived.by(() => {
		if (result) {
			return result.kind === 'draw'
				? i18n.t.draw
				: fill(i18n.t.wins, { name: names[result.winner] });
		}
		if (game.turn === null) return '';
		if (passed !== null) {
			return fill(i18n.t.passed, { name: names[passed], other: names[game.turn] });
		}
		return fill(i18n.t.turnOf, { name: names[game.turn] });
	});

	function play(square: number) {
		const seat = game.turn;
		if (seat === null || !legal.has(square)) return;
		const flipped = flips(game.board, seat, square);
		const next = reversi.applyMove(game, seat, square);
		last = { placed: square, flipped: new Set(flipped) };
		// If the turn did not change hands, the other player had no move.
		passed = next.turn === seat ? (seat === 0 ? 1 : 0) : null;
		confirmingReset = false;
		game = next;
		save(next);

		// Sounds follow the animation: the stone lands, then each ring of flips hops in turn.
		const rings = [...new Set(flipped.map((i) => rippleDelay(square, i)))].sort((a, b) => a - b);
		const settled = (rings.at(-1) ?? 0) + FLIP_MS + 120;
		sound.place();
		sound.flips(rings.map((ms) => ms + FLIP_MS * 0.4));
		if (next.turn === null) sound.finish(settled / 1000);
		else if (passed !== null) sound.pass(settled / 1000);
	}

	function reset() {
		if (started && !result && !confirmingReset) {
			confirmingReset = true;
			return;
		}
		confirmingReset = false;
		last = null;
		passed = null;
		game = reversi.setup();
		save(game);
	}

	const FLIP_MS = 560;

	/** Stones flip in a ripple outwards from the stone that was placed. */
	function rippleDelay(placed: number, square: number): number {
		const dr = Math.abs(Math.floor(square / 8) - Math.floor(placed / 8));
		const dc = Math.abs((square % 8) - (placed % 8));
		return 60 + Math.max(dr, dc) * 90;
	}

	function label(square: number): string {
		const cell = game.board[square];
		const where = `${COLUMNS[square % 8]}${Math.floor(square / 8) + 1}`;
		const what = cell === null ? i18n.t.empty : names[cell];
		return legal.has(square) ? `${where}, ${what}, ${i18n.t.canPlayHere}` : `${where}, ${what}`;
	}
</script>

<svelte:head>
	<title>{i18n.t.reversi} | Asobo</title>
</svelte:head>

<div class="page">
	<div class="title">
		<a class="back" href="/"><span aria-hidden="true">‹</span> {i18n.t.allGames}</a>
		<h1>{i18n.t.reversi}</h1>
		<button
			class="sound soft"
			aria-label={i18n.t.soundEffects}
			aria-pressed={sound.enabled}
			onclick={() => sound.toggle()}
		>
			<svg viewBox="0 0 24 24" aria-hidden="true">
				<path d="M4 9.5h3.5L12 6v12l-4.5-3.5H4z" fill="currentColor" stroke="currentColor" />
				{#if sound.enabled}
					<path d="M15.5 9.2a4 4 0 0 1 0 5.6M18 6.8a7.5 7.5 0 0 1 0 10.4" fill="none" stroke="currentColor" />
				{:else}
					<path d="M15.5 9.5l5 5m0-5l-5 5" fill="none" stroke="currentColor" />
				{/if}
			</svg>
		</button>
	</div>

	<div class="score">
		{#each [0, 1] as const as seat (seat)}
			<div class="chip soft" class:active={game.turn === seat}>
				<i class="stone {seat === 0 ? 'cocoa' : 'cream'}"></i>
				<span class="name">{names[seat]}</span>
				<span class="n">{score[seat]}</span>
			</div>
		{/each}
	</div>

	<div class="board" role="group" aria-label={i18n.t.board}>
		{#each game.board as cell, square (square)}
			<button
				class="cell"
				class:legal={legal.has(square)}
				disabled={!legal.has(square)}
				aria-label={label(square)}
				onclick={() => play(square)}
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

	<p class="status" class:over={result !== null} aria-live="polite">{status}</p>

	<div class="actions">
		{#if result}
			<button class="primary soft" onclick={reset}>{i18n.t.playAgain}</button>
		{:else}
			<p class="tip">{i18n.t.passAndPlay}</p>
			<button class="soft" onclick={reset} onblur={() => (confirmingReset = false)}>
				{confirmingReset ? i18n.t.confirmNewGame : i18n.t.newGame}
			</button>
		{/if}
	</div>
</div>

<style>
	.page {
		display: grid;
		gap: 0.875rem;
	}

	.title {
		display: grid;
		grid-template-columns: 1fr auto;
		align-items: end;
		gap: 0.125rem 0.75rem;
	}

	.back {
		grid-column: 1 / -1;
	}

	.sound {
		display: grid;
		place-items: center;
		inline-size: 2.75rem;
		block-size: 2.75rem;
		padding: 0;
		border-radius: 50%;
	}

	.sound svg {
		inline-size: 1.375rem;
		stroke-width: 1.8;
		stroke-linecap: round;
		stroke-linejoin: round;
	}

	.sound[aria-pressed='false'] {
		color: var(--muted);
	}

	.back {
		justify-self: start;
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		min-block-size: var(--target-size);
		color: var(--muted);
		font-size: 0.9375rem;
		font-weight: 700;
		text-decoration: none;
	}

	h1 {
		font-size: 1.75rem;
	}

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

	.status {
		min-block-size: 1.75em;
		text-align: center;
		font-weight: 700;
	}

	.status.over {
		font-size: 1.375rem;
		font-weight: 900;
	}

	.actions {
		display: grid;
		justify-items: center;
		gap: 0.75rem;
	}

	.tip {
		color: var(--muted);
		font-size: 0.875rem;
		text-align: center;
	}

	.actions button {
		min-block-size: 3rem;
		padding-inline: 1.5rem;
		border-radius: 999px;
		font-weight: 700;
	}

	.actions .primary {
		background: var(--accent);
		color: var(--accent-ink);
		box-shadow: inset 0 -4px 0 var(--accent-shade);
	}
</style>
