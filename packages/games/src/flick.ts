import type { Game, Result, Seat } from './index';

/**
 * Mochi Flick: flick your mochi across a round tray to knock the other
 * player's off. Whoever still has mochi on the tray takes the round.
 *
 * The physics here is the referee, so it has to give exactly the same answer
 * in every browser and on the server. It uses a fixed time step and only
 * + - * / and square roots, which every JavaScript engine computes identically.
 */
export const FLICK = {
	/** Radius of the tray. A mochi whose centre crosses the edge falls off. */
	tray: 100,
	/** Radius of one mochi. */
	radius: 11,
	/** Mochi per player at the start of a round. */
	pieces: 4,
	/** Rounds needed to win the match. */
	roundsToWin: 2,
	/** The hardest allowed flick, in tray units per step. */
	maxSpeed: 6.5,
	/** A flick softer than this doesn't count, so a stray tap can't waste a turn. */
	minSpeed: 0.4,
	/** Each step keeps this much of a mochi's speed. */
	friction: 0.97,
	/** How bouncy a collision is: 1 is perfectly bouncy, 0 is a dead stop. */
	bounce: 0.88,
	/** Below this speed a mochi is treated as stopped. */
	rest: 0.05,
	/** A hard limit on how long one flick can run (60 steps is one second). */
	maxSteps: 480
} as const;

export interface FlickPiece {
	readonly id: number;
	readonly seat: Seat;
	readonly x: number;
	readonly y: number;
	/** True once it has fallen off the tray. */
	readonly out: boolean;
}

export interface FlickState {
	readonly pieces: readonly FlickPiece[];
	/** Whose turn it is, or null once someone has won the match. */
	readonly turn: Seat | null;
	/** Rounds won by each player. */
	readonly wins: readonly [number, number];
	/** Counts rounds from 0; it goes up each time the tray is reset. */
	readonly round: number;
}

/** Which mochi to flick, and the velocity to give it. */
export interface FlickMove {
	readonly piece: number;
	readonly dx: number;
	readonly dy: number;
}

export type FlickEvent =
	| { step: number; kind: 'hit'; a: number; b: number; force: number }
	| { step: number; kind: 'fall'; piece: number };

export interface FlickSimulation {
	/** Where every mochi is at each step: [x0, y0, x1, y1, …], in piece order. */
	frames: number[][];
	/** Collisions and falls, in the order they happen, for sounds and effects. */
	events: FlickEvent[];
	/** Every mochi where it came to rest. */
	pieces: FlickPiece[];
}

const other = (seat: Seat): Seat => (seat === 0 ? 1 : 0);
/** Positions are kept to three decimal places so saved games and messages stay small. */
const tidy = (n: number) => Math.round(n * 1000) / 1000;

/** The starting layout: seat 0 on the near side (positive y), seat 1 mirrored opposite. */
function layout(): FlickPiece[] {
	const spots: [number, number][] = [
		[-22, 30],
		[22, 30],
		[-44, 58],
		[44, 58]
	];
	const pieces: FlickPiece[] = [];
	for (const seat of [0, 1] as const) {
		for (const [x, y] of spots.slice(0, FLICK.pieces)) {
			pieces.push({
				id: pieces.length,
				seat,
				x: seat === 0 ? x : -x,
				y: seat === 0 ? y : -y,
				out: false
			});
		}
	}
	return pieces;
}

/** Scales a flick down to the maximum speed, or returns null if it is too soft or not a number. */
function launch(move: FlickMove): { vx: number; vy: number } | null {
	const { dx, dy } = move;
	if (typeof dx !== 'number' || typeof dy !== 'number') return null;
	if (!Number.isFinite(dx) || !Number.isFinite(dy)) return null;
	const speed = Math.sqrt(dx * dx + dy * dy);
	if (speed < FLICK.minSpeed) return null;
	const scale = speed > FLICK.maxSpeed ? FLICK.maxSpeed / speed : 1;
	return { vx: dx * scale, vy: dy * scale };
}

/**
 * Plays out one flick and returns everything that happened. The app uses the
 * frames to animate; the rules below use only where the mochi ended up.
 */
