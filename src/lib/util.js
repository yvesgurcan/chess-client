import { name, version, author, repository } from '../../package.json';
import { BOARD_SIDE_SIZE } from './constants';

export function getPackageInfo() {
    const parsedPackageInfo = {
        name,
        version,
        repository: repository.url,
        author
    };
    return parsedPackageInfo;
}

export function visualizeBoard(gameState) {
    let squares = [];
    squares.push([
        '---',
        '---',
        '---',
        '---',
        '---',
        '---',
        '---',
        '---',
        '---'
    ]);
    squares.push([
        '   ',
        ' 0 ',
        ' 1 ',
        ' 2 ',
        ' 3 ',
        ' 4 ',
        ' 5 ',
        ' 6 ',
        ' 7 '
    ]);
    for (let y = 0; y <= BOARD_SIDE_SIZE; y++) {
        let line = [];
        squares.push([
            '---',
            '---',
            '---',
            '---',
            '---',
            '---',
            '---',
            '---',
            '---'
        ]);
        for (let x = 0; x <= BOARD_SIDE_SIZE; x++) {
            const piece = gameState.getPieceAt({
                x,
                y
            });
            let pieceId = '   ';
            if (piece) {
                const { type, player } = piece;
                if (piece.type === 'knight') {
                    pieceId = type.substring(1, 2);
                } else {
                    pieceId = type.substring(0, 1);
                }
                const playerColor = player === 0 ? '\x1b[37m' : '\x1b[35m';
                pieceId =
                    '\x1b[1m' +
                    playerColor +
                    ' ' +
                    pieceId +
                    ' \x1b[0m\x1b[33m';
            }

            line.push(pieceId);
            if (x === BOARD_SIDE_SIZE) {
                squares.push([` ${y} `, ...line]);
                line = [];
            }
        }
    }
    squares.push([
        '---',
        '---',
        '---',
        '---',
        '---',
        '---',
        '---',
        '---',
        '---'
    ]);

    console.log(
        [
            `\x1b[33m gameId: ${gameState.gameId}\n`,
            '                    x\n',
            squares.map(line => '|' + line.join('|') + '|').join('\n'),
            '\x1b[0m'
        ].join('')
    );
}
