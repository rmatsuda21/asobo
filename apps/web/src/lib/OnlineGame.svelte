<script lang="ts" generics="State, Move">
	import './game-page.css';
	import type { GameId, Seat } from '@asobo/games';
	import type { GameUI, LastMove } from './games/types.ts';
	import { buzz } from './haptics.ts';
	import { i18n } from './i18n.svelte.ts';
	import { network } from './network.svelte.ts';
	import { RoomConnection } from './room.svelte.ts';
	import SoundButton from './SoundButton.svelte';

	/** Two players on their own devices, joined by a room on the server. */
	let { id, ui, code }: { id: GameId; ui: GameUI<State, Move>; code: string } = $props();

	let last = $state.raw<LastMove<State, Move> | null>(null);
	/** The player who just had to pass, until the next move. */
	let passed = $state<Seat | null>(null);
	/** The player who just earned another turn, until the next move. */
	let bonus = $state<Seat | null>(null);
	let copied = $state(false);
	let room = $state.raw<RoomConnection<State, Move> | null>(null);

	$effect(() => {
		const connection = new RoomConnection<State, Move>(id, code, (before, now) => {
			const move = { before, move: now.last!.move, by: now.last!.seat };
			const turn = ui.rules.turn(now.state);
			// The same player moving again is either a pass by the other side or a bonus turn.
			const again = turn === move.by;
			passed = again && ui.repeatTurn === 'pass' ? (move.by === 0 ? 1 : 0) : null;
			bonus = again && ui.repeatTurn === 'bonus' ? move.by : null;
			last = move;
			ui.sounds(move, now.state, { finished: turn === null, passed: passed !== null });
		});
		room = connection;
		return () => connection.close();
	});

	const snapshot = $derived(room?.snapshot ?? null);
	const game = $derived(snapshot?.state ?? null);
	const seat = $derived(snapshot?.seat ?? null);
	const turn = $derived(game === null ? null : ui.rules.turn(game));
	const result = $derived(game === null ? null : ui.rules.result(game));
	const friend = $derived(seat === null ? null : seat === 0 ? 1 : 0);
	const friendJoined = $derived(snapshot !== null && friend !== null && snapshot.joined[friend]);
	const friendHere = $derived(snapshot !== null && friend !== null && snapshot.present[friend]);

	// A rematch starts a new round: nothing from the old game should animate.
	let round = $state(0);
	$effect(() => {
		if (snapshot && snapshot.round !== round) {
			round = snapshot.round;
			last = null;
			passed = null;
			bonus = null;
		}
	});

	// The friend's pieces doze off once they have been away for a moment. The short
	// wait keeps a quick reload on their side from flickering everyone to sleep.
	let dozing = $state(false);
	$effect(() => {
		if (!(friendJoined && !friendHere) || result) {
			dozing = false;
			return;
		}
		const timer = setTimeout(() => (dozing = true), 1500);
		return () => clearTimeout(timer);
	});

	// Only the player whose turn it is gets tappable moves.
	const legal = $derived(
		game !== null && seat !== null && turn === seat && room?.status === 'open'
			? ui.rules.legalMoves(game, seat)
			: []
	);

	const names = $derived.by((): [string, string] => {
		if (seat === null) return [i18n.t.cocoa, i18n.t.cream];
		return seat === 0 ? [i18n.t.you, i18n.t.friend] : [i18n.t.friend, i18n.t.you];
	});

	const status = $derived.by(() => {
		if (room?.status === 'outdated') return i18n.t.outdated;
		if (!network.online) return i18n.t.offline;
		if (room?.status === 'reconnecting') return i18n.t.reconnecting;
		if (game === null) return i18n.t.connecting;
		if (result) {
			if (result.kind === 'draw') return i18n.t.draw;
			if (seat === null) return '';
			return result.winner === seat ? i18n.t.youWin : i18n.t.youLose;
		}
		if (seat === null) return i18n.t.watching;
		if (friendJoined && !friendHere) return i18n.t.friendAway;
		if (passed !== null) return passed === seat ? i18n.t.youPassed : i18n.t.friendPassed;
		if (bonus !== null) return bonus === seat ? i18n.t.youGoAgain : i18n.t.friendGoesAgain;
		return turn === seat ? i18n.t.yourTurn : i18n.t.friendsTurn;
	});

	async function share() {
		const url = location.href;
		try {
			if (navigator.share) {
				await navigator.share({ title: 'Asobo', url });
				return;
			}
			await navigator.clipboard.writeText(url);
			copied = true;
			setTimeout(() => (copied = false), 2000);
		} catch {
			// The share sheet was dismissed, or the clipboard is blocked; the link is still on screen.
		}
	}

	const canShare = typeof navigator !== 'undefined' && 'share' in navigator;
</script>

<svelte:head>
	<title>{i18n.t[ui.name]} | Asobo</title>
</svelte:head>

<div class="game-page">
	<div class="title">
		<a class="back" href="/play/{id}"><span aria-hidden="true">‹</span> {i18n.t[ui.name]}</a>
		<h1>{i18n.t.onlineGame}</h1>
		<SoundButton />
	</div>

	{#if snapshot && seat !== null && !friendJoined}
		<div class="invite soft">
			<div>
				<h2>{i18n.t.inviteTitle}</h2>
				<p>{i18n.t.inviteBody}</p>
			</div>
			<button class="primary soft" onclick={share}>
				{copied ? i18n.t.copied : canShare ? i18n.t.shareLink : i18n.t.copyLink}
			</button>
		</div>
	{/if}

	{#if game !== null}
		<ui.Table
			state={game}
			{names}
			{legal}
			{last}
			winner={result ? (result.kind === 'draw' ? 'draw' : result.winner) : null}
			confetti={result !== null &&
				(result.kind === 'draw' || seat === null || result.winner === seat)}
			asleep={dozing ? friend : null}
			perspective={seat}
			onplay={(move) => {
				buzz();
				room?.move(move);
			}}
		/>
	{/if}

	<p class="status" class:over={result !== null} aria-live="polite">{status}</p>

	<div class="actions">
		{#if room?.status === 'outdated'}
			<button class="primary soft" onclick={() => location.reload()}>{i18n.t.reload}</button>
		{:else if result && seat !== null}
			<button class="primary soft" onclick={() => room?.rematch()}>{i18n.t.rematch}</button>
		{/if}
	</div>
</div>

<style>
	.invite {
		display: grid;
		grid-template-columns: 1fr auto;
		align-items: center;
		gap: 0.75rem;
		padding: 0.875rem 0.875rem 1rem 1.125rem;
		border-radius: var(--radius);
	}

	.invite h2 {
		font-size: 1rem;
	}

	.invite p {
		color: var(--muted);
		font-size: 0.875rem;
	}

	.invite button {
		min-block-size: 2.75rem;
		padding-inline: 1.125rem;
		border-radius: 999px;
		font-weight: 700;
		white-space: nowrap;
	}

	.invite .primary {
		background: var(--accent);
		color: var(--accent-ink);
		box-shadow: inset 0 -4px 0 var(--accent-shade);
	}
</style>
