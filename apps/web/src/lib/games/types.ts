import type { Game, Seat } from '@asobo/games';
import type { Component } from 'svelte';
import type { MessageKey } from '../i18n.svelte.ts';

/** The move that led to the current state, so a board can animate just what changed. */
export interface LastMove<State, Move> {
	before: State;
	move: Move;
	by: Seat;
}

/** What every game's board component receives. */
export interface TableProps<State, Move> {
	state: State;
	/** Name shown on each player's chip. */
	names: readonly [string, string];
	/** Moves that can be tapped right now. Empty when it is not this device's turn. */
	legal: readonly Move[];
	last: LastMove<State, Move> | null;
	/** Set when the game is over, so the board can celebrate. */
	winner: Seat | 'draw' | null;
	/** Whether to throw confetti with the celebration. */
	confetti: boolean;
	/** A player who is away; their pieces doze until they come back. */
	asleep: Seat | null;
	/**
	 * The seat this device plays, so a board can turn to face them. Null when
	 * both players share the device or the viewer is only watching.
	 */
	perspective: Seat | null;
	onplay: (move: Move) => void;
}

/**
 * Everything the app needs to offer a game: its rules, its board, and a few
 * hooks. The local and online screens are written once against this.
 */
export interface GameUI<State, Move> {
	rules: Game<State, Move>;
	name: MessageKey;
	blurb: MessageKey;
	Table: Component<TableProps<State, Move>>;
	/**
	 * What it means when a player moves twice in a row. In some games the other
	 * player had no move and passed; in others the mover earned a bonus turn.
	 */
	repeatTurn: 'pass' | 'bonus';
	/** Checks a state loaded from storage, returning null if it isn't a valid one. */
	restore(saved: unknown): State | null;
	/** Plays the sounds for a move, timed to the board's animation. */
	sounds(last: LastMove<State, Move>, after: State, info: { finished: boolean; passed: boolean }): void;
}
