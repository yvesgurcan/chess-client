const pieceToFen = require('./pieceToFen');

const BOARD_SIDE_SIZE = 7;

// A CommonJS module so that it can be executed from an NPM script
module.exports = (gameState, outputToConsole = false) => {
    if (!gameState) {
        return console.error('No game state');
    }

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
            const piece = gameState.pieces.find(
                piece => piece.x === x && piece.y === y
            );
            let pieceId = '   ';
            if (piece) {
                pieceId = pieceToFen(piece);
                const playerColor =
                    piece.player === 0 ? '\x1b[37m' : '\x1b[35m';
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

    const visualizationData = [
        `\x1b[33mgameId: ${gameState.gameId}\n`,
        '                    x\n',
        squares.map(line => '|' + line.join('|') + '|').join('\n'),
        '\x1b[0m'
    ].join('');

    if (outputToConsole) {
        console.log(visualizationData);
    }

    return visualizationData;
};
