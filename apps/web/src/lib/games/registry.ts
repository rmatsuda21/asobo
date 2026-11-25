import type { GameId } from '@asobo/games';
import { dotsUI } from './dots.ts';
import { flickUI } from './flick.ts';
import { fourUI } from './four.ts';
import { reversiUI } from './reversi.ts';
import type { GameUI } from './types.ts';

/**
 * Every game the app offers, in the order the home screen lists them.
 * Adding a game means adding its rules to @asobo/games and one entry here.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const registry: Record<GameId, GameUI<any, any>> = {
	reversi: reversiUI,
	four: fourUI,
	dots: dotsUI,
	flick: flickUI
};

export const gameIds = Object.keys(registry) as GameId[];

export function isOffered(id: string): id is GameId {
	return Object.hasOwn(registry, id);
}
