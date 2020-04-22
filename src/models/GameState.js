import { v4 as uuid } from 'uuid';
import moment from 'moment';
import momentDurationFormatSetup from 'moment-duration-format';
import { getPackageInfo, supportsWebWorkers, pieceToFen } from '../lib/util';
import artificialIntelligence from '../models/ArtificialIntelligence';
import GameLog from '../models/GameLog';
import Piece from '../models/Piece';
import {
    DEBUG,
    BOARD_SIDE_SIZE,
    PLAYER1,
    PLAYER2,
    HUMAN_PLAYER,
    AI_PLAYER,
    FEN_ACTIVE_COLORS,
    PAWN,
    LEFT_BACK_ROW_PIECES,
    RIGHT_BACK_ROW_PIECES,
    KING,
    QUEEN,
    BISHOP,
    ROOK,
    KNIGHT,
    KNIGHT_MOVE_DIMENSION1,
    KNIGHT_MOVE_DIMENSION2,
    KING_AREA,
    DRAW,
    CHECKMATE,
    QUEENSIDE,
    KINGSIDE,
    ONGOING,
    STOCKFISH_EVENT_INIT,
    STOCKFISH_EVENT_READY,
    STOCKFISH_EVENT_MOVE
} from '../lib/constants';

momentDurationFormatSetup(moment);

/**
 * @class
 * @example const gameState = new GameState();
 */
export default class GameState {
    practice = false;
    constructor({ artificialIntelligenceViewEventHandler, firstPlayerId }) {
        this.gameId = uuid();
        this.gameStatus = ONGOING;
        this.gameStartedAt = moment();
        this.gameEndedAt = null;
        this.lastSessionTimeUpdate = moment();
        this.totalTimePlayed = moment.duration(
            moment().diff(moment()),
            'milliseconds'
        ); // keeps track of time spent across multiple sessions
        this.currentTurn = 0;
        this.pieces = [];
        this.removedPieces = [[], []];

        const webWorkersAreSupported = supportsWebWorkers();

        this.players = [
            {
                playerId: firstPlayerId,
                color: PLAYER1,
                control: HUMAN_PLAYER
            },
            {
                playerId: /*webWorkersAreSupported ? null :*/ null, //uuid(),
                color: PLAYER2,
                control: /*webWorkersAreSupported ? AI_PLAYER :*/ HUMAN_PLAYER
            }
        ];

        this.enPassantTarget = null;
        this.halfmoveClock = 0;
        this.allowNoKing = false;

        this.gameLog = new GameLog();

        this.artificialIntelligenceStatus = {
            initialized: false,
            gameReady: false,
            ready: false
        };

        if (!webWorkersAreSupported) {
            return;
        }

        this.artificialIntelligenceViewEventHandler = artificialIntelligenceViewEventHandler;

        this.artificialIntelligence = artificialIntelligence.init({
            eventHandler: this.handleArtificialIntelligenceEvent
        });
    }

    /**
     * @returns {number} The numeric representation (`0` for white player or `1` for black player) of the current player.
     */
    get currentPlayer() {
        return this.currentTurn % 2 === 0 ? PLAYER1 : PLAYER2;
    }

    /**
     * @returns {object} The object representation of the current player.
     */
    get currentPlayerObject() {
        return this.players[this.currentPlayer];
    }

    get piecesSortedByRank() {
        return this.pieces.sort((pieceA, pieceB) => {
            if (pieceA.y > pieceB.y) {
                return -1;
            }

            if (pieceA.y < pieceB.y) {
                return 1;
            }

            if (pieceA.x > pieceB.x) {
                return 1;
            }

            if (pieceA.x < pieceB.x) {
                return -1;
            }

            return 0;
        });
    }

