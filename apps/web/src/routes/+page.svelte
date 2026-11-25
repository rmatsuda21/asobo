<script lang="ts">
	import { catalogue } from '#lib/catalogue.ts';
	import { i18n } from '#lib/i18n.svelte.ts';

	// Opening position plus one move, as a thumbnail for the Reversi card.
	const preview = ['....', '.wb.', '.bbb', '....'].join('');
</script>

<section class="hero">
	<h1>{i18n.t.tagline}</h1>
	<p>{i18n.t.intro}</p>
</section>

<section aria-labelledby="games-heading">
	<h2 id="games-heading">{i18n.t.games}</h2>
	<ul class="games">
		{#each catalogue as game (game.id)}
			<li>
				<svelte:element
					this={game.href ? 'a' : 'div'}
					class="card soft"
					href={game.href ?? undefined}
				>
					<div class="board" aria-hidden="true">
						{#each preview as cell, i (i)}
							<span class="cell">
								{#if cell !== '.'}<i class={cell === 'b' ? 'stone cocoa' : 'stone cream'}></i>{/if}
							</span>
						{/each}
					</div>
					<div class="text">
						<h3>{i18n.t[game.name]}</h3>
						<p>{i18n.t[game.blurb]}</p>
						<span class="badge" class:soon={!game.href}>
							{game.href ? i18n.t.play : i18n.t.comingSoon}
						</span>
					</div>
				</svelte:element>
			</li>
		{/each}
	</ul>
	<p class="more">{i18n.t.moreOnTheWay}</p>
</section>

<style>
	.hero {
		padding-block: 1.25rem 2.25rem;
	}

	h1 {
		font-size: clamp(1.875rem, 8.5vw, 2.5rem);
	}

	.hero p {
		margin-block-start: 0.75rem;
		color: var(--muted);
		font-size: 1.0625rem;
		max-inline-size: 28rem;
	}

	h2 {
		font-size: 0.9375rem;
		font-weight: 700;
		color: var(--muted);
	}

	.games {
		list-style: none;
		margin: 0.75rem 0 0;
		padding: 0;
		display: grid;
		gap: 0.875rem;
	}

	.card {
		display: grid;
		grid-template-columns: 6rem 1fr;
		gap: 1rem;
		align-items: center;
		padding: 0.875rem 0.875rem 1rem;
		border-radius: var(--radius);
		color: inherit;
		text-decoration: none;
	}

	a.card {
		transition: translate 80ms ease-out;
	}

	a.card:active {
		translate: 0 2px;
	}

	.badge.soon {
		background: var(--shade);
		color: var(--muted);
	}

	.board {
		display: grid;
		grid-template: repeat(4, 1fr) / repeat(4, 1fr);
		gap: 3px;
		aspect-ratio: 1;
	}

	.cell {
		display: grid;
		place-items: center;
		border-radius: 0.375rem;
		background: var(--felt);
		box-shadow: inset 0 -2px 0 var(--felt-shade);
	}

	.text {
		min-inline-size: 0;
	}

	h3 {
		font-size: 1.1875rem;
	}

	.text p {
		margin-block-start: 0.125rem;
		color: var(--muted);
		font-size: 0.9375rem;
	}

	.badge {
		display: inline-block;
		margin-block-start: 0.5rem;
		padding: 0.125rem 0.75rem;
		border-radius: 999px;
		background: var(--accent);
		color: var(--accent-ink);
		font-size: 0.8125rem;
		font-weight: 700;
	}

	.more {
		margin-block-start: 1.25rem;
		color: var(--muted);
		font-size: 0.9375rem;
	}
</style>
