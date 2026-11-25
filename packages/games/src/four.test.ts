import { describe, expect, it } from 'vitest';
import { four, landingRow, winningLine, type FourState } from './four';
import type { Seat } from './index';

/** Plays a list of columns in turn from the starting position. */
function play(columns: number[]): FourState {
	let state = four.setup();
	for (const column of columns) state = four.applyMove(state, state.turn as Seat, column);
	return state;
}

function perft(state: FourState, depth: number): number {
	if (depth === 0 || state.turn === null) return 1;
	const seat = state.turn;
	return four
		.legalMoves(state, seat)
		.reduce((n, move) => n + perft(four.applyMove(state, seat, move), depth - 1), 0);
}

describe('four in a row', () => {
	it('starts empty with seat 0 to move and every column open', () => {
		const state = four.setup();
		expect(state.board).toHaveLength(42);
		expect(state.board.every((cell) => cell === null)).toBe(true);
		expect(four.legalMoves(state, 0)).toEqual([0, 1, 2, 3, 4, 5, 6]);
		expect(four.legalMoves(state, 1)).toEqual([]);
	});

	it('drops pieces to the lowest free row and alternates turns', () => {
		const state = play([3, 3, 3]);
		expect(state.board[5 * 7 + 3]).toBe(0);
		expect(state.board[4 * 7 + 3]).toBe(1);
		expect(state.board[3 * 7 + 3]).toBe(0);
		expect(state.turn).toBe(1);
		expect(landingRow(state.board, 3)).toBe(2);
	});

	it('does not change the state it was given', () => {
		const state = four.setup();
		four.applyMove(state, 0, 0);
		expect(state.board.every((cell) => cell === null)).toBe(true);
	});

	it('rejects full columns, bad input and moves out of turn', () => {
		const full = play([0, 0, 0, 0, 0, 0]);
		expect(four.legalMoves(full, 0)).toEqual([1, 2, 3, 4, 5, 6]);
		expect(() => four.applyMove(full, 0, 0)).toThrow();
		expect(() => four.applyMove(four.setup(), 0, 7)).toThrow();
		expect(() => four.applyMove(four.setup(), 0, -1)).toThrow();
		expect(() => four.applyMove(four.setup(), 0, 1.5)).toThrow();
		expect(() => four.applyMove(four.setup(), 0, '3' as unknown as number)).toThrow();
		expect(() => four.applyMove(four.setup(), 1, 3)).toThrow();
	});

	it('wins with four in a column', () => {
		const state = play([0, 1, 0, 1, 0, 1, 0]);
		expect(state.turn).toBeNull();
		expect(four.result(state)).toEqual({ kind: 'win', winner: 0 });
		expect(winningLine(state.board)).toEqual([14, 21, 28, 35]);
	});

	it('wins with four in a row', () => {
		const state = play([0, 0, 1, 1, 2, 2, 3]);
		expect(four.result(state)).toEqual({ kind: 'win', winner: 0 });
		expect(winningLine(state.board)).toEqual([35, 36, 37, 38]);
	});

	it('wins on both diagonals', () => {
		// Rising to the right: seat 0 ends on (row 2, col 3).
		const rising = play([0, 1, 1, 2, 2, 3, 2, 3, 3, 6, 3]);
		expect(four.result(rising)).toEqual({ kind: 'win', winner: 0 });
		// Mirrored: rising to the left.
		const falling = play([6, 5, 5, 4, 4, 3, 4, 3, 3, 0, 3]);
		expect(four.result(falling)).toEqual({ kind: 'win', winner: 0 });
	});

	it('lets the second player win too', () => {
		const state = play([0, 1, 0, 1, 0, 1, 6, 1]);
		expect(four.result(state)).toEqual({ kind: 'win', winner: 1 });
	});

	it('does not count three in a row, or a line that wraps round the edge', () => {
		expect(winningLine(play([0, 0, 1, 1, 2, 2]).board)).toBeNull();
		// Seat 0 holds the last three cells of the bottom row and the first cell of the row above.
		const board = four.setup().board.slice();
		for (const i of [39, 40, 41, 28]) board[i] = 0;
		expect(winningLine(board)).toBeNull();
	});

	it('is a draw when the board fills with no line', () => {
		// Columns filled in an order known to leave no four in a row.
		const order = [0, 1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 0, 2, 3, 2, 3, 2, 3, 3, 2, 3, 2, 3, 2];
		const tail = [4, 5, 4, 5, 4, 5, 5, 4, 5, 4, 5, 4, 6, 6, 6, 6, 6, 6];
		const state = play([...order, ...tail]);
		expect(state.board.every((cell) => cell !== null)).toBe(true);
		expect(state.turn).toBeNull();
		expect(four.result(state)).toEqual({ kind: 'draw' });
	});

	it('stops the game once someone has won', () => {
		const state = play([0, 1, 0, 1, 0, 1, 0]);
		expect(four.legalMoves(state, 1)).toEqual([]);
		expect(() => four.applyMove(state, 1, 2)).toThrow();
	});

	it('matches the known move counts for the first seven turns', () => {
		const start = four.setup();
		expect([1, 2, 3, 4, 5, 6, 7].map((d) => perft(start, d))).toEqual([
			7, 49, 343, 2401, 16807, 117649, 823536
		]);
	});
});
