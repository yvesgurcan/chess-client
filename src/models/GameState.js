import Piece from '../models/Piece';
import uuid from 'uuid/v4';
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

export default class GameState {
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
                        type
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

    select = ({ x, y, piece }) => {
        if (piece) {
            const { x: discardX, y: discardY, ...pieceProperties } = piece;
            console.log({ pieceProperties });
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

    moveSelectedPiece = ({ x, y }) => {
        if (!this.selected) {
            return false;
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
                            origin: { x: piece.x, y: piece.y },
                            destination: { x, y },
                            type: selectedPiece.type,
                            player: selectedPiece.player,
                            firstMove: selectedPiece.firstMove
                        })
                    ) {
                        this.select({
                            x,
                            y,
                            piece: { ...piece, firstMove: false }
                        });
                        return new Piece({ ...piece, x, y, firstMove: false });
                    } else {
                        this.select({ x, y });
                        return piece;
                    }
                }

                return piece;
            });
        } else {
            this.select({ x, y });
        }
    };

    isBishopPattern = ({ vectorX, vectorY }) => {
        return Math.abs(vectorX) === Math.abs(vectorY);
    };

    isRookPattern = ({ vectorX, vectorY }) => {
        return (
            (vectorX === 0 && vectorY !== 0) || (vectorX !== 0 && vectorY === 0)
        );
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

        console.log({ vectorX, vectorY });

        switch (type) {
            default: {
                break;
            }
            case KING: {
                return Math.abs(vectorX) === 1 || Math.abs(vectorY) === 1;
            }
            case QUEEN: {
                return (
                    this.isBishopPattern({ vectorX, vectorY }) ||
                    this.isRookPattern({ vectorX, vectorY })
                );
            }
            case ROOK: {
                return this.isRookPattern({ vectorX, vectorY });
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
                    return (
                        vectorY > 0 && vectorY <= 1 + firstMove && vectorX === 0
                    );
                }

                if (player === PLAYER1) {
                    console.log({ vectorY });
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
}
