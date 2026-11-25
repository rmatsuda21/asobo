<script lang="ts">
	import './game-page.css';
	import { i18n } from './i18n.svelte.ts';
</script>

<div class="game-page">
	<div class="title">
		<a class="back" href="/"><span aria-hidden="true">‹</span> {i18n.t.allGames}</a>
		<h1>{i18n.t.noSuchGame}</h1>
	</div>
</div>
