import { name, version, author, repository } from '../../package.json';
import { BOARD_SIDE_SIZE, CHESS_API } from './constants';

export function getPackageInfo() {
    const parsedPackageInfo = {
        name,
        version,
        repository: repository.url,
        author
    };
    return parsedPackageInfo;
}

export async function sendRequest(
    parameters,
    method = 'get',
    endpoint = 'game'
) {
    const serializedParameters = parameters
        .map(parameter => `${parameter.name}=${parameter.value}`)
        .join('&');
    try {
        const url = `${CHESS_API}/${endpoint}`;
        const response = await fetch(`${url}?${serializedParameters}`, {
            method
        });

        if (response) {
            const { status } = response;
            switch (endpoint) {
                default: {
                    console.error(`Unhandled endpoint: ${url}`);
                    return;
                }
                case 'game': {
                    switch (method) {
                        default: {
                            console.error(`Unhandled method: ${method} ${url}`);
                            return;
                        }
                        case 'get': {
                            switch (status) {
                                default: {
                                    console.warn(
                                        `API responded with status code ${status}.`
                                    );
                                    return;
                                }
                                case 200: {
                                    const data = await response.json();
                                    const parsedData = JSON.parse(data.text);
                                    const gameData = parsedData;
                                    return { gameData, oid: data.oid };
                                }
                            }
                        }
                        case 'post': {
                            switch (status) {
                                default: {
                                    console.warn(
                                        `API responded with status code ${status}.`
                                    );
                                    return;
                                }
                                case 200: {
                                    const data = await response.json();
                                    return { oid: data.oid };
                                }
                            }
                        }
                    }
                }
            }
        }

        return;
    } catch (error) {
        console.error({ error });
        return;
    }
}

export function supportsWebWorkers() {
    return typeof Worker !== 'undefined';
}

export function pieceToFen(piece) {
    let letter = '';
    switch (piece.type) {
        default: {
            letter = piece.type.substring(0, 1);
            break;
        }
        case 'knight': {
            letter = 'n';
            break;
        }
    }

    switch (piece.player) {
        default: {
            return letter;
        }
        case 0: {
            return letter.toUpperCase();
        }
    }
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

    return [
        `\x1b[33mgameId: ${gameState.gameId}\n`,
        '                    x\n',
        squares.map(line => '|' + line.join('|') + '|').join('\n'),
        '\x1b[0m'
    ].join('');
}
