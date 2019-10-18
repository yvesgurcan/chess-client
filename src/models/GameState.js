import uuid from 'uuid/v4';
import moment from 'moment';
import momentDurationFormatSetup from 'moment-duration-format';

import Piece from '../models/Piece';
import {
    BOARD_SIDE_SIZE,
    PLAYER1,
    PLAYER2,
    PAWN,
    LEFT_BACK_ROW_PIECES,
    RIGHT_BACK_ROW_PIECES,
    KING,
    QUEEN,
    BISHOP,
    ROOK,
    KNIGHT,
    KNIGHT_MOVE_DIMENSION1,
    KNIGHT_MOVE_DIMENSION2
} from '../lib/constants';

momentDurationFormatSetup(moment);

export default class GameState {
    constructor() {
        this.gameStartedAt = moment(); // timestamp
        this.sessionStartedAt = moment(); // point of reference for time played in current session
        this.totalTimePlayed = moment.duration(
            moment().diff(moment()),
            'milliseconds'
        ); // keeps time spent across multiple sessions
        this.currentPlayer = PLAYER1;
        this.currentTurn = 0;
        this.pieces = [];
        this.removedPieces = [[], []];
    }

    updateTimePlayed = () => {
        const sessionTimePlayed = moment.duration(
            moment().diff(this.sessionStartedAt),
            'milliseconds'
        );
        this.totalTimePlayed = sessionTimePlayed;
    };

    nextTurn = () => {
        this.currentPlayer = +!this.currentPlayer;
        this.currentTurn += 1;
    };

    initPieces = () => {
        let pieces = [];
        [PLAYER1, PLAYER2].forEach(player => {
            [...LEFT_BACK_ROW_PIECES, ...RIGHT_BACK_ROW_PIECES].forEach(
                (type, index) => {
                    const piece = new Piece({
                        id: uuid(),
                        x: index,
                        y: player ? 0 : BOARD_SIDE_SIZE,
                        player,
                        type,
                        firstMove:
                            type === ROOK || type === KING ? true : undefined
                    });
                    const pawn = new Piece({
                        id: uuid(),
                        x: index,
                        y: player ? 1 : BOARD_SIDE_SIZE - 1,
                        player,
                        type: PAWN,
                        firstMove: true
                    });
                    pieces.push(pawn);
                    pieces.push(piece);
                }
            );
        });

        this.pieces = pieces;
    };

    getPieceAt = ({ x, y }) => {
        return this.pieces.find(piece => {
            let matchSelectedId = true;

            if (this.selected && this.selected.piece) {
                if (
                    this.selected.x === piece.x &&
                    this.selected.y === piece.y
                ) {
                    // make sure that, if pieces were to stack on the same square, only the selected piece would be returned
                    if (this.selected.piece.id !== piece.id) {
                        matchSelectedId = false;
                    }
                }
            }

            return piece.x === x && piece.y === y && matchSelectedId;
        });
    };

    removePiece = pieceToRemove => {
        const pieces = [];
        this.pieces.forEach(piece => {
            if (piece.id !== pieceToRemove.id) {
                pieces.push(piece);
            }
        });

        this.pieces = pieces;

        const playerPieceRemoved = this.removedPieces[pieceToRemove.player];
        const updatedPlayerPieceRemoved = [
            ...playerPieceRemoved,
            pieceToRemove
        ];

        const oppositePlayerPieceRemoved = this.removedPieces[
            Number(!pieceToRemove.player)
        ];

        if (pieceToRemove.player === 0) {
            this.removedPieces = [
                updatedPlayerPieceRemoved,
                oppositePlayerPieceRemoved
            ];
        } else {
            this.removedPieces = [
                oppositePlayerPieceRemoved,
                updatedPlayerPieceRemoved
            ];
        }

        console.log(this.removedPieces);
    };

    select = ({ x, y, piece }) => {
        if (piece) {
            const { x: discardX, y: discardY, ...pieceProperties } = piece;
            this.selected = { x, y, piece: pieceProperties };
        } else {
            this.selected = { x, y };
        }
    };

    unselect = () => {
        this.selected = null;
    };

    isSelectedSquare = ({ x, y }) => {
        if (!this.selected) {
            return false;
        }

        return this.selected.x === x && this.selected.y === y;
    };

    isBishopPattern = ({ vectorX, vectorY }) => {
        return Math.abs(vectorX) === Math.abs(vectorY);
    };

    isRookPattern = ({ vectorX, vectorY }) => {
        return (
            (vectorX === 0 && vectorY !== 0) || (vectorX !== 0 && vectorY === 0)
        );
    };

