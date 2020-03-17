import GameState from '../models/GameState';
import { PLAYER1 } from '../lib/constants';
import whitePawnGame from './fixtures/pawnWhite';
import blackPawnGame from './fixtures/pawnBlack';

let gameState = null;
let selected = null;

const initTestGame = function(gameState, importData) {
    gameState.import(importData, {
        resumeGame: true,
        allowNoKing: true
    });
    return gameState.pieces;
};

describe('Chess', function() {
    describe('New instance', function() {
        beforeAll(function() {
            gameState = new GameState();
        });
        afterAll(function() {
            gameState = null;
        });

        test('Has a game ID', function() {
            expect(gameState.gameId).not.toBe(undefined);
        });

        test('Has start time', function() {
            expect(gameState.gameStartedAt).not.toBe(undefined);
        });

        test('End time is null', function() {
            expect(gameState.gameEndedAt).toEqual(null);
        });

        test('Has last session time update time', function() {
            expect(gameState.lastSessionTimeUpdate).not.toBe(undefined);
        });

        test('Has last total time played', function() {
            expect(gameState.totalTimePlayed).not.toBe(undefined);
        });

        test('Current turn is zero', function() {
            expect(gameState.currentTurn).toEqual(0);
        });

        test('Current player to be white player', function() {
            expect(gameState.currentPlayer).toEqual(PLAYER1);
        });

        test('List of pieces is empty', function() {
            expect(gameState.pieces).toEqual([]);
        });

        test('List of removed pieces is empty', function() {
            expect(gameState.removedPieces).toEqual([[], []]);
        });

        test('List of moves is empty', function() {
            expect(gameState.moves).toEqual([]);
        });

        test('Has a player object with two elements', function() {
            expect(gameState.players.length).toEqual(2);
        });
    });

    describe.only('Pawn', function() {
        beforeAll(function() {
            gameState = new GameState();
        });
        afterAll(function() {
            gameState = null;
        });
        afterEach(function() {
            selected = null;
        });

        test('White pawn is selectable', function() {
            const piece = initTestGame(gameState, whitePawnGame)[0];
            selected = gameState.select({ x: piece.x, y: piece.y, piece });
            expect(selected).toEqual(true);
        });

        test('White pawn can move one square ahead', function() {
            const piece = initTestGame(gameState, whitePawnGame)[0];
            selected = gameState.select({ x: piece.x, y: piece.y, piece });
            const moved = gameState.moveSelectedPiece({ x: 4, y: 5 });
            expect(moved).toEqual(true);
        });

        test('White pawn can move two squares ahead on first move', function() {
            const piece = initTestGame(gameState, whitePawnGame)[0];
            selected = gameState.select({ x: piece.x, y: piece.y, piece });
            const moved = gameState.moveSelectedPiece({ x: 4, y: 4 });
            expect(moved).toEqual(true);
        });

        test('Black pawn is selectable', function() {
            const piece = initTestGame(gameState, blackPawnGame)[0];
            selected = gameState.select({ x: piece.x, y: piece.y, piece });
            expect(selected).toEqual(true);
        });

        test('Black pawn can move one square ahead', function() {
            const piece = initTestGame(gameState, blackPawnGame)[0];
            selected = gameState.select({ x: piece.x, y: piece.y, piece });
            const moved = gameState.moveSelectedPiece({ x: 3, y: 2 });
            expect(moved).toEqual(true);
        });

        test('Black pawn can move two squares ahead on first move', function() {
            const piece = initTestGame(gameState, blackPawnGame)[0];
            selected = gameState.select({ x: piece.x, y: piece.y, piece });
            const moved = gameState.moveSelectedPiece({ x: 3, y: 3 });
            expect(moved).toEqual(true);
        });
    });
});
