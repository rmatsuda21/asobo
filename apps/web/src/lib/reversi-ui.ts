import type { ReversiCell } from '@asobo/games';
import { sound } from './sound.svelte.ts';

/** What the last move changed, so only those stones animate. */
export interface LastMove {
	placed: number;
	flipped: Set<number>;
}

/** How long one stone takes to hop over. The board's CSS reads the same value. */
export const FLIP_MS = 560;

/** Stones flip in a ripple outwards from the stone that was placed. */
export function rippleDelay(placed: number, square: number): number {
	const dr = Math.abs(Math.floor(square / 8) - Math.floor(placed / 8));
	const dc = Math.abs((square % 8) - (placed % 8));
	return 60 + Math.max(dr, dc) * 90;
}

/** Works out which stones a move flipped by comparing the boards before and after. */
export function moveBetween(
	before: readonly ReversiCell[],
	after: readonly ReversiCell[],
	placed: number
): LastMove {
	const flipped = new Set<number>();
	after.forEach((cell, i) => {
		if (i !== placed && before[i] !== null && before[i] !== cell) flipped.add(i);
	});
	return { placed, flipped };
}

/** Sounds follow the animation: the stone lands, then each ring of flips hops in turn. */
export function playMoveSounds(move: LastMove, after: { finished: boolean; passed: boolean }) {
	const rings = [...new Set([...move.flipped].map((i) => rippleDelay(move.placed, i)))].sort(
		(a, b) => a - b
	);
	const settled = ((rings.at(-1) ?? 0) + FLIP_MS + 120) / 1000;
	sound.place();
	sound.flips(rings.map((ms) => ms + FLIP_MS * 0.4));
	if (after.finished) sound.finish(settled);
	else if (after.passed) sound.pass(settled);
}
