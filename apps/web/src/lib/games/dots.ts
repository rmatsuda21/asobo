import { dots, type DotsMove, type DotsState } from '@asobo/games';
import DotsTable from '../DotsTable.svelte';
import { sound } from '../sound.svelte.ts';
import type { GameUI } from './types.ts';

const validBox = (box: unknown) => box === 0 || box === 1 || box === null;

/** The boxes a move claimed, found by comparing the boards before and after. */
export function claimedBy(before: DotsState, after: DotsState): number[] {
	const claimed: number[] = [];
	after.boxes.forEach((owner, box) => {
		if (owner !== null && before.boxes[box] === null) claimed.push(box);
	});
	return claimed;
}

export const dotsUI: GameUI<DotsState, DotsMove> = {
	rules: dots,
	name: 'dots',
	blurb: 'dotsBlurb',
	Table: DotsTable,
	// Closing a box earns another go; nobody ever has to pass.
	repeatTurn: 'bonus',

	restore(saved) {
		if (typeof saved !== 'object' || saved === null) return null;
		const { lines, boxes, turn } = saved as Record<string, unknown>;
		if (!Array.isArray(lines) || lines.length !== 60) return null;
		if (!lines.every((line) => typeof line === 'boolean')) return null;
		if (!Array.isArray(boxes) || boxes.length !== 25 || !boxes.every(validBox)) return null;
		if (!validBox(turn)) return null;
		return { lines, boxes, turn: turn as DotsState['turn'] };
	},

	// A tick for the line, then a little chime if it closed a box.
	sounds(last, after, { finished }) {
		sound.tick();
		const claimed = claimedBy(last.before, after).length > 0;
		if (claimed) sound.chime(0.1);
		if (finished) sound.finish(0.5);
	}
};
