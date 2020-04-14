import { name, version, author, repository } from '../../package.json';
import token from '../token';
import {
    DEBUG,
    DATA_REPOSITORY,
    BOARD_SIDE_SIZE,
    GITHUB_REST_API
} from './constants';
// import DEBUG_TOKEN from '../token.ignore.js';

export function supportsWebWorkers() {
    return typeof Worker !== 'undefined';
}

export function getPackageInfo() {
    const parsedPackageInfo = {
        name,
        version,
        repository: repository.url,
        author
    };
    return parsedPackageInfo;
}

export async function saveGameRemotely(gameData) {
    const response = await fetch(
        `${GITHUB_REST_API}/repos/${DATA_REPOSITORY.owner}/${DATA_REPOSITORY.name}/contents/${gameData.id}.json`,
        {
            method: 'PUT',
            headers: {
                authorization: `Bearer ${
                    DEBUG && typeof DEBUG_TOKEN !== 'undefined'
                        ? DEBUG_TOKEN
                        : token
                }`
            }
        }
    );
    const data = response.json();
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

    return [
        `\x1b[33mgameId: ${gameState.gameId}\n`,
        '                    x\n',
        squares.map(line => '|' + line.join('|') + '|').join('\n'),
        '\x1b[0m'
    ].join('');
}
