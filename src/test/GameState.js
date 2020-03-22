import diff from 'jest-diff';

import GameState from '../models/GameState';
import { PLAYER1, PLAYER2, DRAW, CHECKMATE, ONGOING } from '../lib/constants';

import { visualizeBoard } from '../lib/util';

import pawnWhiteMove from './fixtures/pawnWhiteMove';
import pawnWhiteCapture from './fixtures/pawnWhiteCapture';
import knightWhiteMove from './fixtures/knightWhiteMove';
import knightWhiteCapture from './fixtures/knightWhiteCapture';
import bishopWhiteMove from './fixtures/bishopWhiteMove';
import bishopWhiteOppositeMove from './fixtures/bishopWhiteOppositeMove';
import kingWhite from './fixtures/kingWhite';
import kingWhiteCheckmate from './fixtures/kingWhiteCheckmate';
import kingWhiteDraw from './fixtures/kingWhiteDraw';
import kingWhiteNotDrawMove from './fixtures/kingWhiteNotDrawMove';
import kingWhiteNotDrawCapture from './fixtures/kingWhiteNotDrawCapture';

import pawnBlackMove from './fixtures/pawnBlackMove';
import pawnBlackCapture from './fixtures/pawnBlackCapture';
import knightBlackMove from './fixtures/knightBlackMove';
import knightBlackCapture from './fixtures/knightBlackCapture';
import kingBlack from './fixtures/kingBlack';
import kingBlackCheckmate from './fixtures/kingBlackCheckmate';
import kingBlackDraw from './fixtures/kingBlackDraw';

// TODO: Turns: Check if player can play during their turn and can't play out of turn and can't play when checkmate or draw

let gameState = null;

expect.extend({
    coordinatesToBe(received, expected) {
        const options = {
            comment: 'Compare x and y',
            isNot: this.isNot,
            promise: this.promise
        };

        const pass =
            received &&
            expected &&
            Object.is(received.x, expected.x) &&
            Object.is(received.y, expected.y);

        const displayExpected = expected
            ? { x: expected.x, y: expected.y }
            : expected;
        const displayReceived = received
            ? { x: received.x, y: received.y }
            : received;

        const board = this.expand ? visualizeBoard(gameState) : '';

        const message = pass
            ? () =>
                  this.utils.matcherHint(
                      'coordinatesToBe',
                      undefined,
                      undefined,
                      options
                  ) +
                  '\n\n' +
                  (diffString &&
                      `Expected: not ${this.utils.printExpected(
                          displayExpected
                      )}\n` +
                          `Received: ${this.utils.printReceived(
                              displayReceived
                          )}\n\n` +
                          board)
            : () => {
                  const diffString = diff(expected, received, {
                      expand: this.expand
                  });
                  return (
                      this.utils.matcherHint(
                          'coordinatesToBe',
                          undefined,
                          undefined,
                          options
                      ) +
                      '\n\n' +
                      (diffString &&
                          `Expected: ${this.utils.printExpected(
                              displayExpected
                          )}\n` +
                              `Received: ${this.utils.printReceived(
                                  displayReceived
                              )}\n\n` +
                              board)
                  );
              };

        return { actual: received, message, pass };
    }
});

const initTestGame = function(gameState, importData) {
    gameState.import(importData, {
        resumeGame: true,
        noConsoleOutput: true
    });
    return gameState.pieces;
};

const checkSelect = function(gameState, { piece }) {
    const selected = gameState.select({ x: piece.x, y: piece.y, piece });
    expect(selected).toBe(true);
};

const checkSelectAndMove = function(gameState, { piece, x, y }) {
    checkSelect(gameState, { piece });
    gameState.moveSelectedPiece({ piece, x, y });
    const movedPiece = gameState.getFirstPiece({
        player: piece.player,
        type: piece.type
    });

    expect(movedPiece).coordinatesToBe({ x, y });
};

