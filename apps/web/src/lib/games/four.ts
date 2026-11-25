import { four, landingRow, type FourMove, type FourState } from '@asobo/games';
import FourTable from '../FourTable.svelte';
import { sound } from '../sound.svelte.ts';
import type { GameUI } from './types.ts';

/** How long a piece takes to fall to a given row (0 is the top). The board's CSS uses the same value. */
export function dropTime(row: number): number {
	return 160 + (row + 1) * 70;
}

const validCell = (cell: unknown) => cell === 0 || cell === 1 || cell === null;

export const fourUI: GameUI<FourState, FourMove> = {
	rules: four,
	name: 'four',
	blurb: 'fourBlurb',
	Table: FourTable,
	repeatTurn: 'pass',

	restore(saved) {
		if (typeof saved !== 'object' || saved === null) return null;
		const { board, turn } = saved as Record<string, unknown>;
		if (!Array.isArray(board) || board.length !== 42 || !board.every(validCell)) return null;
		if (!validCell(turn)) return null;
		return { board, turn: turn as FourState['turn'] };
	},

	// The "pon" plays when the piece hits the bottom of its column, not when it is let go.
	sounds(last, _after, { finished }) {
		const landed = dropTime(landingRow(last.before.board, last.move) ?? 0) * 0.7;
		sound.place(landed / 1000);
		if (finished) sound.finish((landed + 350) / 1000);
	}
};
