import { PLAYER_COLORS, PIECE_VALUES, KING, ROOK } from '../lib/constants';

export default class Piece {
    constructor({ id, type, x, y, player, firstMove }) {
        this.id = id;
        this.type = type;
        this.x = x;
        this.y = y;
        this.player = player;
        this.firstMove = firstMove;
    }

    get debug() {
        return {
            ...this,
            playerColor: PLAYER_COLORS[this.player],
            x: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'][this.x],
            y: this.y + 1
        };
    }

    get value() {
        return PIECE_VALUES[this.type] || 0;
    }

    get canCastlePrerequisites() {
        return this.firstMove && [KING, ROOK].includes(this.type);
    }
}
