import {
    BOARD_SIDE_SIZE,
    PLAYER_COLORS,
    PIECE_VALUES,
    KING,
    ROOK
} from '../lib/constants';

export default class Piece {
    constructor({ id, type, x, y, player, firstMove, queenSide, kingSide }) {
        this.id = id;
        this.type = type;
        this.x = x;
        this.y = y;
        this.player = player;
        this.firstMove = firstMove;
        this.queenSide = queenSide;
        this.kingSide = kingSide;
    }

    get debug() {
        return {
            ...this,
            playerColor: PLAYER_COLORS[this.player],
            xColumn: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'][this.x],
            yRow: BOARD_SIDE_SIZE - this.y + 1
        };
    }

    get value() {
        return PIECE_VALUES[this.type] || 0;
    }

    get canCastlePrerequisites() {
        // TODO: Add requirement: Piece must be on the player's first rank
        return this.firstMove && [KING, ROOK].includes(this.type);
    }
}
