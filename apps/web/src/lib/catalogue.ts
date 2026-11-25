import type { MessageKey } from './i18n.svelte.ts';

export interface CatalogueEntry {
	id: string;
	name: MessageKey;
	blurb: MessageKey;
	/** False until the game is playable; the home screen shows it as coming soon. */
	available: boolean;
}

export const catalogue: CatalogueEntry[] = [
	{ id: 'reversi', name: 'reversi', blurb: 'reversiBlurb', available: false }
];
