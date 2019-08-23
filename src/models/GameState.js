import Piece from '../models/Piece';
import uuid from 'uuid/v4';
import {
    BOARD_SIDE_SIZE,
    PLAYER1,
    PLAYER2,
    PAWN,
    LEFT_BACK_ROW_PIECES,
    RIGHT_BACK_ROW_PIECES
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
                        type: PAWN
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
                            type: selectedPiece.type
                        })
                    ) {
                        this.select({ x, y, piece });
                        return new Piece({ ...piece, x, y });
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

    isLegalMove = ({ origin, destination, type }) => {
        return true;
    };
}