    /**
     * @returns {string}
     */
    get fenString() {
        const castlingPieces = [];

        const piecesWithFen = this.piecesSortedByRank.map(piece => {
            if ([ROOK, KING].includes(piece.type)) {
                castlingPieces.push(piece);
            }

            return {
                fen: pieceToFen(piece),
                x: piece.x,
                y: piece.y
            };
        });

        const piecesByRank = {};
        piecesWithFen.forEach(piece => {
            if (piecesByRank[piece.y]) {
                piecesByRank[piece.y] = [...piecesByRank[piece.y], piece];
            } else {
                piecesByRank[piece.y] = [piece];
            }
        });

        let fenBoard = [];
        for (let i = 0; i <= BOARD_SIDE_SIZE; i++) {
            const rankPieces = piecesByRank[i];
            if (!rankPieces) {
                fenBoard.push('8');
                continue;
            }

            let rank = '';
            rankPieces.forEach((piece, index) => {
                let prevPiece = rankPieces[index - 1];
                let nextPiece = rankPieces[index + 1];
                let diffBefore = 0;
                let diffAfter = 0;

                if (prevPiece) {
                    diffBefore = piece.x - prevPiece.x - 1;
                } else {
                    diffBefore = piece.x;
                }

                if (!nextPiece) {
                    diffAfter = BOARD_SIDE_SIZE - piece.x;
                }

                rank += (diffBefore || '') + piece.fen + (diffAfter || '');
            });

            fenBoard.push(rank);
        }

        const activeColor = FEN_ACTIVE_COLORS[this.currentPlayer];

        const castlingAvailability = this.fenCastlingAvailability(
            castlingPieces
        );

        let enPassantTargetFen = '-';
        if (this.enPassantTarget) {
            enPassantTargetFen = [
                String.fromCharCode(97 + this.enPassantTarget.x),
                BOARD_SIDE_SIZE + 1 - this.enPassantTarget.y
            ].join('');
        }

        const fullmoveNumber = Math.floor(this.currentTurn / 2) + 1;

        const fenArray = [
            fenBoard.join('/'),
            activeColor,
            castlingAvailability,
            enPassantTargetFen,
            this.halfmoveClock,
            fullmoveNumber
        ];

        return fenArray.join(' ');
    }

    /**
     * @returns {array}
     */
    get log() {
        return this.gameLog.movesAlgebraicNotation;
    }

    /**
     * @returns {array}
     */
    get aiOptions() {
        return this.artificialIntelligence.options;
    }

    setArtificialIntelligenceOption(updatePayload) {
        return this.artificialIntelligence.setOption(updatePayload);
    }

    /**
     * @returns {undefined}
     */
    newGame = ({ gameId } = {}) => {
        if (gameId) {
            this.gameId = gameId;
        }

        let pieces = [];
        [PLAYER1, PLAYER2].forEach(player => {
            [LEFT_BACK_ROW_PIECES, RIGHT_BACK_ROW_PIECES].forEach(
                (side, sideIndex, sides) => {
                    let startingX = 0;
                    if (sides[sideIndex - 1]) {
                        startingX = sides[sideIndex - 1].length * sideIndex;
                    }
                    side.forEach((type, index) => {
                        const piece = new Piece({
                            id: uuid(),
                            x: startingX + index,
                            y: player ? 0 : BOARD_SIDE_SIZE,
                            player,
                            type,
                            firstMove:
                                type === ROOK || type === KING
                                    ? true
                                    : undefined,
                            queenSide: index === 0,
                            kingSide: index !== 0
                        });
                        const pawn = new Piece({
                            id: uuid(),
                            x: startingX + index,
                            y: player ? 1 : BOARD_SIDE_SIZE - 1,
                            player,
                            type: PAWN,
                            firstMove: true,
                            queenSide: index === 0,
                            kingSide: index !== 0
                        });
                        pieces.push(pawn);
                        pieces.push(piece);
                    });
                }
            );
        });

        this.pieces = pieces;

        if (!supportsWebWorkers()) {
            return;
        }

        this.artificialIntelligence.startGame();
    };

    /**
     * @returns {string} The current game state as stringified JSON.
     */
    export = () => {
        const { version: gameVersion } = getPackageInfo();
        return JSON.stringify(
            {
                gameVersion,
                gameId: this.gameId,
                gameSavedAt: moment(),
                gameStartedAt: this.gameStartedAt,
                gameEndedAt: this.gameEndedAt,
                totalTimePlayed: this.totalTimePlayed,
                players: this.players,
                currentTurn: this.currentTurn,
                pieces: this.pieces,
                removedPieces: this.removedPieces,
                enPassantTarget: this.enPassantTarget,
                moves: this.moves // should be done on game log instead
            },
            null,
            '\t'
        );
    };

