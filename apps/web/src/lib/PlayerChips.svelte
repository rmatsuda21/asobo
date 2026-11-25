<script lang="ts">
	import type { Seat } from '@asobo/games';

	interface Props {
		names: readonly [string, string];
		/** Whose turn it is; that player's chip is ringed. */
		turn: Seat | null;
		/** A number per player, for games that keep a running count. */
		score?: readonly [number, number] | null;
		/** A player who is away: their stone sleeps and z's drift up from it. */
		asleep?: Seat | null;
		/** Which players' stones should smile (the winner, or both on a draw). */
		happy?: readonly [boolean, boolean];
	}

	let { names, turn, score = null, asleep = null, happy = [false, false] }: Props = $props();
</script>

<div class="chips">
	{#each [0, 1] as const as seat (seat)}
		<div class="chip soft" class:active={turn === seat}>
			<i
				class="stone {seat === 0 ? 'cocoa' : 'cream'}"
				class:asleep={asleep === seat}
				class:happy={happy[seat]}
			></i>
			{#if asleep === seat}
				<span class="zzz" aria-hidden="true"><b>z</b><b>z</b><b>z</b></span>
			{/if}
			<span class="name">{names[seat]}</span>
			{#if score}<span class="n">{score[seat]}</span>{/if}
		</div>
	{/each}
</div>

<style>
	.chips {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.75rem;
	}

	.chip {
		position: relative;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		min-block-size: 2.875rem;
		padding: 0.5rem 0.875rem 0.625rem 0.625rem;
		border-radius: 999px;
		font-weight: 700;
		outline: 3px solid transparent;
		transition: outline-color 150ms ease-out;
	}

	.chip.active {
		outline-color: var(--accent);
	}

	.stone {
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

	@media (prefers-reduced-motion: reduce) {
		.zzz b {
			animation: none;
			opacity: 1;
		}
	}
</style>
