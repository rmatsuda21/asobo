<script lang="ts">
	import { FLICK, simulate, type FlickMove, type FlickPiece, type FlickState } from '@asobo/games';
	import Confetti from './Confetti.svelte';
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
		perspective,
		onplay
	}: TableProps<FlickState, FlickMove> = $props();

	/** Half the width of the drawn area, in tray units: the tray plus room for mochi to fall into. */
	const VIEW = 124;
	/** How far back, in tray units, a mochi can be pulled. A full pull is a full-strength flick. */
	const MAX_PULL = 62;
	const FRAME_MS = 1000 / 60;

	// Online, the board turns so your own mochi are always nearest you.
	const flip = $derived(perspective === 1 ? -1 : 1);
	const mine = $derived(new Set(legal.map((move) => move.piece)));

	/** Where the mochi are drawn right now. During a flick this runs ahead of `game`. */
	// svelte-ignore state_referenced_locally (the effect below keeps this in step with `game`)
	let shown = $state.raw<readonly FlickPiece[]>(game.pieces);
	/** Mochi that have gone over the edge during the flick being played. */
	let falling = $state.raw<ReadonlySet<number>>(new Set());
	let playing = $state(false);
	/** Who took the round that just ended, shown briefly before the tray resets. */
	let banner = $state.raw<{ seat: 0 | 1 | null } | null>(null);

	let area = $state<HTMLElement>();
	const elements: Record<number, HTMLElement> = {};
	let played: unknown = null;

	function squish(id: number, force: number) {
		const stone = elements[id]?.firstElementChild;
		if (!stone || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
		const amount = Math.min(0.32, 0.08 + force * 0.05);
		stone.animate(
			[
				{ scale: `${1 + amount} ${1 - amount}` },
				{ scale: `${1 - amount / 3} ${1 + amount / 3}` },
				{ scale: '1 1' }
			],
			{ duration: 240, easing: 'ease-out' }
		);
	}

	// Plays each new flick: the same simulation the rules ran, drawn one step per frame.
	$effect(() => {
		const move = last;
		const now = game;
		const settle = () => {
			playing = false;
			falling = new Set();
			banner = null;
			shown = now.pieces;
		};
		if (!move || move === played) {
			settle();
			return;
		}
		played = move;

		const before = move.before.pieces;
		const { frames, events } = simulate(before, move.move);
		// The clock starts at the first frame the browser draws. A frame's timestamp is
		// when that frame began, which can be earlier than "now" was when the flick
		// arrived, so measuring from "now" could ask for a step before the first one.
		let started: number | null = null;
		let frameRequest = 0;
		let bannerTimer: ReturnType<typeof setTimeout> | undefined;
		let nextEvent = 0;
		let done = false;
		playing = true;
		falling = new Set();
		banner = null;

		const finish = () => {
			if (done) return;
			done = true;
			cancelAnimationFrame(frameRequest);
			if (now.round === move.before.round) {
				settle();
				return;
			}
			// The round ended: say who took it, then bring out the fresh tray.
			const took = now.wins[0] > move.before.wins[0] ? 0 : now.wins[1] > move.before.wins[1] ? 1 : null;
			banner = { seat: took };
			bannerTimer = setTimeout(settle, 1600);
		};

		const draw = (time: number) => {
			started ??= time;
			const elapsed = Math.max(0, time - started);
			const step = Math.min(frames.length - 1, Math.floor(elapsed / FRAME_MS));
			const frame = frames[step]!;
			shown = before.map((piece, i) => ({ ...piece, x: frame[i * 2]!, y: frame[i * 2 + 1]! }));
			while (nextEvent < events.length && events[nextEvent]!.step <= step) {
				const event = events[nextEvent++]!;
				if (event.kind === 'fall') falling = new Set([...falling, event.piece]);
				else {
					squish(event.a, event.force);
					squish(event.b, event.force);
				}
			}
			if (step < frames.length - 1) frameRequest = requestAnimationFrame(draw);
			else finish();
		};
		frameRequest = requestAnimationFrame(draw);
		// Browsers pause drawing in a background tab; make sure the flick still ends.
		const watchdog = setTimeout(finish, frames.length * FRAME_MS + 400);

		return () => {
			done = true;
			cancelAnimationFrame(frameRequest);
			clearTimeout(watchdog);
			clearTimeout(bannerTimer);
		};
	});

	/** The mochi being pulled back and how far, in the board's own (possibly turned) directions. */
	let aim = $state.raw<{ id: number; x: number; y: number } | null>(null);

	const canFlick = (piece: FlickPiece) => !playing && !piece.out && mine.has(piece.id);

	function pull(event: PointerEvent, piece: FlickPiece) {
		if (!canFlick(piece)) return;
		event.preventDefault();
		(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
		aim = { id: piece.id, x: 0, y: 0 };
	}

	function drag(event: PointerEvent, piece: FlickPiece) {
		if (!aim || aim.id !== piece.id || !area) return;
		const box = area.getBoundingClientRect();
		const unit = box.width / (VIEW * 2);
		let x = (event.clientX - box.left) / unit - VIEW - piece.x * flip;
		let y = (event.clientY - box.top) / unit - VIEW - piece.y * flip;
		const length = Math.hypot(x, y);
		if (length > MAX_PULL) {
			x *= MAX_PULL / length;
			y *= MAX_PULL / length;
		}
		aim = { id: piece.id, x, y };
	}

	function release() {
		if (!aim) return;
		const { id, x, y } = aim;
		aim = null;
		// The mochi flies the opposite way to the pull.
		const power = FLICK.maxSpeed / MAX_PULL;
		const dx = Math.round(-x * power * flip * 10000) / 10000;
		const dy = Math.round(-y * power * flip * 10000) / 10000;
		// A tiny pull is treated as changing your mind.
		if (Math.hypot(dx, dy) < FLICK.minSpeed * 2) return;
		onplay({ piece: id, dx, dy });
	}

	const aimed = $derived(aim ? (shown.find((piece) => piece.id === aim!.id) ?? null) : null);
	const cheers = (piece: FlickPiece) =>
		!playing && !piece.out && (winner === 'draw' || winner === piece.seat);
	const happy = (seat: 0 | 1) => !playing && (winner === 'draw' || winner === seat);
	/** A position in tray units as a percentage of the mochi's own size, for `translate`. */
	const offset = (value: number) => (value / (FLICK.radius * 2)) * 100;
</script>

<PlayerChips
	{names}
	turn={game.turn}
	score={game.wins}
	{asleep}
	happy={[happy(0), happy(1)]}
/>

<div class="table">
	<div class="area" bind:this={area}>
		<div class="tray"></div>

		{#if aim && aimed}
			<!-- An arrow showing where the mochi will go and how hard. -->
			<svg class="aim" viewBox="{-VIEW} {-VIEW} {VIEW * 2} {VIEW * 2}" aria-hidden="true">
				<line
					x1={aimed.x * flip}
					y1={aimed.y * flip}
					x2={aimed.x * flip - aim.x * 1.5}
					y2={aimed.y * flip - aim.y * 1.5}
				/>
				<circle cx={aimed.x * flip - aim.x * 1.5} cy={aimed.y * flip - aim.y * 1.5} r="4.5" />
			</svg>
		{/if}

		{#key game.round}
			{#each shown as piece (piece.id)}
				{@const pulled = aim?.id === piece.id ? aim : null}
				<!-- Flicking is a drag, so these are not buttons. There is no keyboard way to flick yet. -->
				<!-- svelte-ignore a11y_no_static_element_interactions -->
				<div
					class="piece"
					class:mine={canFlick(piece)}
					class:gone={piece.out && !falling.has(piece.id)}
					class:falling={falling.has(piece.id)}
					class:pulled={pulled !== null}
					style:translate="{offset(piece.x * flip + (pulled?.x ?? 0) * 0.22)}% {offset(
						piece.y * flip + (pulled?.y ?? 0) * 0.22
					)}%"
					bind:this={elements[piece.id]}
					onpointerdown={(event) => pull(event, piece)}
					onpointermove={(event) => drag(event, piece)}
					onpointerup={release}
					onpointercancel={() => (aim = null)}
				>
					<i
						class="stone {piece.seat === 0 ? 'cocoa' : 'cream'}"
						class:asleep={asleep === piece.seat && !cheers(piece)}
						class:happy={cheers(piece)}
						class:cheer={cheers(piece)}
						style:--wave="{piece.id * 80}ms"
					></i>
				</div>
			{/each}
		{/key}

		{#if banner}
			<div class="banner soft" role="status">
				{#if banner.seat === null}
					{i18n.t.roundDraw}
				{:else}
					<i class="stone {banner.seat === 0 ? 'cocoa' : 'cream'} happy"></i>
					{i18n.t.takesRound}
				{/if}
			</div>
		{/if}
	</div>
	{#if !playing && winner !== null && confetti}<Confetti />{/if}
</div>

<p class="hint" class:visible={mine.size > 0 && !playing}>{i18n.t.flickHint}</p>

<style>
	.table {
		position: relative;
		display: grid;
		/* Never taller than the screen, so the whole tray is always reachable. */
		inline-size: min(100%, 100dvb - 20rem);
		min-inline-size: 15rem;
		justify-self: center;
		font-size: clamp(1.25rem, 9vw, 3rem);
	}

	/* A square stage. The tray sits inside it with a margin for mochi to fall into. */
	.area {
		position: relative;
		aspect-ratio: 1;
		/* The empty margin above and below the tray may overlap its neighbours, to save height. */
		margin-block: -6%;
		/* Dragging here aims a flick; it must never scroll the page. */
		touch-action: none;
		user-select: none;
		-webkit-user-select: none;
	}

	.tray {
		position: absolute;
		/* (VIEW - tray radius) / (VIEW * 2) */
		inset: 9.68%;
		border-radius: 50%;
		background: var(--felt);
		box-shadow:
			inset 0 -6px 0 var(--felt-shade),
			inset 0 0 0 0.12em rgb(255 255 255 / 0.35);
	}

	.aim {
		position: absolute;
		inset: 0;
		pointer-events: none;
		overflow: visible;
	}

	.aim line {
		stroke: var(--accent-shade);
		stroke-width: 3.5;
		stroke-linecap: round;
		stroke-dasharray: 0.1 8;
	}

	.aim circle {
		fill: var(--accent-shade);
	}

	.piece {
		position: absolute;
		/* mochi diameter / (VIEW * 2) */
		inline-size: 8.87%;
		aspect-ratio: 1;
		inset-inline-start: 45.565%;
		inset-block-start: 45.565%;
		display: grid;
		place-items: center;
		touch-action: none;
		animation: arrive 320ms cubic-bezier(0.3, 1.5, 0.5, 1) backwards;
	}

	.piece .stone {
		inline-size: 100%;
		font-size: 0.42em;
	}

	/* A mochi you can flick sits on a soft ring, and the finger target is larger than the mochi. */
	.piece.mine {
		cursor: grab;
	}

	.piece.mine::before {
		content: '';
		position: absolute;
		inset: -32%;
		border-radius: 50%;
		background: rgb(255 255 255 / 0.4);
		animation: breathe-ring 1.8s ease-in-out infinite;
	}

	.piece.pulled {
		cursor: grabbing;
		z-index: 1;
	}

	.piece.pulled::before {
		animation: none;
		background: rgb(255 255 255 / 0.6);
	}

	/* Over the edge: it tumbles away and shrinks to nothing. */
	.piece.falling {
		pointer-events: none;
		animation: tumble 420ms ease-in forwards;
	}

	.piece.gone {
		display: none;
	}

	@keyframes arrive {
		from {
			scale: 0;
		}
	}

	@keyframes tumble {
		to {
			scale: 0.1;
			rotate: 200deg;
			opacity: 0;
		}
	}

	@keyframes breathe-ring {
		0%,
		100% {
			scale: 0.9;
			opacity: 0.7;
		}
		50% {
			scale: 1.08;
			opacity: 1;
		}
	}

	.banner {
		position: absolute;
		inset-inline: 0;
		inset-block-start: 50%;
		translate: 0 -50%;
		margin-inline: auto;
		inline-size: max-content;
		max-inline-size: 90%;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.625rem 1.125rem 0.75rem 0.75rem;
		border-radius: 999px;
		font-size: 1.0625rem;
		font-weight: 900;
		animation: arrive 260ms cubic-bezier(0.3, 1.5, 0.5, 1) backwards;
	}

	.banner .stone {
		inline-size: 2rem;
		flex: none;
		font-size: 1rem;
	}

	.hint {
		min-block-size: 1.5em;
		color: var(--muted);
		font-size: 0.875rem;
		text-align: center;
		visibility: hidden;
	}

	.hint.visible {
		visibility: visible;
	}

	@media (prefers-reduced-motion: reduce) {
		.piece,
		.piece.mine::before,
		.banner {
			animation: none;
		}

		.piece.falling {
			animation: none;
			opacity: 0;
		}
	}
</style>
