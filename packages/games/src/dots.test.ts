import { describe, expect, it } from 'vitest';
import { boxCount, boxSides, dots, DOTS_LINES, linePosition, type DotsState } from './dots';
import type { Seat } from './index';

/** Draws a list of lines in turn from the starting position. */
function play(lines: number[], from: DotsState = dots.setup()): DotsState {
	let state = from;
	for (const line of lines) state = dots.applyMove(state, state.turn as Seat, line);
	return state;
}

describe('dots and boxes', () => {
	it('starts with 60 open lines, 25 empty boxes and seat 0 to move', () => {
		const state = dots.setup();
		expect(state.lines).toHaveLength(60);
		expect(state.boxes).toHaveLength(25);
		expect(dots.legalMoves(state, 0)).toHaveLength(60);
		expect(dots.legalMoves(state, 1)).toEqual([]);
	});

	it('numbers horizontal lines first, then vertical ones', () => {
		expect(linePosition(0)).toEqual({ horizontal: true, row: 0, column: 0 });
		expect(linePosition(29)).toEqual({ horizontal: true, row: 5, column: 4 });
		expect(linePosition(30)).toEqual({ horizontal: false, row: 0, column: 0 });
		expect(linePosition(59)).toEqual({ horizontal: false, row: 4, column: 5 });
	});

	it('knows the four sides of a box', () => {
		expect(boxSides(0)).toEqual([0, 5, 30, 31]);
		expect(boxSides(24)).toEqual([24, 29, 58, 59]);
	});

	it('passes the turn after a line that closes nothing', () => {
		const state = play([0]);
		expect(state.lines[0]).toBe(true);
		expect(state.turn).toBe(1);
		expect(boxCount(state.boxes)).toEqual([0, 0]);
	});

	it('claims a box for whoever draws its fourth side, and gives them another turn', () => {
		// Sides of the top-left box are 0, 5, 30 and 31. Seat 1 draws the last one.
		const state = play([0, 5, 30, 31]);
		expect(state.boxes[0]).toBe(1);
		expect(state.turn).toBe(1);
		expect(boxCount(state.boxes)).toEqual([0, 1]);
	});

	it('claims two boxes at once with a line between them', () => {
		// Boxes 0 and 1 share vertical line 31. Draw every other side of both first.
		const setup = [0, 5, 30, 1, 6, 32];
		const before = play(setup);
		expect(boxCount(before.boxes)).toEqual([0, 0]);
		const mover = before.turn as Seat;
		const after = dots.applyMove(before, mover, 31);
		expect(after.boxes[0]).toBe(mover);
		expect(after.boxes[1]).toBe(mover);
		expect(after.turn).toBe(mover);
	});

	it('does not change the state it was given', () => {
		const state = dots.setup();
		dots.applyMove(state, 0, 0);
		expect(state.lines[0]).toBe(false);
	});

	it('rejects drawn lines, bad input and moves out of turn', () => {
		const state = play([0]);
		expect(() => dots.applyMove(state, 1, 0)).toThrow();
		expect(() => dots.applyMove(state, 1, 60)).toThrow();
		expect(() => dots.applyMove(state, 1, -1)).toThrow();
		expect(() => dots.applyMove(state, 1, 2.5)).toThrow();
		expect(() => dots.applyMove(state, 1, '3' as unknown as number)).toThrow();
		expect(() => dots.applyMove(state, 0, 1)).toThrow();
	});

	it('always ends after 60 lines with all 25 boxes claimed and a winner', () => {
		// Play several different complete games by walking the lines in different orders.
		for (const step of [1, 7, 11, 13, 17, 23]) {
			let state = dots.setup();
			let moves = 0;
			for (let i = 0; i < DOTS_LINES; i++) {
				state = dots.applyMove(state, state.turn as Seat, (i * step) % DOTS_LINES);
				moves++;
			}
			const [a, b] = boxCount(state.boxes);
			expect(moves).toBe(60);
			expect(state.turn).toBeNull();
			expect(a + b).toBe(25);
			// 25 boxes cannot split evenly, so there is always a winner.
			expect(dots.result(state)).toEqual({ kind: 'win', winner: a > b ? 0 : 1 });
		}
	});

	it('has no result until the last line is drawn', () => {
		let state = dots.setup();
		for (let line = 0; line < DOTS_LINES - 1; line++) {
			state = dots.applyMove(state, state.turn as Seat, line);
			expect(dots.result(state)).toBeNull();
		}
		state = dots.applyMove(state, state.turn as Seat, DOTS_LINES - 1);
		expect(dots.result(state)).not.toBeNull();
		expect(dots.legalMoves(state, 0)).toEqual([]);
		expect(dots.legalMoves(state, 1)).toEqual([]);
	});

	it('reports a draw if the boxes are level', () => {
		// Not reachable on a 5x5 board, but the result must still be honest about it.
		const boxes = Array(25).fill(null) as (Seat | null)[];
		boxes[0] = 0;
		boxes[1] = 1;
		expect(dots.result({ lines: Array(60).fill(true), boxes, turn: null })).toEqual({
			kind: 'draw'
		});
	});
});
