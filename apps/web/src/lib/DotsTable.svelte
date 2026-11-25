<script lang="ts">
	import {
		boxCount,
		DOTS_BOXES,
		DOTS_SIZE,
		linePosition,
		type DotsMove,
		type DotsState
	} from '@asobo/games';
	import Confetti from './Confetti.svelte';
	import { claimedBy } from './games/dots.ts';
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
	}: TableProps<DotsState, DotsMove> = $props();

	const canPlay = $derived(new Set(legal));
	const score = $derived(boxCount(game.boxes));
	/** The boxes the last line closed, so only their stones pop in. */
	const justClaimed = $derived(new Set(last ? claimedBy(last.before, game) : []));

	const dotIndexes = Array.from({ length: DOTS_SIZE * DOTS_SIZE }, (_, i) => i);
	/** One step between neighbouring dots, as a percentage of the board. */
	const STEP = 100 / DOTS_BOXES;

	/** True shortly after the game ends, once the last stone has popped in. */
	let cheering = $state(false);

	$effect(() => {
		if (winner === null) {
			cheering = false;
			return;
		}
		const timer = setTimeout(() => (cheering = true), last ? 450 : 0);
		return () => clearTimeout(timer);
	});

	const cheers = (owner: 0 | 1) => cheering && (winner === 'draw' || winner === owner);
</script>

<PlayerChips {names} turn={game.turn} {score} {asleep} happy={[cheers(0), cheers(1)]} />

<div class="table">
	<div class="panel">
		<div class="board" role="group" aria-label={i18n.t.board}>
			{#each game.boxes as owner, box (box)}
				<div
					class="box"
					class:cocoa={owner === 0}
					class:cream={owner === 1}
					style:left="{(box % DOTS_BOXES) * STEP}%"
					style:top="{Math.floor(box / DOTS_BOXES) * STEP}%"
				>
					{#if owner !== null}
						<i
							class="stone {owner === 0 ? 'cocoa' : 'cream'}"
							class:claimed={!cheering && justClaimed.has(box)}
							class:asleep={asleep === owner && !cheering}
							class:happy={cheers(owner)}
							class:cheer={cheers(owner)}
							style:--wave="{((box % DOTS_BOXES) + Math.floor(box / DOTS_BOXES)) * 70}ms"
						></i>
					{/if}
				</div>
			{/each}

			{#each game.lines as drawn, line (line)}
				{@const at = linePosition(line)}
				<button
					class="line"
					class:horizontal={at.horizontal}
					class:drawn
					class:fresh={last?.move === line}
					disabled={!canPlay.has(line)}
					aria-label={fill(i18n.t.line, { n: String(line + 1) })}
					aria-pressed={drawn}
					style:left="{at.column * STEP}%"
					style:top="{at.row * STEP}%"
					onclick={() => onplay(line)}
				></button>
			{/each}

			{#each dotIndexes as dot (dot)}
				<i
					class="dot"
					style:left="{(dot % DOTS_SIZE) * STEP}%"
					style:top="{Math.floor(dot / DOTS_SIZE) * STEP}%"
				></i>
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
		inline-size: min(100%, 100dvb - 19rem);
		min-inline-size: 15rem;
		justify-self: center;
		font-size: clamp(1.25rem, 9vw, 3rem);
	}

	.panel {
		padding: 9%;
		border-radius: 1.375rem;
		background: var(--felt);
		box-shadow: inset 0 -5px 0 var(--felt-shade);
	}

	/* Everything inside is placed by percentage: 0% and 100% are the outer rows of dots. */
	.board {
		--step: 20%;
		position: relative;
		aspect-ratio: 1;
	}

	.box {
		position: absolute;
		inline-size: var(--step);
		block-size: var(--step);
		display: grid;
		place-items: center;
		transition: background-color 200ms ease-out;
	}

	.box.cocoa {
		background: rgb(111 77 80 / 0.2);
	}

	.box.cream {
		background: rgb(255 250 243 / 0.65);
	}

	.box .stone {
		inline-size: 62%;
		font-size: 0.35em;
	}

	/* The stone pops into a box the moment it is closed. */
	.stone.claimed {
		animation: pop 380ms cubic-bezier(0.3, 1.6, 0.5, 1) 80ms backwards;
	}

	@keyframes pop {
		0% {
			scale: 0;
			rotate: -25deg;
		}
		70% {
			scale: 1.15;
			rotate: 6deg;
		}
		100% {
			scale: 1;
			rotate: 0deg;
		}
	}

	/*
	 * A line is a wide, invisible button with a thin bar drawn inside it, so it
	 * is easy to hit. The ends stop short of the dots so neighbours don't overlap.
	 */
	.line {
		--reach: 46%;
		position: absolute;
		min-inline-size: 0;
		min-block-size: 0;
		padding: 0;
		border: 0;
		background: transparent;
		/* Vertical by default: one step tall, centred on its column of dots. */
		inline-size: calc(var(--step) * 0.46);
		block-size: calc(var(--step) * 0.76);
		translate: -50% 0;
		margin-block-start: calc(var(--step) * 0.12);
	}

	.line.horizontal {
		inline-size: calc(var(--step) * 0.76);
		block-size: calc(var(--step) * 0.46);
		translate: 0 -50%;
		margin-block-start: 0;
		margin-inline-start: calc(var(--step) * 0.12);
	}

	.line::before {
		content: '';
		position: absolute;
		inset-block: -16%;
		inset-inline: calc(50% - 0.07em);
		border-radius: 999px;
		background: var(--felt-shade);
		transition: background-color 120ms ease-out;
	}

	.line.horizontal::before {
		inset-inline: -16%;
		inset-block: calc(50% - 0.07em);
	}

	.line.drawn::before {
		background: var(--cocoa);
	}

	/* The line just drawn is pink until the next move, so the other player can spot it. */
	.line.fresh::before {
		background: var(--accent-shade);
		animation: draw 220ms ease-out backwards;
	}

	@keyframes draw {
		from {
			scale: 1 0;
		}
	}

	.line.horizontal.fresh::before {
		animation-name: draw-across;
	}

	@keyframes draw-across {
		from {
			scale: 0 1;
		}
	}

	.line:enabled {
		cursor: pointer;
	}

	.line:enabled:active::before {
		background: var(--accent);
	}

	@media (hover: hover) {
		.line:enabled:hover::before {
			background: var(--accent);
		}
	}

	.line:focus-visible {
		outline-offset: 0;
		border-radius: 999px;
	}

	.dot {
		position: absolute;
		inline-size: 0.26em;
		aspect-ratio: 1;
		border-radius: 50%;
		background: var(--cocoa);
		translate: -50% -50%;
		pointer-events: none;
	}

	@media (prefers-reduced-motion: reduce) {
		.stone.claimed,
		.line.fresh::before {
			animation: none;
		}
	}
</style>
