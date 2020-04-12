import { v4 as uuid } from 'uuid';
import { BOARD_SIDE_SIZE } from '../lib/constants';

export default class GameLog {
    constructor() {
        this.fenString = '';
        this.pureAlgebraicNotation = '';
        this.moves = [];
        this.movesAlgebraicNotation = [];
    }

    parseMoveToPureAlgebraicNotation({ from, to }) {
        const fromX = String.fromCharCode(97 + from.x);
        const fromY = BOARD_SIDE_SIZE + 1 - from.y;
        const toX = String.fromCharCode(97 + to.x);
        const toY = BOARD_SIDE_SIZE + 1 - to.y;
        const move = `${fromX}${fromY}${toX}${toY}`;

        if (this.pureAlgebraicNotation) {
            return ` ${move}`;
        }

        return move;
    }

    parsePureAlgebraicNotationToMove(string) {
        const fromX = string[0].charCodeAt() - 97;
        const fromY = Number(BOARD_SIDE_SIZE + 1 - string[1]);
        const toX = string[2].charCodeAt() - 97;
        const toY = Number(BOARD_SIDE_SIZE + 1 - string[3]);
        return {
            from: {
                x: fromX,
                y: fromY
            },
            to: {
                x: toX,
                y: toY
            }
        };
    }

    addEntry(moveData) {
        const id = uuid();
        const { from, to, player, piece } = moveData;
        this.moves = [...this.moves, { id, ...moveData }];
        const pureAlgebraicNotationMove = this.parseMoveToPureAlgebraicNotation(
            {
                from,
                to
            }
        );
        this.movesAlgebraicNotation = [
            ...this.movesAlgebraicNotation,
            { id, string: pureAlgebraicNotationMove, player, piece }
        ];
        this.pureAlgebraicNotation += pureAlgebraicNotationMove;
    }
}