    /**
     * @param {string} unparsedGameData
     * @param {object} options
     * @returns {undefined}
     */
    import = (
        unparsedGameData,
        {
            resumeGame = false,
            allowNoKing = false,
            noConsoleOutput = false
        } = {}
    ) => {
        let gameData = null;

        try {
            gameData = JSON.parse(unparsedGameData);
        } catch (error) {
            gameData = unparsedGameData;
        }

        if (!gameData) {
            console.warn('Import data is empty.');
            return;
        }

        // TODO: Check if there is at least one king.
        // TODO: Check if pieces overlap. Throw an error if they do.
        // TODO: Check if pieces are within the board.

        this.gameVersion = gameData.gameVersion;
        this.gameId = gameData.gameId;
        this.gameStatus = gameData.gameStatus;
        this.gameStartedAt = moment(gameData.gameStartedAt);
        this.gameEndedAt = gameData.gameEndedAt
            ? moment(gameData.gameEndedAt)
            : null;
        this.lastSessionTimeUpdate = null;
        this.totalTimePlayed = moment.duration(
            gameData.totalTimePlayed,
            'milliseconds'
        );
        this.currentTurn = gameData.currentTurn;
        this.pieces = gameData.pieces.map(piece => new Piece(piece));
        this.removedPieces = gameData.removedPieces;
        this.moves = gameData.moves && gameData.moves; // should be done on game log instead
        this.players = gameData.players;
        this.enPassantTarget = gameData.enPassantTarget;
        this.allowNoKing = allowNoKing;

        if (!noConsoleOutput) {
            console.log(
                `Loading game '${this.gameId}' (game version: ${
                    this.gameVersion
                }). Turn: ${
                    this.currentTurn
                }. Time played: ${this.totalTimePlayed.format('hh:mm:ss', {
                    trim: false
                })}. Last saved on ${gameData.gameSavedAt}.`
            );
        }

        if (resumeGame) {
            this.resume();
        } else {
            this.startArtificialIntelligenceTurn();
        }

        // this is an additional check that is only meaningful if the imported file has been manipulated
        const gameEnd = this.isGameEnd({
            player: this.currentPlayer === PLAYER1 ? PLAYER2 : PLAYER1
        });
        if (gameEnd) {
            this.gameStatus = gameEnd;
            this.gameEndedAt = moment();
        }
    };

    /**
     * @returns {undefined}
     */
    updateTimePlayed = () => {
        if (this.gameEndedAt || !this.lastSessionTimeUpdate) {
            return;
        }

        const timePlayedSinceLastUpdate = moment.duration(
            moment().diff(this.lastSessionTimeUpdate),
            'milliseconds'
        );

        this.lastSessionTimeUpdate = moment();

        this.totalTimePlayed = this.totalTimePlayed.add(
            timePlayedSinceLastUpdate
        );
    };

    /**
     * @returns {undefined}
     */
    pause = () => {
        this.lastSessionTimeUpdate = null;
    };

    /**
     * @returns {undefined}
     */
    resume = () => {
        this.lastSessionTimeUpdate = moment();
        this.startArtificialIntelligenceTurn();
    };

    setPlayerControl(playerColor, playerId) {
        if (playerId !== AI_PLAYER) {
            this.players[playerColor].control = HUMAN_PLAYER;
            this.players[playerColor].playerId = playerId;
            return;
        }

        this.players[playerColor].control = AI_PLAYER;
        this.players[playerColor].playerId = null;
    }

    removePlayer(playerId) {
        const updatedPlayers = this.players.map(player => {
            if (player.playerId !== playerId) {
                return { ...player };
            }

            return {
                ...player,
                playerId: null,
                control: HUMAN_PLAYER
            };
        });

        this.players = [...updatedPlayers];
    }

    /**
     * @returns {undefined}
     */
    nextTurn = () => {
        if (DEBUG && this.practice) {
            this.currentTurn += 2;
        } else {
            this.currentTurn += 1;
        }

        setTimeout(() => {
            this.unselect();
        }, 500);
        this.startArtificialIntelligenceTurn();
    };

    /**
     * @returns {undefined}
     */
    recordMove = move => {
        const newMove = {
            ...move,
            player: this.currentPlayer
        };
        this.gameLog.addEntry(newMove);
    };

    /**
     * @returns {Piece|undefined}
     */
    getFirstPiece = ({ type, player }) => {
        return this.pieces.find(
            piece => piece.type === type && piece.player === player
        );
    };

    /**
     * @example const piece = getPieceAt({ x: 2, y: 1 });
     * @returns {Piece|undefined} The piece at the coordinates.
     */
    getPieceAt = ({ x, y }) => {
        return this.pieces.find(piece => piece.x === x && piece.y === y);
    };

