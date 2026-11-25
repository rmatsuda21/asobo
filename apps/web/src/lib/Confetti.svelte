<script lang="ts">
	// Pieces are laid out from their index, so they look scattered but never jump around.
	const COLOURS = ['var(--accent)', '#f5d77a', '#b9d7f0', 'var(--cream)', 'var(--cocoa)'];
	const pieces = Array.from({ length: 32 }, (_, i) => ({
		left: (i * 37 + 11) % 100,
		delay: ((i * 53) % 17) * 70,
		duration: 1700 + ((i * 29) % 9) * 130,
		size: 0.3 + ((i * 7) % 4) * 0.08,
		sway: ((i * 13) % 7) - 3,
		round: i % 3 !== 0,
		colour: COLOURS[i % COLOURS.length]
	}));
</script>

<!-- Falls once over whatever positioned element it is placed in. -->
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

<style>
	.confetti {
		position: absolute;
		inset: -12% 0 0;
		overflow: hidden;
		pointer-events: none;
	}

	i {
		position: absolute;
		inset-block-start: 0;
		inline-size: 1em;
		block-size: 1em;
		border-radius: 22%;
		opacity: 0;
		animation: fall linear 1 both;
	}

	i.round {
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
		.confetti {
			display: none;
		}
	}
</style>
