import GameState from '../models/GameState';
import { PLAYER1, DRAW, CHECKMATE, ONGOING } from '../lib/constants';
import { visualizeBoard } from '../lib/util';
import whitePawnGame from './fixtures/pawnWhite';
import blackPawnGame from './fixtures/pawnBlack';
import whiteKingGame from './fixtures/kingWhite';
import whiteKingCheckmateGame from './fixtures/kingWhiteCheckmate';
import whiteKingDrawGame from './fixtures/kingWhiteDraw';
import whiteKingNotDrawMoveGame from './fixtures/kingWhiteNotDrawMove';
import whiteKingNotDrawCaptureGame from './fixtures/kingWhiteNotDrawCapture';
import blackKingGame from './fixtures/kingBlack';
import blackKingCheckmateGame from './fixtures/kingBlackCheckmate';
import blackKingDrawGame from './fixtures/kingBlackDraw';

let gameState = null;
let selected = null;

const initTestGame = function(gameState, importData) {
    gameState.import(importData, {
        resumeGame: true,
        noConsoleOutput: true
    });
    // visualizeBoard(gameState);
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

        test('Status is ongoing', function() {
            expect(gameState.gameStatus).toBe(ONGOING);
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

    describe('Pawn', function() {
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

    describe('King', function() {
        beforeAll(function() {
            gameState = new GameState();
        });
        afterAll(function() {
            gameState = null;
        });
        afterEach(function() {
            selected = null;
        });

        test('White king is selectable', function() {
            const piece = initTestGame(gameState, whiteKingGame)[0];
            selected = gameState.select({ x: piece.x, y: piece.y, piece });
            expect(selected).toEqual(true);
        });

        test('White king can move one square north', function() {
            const piece = initTestGame(gameState, whiteKingGame)[0];
            selected = gameState.select({ x: piece.x, y: piece.y, piece });

            const moved = gameState.moveSelectedPiece({ x: 4, y: 3 });
            expect(moved).toEqual(true);

            const movedPiece = gameState.getFirstPiece({
                player: piece.player,
                type: piece.type
            });

            expect(movedPiece.x).toEqual(4);
            expect(movedPiece.y).toEqual(3);
        });

        test('White king can move one square northeast', function() {
            const piece = initTestGame(gameState, whiteKingGame)[0];
            selected = gameState.select({ x: piece.x, y: piece.y, piece });

            const moved = gameState.moveSelectedPiece({ x: 5, y: 3 });
            expect(moved).toEqual(true);

            const movedPiece = gameState.getFirstPiece({
                player: piece.player,
                type: piece.type
            });
            expect(movedPiece.x).toEqual(5);
            expect(movedPiece.y).toEqual(3);
        });

        test('White king can move one square east', function() {
            const piece = initTestGame(gameState, whiteKingGame)[0];
            selected = gameState.select({ x: piece.x, y: piece.y, piece });

            const moved = gameState.moveSelectedPiece({ x: 5, y: 4 });
            expect(moved).toEqual(true);

            const movedPiece = gameState.getFirstPiece({
                player: piece.player,
                type: piece.type
            });
            expect(movedPiece.x).toEqual(5);
            expect(movedPiece.y).toEqual(4);
        });

        test('White king can move one square southeast', function() {
            const piece = initTestGame(gameState, whiteKingGame)[0];
            selected = gameState.select({ x: piece.x, y: piece.y, piece });

            const moved = gameState.moveSelectedPiece({ x: 5, y: 5 });
            expect(moved).toEqual(true);

            const movedPiece = gameState.getFirstPiece({
                player: piece.player,
                type: piece.type
            });
            expect(movedPiece.x).toEqual(5);
            expect(movedPiece.y).toEqual(5);
        });

        test('White king can move one square south', function() {
            const piece = initTestGame(gameState, whiteKingGame)[0];
            selected = gameState.select({ x: piece.x, y: piece.y, piece });

            const moved = gameState.moveSelectedPiece({ x: 4, y: 5 });
            expect(moved).toEqual(true);

            const movedPiece = gameState.getFirstPiece({
                player: piece.player,
                type: piece.type
            });
            expect(movedPiece.x).toEqual(4);
            expect(movedPiece.y).toEqual(5);
        });

        test('White king can move one square southwest', function() {
            const piece = initTestGame(gameState, whiteKingGame)[0];
            selected = gameState.select({ x: piece.x, y: piece.y, piece });

            const moved = gameState.moveSelectedPiece({ x: 3, y: 5 });
            expect(moved).toEqual(true);

            const movedPiece = gameState.getFirstPiece({
                player: piece.player,
                type: piece.type
            });
            expect(movedPiece.x).toEqual(3);
            expect(movedPiece.y).toEqual(5);
        });

        test('White king can move one square west', function() {
            const piece = initTestGame(gameState, whiteKingGame)[0];
            selected = gameState.select({ x: piece.x, y: piece.y, piece });

            const moved = gameState.moveSelectedPiece({ x: 3, y: 4 });
            expect(moved).toEqual(true);

            const movedPiece = gameState.getFirstPiece({
                player: piece.player,
                type: piece.type
            });
            expect(movedPiece.x).toEqual(3);
            expect(movedPiece.y).toEqual(4);
        });

        test('White king can move one square northwest', function() {
            const piece = initTestGame(gameState, whiteKingGame)[0];
            selected = gameState.select({ x: piece.x, y: piece.y, piece });

            const moved = gameState.moveSelectedPiece({ x: 3, y: 3 });
            expect(moved).toEqual(true);

            const movedPiece = gameState.getFirstPiece({
                player: piece.player,
                type: piece.type
            });
            expect(movedPiece.x).toEqual(3);
            expect(movedPiece.y).toEqual(3);
        });

        test('White king checkmate ends the game', function() {
            const piece = initTestGame(gameState, whiteKingCheckmateGame)[0];
            selected = gameState.select({ x: piece.x, y: piece.y, piece });

            const moved = gameState.moveSelectedPiece({ x: 7, y: 3 });

            expect(moved).toEqual(true);

            const movedPiece = gameState.getFirstPiece({
                player: piece.player,
                type: piece.type
            });
            expect(movedPiece.x).toEqual(7);
            expect(movedPiece.y).toEqual(3);
            expect(gameState.gameStatus).toEqual(CHECKMATE);
            expect(gameState.gameEndedAt).not.toBe(null);
        });

        test('White king draw ends the game', function() {
            const piece = initTestGame(gameState, whiteKingDrawGame)[0];
            selected = gameState.select({ x: piece.x, y: piece.y, piece });

            const moved = gameState.moveSelectedPiece({ x: 5, y: 1 });

            expect(moved).toEqual(true);

            const movedPiece = gameState.getFirstPiece({
                player: piece.player,
                type: piece.type
            });
            expect(movedPiece.x).toEqual(5);
            expect(movedPiece.y).toEqual(1);

            expect(gameState.gameStatus).toEqual(DRAW);
            expect(gameState.gameEndedAt).not.toBe(null);
        });

        // TODO: Implement this test for black king
        test('White king gets out of draw thanks to another piece moving does not end the game', function() {
            const piece = initTestGame(gameState, whiteKingNotDrawMoveGame)[0];
            selected = gameState.select({ x: piece.x, y: piece.y, piece });

            const moved = gameState.moveSelectedPiece({ x: 5, y: 1 });

            // visualizeBoard(gameState);

            expect(moved).toEqual(true);

            const movedPiece = gameState.getFirstPiece({
                player: piece.player,
                type: piece.type
            });
            expect(movedPiece.x).toEqual(5);
            expect(movedPiece.y).toEqual(1);

            expect(gameState.gameStatus).toEqual(ONGOING);
            expect(gameState.gameEndedAt).toBe(null);
        });

        // TODO: Implement this test for black king
        test('White king gets out of draw thanks to another piece capturing does not end the game', function() {
            const piece = initTestGame(
                gameState,
                whiteKingNotDrawCaptureGame
            )[0];
            selected = gameState.select({ x: piece.x, y: piece.y, piece });

            const moved = gameState.moveSelectedPiece({ x: 5, y: 1 });

            // visualizeBoard(gameState);

            expect(moved).toEqual(true);

            const movedPiece = gameState.getFirstPiece({
                player: piece.player,
                type: piece.type
            });
            expect(movedPiece.x).toEqual(5);
            expect(movedPiece.y).toEqual(1);

            expect(gameState.gameStatus).toEqual(ONGOING);
            expect(gameState.gameEndedAt).toBe(null);
        });

        test('Black king is selectable', function() {
            const piece = initTestGame(gameState, blackKingGame)[0];
            selected = gameState.select({ x: piece.x, y: piece.y, piece });
            expect(selected).toEqual(true);
        });

        test('Black king can move one square north', function() {
            const piece = initTestGame(gameState, blackKingGame)[0];
            selected = gameState.select({ x: piece.x, y: piece.y, piece });

            const moved = gameState.moveSelectedPiece({ x: 4, y: 3 });
            expect(moved).toEqual(true);

            const movedPiece = gameState.getFirstPiece({
                player: piece.player,
                type: piece.type
            });

            expect(movedPiece.x).toEqual(4);
            expect(movedPiece.y).toEqual(3);
        });

        test('Black king can move one square northeast', function() {
            const piece = initTestGame(gameState, blackKingGame)[0];
            selected = gameState.select({ x: piece.x, y: piece.y, piece });

            const moved = gameState.moveSelectedPiece({ x: 5, y: 3 });
            expect(moved).toEqual(true);

            const movedPiece = gameState.getFirstPiece({
                player: piece.player,
                type: piece.type
            });
            expect(movedPiece.x).toEqual(5);
            expect(movedPiece.y).toEqual(3);
        });

        test('Black king can move one square east', function() {
            const piece = initTestGame(gameState, blackKingGame)[0];
            selected = gameState.select({ x: piece.x, y: piece.y, piece });

            const moved = gameState.moveSelectedPiece({ x: 5, y: 4 });
            expect(moved).toEqual(true);

            const movedPiece = gameState.getFirstPiece({
                player: piece.player,
                type: piece.type
            });
            expect(movedPiece.x).toEqual(5);
            expect(movedPiece.y).toEqual(4);
        });

        test('Black king can move one square southeast', function() {
            const piece = initTestGame(gameState, blackKingGame)[0];
            selected = gameState.select({ x: piece.x, y: piece.y, piece });

            const moved = gameState.moveSelectedPiece({ x: 5, y: 5 });
            expect(moved).toEqual(true);

            const movedPiece = gameState.getFirstPiece({
                player: piece.player,
                type: piece.type
            });
            expect(movedPiece.x).toEqual(5);
            expect(movedPiece.y).toEqual(5);
        });

        test('Black king can move one square south', function() {
            const piece = initTestGame(gameState, blackKingGame)[0];
            selected = gameState.select({ x: piece.x, y: piece.y, piece });

            const moved = gameState.moveSelectedPiece({ x: 4, y: 5 });
            expect(moved).toEqual(true);

            const movedPiece = gameState.getFirstPiece({
                player: piece.player,
                type: piece.type
            });
            expect(movedPiece.x).toEqual(4);
            expect(movedPiece.y).toEqual(5);
        });

        test('Black king can move one square southwest', function() {
            const piece = initTestGame(gameState, blackKingGame)[0];
            selected = gameState.select({ x: piece.x, y: piece.y, piece });

            const moved = gameState.moveSelectedPiece({ x: 3, y: 5 });
            expect(moved).toEqual(true);

            const movedPiece = gameState.getFirstPiece({
                player: piece.player,
                type: piece.type
            });
            expect(movedPiece.x).toEqual(3);
            expect(movedPiece.y).toEqual(5);
        });

        test('Black king can move one square west', function() {
            const piece = initTestGame(gameState, blackKingGame)[0];
            selected = gameState.select({ x: piece.x, y: piece.y, piece });

            const moved = gameState.moveSelectedPiece({ x: 3, y: 4 });
            expect(moved).toEqual(true);

            const movedPiece = gameState.getFirstPiece({
                player: piece.player,
                type: piece.type
            });
            expect(movedPiece.x).toEqual(3);
            expect(movedPiece.y).toEqual(4);
        });

        test('Black king can move one square northwest', function() {
            const piece = initTestGame(gameState, blackKingGame)[0];
            selected = gameState.select({ x: piece.x, y: piece.y, piece });

            const moved = gameState.moveSelectedPiece({ x: 3, y: 3 });
            expect(moved).toEqual(true);

            const movedPiece = gameState.getFirstPiece({
                player: piece.player,
                type: piece.type
            });
            expect(movedPiece.x).toEqual(3);
            expect(movedPiece.y).toEqual(3);
        });

        test('Black king checkmate ends the game', function() {
            const piece = initTestGame(gameState, blackKingCheckmateGame)[0];
            selected = gameState.select({ x: piece.x, y: piece.y, piece });

            const moved = gameState.moveSelectedPiece({ x: 7, y: 3 });

            expect(moved).toEqual(true);

            const movedPiece = gameState.getFirstPiece({
                player: piece.player,
                type: piece.type
            });

            expect(movedPiece.x).toEqual(7);
            expect(movedPiece.y).toEqual(3);
            expect(gameState.gameStatus).toEqual(CHECKMATE);
            expect(gameState.gameEndedAt).not.toBe(null);
        });

        test('Black king draw ends the game', function() {
            const piece = initTestGame(gameState, blackKingDrawGame)[0];
            selected = gameState.select({ x: piece.x, y: piece.y, piece });

            const moved = gameState.moveSelectedPiece({ x: 5, y: 1 });

            expect(moved).toEqual(true);

            const movedPiece = gameState.getFirstPiece({
                player: piece.player,
                type: piece.type
            });
            expect(movedPiece.x).toEqual(5);
            expect(movedPiece.y).toEqual(1);

            expect(gameState.gameStatus).toEqual(DRAW);
            expect(gameState.gameEndedAt).not.toBe(null);
        });
    });
});