const checkSelectAndCapture = function(gameState, { piece, x, y }) {
    checkSelectAndMove(gameState, { piece, x, y });
    const opponentPlayer = piece.player === PLAYER1 ? PLAYER2 : PLAYER1;
    expect(gameState.removedPieces[opponentPlayer].length).toBe(1);
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
            expect(gameState.gameEndedAt).toBe(null);
        });

        test('Has last session time update time', function() {
            expect(gameState.lastSessionTimeUpdate).not.toBe(undefined);
        });

        test('Has last total time played', function() {
            expect(gameState.totalTimePlayed).not.toBe(undefined);
        });

        test('Current turn is zero', function() {
            expect(gameState.currentTurn).toBe(0);
        });

        test('Current player to be white player', function() {
            expect(gameState.currentPlayer).toBe(PLAYER1);
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
            expect(gameState.players.length).toBe(2);
        });
    });

    describe('Pawn', function() {
        beforeAll(function() {
            gameState = new GameState();
        });
        afterAll(function() {
            gameState = null;
        });

        describe('White', function() {
            test('White pawn is selectable', function() {
                const piece = initTestGame(gameState, pawnWhiteMove)[0];
                checkSelect(gameState, { piece });
            });

            test('White pawn can move one square ahead', function() {
                const piece = initTestGame(gameState, pawnWhiteMove)[0];
                checkSelectAndMove(gameState, { piece, x: 4, y: 5 });
            });

            test('White pawn can move two squares ahead on first move', function() {
                const piece = initTestGame(gameState, pawnWhiteMove)[0];
                checkSelectAndMove(gameState, { piece, x: 4, y: 4 });
            });

            test('White pawn can capture to northwest', function() {
                const piece = initTestGame(gameState, pawnWhiteCapture)[0];
                checkSelectAndCapture(gameState, { piece, x: 3, y: 3 });
            });

            test('White pawn can capture to northeast', function() {
                const piece = initTestGame(gameState, pawnWhiteCapture)[0];
                checkSelectAndCapture(gameState, { piece, x: 5, y: 3 });
            });
        });

        describe('Black', function() {
            test('Black pawn is selectable', function() {
                const piece = initTestGame(gameState, pawnBlackMove)[0];
                checkSelect(gameState, { piece });
            });

            test('Black pawn can move one square ahead', function() {
                const piece = initTestGame(gameState, pawnBlackMove)[0];
                checkSelectAndMove(gameState, { piece, x: 3, y: 2 });
            });

            test('Black pawn can move two squares ahead on first move', function() {
                const piece = initTestGame(gameState, pawnBlackMove)[0];
                checkSelectAndMove(gameState, { piece, x: 3, y: 3 });
            });

            test('Black pawn can capture to southwest', function() {
                const piece = initTestGame(gameState, pawnBlackCapture)[0];
                checkSelectAndMove(gameState, { piece, x: 2, y: 4 });
            });

            test('Black pawn can capture to southeast', function() {
                const piece = initTestGame(gameState, pawnBlackCapture)[0];
                checkSelectAndMove(gameState, { piece, x: 4, y: 4 });
            });
        });
    });

    describe('Knight', function() {
        beforeAll(function() {
            gameState = new GameState();
        });
        afterAll(function() {
            gameState = null;
        });

        describe('White', function() {
            test('White knight is selectable', function() {
                const piece = initTestGame(gameState, knightWhiteMove)[0];
                checkSelect(gameState, { piece });
            });

            test('White knight can move 2 north and 1 west', function() {
                const piece = initTestGame(gameState, knightWhiteMove)[0];
                checkSelectAndMove(gameState, { piece, x: 3, y: 1 });
            });

            test('White knight can move 2 north and 1 east', function() {
                const piece = initTestGame(gameState, knightWhiteMove)[0];
                checkSelectAndMove(gameState, { piece, x: 5, y: 1 });
            });

            test('White knight can move 2 east and 1 north', function() {
                const piece = initTestGame(gameState, knightWhiteMove)[0];
                checkSelectAndMove(gameState, { piece, x: 6, y: 2 });
            });

            test('White knight can move 2 east and 1 south', function() {
                const piece = initTestGame(gameState, knightWhiteMove)[0];
                checkSelectAndMove(gameState, { piece, x: 6, y: 4 });
            });

            test('White knight can move 2 south and 1 west', function() {
                const piece = initTestGame(gameState, knightWhiteMove)[0];
                checkSelectAndMove(gameState, { piece, x: 3, y: 5 });
            });

            test('White knight can move 2 south and 1 east', function() {
                const piece = initTestGame(gameState, knightWhiteMove)[0];
                checkSelectAndMove(gameState, { piece, x: 5, y: 5 });
            });

            test('White knight can move 2 west and 1 north', function() {
                const piece = initTestGame(gameState, knightWhiteMove)[0];
                checkSelectAndMove(gameState, { piece, x: 2, y: 2 });
            });

            test('White knight can move 2 west and 1 south', function() {
                const piece = initTestGame(gameState, knightWhiteMove)[0];
                checkSelectAndMove(gameState, { piece, x: 2, y: 4 });
            });

            test('White knight can capture 2 north and 1 west', function() {
                const piece = initTestGame(gameState, knightWhiteCapture)[0];
                checkSelectAndCapture(gameState, { piece, x: 3, y: 1 });
            });

            test('White knight can capture 2 north and 1 east', function() {
                const piece = initTestGame(gameState, knightWhiteCapture)[0];
                checkSelectAndCapture(gameState, { piece, x: 5, y: 1 });
            });

            test('White knight can capture 2 east and 1 north', function() {
                const piece = initTestGame(gameState, knightWhiteCapture)[0];
                checkSelectAndCapture(gameState, { piece, x: 6, y: 2 });
            });

            test('White knight can capture 2 east and 1 south', function() {
                const piece = initTestGame(gameState, knightWhiteCapture)[0];
                checkSelectAndCapture(gameState, { piece, x: 6, y: 4 });
            });

            test('White knight can capture 2 south and 1 west', function() {
                const piece = initTestGame(gameState, knightWhiteCapture)[0];
                checkSelectAndCapture(gameState, { piece, x: 3, y: 5 });
            });

            test('White knight can capture 2 south and 1 east', function() {
                const piece = initTestGame(gameState, knightWhiteCapture)[0];
                checkSelectAndCapture(gameState, { piece, x: 5, y: 5 });
            });

            test('White knight can capture 2 west and 1 north', function() {
                const piece = initTestGame(gameState, knightWhiteCapture)[0];
                checkSelectAndCapture(gameState, { piece, x: 2, y: 2 });
            });

            test('White knight can capture 2 west and 1 south', function() {
                const piece = initTestGame(gameState, knightWhiteCapture)[0];
                checkSelectAndCapture(gameState, { piece, x: 2, y: 4 });
            });
        });

        describe('Black', function() {
            test('Black knight is selectable', function() {
                const piece = initTestGame(gameState, knightBlackMove)[0];
                checkSelect(gameState, { piece });
            });

            test('Black knight can move 2 north and 1 west', function() {
                const piece = initTestGame(gameState, knightBlackMove)[0];
                checkSelectAndMove(gameState, { piece, x: 3, y: 1 });
            });

            test('Black knight can move 2 north and 1 east', function() {
                const piece = initTestGame(gameState, knightBlackMove)[0];
                checkSelectAndMove(gameState, { piece, x: 5, y: 1 });
            });

            test('Black knight can move 2 east and 1 north', function() {
                const piece = initTestGame(gameState, knightBlackMove)[0];
                checkSelectAndMove(gameState, { piece, x: 6, y: 2 });
            });

            test('Black knight can move 2 east and 1 south', function() {
                const piece = initTestGame(gameState, knightBlackMove)[0];
                checkSelectAndMove(gameState, { piece, x: 6, y: 4 });
            });

            test('Black knight can move 2 south and 1 west', function() {
                const piece = initTestGame(gameState, knightBlackMove)[0];
                checkSelectAndMove(gameState, { piece, x: 3, y: 5 });
            });

            test('Black knight can move 2 south and 1 east', function() {
                const piece = initTestGame(gameState, knightBlackMove)[0];
                checkSelectAndMove(gameState, { piece, x: 5, y: 5 });
            });

            test('Black knight can move 2 west and 1 north', function() {
                const piece = initTestGame(gameState, knightBlackMove)[0];
                checkSelectAndMove(gameState, { piece, x: 2, y: 2 });
            });

            test('Black knight can move 2 west and 1 south', function() {
                const piece = initTestGame(gameState, knightBlackMove)[0];
                checkSelectAndMove(gameState, { piece, x: 2, y: 4 });
            });

            test('Black knight can capture 2 north and 1 west', function() {
                const piece = initTestGame(gameState, knightBlackCapture)[0];
                checkSelectAndCapture(gameState, { piece, x: 3, y: 1 });
            });

            test('Black knight can capture 2 north and 1 east', function() {
                const piece = initTestGame(gameState, knightBlackCapture)[0];
                checkSelectAndCapture(gameState, { piece, x: 5, y: 1 });
            });

            test('Black knight can capture 2 east and 1 north', function() {
                const piece = initTestGame(gameState, knightBlackCapture)[0];
                checkSelectAndCapture(gameState, { piece, x: 6, y: 2 });
            });

            test('Black knight can capture 2 east and 1 south', function() {
                const piece = initTestGame(gameState, knightBlackCapture)[0];
                checkSelectAndCapture(gameState, { piece, x: 6, y: 4 });
            });

            test('Black knight can capture 2 south and 1 west', function() {
                const piece = initTestGame(gameState, knightBlackCapture)[0];
                checkSelectAndCapture(gameState, { piece, x: 3, y: 5 });
            });

            test('Black knight can capture 2 south and 1 east', function() {
                const piece = initTestGame(gameState, knightBlackCapture)[0];
                checkSelectAndCapture(gameState, { piece, x: 5, y: 5 });
            });

            test('Black knight can capture 2 west and 1 north', function() {
                const piece = initTestGame(gameState, knightBlackCapture)[0];
                checkSelectAndCapture(gameState, { piece, x: 2, y: 2 });
            });

            test('Black knight can capture 2 west and 1 south', function() {
                const piece = initTestGame(gameState, knightBlackCapture)[0];
                checkSelectAndCapture(gameState, { piece, x: 2, y: 4 });
            });
        });
    });

    describe('Bishop', function() {
        beforeAll(function() {
            gameState = new GameState();
        });
        afterAll(function() {
            gameState = null;
        });

        describe('White', function() {
            test('White bishop is selectable', function() {
                const piece = initTestGame(gameState, bishopWhiteMove)[0];
                checkSelect(gameState, { piece });
            });

            test('White bishop can move to northeast', function() {
                const piece = initTestGame(gameState, bishopWhiteMove)[0];
                checkSelectAndMove(gameState, { piece, x: 6, y: 0 });
            });

            test('White bishop can move to southeast', function() {
                const piece = initTestGame(gameState, bishopWhiteMove)[0];
                checkSelectAndMove(gameState, { piece, x: 7, y: 7 });
            });

            test('White bishop can move to southwest', function() {
                const piece = initTestGame(gameState, bishopWhiteMove)[0];
                checkSelectAndMove(gameState, { piece, x: 0, y: 6 });
            });

            test('White bishop can move to northwest', function() {
                const piece = initTestGame(gameState, bishopWhiteMove)[0];
                checkSelectAndMove(gameState, { piece, x: 0, y: 0 });
            });

            test('White bishop on opposite color is selectable', function() {
                const piece = initTestGame(
                    gameState,
                    bishopWhiteOppositeMove
                )[0];
                checkSelect(gameState, { piece });
            });

            test('White bishop on opposite color can move to northeast', function() {
                const piece = initTestGame(
                    gameState,
                    bishopWhiteOppositeMove
                )[0];
                checkSelectAndMove(gameState, { piece, x: 7, y: 0 });
            });

            test('White bishop on opposite color can move to southeast', function() {
                const piece = initTestGame(
                    gameState,
                    bishopWhiteOppositeMove
                )[0];
                checkSelectAndMove(gameState, { piece, x: 7, y: 6 });
            });

            test('White bishop on opposite color can move to southwest', function() {
                const piece = initTestGame(
                    gameState,
                    bishopWhiteOppositeMove
                )[0];
                checkSelectAndMove(gameState, { piece, x: 0, y: 7 });
            });

            test('White bishop on opposite color can move to northwest', function() {
                const piece = initTestGame(
                    gameState,
                    bishopWhiteOppositeMove
                )[0];
                checkSelectAndMove(gameState, { piece, x: 1, y: 0 });
            });
        });

        describe('Black', function() {});
    });

    describe('King', function() {
        beforeAll(function() {
            gameState = new GameState();
        });
        afterAll(function() {
            gameState = null;
        });

        describe('White', function() {
            test('White king is selectable', function() {
                const piece = initTestGame(gameState, kingWhite)[0];
                checkSelect(gameState, { piece });
            });

            test('White king can move one square north', function() {
                const piece = initTestGame(gameState, kingWhite)[0];
                checkSelectAndMove(gameState, { piece, x: 4, y: 3 });
            });

            test('White king can move one square northeast', function() {
                const piece = initTestGame(gameState, kingWhite)[0];
                checkSelectAndMove(gameState, { piece, x: 5, y: 3 });
            });

            test('White king can move one square east', function() {
                const piece = initTestGame(gameState, kingWhite)[0];
                checkSelectAndMove(gameState, { piece, x: 5, y: 4 });
            });

            test('White king can move one square southeast', function() {
                const piece = initTestGame(gameState, kingWhite)[0];
                checkSelectAndMove(gameState, { piece, x: 5, y: 5 });
            });

            test('White king can move one square south', function() {
                const piece = initTestGame(gameState, kingWhite)[0];
                checkSelectAndMove(gameState, { piece, x: 4, y: 5 });
            });

            test('White king can move one square southwest', function() {
                const piece = initTestGame(gameState, kingWhite)[0];
                checkSelectAndMove(gameState, { piece, x: 3, y: 5 });
            });

            test('White king can move one square west', function() {
                const piece = initTestGame(gameState, kingWhite)[0];
                checkSelectAndMove(gameState, { piece, x: 3, y: 4 });
            });

            test('White king can move one square northwest', function() {
                const piece = initTestGame(gameState, kingWhite)[0];
                checkSelectAndMove(gameState, { piece, x: 3, y: 3 });
            });

            test('White king checkmate ends the game', function() {
                const piece = initTestGame(gameState, kingWhiteCheckmate)[0];
                checkSelectAndMove(gameState, { piece, x: 7, y: 3 });

                expect(gameState.gameStatus).toBe(CHECKMATE);
                expect(gameState.gameEndedAt).not.toBe(null);
            });

            test('White king draw ends the game', function() {
                const piece = initTestGame(gameState, kingWhiteDraw)[0];
                checkSelectAndMove(gameState, { piece, x: 5, y: 1 });

                expect(gameState.gameStatus).toBe(DRAW);
                expect(gameState.gameEndedAt).not.toBe(null);
            });

            // TODO: Implement this test for black king
            test.skip('White king gets out of draw thanks to another piece moving does not end the game', function() {
                const piece = initTestGame(gameState, kingWhiteNotDrawMove)[0];
                // visualizeBoard(gameState);
                checkSelectAndMove(gameState, { piece, x: 5, y: 1 });

                expect(gameState.gameStatus).toBe(ONGOING);
                expect(gameState.gameEndedAt).toBe(null);
            });

            // TODO: Implement this test for black king
            test.skip('White king gets out of draw thanks to another piece capturing does not end the game', function() {
                const piece = initTestGame(
                    gameState,
                    kingWhiteNotDrawCapture
                )[0];
                // visualizeBoard(gameState);
                checkSelectAndMove(gameState, { piece, x: 5, y: 1 });

                expect(gameState.gameStatus).toBe(ONGOING);
                expect(gameState.gameEndedAt).toBe(null);
            });
        });

        describe('Black', function() {
            test('Black king is selectable', function() {
                const piece = initTestGame(gameState, kingBlack)[0];
                checkSelect(gameState, { piece });
            });

            test('Black king can move one square north', function() {
                const piece = initTestGame(gameState, kingBlack)[0];
                checkSelectAndMove(gameState, { piece, x: 4, y: 3 });
            });

            test('Black king can move one square northeast', function() {
                const piece = initTestGame(gameState, kingBlack)[0];
                checkSelectAndMove(gameState, { piece, x: 5, y: 3 });
            });

            test('Black king can move one square east', function() {
                const piece = initTestGame(gameState, kingBlack)[0];
                checkSelectAndMove(gameState, { piece, x: 5, y: 4 });
            });

            test('Black king can move one square southeast', function() {
                const piece = initTestGame(gameState, kingBlack)[0];
                checkSelectAndMove(gameState, { piece, x: 5, y: 5 });
            });

            test('Black king can move one square south', function() {
                const piece = initTestGame(gameState, kingBlack)[0];
                checkSelectAndMove(gameState, { piece, x: 4, y: 5 });
            });

            test('Black king can move one square southwest', function() {
                const piece = initTestGame(gameState, kingBlack)[0];
                checkSelectAndMove(gameState, { piece, x: 3, y: 5 });
            });

            test('Black king can move one square west', function() {
                const piece = initTestGame(gameState, kingBlack)[0];
                checkSelectAndMove(gameState, { piece, x: 3, y: 4 });
            });

            test('Black king can move one square northwest', function() {
                const piece = initTestGame(gameState, kingBlack)[0];
                checkSelectAndMove(gameState, { piece, x: 3, y: 3 });
            });

            test('Black king checkmate ends the game', function() {
                const piece = initTestGame(gameState, kingBlackCheckmate)[0];
                checkSelectAndMove(gameState, { piece, x: 7, y: 3 });

                expect(gameState.gameStatus).toBe(CHECKMATE);
                expect(gameState.gameEndedAt).not.toBe(null);
            });

            test('Black king draw ends the game', function() {
                const piece = initTestGame(gameState, kingBlackDraw)[0];
                checkSelectAndMove(gameState, { piece, x: 5, y: 1 });

                expect(gameState.gameStatus).toBe(DRAW);
                expect(gameState.gameEndedAt).not.toBe(null);
            });
        });
    });
});