    /**
     * @example const isPiece = hasPieceAt({ x: 4, y: 5 });
     * @returns {boolean} `true` if there is a piece at the coordinates; otherwise, `false`.
     */
    hasPieceAt = ({ x, y }) => {
        return this.pieces.some(piece => piece.x === x && piece.y === y);
    };

    /**
     * @example
     * removePiece({
     *      id: '297a7c98-da21-4309-8751-9e187f51259b',
     *      type: 'pawn',
     *      x: 1,
     *      y: 3,
     *      player: 0
     * });
     * @returns {undefined}
     */
    removePiece = pieceToRemove => {
        const pieces = [];
        this.pieces.forEach(piece => {
            if (piece.id !== pieceToRemove.id) {
                pieces.push(piece);
            }
        });

        this.pieces = pieces;

        const playerPieceRemoved = this.removedPieces[pieceToRemove.player];
        const updatedPlayerPieceRemoved = [
            ...playerPieceRemoved,
            pieceToRemove
        ];

        const oppositePlayerPieceRemoved = this.removedPieces[
            Number(!pieceToRemove.player)
        ];

        if (pieceToRemove.player === 0) {
            this.removedPieces = [
                updatedPlayerPieceRemoved,
                oppositePlayerPieceRemoved
            ];
        } else {
            this.removedPieces = [
                oppositePlayerPieceRemoved,
                updatedPlayerPieceRemoved
            ];
        }
    };

    /**
     * @returns {boolean}
     */
    select = ({ x, y }) => {
        let pieceSelected = false;
        if (this.gameEndedAt || !this.lastSessionTimeUpdate) {
            return pieceSelected;
        }

        const piece = this.getPieceAt({ x, y });
        if (piece) {
            const { x: discardX, y: discardY, ...pieceProperties } = piece;
            this.selected = { x, y, piece: pieceProperties };
            pieceSelected = true;
        } else {
            this.selected = { x, y };
        }

        return pieceSelected;
    };

    /**
     * @returns {undefined}
     */
    unselect = () => {
        this.selected = null;
    };

    /**
     * @returns {boolean} `true` if the coordinates correspond to a selected tile; otherwise, `false`.
     */
    isSelectedSquare = ({ x, y }) => {
        if (!this.selected) {
            return false;
        }

        return this.selected.x === x && this.selected.y === y;
    };

    /**
     * @returns {boolean}
     */
    isPawnCapturing = ({ x, y, vectorX, vectorY, direction }) => {
        if (vectorY === direction && (vectorX === 1 || vectorX === -1)) {
            return this.hasPieceAt({ x, y });
        }

        return false;
    };

    /**
     * @returns {boolean}
     */
    isPawnMoving = ({ x, y, vectorX, vectorY, firstMove, direction }) => {
        const hasPiece = this.hasPieceAt({ x, y });
        if (hasPiece) {
            return false;
        }

        if (direction === 1) {
            return vectorY > 0 && vectorY <= 1 + firstMove && vectorX === 0;
        } else {
            return vectorY < 0 && vectorY >= -1 - firstMove && vectorX === 0;
        }
    };

    /**
     * @returns {boolean}
     */
    isEnPassant = ({ x, y, vectorX, vectorY, direction }) => {
        if (this.enPassantTarget) {
            if (vectorY === direction && (vectorX === 1 || vectorX === -1)) {
                let pawnToCaptureY = y - direction;
                const enPassant = this.hasPieceAt({ x, y: pawnToCaptureY });
                // TODO: Add logic to capture other piece
                console.warn({ enPassant });
                return enPassant;
            }
        }

        return false;
    };

    /**
     * @returns {boolean}
     */
    isBishopPattern = ({ vectorX, vectorY }) => {
        return Math.abs(vectorX) === Math.abs(vectorY);
    };

    /**
     * @returns {boolean}
     */
    isBishopMoveFree = ({ origin, destination, vector }) => {
        const pieceIsInTheWay = this.pieces.some(piece => {
            if (piece.id === origin.id) {
                return false;
            }

            const delta = {
                x: piece.x - origin.x,
                y: piece.y - origin.y
            };

            // piece is diagonal to the bishop
            if (Math.abs(delta.x) === Math.abs(delta.y)) {
                let xObstructed = false;
                let yObstructed = false;
                if (vector.x > 0) {
                    xObstructed = piece.x < destination.x && piece.x > origin.x;
                } else {
                    xObstructed = piece.x > destination.x && piece.x < origin.x;
                }

                if (vector.y > 0) {
                    yObstructed = piece.y < destination.y && piece.y > origin.y;
                } else {
                    yObstructed = piece.y > destination.y && piece.y < origin.y;
                }

                // piece is within the area that the bishop is crossing
                return xObstructed && yObstructed;
            }

            return false;
        });

        return !pieceIsInTheWay;
    };

