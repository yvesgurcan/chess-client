export default class Piece {
    constructor({ id, type, x, y, player }) {
        this.id = id;
        this.type = type;
        this.x = x;
        this.y = y;
        this.player = player;
    }
}