    isRookMoveFree = ({ origin, vector }) => {
        const axis = vector.x ? 'y' : 'x';
        const otherAxis = vector.x ? 'x' : 'y';
        const lineToCheck = origin[axis];
        const target = origin[otherAxis] + vector[otherAxis];
        const pieceIsInTheWay = this.pieces.some(piece => {
            if (piece[axis] !== lineToCheck || piece.id === origin.id) {
                return false;
            }

            if (vector[otherAxis] > 0) {
                if (
                    piece[otherAxis] > origin[otherAxis] &&
                    piece[otherAxis] < target
                ) {
                    return true;
                }
            }

            if (vector[otherAxis] < 0) {
                if (
                    piece[otherAxis] < origin[otherAxis] &&
                    piece[otherAxis] > target
                ) {
                    return true;
                }
            }

            return false;
        });

        return !pieceIsInTheWay;
    };

    isPiecePattern = ({
        destination: { x, y },
        origin,
        type,
        player,
        firstMove
    }) => {
        const vectorX = x - origin.x;
        const vectorY = y - origin.y;

        switch (type) {
            default: {
                break;
            }
            case KING: {
                return Math.abs(vectorX) === 1 || Math.abs(vectorY) === 1;
                // TODO: check if this is castling
                /*
                    The king and the chosen rook are on the player's first rank.
                    Neither the king nor the chosen rook has previously moved.
                    There are no pieces between the king and the chosen rook.
                    The king is not currently in check.
                    The king does not pass through a square that is attacked by an enemy piece.
                    The king does not end up in check. (True of any legal move.)
                */
            }
            case QUEEN: {
                return (
                    this.isBishopPattern({ vectorX, vectorY }) ||
                    this.isRookPattern({ vectorX, vectorY })
                );
            }
            case ROOK: {
                return (
                    this.isRookPattern({ vectorX, vectorY }) &&
                    this.isRookMoveFree({
                        origin,
                        vector: { x: vectorX, y: vectorY }
                    })
                );
                // TODO: check if this is castling
            }
            case KNIGHT: {
                if (
                    (Math.abs(vectorX) === KNIGHT_MOVE_DIMENSION1 &&
                        Math.abs(vectorY) === KNIGHT_MOVE_DIMENSION2) ||
                    (Math.abs(vectorX) === KNIGHT_MOVE_DIMENSION2 &&
                        Math.abs(vectorY) === KNIGHT_MOVE_DIMENSION1)
                ) {
                    return true;
                }
                break;
            }
            case BISHOP: {
                return this.isBishopPattern({ vectorX, vectorY });
            }
            case PAWN: {
                if (player === PLAYER2) {
                    // TODO: check if pawn is taking a piece
                    return (
                        vectorY > 0 && vectorY <= 1 + firstMove && vectorX === 0
                    );
                }

                if (player === PLAYER1) {
                    // TODO: check if pawn is taking a piece
                    return (
                        vectorY < 0 &&
                        vectorY >= -1 - firstMove &&
                        vectorX === 0
                    );
                }
            }
        }

        return false;
    };

    isLegalMove = ({ destination, origin, type, player, firstMove }) => {
        const fitsPiecePattern = this.isPiecePattern({
            destination,
            origin,
            type,
            player,
            firstMove
        });
        return fitsPiecePattern;
    };

    moveSelectedPiece = ({ x, y }) => {
        let moved = false;
        let pieceToRemove = null;

        if (!this.selected) {
            return moved;
        }

        const {
            x: selectedX,
            y: selectedY,
            piece: selectedPiece
        } = this.selected;
        if (selectedPiece) {
            this.pieces = this.pieces.map(piece => {
                if (
                    piece.x === selectedX &&
                    piece.y === selectedY &&
                    piece.id === selectedPiece.id
                ) {
                    if (
                        this.isLegalMove({
                            origin: { x: piece.x, y: piece.y, id: piece.id },
                            destination: { x, y },
                            type: selectedPiece.type,
                            player: selectedPiece.player,
                            firstMove: selectedPiece.firstMove
                        })
                    ) {
                        const targetPiece = this.getPieceAt({
                            x,
                            y
                        });

                        if (targetPiece) {
                            if (
                                selectedPiece.player === this.currentPlayer &&
                                targetPiece.player !== selectedPiece.player
                            ) {
                                pieceToRemove = targetPiece;
                            } else {
                                return piece;
                            }
                        } else if (
                            selectedPiece.player !== this.currentPlayer
                        ) {
                            return piece;
                        }

                        moved = true;

                        this.select({
                            x,
                            y,
                            piece: { ...piece, firstMove: false }
                        });

                        this.nextTurn();
                        return new Piece({ ...piece, x, y, firstMove: false });
                    } else {
                        // select empty tile
                        this.select({ x, y });
                        return piece;
                    }
                }

                return piece;
            });

            if (pieceToRemove) {
                this.removePiece(pieceToRemove);
            }
        } else {
            this.select({ x, y });
        }

        return moved;
    };
}