    /**
     * @returns {boolean}
     */
    isRookPattern = ({ vectorX, vectorY }) => {
        return (
            (vectorX === 0 && vectorY !== 0) || (vectorX !== 0 && vectorY === 0)
        );
    };

    /**
     * @returns {boolean}
     */
    isRookMoveFree = ({ origin, vector }) => {
        const axis = vector.x ? 'y' : 'x';
        const otherAxis = vector.x ? 'x' : 'y';
        const lineToCheck = origin[axis];
        const target = origin[otherAxis] + vector[otherAxis];
        const pieceIsInTheWay = this.pieces.some(piece => {
            if (piece[axis] !== lineToCheck || piece.id === origin.id) {
                return false;
            }

            if (vector[otherAxis] > 0) {
                if (
                    piece[otherAxis] > origin[otherAxis] &&
                    piece[otherAxis] < target
                ) {
                    return true;
                }
            }

            if (vector[otherAxis] < 0) {
                if (
                    piece[otherAxis] < origin[otherAxis] &&
                    piece[otherAxis] > target
                ) {
                    return true;
                }
            }

            return false;
        });

        return !pieceIsInTheWay;
    };

    /**
     * @returns {boolean}
     */
    isKingPattern = ({ vectorX, vectorY }) => {
        return vectorX >= -1 && vectorX <= 1 && vectorY >= -1 && vectorY <= 1;
    };

    /**
     * @returns {boolean}
     */
    isCastlePattern = ({ vectorX, vectorY }) => {
        return Math.abs(vectorX) === 2 && vectorY === 0;
    };

    /**
     * @returns {boolean}
     */
    performCastle = ({ castleVectorX, selectedPiece, destination, from }) => {
        const playerY = this.currentPlayer === PLAYER1 ? 7 : 0;
        const rookX = castleVectorX > 0 ? 7 : 0;
        const rookVectorX = castleVectorX > 0 ? -1 : 1;

        // find chosen rook
        const targetRook = this.pieces.find(piece => {
            return (
                piece.type === ROOK &&
                piece.player === selectedPiece.player &&
                piece.firstMove &&
                piece.x === rookX
            );
        });

        // there's no rook to castle with
        if (!targetRook) {
            return false;
        }

        let betweenX;

        if (castleVectorX > 0) {
            betweenX = [5, 6];
        } else {
            betweenX = [1, 2, 3];
        }

        const isBlocked = betweenX
            .map(deltaX => {
                return (
                    this.hasPieceAt({ x: deltaX, y: playerY }) ||
                    this.isKingInCheck({ x: deltaX, y: playerY })
                );
            })
            .some(blocking => blocking);

        // there are pieces between the king and the rook
        if (isBlocked) {
            return false;
        }

        // update pieces positions
        this.pieces = this.pieces.map(piece => {
            if (piece.id === selectedPiece.id) {
                return new Piece({
                    ...selectedPiece,
                    x: destination.x,
                    y: destination.y,
                    firstMove: false
                });
            } else if (piece.id === targetRook.id) {
                return new Piece({
                    ...targetRook,
                    x: destination.x + rookVectorX,
                    firstMove: false
                });
            }

            return piece;
        });

        // const castling = rookVectorX > 0 ? QUEENSIDE : KINGSIDE;
        this.recordMove({
            piece: {
                id: selectedPiece.id,
                type: selectedPiece.type
            },
            from,
            to: destination
        });
        this.nextTurn();

        return true;
    };

