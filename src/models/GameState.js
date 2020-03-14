import { v4 as uuid } from 'uuid';
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
    practice = false;

    constructor() {
        this.gameStartedAt = moment(); // timestamp
        this.sessionStartedAt = moment(); // point of reference for time played in current session
        this.totalTimePlayed = moment.duration(
            moment().diff(moment()),
            'milliseconds'
        ); // keeps track of time spent across multiple sessions
        this.gameEndedAt = null;
        this.currentPlayer = PLAYER1;
        this.currentTurn = 0;
        this.pieces = [];
        this.removedPieces = [[], []];
    }

    updateTimePlayed = () => {
        if (this.gameEndedAt) {
            return;
        }

        const sessionTimePlayed = moment.duration(
            moment().diff(this.sessionStartedAt),
            'milliseconds'
        );

        this.totalTimePlayed = sessionTimePlayed;
    };

    nextTurn = () => {
        this.currentTurn += 1;

        if (this.practice) {
            return;
        }

        this.unselect();
        this.currentPlayer = +!this.currentPlayer;
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

    /**
     * @returns `Piece` or `undefined`
     */
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

    hasPieceAt = ({ x, y }) => {
        return this.pieces.some(piece => piece.x === x && piece.y === y);
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

    isPawnCapturing = ({ x, y, vectorX, vectorY, direction }) => {
        if (vectorY === direction && (vectorX === 1 || vectorX === -1)) {
            return this.hasPieceAt({ x, y });
        }

        return false;
    };

    isPawnMoving = ({ x, y, vectorX, vectorY, firstMove, direction }) => {
        const hasPiece = this.hasPieceAt({ x, y });
        if (hasPiece) {
            return false;
        }

        if (direction === 1) {
            return vectorY > 0 && vectorY <= 1 + firstMove && vectorX === 0;
        } else {
            return vectorY < 0 && vectorY >= -1 - firstMove && vectorX === 0;
        }
    };

    isBishopPattern = ({ vectorX, vectorY }) => {
        return Math.abs(vectorX) === Math.abs(vectorY);
    };

    isBishopMoveFree = ({ origin, destination, vector }) => {
        const pieceIsInTheWay = this.pieces.some(piece => {
            if (piece.id === origin.id) {
                return false;
            }

            const delta = {
                x: piece.x - origin.x,
                y: piece.y - origin.y
            };

            // piece is diagonal to the bishop
            if (Math.abs(delta.x) === Math.abs(delta.y)) {
                let xObstructed = false;
                let yObstructed = false;
                if (vector.x > 0) {
                    xObstructed = piece.x < destination.x && piece.x > origin.x;
                } else {
                    xObstructed = piece.x > destination.x && piece.x < origin.x;
                }

                if (vector.y > 0) {
                    yObstructed = piece.y < destination.y && piece.y > origin.y;
                } else {
                    yObstructed = piece.y > destination.y && piece.y < origin.y;
                }

                // piece is within the area that the bishop is crossing
                return xObstructed && yObstructed;
            }

            return false;
        });

        return !pieceIsInTheWay;
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

    isKingPattern = ({ vectorX, vectorY }) => {
        return vectorX >= -1 && vectorX <= 1 && vectorY >= -1 && vectorY <= 1;
    };

    isCastlePattern = ({ vectorX, vectorY }) => {
        return Math.abs(vectorX) === 2 && vectorY === 0;
    };

    performCastle = ({ castleVectorX, selectedPiece, destination }) => {
        const playerY = this.currentPlayer === PLAYER1 ? 7 : 0;
        const rookX = castleVectorX > 0 ? 7 : 0;
        const rookVectorX = castleVectorX > 0 ? -1 : 1;

        // find chosen rook
        const targetRook = this.pieces.find(piece => {
            return (
                piece.type === ROOK &&
                piece.player === selectedPiece.player &&
                piece.firstMove &&
                piece.x === rookX
            );
        });

        // there's no rook to castle with
        if (!targetRook) {
            return;
        }

        let betweenX;

        if (castleVectorX > 0) {
            betweenX = [5, 6];
        } else {
            betweenX = [1, 2, 3];
        }

        const isBlocked = betweenX
            .map(deltaX => {
                return (
                    this.hasPieceAt({ x: deltaX, y: playerY }) ||
                    this.isKingInCheck({ x: deltaX, y: playerY })
                );
            })
            .some(blocking => blocking);

        // there are pieces between the king and the rook
        if (isBlocked) {
            return false;
        }

        // update pieces positions
        this.pieces = this.pieces.map(piece => {
            if (piece.id === selectedPiece.id) {
                return new Piece({
                    ...selectedPiece,
                    x: destination.x,
                    y: destination.y,
                    firstMove: false
                });
            } else if (piece.id === targetRook.id) {
                return new Piece({
                    ...targetRook,
                    x: destination.x + rookVectorX,
                    firstMove: false
                });
            }

            return piece;
        });

        this.nextTurn();

        return true;
    };

    /**
     * @returns {bool} Whether the pattern corresponds to the piece
     */
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
                return this.isKingPattern({ vectorX, vectorY });
            }
            case QUEEN: {
                return (
                    (this.isBishopPattern({ vectorX, vectorY }) &&
                        this.isBishopMoveFree({
                            origin,
                            destination: { x, y },
                            vector: { x: vectorX, y: vectorY }
                        })) ||
                    (this.isRookPattern({ vectorX, vectorY }) &&
                        this.isRookMoveFree({
                            origin,
                            vector: { x: vectorX, y: vectorY }
                        }))
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
                return (
                    this.isBishopPattern({ vectorX, vectorY }) &&
                    this.isBishopMoveFree({
                        origin,
                        destination: { x, y },
                        vector: { x: vectorX, y: vectorY }
                    })
                );
            }
            case PAWN: {
                const direction = player === PLAYER1 ? -1 : 1;
                return (
                    this.isPawnMoving({
                        x,
                        y,
                        vectorX,
                        vectorY,
                        firstMove,
                        direction
                    }) ||
                    this.isPawnCapturing({
                        x,
                        y,
                        vectorX,
                        vectorY,
                        direction
                    })
                );
            }
        }

        return false;
    };

    isKingInCheck = kingProjection => {
        let kingActual = null;
        const opponentPieces = this.pieces.filter(piece => {
            if (piece.type === KING && piece.player === this.currentPlayer) {
                kingActual = { ...piece };
            }

            return piece.player !== this.currentPlayer;
        });

        const king = kingProjection || kingActual;

        if (!king) {
            console.error('King not found?!');
            return false;
        }

        const isInCheck = opponentPieces.some(piece => {
            // TODO: allow king to capture the piece when adjacent to it
            const fitsPiecePattern = this.isPiecePattern({
                destination: { x: king.x, y: king.y },
                origin: { x: piece.x, y: piece.y },
                type: piece.type,
                player: piece.player,
                firstMove: false
            });
            return fitsPiecePattern;
        });

        return isInCheck;
    };

    isOpponentKingCheckmate = () => {
        let opponentKing = null;
        const pieces = this.pieces.filter(piece => {
            if (piece.type === KING && piece.player !== this.currentPlayer) {
                opponentKing = { ...piece };
            }

            return piece.player === this.currentPlayer;
        });

        if (!opponentKing) {
            console.error('Opponent king not found?!');
            return false;
        }

        // check how many of the possible king moves will end up with the king being in check, including its current position
        let isInCheck = [];
        for (let x = -1; x <= 1; x++) {
            for (let y = -1; y <= 1; y++) {
                const destination = {
                    x: Math.max(0, opponentKing.x + x),
                    y: Math.max(0, opponentKing.y + y)
                };
                const destinationInCheck = pieces.some(piece => {
                    const fitsPiecePattern = this.isPiecePattern({
                        destination,
                        origin: { x: piece.x, y: piece.y },
                        type: piece.type,
                        player: piece.player,
                        firstMove: false
                    });
                    return fitsPiecePattern;
                });

                // console.log(destination, destinationInCheck);

                isInCheck.push(destinationInCheck);
            }
        }

        const illegalMoves = isInCheck.reduce(
            (sum, value) => sum + Number(value)
        );

        // console.log({ illegalMoves });

        // TODO: Check if moving one of the pieces of the opponent might get the king out of checkmate

        return illegalMoves === 9;
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

        if (this.gameEndedAt) {
            return moved;
        }

        let pieceToRemove = null;
        let castleVectorX = null;

        if (!this.selected) {
            return moved;
        }

        const {
            x: selectedX,
            y: selectedY,
            piece: selectedPiece
        } = this.selected;

        if (!selectedPiece) {
            this.select({ x, y });
            return moved;
        }

        const originalPieces = [].concat(this.pieces);

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
                        // capture opponent piece
                        if (
                            selectedPiece.player === this.currentPlayer &&
                            targetPiece.player !== selectedPiece.player
                        ) {
                            pieceToRemove = targetPiece;
                        } else {
                            return piece;
                        }
                    } else if (selectedPiece.player !== this.currentPlayer) {
                        return piece;
                    }

                    moved = true;

                    this.select({
                        x,
                        y,
                        piece: { ...piece, firstMove: false }
                    });

                    return new Piece({ ...piece, x, y, firstMove: false });
                } else {
                    // castling check
                    if (piece.canCastlePrerequisites) {
                        const vectorX = x - piece.x;
                        const vectorY = y - piece.y;
                        if (this.isCastlePattern({ vectorX, vectorY })) {
                            castleVectorX = vectorX;
                        }
                    }

                    // select empty tile
                    this.select({ x, y });
                    return piece;
                }
            }

            return piece;
        });

        const kingInCheck = this.isKingInCheck();
        if (kingInCheck) {
            this.pieces = originalPieces;
            moved = false;
            return moved;
        }

        if (pieceToRemove) {
            this.removePiece(pieceToRemove);
        }

        const opponentKingCheckmate = this.isOpponentKingCheckmate();
        if (opponentKingCheckmate) {
            this.gameEndedAt = moment();
            return moved;
        }

        // perform castling
        if (castleVectorX) {
            return this.performCastle({
                castleVectorX,
                selectedPiece,
                destination: { x, y }
            });
        }

        if (moved) {
            this.nextTurn();
        }

        return moved;
    };
}
