import { flick, simulate, type FlickMove, type FlickState } from '@asobo/games';
import FlickTable from '../FlickTable.svelte';
import { sound } from '../sound.svelte.ts';
import type { GameUI } from './types.ts';

const isSeat = (value: unknown) => value === 0 || value === 1;
const isCount = (value: unknown) => typeof value === 'number' && Number.isInteger(value) && value >= 0;

function validPiece(piece: unknown, index: number): boolean {
	if (typeof piece !== 'object' || piece === null) return false;
	const { id, seat, x, y, out } = piece as Record<string, unknown>;
	return (
		id === index &&
		isSeat(seat) &&
		typeof x === 'number' &&
		Number.isFinite(x) &&
		typeof y === 'number' &&
		Number.isFinite(y) &&
		typeof out === 'boolean'
	);
}

export const flickUI: GameUI<FlickState, FlickMove> = {
	rules: flick,
	name: 'flick',
	blurb: 'flickBlurb',
	Table: FlickTable,
	// Turns always alternate, so this never comes up.
	repeatTurn: 'pass',

	restore(saved) {
		if (typeof saved !== 'object' || saved === null) return null;
		const { pieces, turn, wins, round } = saved as Record<string, unknown>;
		if (!Array.isArray(pieces) || pieces.length !== 8 || !pieces.every(validPiece)) return null;
		if (!(isSeat(turn) || turn === null)) return null;
		if (!Array.isArray(wins) || wins.length !== 2 || !wins.every(isCount)) return null;
		if (!isCount(round)) return null;
		return { pieces, turn: turn as FlickState['turn'], wins: [wins[0], wins[1]], round: round as number };
	},

	// Replays the flick to find out when things bump and fall, and schedules a sound for each.
	sounds(last, _after, { finished }) {
		const { frames, events } = simulate(last.before.pieces, last.move);
		sound.tick();
		let bumps = 0;
		for (const event of events) {
			const at = event.step / 60;
			if (event.kind === 'fall') sound.fall(at);
			else if (bumps++ < 12) sound.bump(at, event.force);
		}
		if (finished) sound.finish(frames.length / 60 + 0.3);
	}
};
