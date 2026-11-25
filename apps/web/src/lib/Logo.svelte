<!--
	The Asobo wordmark. The letters take the current text colour so they stay
	readable in dark mode; the two mochi keep their own colours.
-->
<svg viewBox="0 0 293 100" role="img" aria-label="Asobo">
	<defs>
		<clipPath id="logo-o1"><circle cx="140" cy="62" r="25.5" /></clipPath>
		<clipPath id="logo-o2"><circle cx="259" cy="62" r="25.5" /></clipPath>
	</defs>
	<g
		fill="none"
		stroke="currentColor"
		stroke-width="13"
		stroke-linecap="round"
		stroke-linejoin="round"
	>
		<circle cx="34" cy="62" r="19" />
		<path d="M53 43V81" />
		<path d="M102 49C97 41 76 41 76 52C76 63 102 60 102 71C102 83 80 83 74 75" />
		<path d="M183 20V81" />
		<circle cx="202" cy="62" r="19" />
	</g>
	<g clip-path="url(#logo-o1)">
		<circle cx="140" cy="62" r="25.5" fill="var(--o1-shade)" />
		<circle cx="140" cy="58" r="25.5" fill="var(--o1)" />
	</g>
	<ellipse cx="131" cy="65.5" rx="4.2" ry="2.6" fill="var(--blush)" opacity="0.75" />
	<ellipse cx="155" cy="65.5" rx="4.2" ry="2.6" fill="var(--blush)" opacity="0.75" />
	<circle cx="137" cy="59" r="2.5" fill="var(--o1-face)" />
	<circle cx="149" cy="59" r="2.5" fill="var(--o1-face)" />
	<path
		d="M140 63.5q1.5 2.2 3 0q1.5 2.2 3 0"
		fill="none"
		stroke="var(--o1-face)"
		stroke-width="1.6"
		stroke-linecap="round"
		stroke-linejoin="round"
	/>
	<g clip-path="url(#logo-o2)">
		<circle cx="259" cy="62" r="25.5" fill="var(--accent-shade)" />
		<circle cx="259" cy="58" r="25.5" fill="var(--accent)" />
	</g>
	<ellipse cx="244" cy="65.5" rx="4.2" ry="2.6" fill="#fff" opacity="0.6" />
	<ellipse cx="268" cy="65.5" rx="4.2" ry="2.6" fill="#fff" opacity="0.6" />
	<circle cx="250" cy="59" r="2.5" fill="var(--cocoa)" />
	<circle cx="262" cy="59" r="2.5" fill="var(--cocoa)" />
	<path
		d="M253 63.5q1.5 2.2 3 0q1.5 2.2 3 0"
		fill="none"
		stroke="var(--cocoa)"
		stroke-width="1.6"
		stroke-linecap="round"
		stroke-linejoin="round"
	/>
</svg>

<style>
	svg {
		display: block;
		block-size: 100%;
		inline-size: auto;
		--o1: var(--cocoa);
		--o1-shade: var(--cocoa-shade);
		--o1-face: var(--cream);
	}

	/* Cocoa disappears on the dark background, so the first mochi turns cream there. */
	@media (prefers-color-scheme: dark) {
		svg {
			--o1: var(--cream);
			--o1-shade: #e3d2c8;
			--o1-face: var(--cocoa);
		}
	}
</style>