export function simulate(pieces: readonly FlickPiece[], move: FlickMove): FlickSimulation {
	const n = pieces.length;
	const x = pieces.map((p) => p.x);
	const y = pieces.map((p) => p.y);
	const vx = pieces.map(() => 0);
	const vy = pieces.map(() => 0);
	const out = pieces.map((p) => p.out);
	const frames: number[][] = [];
	const events: FlickEvent[] = [];

	const start = launch(move);
	const shooter = pieces.findIndex((p) => p.id === move.piece);
	if (start && shooter !== -1) {
		vx[shooter] = start.vx;
		vy[shooter] = start.vy;
	}

	const snapshot = () => {
		const frame: number[] = [];
		for (let i = 0; i < n; i++) frame.push(x[i]!, y[i]!);
		frames.push(frame);
	};
	snapshot();

	const reach = FLICK.radius * 2;
	for (let step = 1; step <= FLICK.maxSteps; step++) {
		// Move.
		for (let i = 0; i < n; i++) {
			if (out[i]) continue;
			x[i]! += vx[i]!;
			y[i]! += vy[i]!;
		}

		// Bounce every overlapping pair apart. Mochi all weigh the same.
		for (let i = 0; i < n; i++) {
			if (out[i]) continue;
			for (let j = i + 1; j < n; j++) {
				if (out[j]) continue;
				const dx = x[j]! - x[i]!;
				const dy = y[j]! - y[i]!;
				const distSq = dx * dx + dy * dy;
				if (distSq >= reach * reach || distSq === 0) continue;
				const dist = Math.sqrt(distSq);
				const nx = dx / dist;
				const ny = dy / dist;
				// Push them apart so they no longer overlap.
				const overlap = (reach - dist) / 2;
				x[i]! -= nx * overlap;
				y[i]! -= ny * overlap;
				x[j]! += nx * overlap;
				y[j]! += ny * overlap;
				// Swap the part of their speed that points at each other.
				const closing = (vx[i]! - vx[j]!) * nx + (vy[i]! - vy[j]!) * ny;
				if (closing <= 0) continue;
				const impulse = ((1 + FLICK.bounce) / 2) * closing;
				vx[i]! -= impulse * nx;
				vy[i]! -= impulse * ny;
				vx[j]! += impulse * nx;
				vy[j]! += impulse * ny;
				if (closing > 0.25) {
					events.push({ step, kind: 'hit', a: pieces[i]!.id, b: pieces[j]!.id, force: closing });
				}
			}
		}

		// Slow down, and tip anything whose centre has crossed the edge off the tray.
		let moving = false;
		for (let i = 0; i < n; i++) {
			if (out[i]) continue;
			if (x[i]! * x[i]! + y[i]! * y[i]! > FLICK.tray * FLICK.tray) {
				out[i] = true;
				vx[i] = 0;
				vy[i] = 0;
				events.push({ step, kind: 'fall', piece: pieces[i]!.id });
				continue;
			}
			vx[i]! *= FLICK.friction;
			vy[i]! *= FLICK.friction;
			if (vx[i]! * vx[i]! + vy[i]! * vy[i]! < FLICK.rest * FLICK.rest) {
				vx[i] = 0;
				vy[i] = 0;
			} else {
				moving = true;
			}
		}

		snapshot();
		if (!moving) break;
	}

	return {
		frames,
		events,
		pieces: pieces.map((p, i) => ({ ...p, x: tidy(x[i]!), y: tidy(y[i]!), out: out[i]! }))
	};
}

export const flick: Game<FlickState, FlickMove> = {
	id: 'flick',

	setup() {
		return { pieces: layout(), turn: 0, wins: [0, 0], round: 0 };
	},

	turn(state) {
		return state.turn;
	},

	/**
	 * A flick can go in any direction at any strength, so the moves can't be
	 * listed. This returns one entry per mochi the player may flick, with no
	 * direction, which tells the board which mochi are theirs to pull.
	 */
	legalMoves(state, seat) {
		if (state.turn !== seat) return [];
		return state.pieces
			.filter((p) => p.seat === seat && !p.out)
			.map((p) => ({ piece: p.id, dx: 0, dy: 0 }));
	},

	applyMove(state, seat, move) {
		if (state.turn !== seat) throw new Error('It is not this player’s turn.');
		if (typeof move !== 'object' || move === null) throw new Error('Not a flick.');
		const piece = state.pieces.find((p) => p.id === move.piece);
		if (!piece || piece.seat !== seat || piece.out) {
			throw new Error('That mochi cannot be flicked.');
		}
		if (!launch(move)) throw new Error('That flick is too soft or not a number.');

		const { pieces } = simulate(state.pieces, move);
		const left: [number, number] = [0, 0];
		for (const p of pieces) if (!p.out) left[p.seat]++;

		// Both players still have mochi: the round goes on.
		if (left[0] > 0 && left[1] > 0) {
			return { ...state, pieces, turn: other(seat) };
		}

		// Someone is out of mochi. If both are, nobody takes the round.
		const wins: [number, number] = [state.wins[0], state.wins[1]];
		if (left[0] > 0) wins[0]++;
		else if (left[1] > 0) wins[1]++;

		if (wins[0] >= FLICK.roundsToWin || wins[1] >= FLICK.roundsToWin) {
			// The match is over; leave the tray as it finished.
			return { pieces, turn: null, wins, round: state.round };
		}
		return { pieces: layout(), turn: other(seat), wins, round: state.round + 1 };
	},

	result(state): Result | null {
		if (state.turn !== null) return null;
		if (state.wins[0] === state.wins[1]) return { kind: 'draw' };
		return { kind: 'win', winner: state.wins[0] > state.wins[1] ? 0 : 1 };
	}
};
