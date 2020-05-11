import { name, version, author, repository } from '../../package.json';
import { CHESS_API } from './constants';
import pieceToFenImport from './pieceToFen';
import visualizeBoardImport from './visualizeBoard';

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
                case 'user': {
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
                                    const userData = parsedData;
                                    return { userData, oid: data.oid };
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

export const pieceToFen = pieceToFenImport;

export const visualizeBoard = visualizeBoardImport;