    /**
     * @returns {boolean} Whether the pattern corresponds to the piece
     */
    isPiecePattern = ({
        destination: { x, y },
        origin,
        type,
        player,
        firstMove
    }) => {
        const vectorX = x - origin.x;
        const vectorY = y - origin.y;

        switch (type) {
            default: {
                break;
            }
            case KING: {
                return this.isKingPattern({ vectorX, vectorY });
            }
            case QUEEN: {
                return (
                    (this.isBishopPattern({ vectorX, vectorY }) &&
                        this.isBishopMoveFree({
                            origin,
                            destination: { x, y },
                            vector: { x: vectorX, y: vectorY }
                        })) ||
                    (this.isRookPattern({ vectorX, vectorY }) &&
                        this.isRookMoveFree({
                            origin,
                            vector: { x: vectorX, y: vectorY }
                        }))
                );
            }
            case ROOK: {
                return (
                    this.isRookPattern({ vectorX, vectorY }) &&
                    this.isRookMoveFree({
                        origin,
                        vector: { x: vectorX, y: vectorY }
                    })
                );
            }
            case KNIGHT: {
                if (
                    (Math.abs(vectorX) === KNIGHT_MOVE_DIMENSION1 &&
                        Math.abs(vectorY) === KNIGHT_MOVE_DIMENSION2) ||
                    (Math.abs(vectorX) === KNIGHT_MOVE_DIMENSION2 &&
                        Math.abs(vectorY) === KNIGHT_MOVE_DIMENSION1)
                ) {
                    return true;
                }
                break;
            }
            case BISHOP: {
                return (
                    this.isBishopPattern({ vectorX, vectorY }) &&
                    this.isBishopMoveFree({
                        origin,
                        destination: { x, y },
                        vector: { x: vectorX, y: vectorY }
                    })
                );
            }
            case PAWN: {
                const direction = player === PLAYER1 ? -1 : 1;
                return (
                    this.isPawnMoving({
                        x,
                        y,
                        vectorX,
                        vectorY,
                        firstMove,
                        direction
                    }) ||
                    this.isPawnCapturing({
                        x,
                        y,
                        vectorX,
                        vectorY,
                        direction
                    }) ||
                    this.isEnPassant({
                        x,
                        y,
                        vectorX,
                        vectorY,
                        direction
                    })
                );
            }
        }

        return false;
    };

    /**
     * @returns {boolean}
     */
    isKingInCheck = kingProjection => {
        if (this.allowNoKing) {
            return false;
        }

        let kingActual = null;
        const opponentPieces = this.pieces.filter(piece => {
            if (piece.type === KING && piece.player === this.currentPlayer) {
                kingActual = { ...piece };
            }

            return piece.player !== this.currentPlayer;
        });

        const king = kingProjection || kingActual;

        if (!king) {
            console.error('King not found?!');
            return false;
        }

        const isInCheckByAnOpponentPiece = opponentPieces.some(piece => {
            // TODO: allow king to capture the piece when adjacent to it
            const pieceCanReachKing = this.isPiecePattern({
                destination: { x: king.x, y: king.y },
                origin: { x: piece.x, y: piece.y, id: piece.id },
                type: piece.type,
                player: piece.player,
                firstMove: false
            });

            return pieceCanReachKing;
        });

        return isInCheckByAnOpponentPiece;
    };

    /**
     * @returns {boolean | string}
     */
    isGameEnd = ({ player = this.currentPlayer }) => {
        if (this.allowNoKing) {
            return false;
        }

        let opponentKing = null;
        let opponentPieces = [];
        const pieces = this.pieces.filter(piece => {
            if (piece.type === KING && piece.player !== player) {
                opponentKing = { ...piece };
            }

            if (piece.player === player) {
                return true;
            }

            opponentPieces.push(piece);
            return false;
        });

        if (!opponentKing) {
            console.error('Opponent king not found?!');
            return false;
        }

        let maxAvailableArea = KING_AREA;
        let currentPositionFree = true;

        // check how many of the possible king moves will end up with the king being in check, including its current position
        let isInCheck = [];
        for (let x = -1; x <= 1; x++) {
            for (let y = -1; y <= 1; y++) {
                const destination = {
                    x: opponentKing.x + x,
                    y: opponentKing.y + y
                };

                // don't check for off-board coordinates
                if (
                    destination.x < 0 ||
                    destination.y < 0 ||
                    destination.x > BOARD_SIDE_SIZE ||
                    destination.y > BOARD_SIDE_SIZE
                ) {
                    maxAvailableArea--;
                    continue;
                }

                const destinationInCheck = pieces.some(piece => {
                    const fitsPiecePattern = this.isPiecePattern({
                        destination,
                        origin: { x: piece.x, y: piece.y, id: piece.id },
                        type: piece.type,
                        player: piece.player,
                        firstMove: false
                    });
                    return fitsPiecePattern;
                });

                // king can't move there because their own piece is blocking the way
                // TODO: Check if that piece can be moved (in that case, then the king is not checkmate)
                /*
                const occupied = opponentPieces.some(piece => {
                    console.log(
                        piece.type,
                        piece.player,
                        piece.x === destination.x && piece.y === destination.y
                    );
                    return (
                        piece.type !== KING &&
                        piece.x === destination.x &&
                        piece.y === destination.y
                    );
                });
                */

                isInCheck.push(destinationInCheck /*|| occupied*/);

                // used to determine if it's a draw
                if (x === 0 && y === 0) {
                    currentPositionFree = !destinationInCheck;
                }
            }
        }

        const illegalMoves = isInCheck.reduce(
            (sum, value) => sum + Number(value)
        );

        // TODO: Check if moving one of the pieces of the opponent might get the king out of checkmate/draw

        // console.log({ maxAvailableArea, illegalMoves });

        if (illegalMoves === maxAvailableArea) {
            return CHECKMATE;
        }

        if (currentPositionFree && illegalMoves === maxAvailableArea - 1) {
            return DRAW;
        }

        return false;
    };

