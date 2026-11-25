<script lang="ts">
	import { gameIds, registry } from '#lib/games/registry.ts';
	import GameThumb from '#lib/GameThumb.svelte';
	import { i18n } from '#lib/i18n.svelte.ts';
</script>

<section class="hero">
	<h1>{i18n.t.tagline}</h1>
	<p>{i18n.t.intro}</p>
</section>

<section aria-labelledby="games-heading">
	<h2 id="games-heading">{i18n.t.games}</h2>
	<ul class="games">
		{#each gameIds as id (id)}
			<li>
				<a class="card soft" href="/play/{id}">
					<GameThumb {id} />
					<div class="text">
						<h3>{i18n.t[registry[id].name]}</h3>
						<p>{i18n.t[registry[id].blurb]}</p>
						<span class="badge">{i18n.t.play}</span>
					</div>
				</a>
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
