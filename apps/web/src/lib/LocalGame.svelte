<script lang="ts" generics="State, Move">
	import './game-page.css';
	import { goto } from '$app/navigation';
	import type { GameId, Seat } from '@asobo/games';
	import type { GameUI, LastMove } from './games/types.ts';
	import { buzz } from './haptics.ts';
	import { fill, i18n } from './i18n.svelte.ts';
	import { newRoomCode } from './room.svelte.ts';
	import SoundButton from './SoundButton.svelte';

	/** Two players sharing one device. */
	let { id, ui }: { id: GameId; ui: GameUI<State, Move> } = $props();

	const storageKey = $derived(`asobo:${id}:local`);
	const fresh = $derived(JSON.stringify(ui.rules.setup()));

	function load(): State | null {
		try {
			return ui.restore(JSON.parse(localStorage.getItem(storageKey) ?? 'null'));
		} catch {
			return null;
		}
	}

	function save(state: State) {
		try {
			localStorage.setItem(storageKey, JSON.stringify(state));
		} catch {
			// Without storage the game still works; it just won't survive a reload.
		}
	}

	// The screen is recreated for each game, so reading `ui` once here is intended.
	// svelte-ignore state_referenced_locally
	let game = $state.raw<State>(load() ?? ui.rules.setup());
	let last = $state.raw<LastMove<State, Move> | null>(null);
	/** The player who just had to pass, until the next move. */
	let passed = $state<Seat | null>(null);
	let confirmingReset = $state(false);

	const names = $derived([i18n.t.cocoa, i18n.t.cream] as const);
	const turn = $derived(ui.rules.turn(game));
	const legal = $derived(turn === null ? [] : ui.rules.legalMoves(game, turn));
	const result = $derived(ui.rules.result(game));
	const started = $derived(JSON.stringify(game) !== fresh);

	const status = $derived.by(() => {
		if (result) {
			return result.kind === 'draw'
				? i18n.t.draw
				: fill(i18n.t.wins, { name: names[result.winner] });
		}
		if (turn === null) return '';
		if (passed !== null) return fill(i18n.t.passed, { name: names[passed], other: names[turn] });
		return fill(i18n.t.turnOf, { name: names[turn] });
	});

	function play(move: Move) {
		const seat = turn;
		if (seat === null) return;
		let next: State;
		try {
			next = ui.rules.applyMove(game, seat, move);
		} catch {
			return;
		}
		buzz();
		const nextTurn = ui.rules.turn(next);
		const move_ = { before: game, move, by: seat };
		// If the turn did not change hands, the other player had no move.
		passed = nextTurn === seat ? (seat === 0 ? 1 : 0) : null;
		confirmingReset = false;
		last = move_;
		game = next;
		save(next);
		ui.sounds(move_, next, { finished: nextTurn === null, passed: passed !== null });
	}

	function reset() {
		if (started && !result && !confirmingReset) {
			confirmingReset = true;
			return;
		}
		confirmingReset = false;
		last = null;
		passed = null;
		game = ui.rules.setup();
		save(game);
	}
</script>

<svelte:head>
	<title>{i18n.t[ui.name]} | Asobo</title>
</svelte:head>

<div class="game-page">
	<div class="title">
		<a class="back" href="/"><span aria-hidden="true">‹</span> {i18n.t.allGames}</a>
		<h1>{i18n.t[ui.name]}</h1>
		<SoundButton />
	</div>

	<ui.Table
		state={game}
		{names}
		{legal}
		{last}
		winner={result ? (result.kind === 'draw' ? 'draw' : result.winner) : null}
		confetti
		asleep={null}
		onplay={play}
	/>

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
		<button class="primary soft" onclick={() => goto(`/play/${id}/${newRoomCode()}`)}>
			{i18n.t.playOnline}
		</button>
	</div>
</div>
