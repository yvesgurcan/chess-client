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
            x: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'][this.x],
            y: this.y + 1
        };
    }
}
