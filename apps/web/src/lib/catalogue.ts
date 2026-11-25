import type { MessageKey } from './i18n.svelte.ts';

export interface CatalogueEntry {
	id: string;
	name: MessageKey;
	blurb: MessageKey;
	/** Where the game lives, or null until it is playable (shown as coming soon). */
	href: string | null;
}

export const catalogue: CatalogueEntry[] = [
	{ id: 'reversi', name: 'reversi', blurb: 'reversiBlurb', href: '/play/reversi' }
];
