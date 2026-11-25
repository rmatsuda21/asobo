<script lang="ts">
	import '#lib/game-page.css';
	import { goto } from '$app/navigation';
	import { count, reversi, type ReversiState, type Seat } from '@asobo/games';
	import { fill, i18n } from '#lib/i18n.svelte.ts';
	import ReversiTable from '#lib/ReversiTable.svelte';
	import { moveBetween, playMoveSounds, type LastMove } from '#lib/reversi-ui.ts';
	import { newRoomCode } from '#lib/room.svelte.ts';
	import SoundButton from '#lib/SoundButton.svelte';

	const STORAGE_KEY = 'asobo:reversi:local';

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
		const next = reversi.applyMove(game, seat, square);
		last = moveBetween(game.board, next.board, square);
		// If the turn did not change hands, the other player had no move.
		passed = next.turn === seat ? (seat === 0 ? 1 : 0) : null;
		confirmingReset = false;
		game = next;
		save(next);
		playMoveSounds(last, { finished: next.turn === null, passed: passed !== null });
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
</script>

<svelte:head>
	<title>{i18n.t.reversi} | Asobo</title>
</svelte:head>

<div class="game-page">
	<div class="title">
		<a class="back" href="/"><span aria-hidden="true">‹</span> {i18n.t.allGames}</a>
		<h1>{i18n.t.reversi}</h1>
		<SoundButton />
	</div>

	<ReversiTable board={game.board} turn={game.turn} {score} {names} {legal} {last} onplay={play} />

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
		<button class="primary soft" onclick={() => goto(`/play/reversi/${newRoomCode()}`)}>
			{i18n.t.playOnline}
		</button>
	</div>
</div>