    /**
     * @returns {boolean}
     */
    isLegalMove = ({ destination, origin, type, player, firstMove }) => {
        const fitsPiecePattern = this.isPiecePattern({
            destination,
            origin,
            type,
            player,
            firstMove
        });
        return fitsPiecePattern;
    };

    /**
     * @returns {boolean}
     */
    moveSelectedPiece = ({ x, y }) => {
        let moved = false;

        if (this.gameEndedAt || !this.lastSessionTimeUpdate) {
            return moved;
        }

        let pieceToRemove = null;
        let castleVectorX = null;

        if (!this.selected) {
            return moved;
        }

        const {
            x: selectedX,
            y: selectedY,
            piece: selectedPiece
        } = this.selected;

        if (!selectedPiece) {
            this.select({ x, y });
            return moved;
        }

        const originalPieces = [].concat(this.pieces);
        const originalRemovedPieces = [].concat(this.removedPieces);

        this.pieces = this.pieces.map(piece => {
            if (
                piece.x === selectedX &&
                piece.y === selectedY &&
                piece.id === selectedPiece.id
            ) {
                if (
                    this.isLegalMove({
                        origin: { x: piece.x, y: piece.y, id: piece.id },
                        destination: { x, y },
                        type: selectedPiece.type,
                        player: selectedPiece.player,
                        firstMove: selectedPiece.firstMove
                    })
                ) {
                    const targetPiece = this.getPieceAt({
                        x,
                        y
                    });

                    if (targetPiece) {
                        // capture opponent piece
                        if (
                            selectedPiece.player === this.currentPlayer &&
                            targetPiece.player !== selectedPiece.player
                        ) {
                            pieceToRemove = targetPiece;
                        } else {
                            return piece;
                        }
                    } else if (selectedPiece.player !== this.currentPlayer) {
                        return piece;
                    }

                    moved = true;

                    this.select({
                        x,
                        y,
                        piece: { ...piece, firstMove: false }
                    });

                    if (piece.type === PAWN && piece.firstMove) {
                        const delta = Math.abs(piece.y - y);
                        if (delta === 2) {
                            const yTarget =
                                this.currentPlayer === PLAYER1 ? y + 1 : y - 1;
                            this.enPassantTarget = {
                                x,
                                y: yTarget
                            };
                        }
                    } else if (this.enPassantTarget) {
                        this.enPassantTarget = null;
                    }

                    if (piece.type === PAWN) {
                        this.halfmoveClock = 0;
                    } else {
                        this.halfmoveClock += 1;
                    }

                    return new Piece({ ...piece, x, y, firstMove: false });
                } else {
                    // castling check
                    if (piece.canCastlePrerequisites) {
                        const vectorX = x - piece.x;
                        const vectorY = y - piece.y;
                        if (this.isCastlePattern({ vectorX, vectorY })) {
                            castleVectorX = vectorX;
                        }
                    }

                    // select empty tile
                    this.select({ x, y });
                    return piece;
                }
            }

            return piece;
        });

        if (pieceToRemove) {
            this.halfmoveClock = 0;
            this.removePiece(pieceToRemove);
        }

        const kingInCheck = this.isKingInCheck();
        if (kingInCheck) {
            this.pieces = originalPieces;
            this.removedPieces = originalRemovedPieces;
            moved = false;

            return moved;
        }

        const gameEnd = this.isGameEnd({});
        if (gameEnd) {
            this.gameStatus = gameEnd;
            this.recordMove({
                piece: {
                    id: selectedPiece.id,
                    type: selectedPiece.type
                },
                from: { x: selectedX, y: selectedY },
                to: { x, y },
                endGame: gameEnd
            });
            if (gameEnd === DRAW) {
                this.nextTurn();
            }

            this.gameEndedAt = moment();
            return moved;
        }

        // perform castling
        if (castleVectorX) {
            return this.performCastle({
                castleVectorX,
                selectedPiece,
                destination: { x, y },
                from: { x: selectedX, y: selectedY }
            });
        }

        if (moved) {
            this.recordMove({
                piece: {
                    id: selectedPiece.id,
                    type: selectedPiece.type
                },
                from: { x: selectedX, y: selectedY },
                to: { x, y }
            });
            this.nextTurn();
        }

        return moved;
    };

