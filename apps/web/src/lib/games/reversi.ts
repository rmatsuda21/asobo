import { reversi, type ReversiCell, type ReversiMove, type ReversiState } from '@asobo/games';
import ReversiTable from '../ReversiTable.svelte';
import { sound } from '../sound.svelte.ts';
import type { GameUI } from './types.ts';

/** How long one stone takes to hop over. The board's CSS reads the same value. */
export const FLIP_MS = 560;

/** Stones flip in a ripple outwards from the stone that was placed. */
export function rippleDelay(placed: number, square: number): number {
	const dr = Math.abs(Math.floor(square / 8) - Math.floor(placed / 8));
	const dc = Math.abs((square % 8) - (placed % 8));
	return 60 + Math.max(dr, dc) * 90;
}

/** Works out which stones a move flipped by comparing the boards before and after. */
export function flippedBy(
	before: readonly ReversiCell[],
	after: readonly ReversiCell[],
	placed: number
): Set<number> {
	const flipped = new Set<number>();
	after.forEach((cell, i) => {
		if (i !== placed && before[i] !== null && before[i] !== cell) flipped.add(i);
	});
	return flipped;
}

/** When the last stone of a move has finished hopping, in milliseconds. */
export function settleTime(placed: number, flipped: ReadonlySet<number>): number {
	return Math.max(0, ...[...flipped].map((i) => rippleDelay(placed, i))) + FLIP_MS;
}

const validCell = (cell: unknown) => cell === 0 || cell === 1 || cell === null;

export const reversiUI: GameUI<ReversiState, ReversiMove> = {
	rules: reversi,
	name: 'reversi',
	blurb: 'reversiBlurb',
	Table: ReversiTable,
	repeatTurn: 'pass',

	restore(saved) {
		if (typeof saved !== 'object' || saved === null) return null;
		const { board, turn } = saved as Record<string, unknown>;
		if (!Array.isArray(board) || board.length !== 64 || !board.every(validCell)) return null;
		if (!validCell(turn)) return null;
		return { board, turn: turn as ReversiState['turn'] };
	},

	// The stone lands, then each ring of flips hops in turn with a rising note.
	sounds(last, after, { finished, passed }) {
		const flipped = flippedBy(last.before.board, after.board, last.move);
		const rings = [...new Set([...flipped].map((i) => rippleDelay(last.move, i)))].sort(
			(a, b) => a - b
		);
		const settled = (settleTime(last.move, flipped) + 120) / 1000;
		sound.place();
		sound.flips(rings.map((ms) => ms + FLIP_MS * 0.4));
		if (finished) sound.finish(settled);
		else if (passed) sound.pass(settled);
	}
};
