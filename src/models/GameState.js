import Piece from '../models/Piece';
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
                        x: index,
                        y: player ? 0 : BOARD_SIDE_SIZE,
                        player,
                        type
                    });
                    const pawn = new Piece({
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
        return this;
    };

    getPieceAt = ({ x, y }) => {
        const piece = this.pieces.find(piece => piece.x === x && piece.y === y);
        return piece || {};
    };

    selectSquare = ({ x, y }) => {
        this.selected = { x, y };
    };

    isSelectedSquare = ({ x, y }) => {
        if (!this.selected) {
            return null;
        }

        return this.selected.x === x && this.selected.y === y;
    };
}