    startArtificialIntelligenceTurn = () => {
        if (!supportsWebWorkers()) {
            return;
        }

        if (this.currentPlayerObject.control === AI_PLAYER) {
            const {
                initialized,
                gameReady
            } = this.artificialIntelligenceStatus;
            if (initialized && gameReady) {
                this.artificialIntelligenceStatus.computingNextMove = true;
                // give some time for humans to see what is going on in the case of two AIs playing against each other
                setTimeout(() => {
                    this.artificialIntelligence.computeNextMove(
                        this.gameLog.pureAlgebraicNotation,
                        this.fenString
                    );
                }, 1000);
            } else {
                console.error('AI is not ready.');
            }
        }
    };

    handleArtificialIntelligenceEvent = payload => {
        const {
            initialized,
            gameReady,
            ready
        } = this.artificialIntelligenceStatus;
        switch (payload.event) {
            default: {
                break;
            }
            case STOCKFISH_EVENT_INIT: {
                this.artificialIntelligenceStatus.initialized = true;
                break;
            }
            case STOCKFISH_EVENT_READY: {
                // first ready
                if (initialized && !gameReady) {
                    this.artificialIntelligenceStatus.gameReady = true;
                    this.startArtificialIntelligenceTurn();
                } else if (gameReady) {
                    this.startArtificialIntelligenceTurn();
                }
                break;
            }
            case STOCKFISH_EVENT_MOVE: {
                if (this.currentPlayerObject.control === AI_PLAYER) {
                    console.log('move');
                    this.artificialIntelligenceStatus.computingNextMove = false;
                    const parsedMove = this.gameLog.parsePureAlgebraicNotationToMove(
                        payload.move
                    );
                    const { from, to } = parsedMove;
                    this.select({ x: from.x, y: from.y });
                    this.moveSelectedPiece({ x: to.x, y: to.y });

                    if (this.artificialIntelligenceViewEventHandler) {
                        this.artificialIntelligenceViewEventHandler(payload);
                    }
                }
                break;
            }
        }
    };

    fenCastlingAvailability = pieces => {
        let piecesByPlayer = [];
        pieces.forEach(piece => {
            if (piecesByPlayer[piece.player]) {
                piecesByPlayer[piece.player] = [
                    ...piecesByPlayer[piece.player],
                    piece
                ];
            } else {
                piecesByPlayer[piece.player] = [piece];
            }
        });

        const castlingAvailabilityPerPlayer = piecesByPlayer.map(
            playerPieces => {
                let kingSide = pieceToFen({
                    type: 'king',
                    player: playerPieces[0].player
                });
                let queenSide = pieceToFen({
                    type: 'queen',
                    player: playerPieces[0].player
                });
                let hasKing = false;
                let hasQueenRook = false;
                let hasKingRook = false;
                for (let i = 0; i < playerPieces.length; i++) {
                    const piece = playerPieces[i];

                    if (piece.type === KING) {
                        hasKing = true;
                        if (!piece.firstMove) {
                            kingSide = '';
                            queenSide = '';
                            break;
                        }
                    }

                    if (piece.type === ROOK) {
                        if (piece.queenSide) {
                            hasQueenRook = true;
                            if (!piece.firstMove) {
                                queenSide = '';
                            }
                        }

                        if (piece.kingSide) {
                            hasKingRook = true;
                            if (!piece.firstMove) {
                                kingSide = '';
                            }
                        }
                    }
                }

                if (!hasKing) {
                    return '';
                }

                return `${hasKingRook ? kingSide : ''}${
                    hasQueenRook ? queenSide : ''
                }`;
            }
        );

        return castlingAvailabilityPerPlayer.join('') || '-';
    };
}
