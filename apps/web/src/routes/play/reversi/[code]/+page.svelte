<script lang="ts">
	import '#lib/game-page.css';
	import { page } from '$app/state';
	import { count, reversi, type ReversiState, type Seat } from '@asobo/games';
	import { i18n } from '#lib/i18n.svelte.ts';
	import ReversiTable from '#lib/ReversiTable.svelte';
	import { playMoveSounds } from '#lib/reversi-ui.ts';
	import { RoomConnection } from '#lib/room.svelte.ts';
	import SoundButton from '#lib/SoundButton.svelte';

	const code = $derived(page.params.code ?? '');

	/** The player who just had to pass, until the next move. */
	let passed = $state<Seat | null>(null);
	let copied = $state(false);
	let room = $state.raw<RoomConnection | null>(null);

	$effect(() => {
		const connection = new RoomConnection(code, (move, after: ReversiState, by) => {
			// If the turn did not change hands, the other player had no move.
			passed = after.turn === by ? (by === 0 ? 1 : 0) : null;
			playMoveSounds(move, { finished: after.turn === null, passed: passed !== null });
		});
		room = connection;
		return () => connection.close();
	});

	const snapshot = $derived(room?.snapshot ?? null);
	const game = $derived(snapshot?.state ?? null);
	const seat = $derived(snapshot?.seat ?? null);
	const score = $derived(game ? count(game.board) : ([0, 0] as [number, number]));
	const result = $derived(game ? reversi.result(game) : null);
	const friendJoined = $derived(
		snapshot !== null && seat !== null && snapshot.joined[seat === 0 ? 1 : 0]
	);
	const friendHere = $derived(
		snapshot !== null && seat !== null && snapshot.present[seat === 0 ? 1 : 0]
	);

	// The friend's stones doze off once they have been away for a moment. The short
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

	// Only the player whose turn it is gets tappable squares.
	const legal = $derived(
		new Set(
			game && seat !== null && game.turn === seat && room?.status === 'open'
				? reversi.legalMoves(game, seat)
				: []
		)
	);

	const names = $derived.by((): [string, string] => {
		if (seat === null) return [i18n.t.cocoa, i18n.t.cream];
		return seat === 0 ? [i18n.t.you, i18n.t.friend] : [i18n.t.friend, i18n.t.you];
	});

	const status = $derived.by(() => {
		if (!game) return i18n.t.connecting;
		if (room?.status === 'reconnecting') return i18n.t.reconnecting;
		if (result) {
			if (result.kind === 'draw') return i18n.t.draw;
			if (seat === null) return '';
			return result.winner === seat ? i18n.t.youWin : i18n.t.youLose;
		}
		if (seat === null) return i18n.t.watching;
		if (friendJoined && !friendHere) return i18n.t.friendAway;
		if (passed !== null) return passed === seat ? i18n.t.youPassed : i18n.t.friendPassed;
		return game.turn === seat ? i18n.t.yourTurn : i18n.t.friendsTurn;
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
	<title>{i18n.t.reversi} | Asobo</title>
</svelte:head>

<div class="game-page">
	<div class="title">
		<a class="back" href="/play/reversi"><span aria-hidden="true">‹</span> {i18n.t.reversi}</a>
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

	{#if game}
		<ReversiTable
			board={game.board}
			turn={game.turn}
			{score}
			{names}
			{legal}
			last={room?.last ?? null}
			winner={result ? (result.kind === 'draw' ? 'draw' : result.winner) : null}
			confetti={result !== null && (result.kind === 'draw' || seat === null || result.winner === seat)}
			asleep={dozing && seat !== null ? (seat === 0 ? 1 : 0) : null}
			onplay={(square) => room?.move(square)}
		/>
	{/if}

	<p class="status" class:over={result !== null} aria-live="polite">{status}</p>

	<div class="actions">
		{#if result && seat !== null}
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
