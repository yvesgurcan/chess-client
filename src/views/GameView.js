import React, { Component } from 'react';
import styled from 'styled-components';
import {
    ONE_SECOND,
    STOCKFISH_EVENT_MOVE,
    WEBSOCKET_EVENT_JOIN,
    WEBSOCKET_EVENT_DISCONNECTED,
    WEBSOCKET_EVENT_SELECT,
    WEBSOCKET_EVENT_SET_OPTION,
    WEBSOCKET_EVENT_SET_ARTIFICIAL_INTELLIGENCE_OPTION
} from '../lib/constants';
import GameState from '../models/GameState';
import GameSocket from '../models/GameSocket';
import GameStats from '../components/GameStats';
import Board from '../components/Board';
import Graveyard from '../components/Graveyard';
import Log from '../components/Log';

import { getPackageInfo, sendRequest } from '../lib/util';

export default class GameView extends Component {
    constructor(props) {
        super(props);

        let entrypoint = 'UNKNOWN';

        if (props.gameData) {
            entrypoint = 'LOCAL';
        } else if (!props.gameId || props.gameId === 'new') {
            entrypoint = 'NEW';
        } else {
            entrypoint = 'REMOTE';
        }

        const gameState = new GameState({
            artificialIntelligenceViewEventHandler: this
                .saveGameOnArtificialIntelligenceMove,
            firstPlayerId: props.userId
        });

        switch (entrypoint) {
            default: {
                console.error(`Unhandled entrypoint: ${entrypoint}`);
                break;
            }
            case 'NEW': {
                this.props.history.replace({
                    pathname: `/game/${gameState.gameId}`
                });
                gameState.newGame();
                break;
            }
            case 'LOCAL': {
                gameState.import(props.gameData);
                gameState.resume();
                this.props.history.replace(`/game/${gameState.gameId}`);
                break;
            }
            case 'REMOTE': {
                this.loadGame();
                break;
            }
        }

        const gameSocket = new GameSocket();
        gameSocket.init({ eventHandler: this.handleWebSocketMessage });
        gameSocket.gameId = props.gameId;
        gameSocket.playerId = props.userId;

        this.state = {
            gameState,
            gameSocket,
            settingsOpened: false,
            aiSettingsOpened: false,
            offlineMode: false,
            spectators: []
        };

        window.gameState = gameState;
        const { name, version, repository, author } = getPackageInfo();
        console.log(`${name} v${version} by ${author}`);
        console.log(`repository: ${repository}`);
        console.log(`game entrypoint: ${entrypoint}`);
    }

    componentDidMount() {
        let finalUpdate = false;
        setInterval(() => {
            if (!this.state.gameState.gameEndedAt) {
                const { gameState } = this.state;
                gameState.updateTimePlayed();
                this.updateGameState(gameState);
            } else if (!finalUpdate) {
                finalUpdate = true;
                this.updateGameState(gameState);
            }
        }, ONE_SECOND);
    }

    loadGame = async () => {
        if (this.props.gameId) {
            const result = await sendRequest([
                { name: 'fileId', value: this.props.gameId }
            ]);
            if (result && result.gameData) {
                const { gameState } = this.state;
                gameState.import(result.gameData);
                gameState.resume();
                this.setState({ gameState, oid: result.oid });
            } else {
                console.error('Game not found. New game created instead.');

                const { gameState, gameSocket } = this.state;
                gameState.newGame({ gameId: this.props.gameId });
                gameSocket.gameId = this.props.gameId;
                gameSocket.playerId = this.props.userId;
                this.updateGameState(gameState);
                this.props.history.replace({
                    pathname: `/game/${gameState.gameId}`,
                    newGame: true
                });
            }
        }
    };

    saveGame = async () => {
        const result = await sendRequest(
            [
                { name: 'fileId', value: this.state.gameState.gameId },
                { name: 'content', value: gameState.export() },
                { name: 'oid', value: this.state.oid ? this.state.oid : '' }
            ],
            'post'
        );
        if (result && result.oid) {
            this.setState({ oid: result.oid });
        }
    };

    saveGameOnArtificialIntelligenceMove = payload => {
        if (payload.event === STOCKFISH_EVENT_MOVE) {
            this.saveGame();
            this.handleSelectWithWebsocket(payload.from);
            this.handleSelectWithWebsocket(payload.to);
        }
    };

    updateGameState = gameState => {
        if (!gameState) {
            console.error("Can't update gameState: object is falsy.");
            return;
        }

        this.setState({ gameState });
    };

    handleWebSocketMessage = payload => {
        if (payload.playerId === this.props.userId) {
            return;
        }

        switch (payload.event) {
            default: {
                console.error('Unhandled payload', { payload });
                return;
            }
            case WEBSOCKET_EVENT_JOIN: {
                this.handleJoin(payload);
                return;
            }
            case WEBSOCKET_EVENT_DISCONNECTED: {
                const { gameState } = this.state;
                gameState.removePlayer(payload.playerId);
                this.updateGameState(gameState);
                this.removeSpectator(payload.playerId);

                return;
            }
            case WEBSOCKET_EVENT_SELECT: {
                const { x, y } = payload;
                this.handleSelect({ x, y });
                return;
            }
            case WEBSOCKET_EVENT_SET_OPTION: {
                const { name, value } = payload;
                this.handleSetOption({ name, value });
                return;
            }
            case WEBSOCKET_EVENT_SET_ARTIFICIAL_INTELLIGENCE_OPTION: {
                const { name, value } = payload;
                this.handleSetAIOption({ name, value });
                return;
            }
        }
    };

    handleJoin({ player1, player2, spectators }) {
        const { gameState } = this.state;
        const { players } = gameState;

        let updateGameState = false;
        let updatedPlayers = [...players];

        if (player1 !== players[0].playerId) {
            updatedPlayers[0] = {
                ...players[0],
                playerId: player1
            };
            updateGameState = true;
        }

        if (player2 !== players[1].playerId) {
            updatedPlayers[1] = {
                ...players[1],
                playerId: player2
            };
            updateGameState = true;
        }

        if (spectators !== this.state.spectators) {
            this.setState({ spectators });
        }

        if (updateGameState) {
            gameState.players = [...updatedPlayers];
            this.updateGameState(gameState);
        }
    }

    handleSetOption = payload => {
        const { gameState, spectators } = this.state;
        const { value } = payload;

        const previousPlayerId = gameState.players[value.colorIndex].playerId;

        gameState.setPlayerControl(value.colorIndex, value.playerId);

        this.updateGameState(gameState);

        const updatedPlayers = gameState.players;

        if (spectators.includes(value.playerId)) {
            this.removeSpectator(value.playerId);
        }

        if (
            previousPlayerId &&
            !updatedPlayers
                .map(player => player.playerId)
                .includes(previousPlayerId)
        ) {
            this.addSpectator(previousPlayerId);
        }
    };

    handleSetAIOption = ({ name, value }) => {
        const { gameState } = this.state;
        gameState.setArtificialIntelligenceOption({
            name,
            value
        });
    };

    removeSpectator = spectatorToRemove => {
        const updatedSpectators = [...this.state.spectators].filter(
            spectator => spectator !== spectatorToRemove
        );

        if (updatedSpectators.length !== this.state.spectators.length) {
            this.setState({ spectators: updatedSpectators });
        }
    };

    addSpectator = spectatorToAdd => {
        const updatedSpectators = [...this.state.spectators, spectatorToAdd];
        this.setState({ spectators: updatedSpectators });
    };

    handleSelect = ({ x, y }) => {
        const { gameState } = this.state;
        const { selected } = gameState;
        if (selected) {
            // unselect
            if (selected.x === x && selected.y === y) {
                gameState.unselect();
                // move
            } else if (selected.piece) {
                const moved = gameState.moveSelectedPiece({ x, y });

                // select
                if (!moved) {
                    gameState.select({ x, y });
                } else {
                    this.saveGame();
                }
                // select
            } else {
                gameState.select({ x, y });
            }
        } else {
            // select
            gameState.select({ x, y });
        }

        // debug
        window.gameState = gameState;
        this.updateGameState(gameState);
    };

    handleSelectWithWebsocket = ({ x, y }) => {
        this.handleSelect({ x, y });
        const { gameSocket } = this.state;
        gameSocket.sendMessage({
            event: WEBSOCKET_EVENT_SELECT,
            x,
            y
        });
    };

    handleUpdateOptionWithWebsocket = ({ name, value }) => {
        const { gameSocket } = this.state;
        gameSocket.sendMessage({
            event: WEBSOCKET_EVENT_SET_OPTION,
            name,
            value
        });
    };

    handleUpdateAIOptionWithWebsocket = updatedAIOption => {
        const { gameSocket } = this.state;
        gameSocket.sendMessage({
            event: WEBSOCKET_EVENT_SET_ARTIFICIAL_INTELLIGENCE_OPTION,
            ...updatedAIOption
        });
    };

    render() {
        return (
            <View>
                <GameStats
                    userId={this.props.userId}
                    gameState={this.state.gameState}
                    updateGameState={this.updateGameState}
                    spectators={this.state.spectators}
                    removeSpectator={this.removeSpectator}
                    addSpectator={this.addSpectator}
                    themeIndex={this.props.themeIndex}
                    setThemeIndex={this.props.setThemeIndex}
                    handleUpdateOptionWithWebsocket={
                        this.handleUpdateOptionWithWebsocket
                    }
                    handleUpdateAIOptionWithWebsocket={
                        this.handleUpdateAIOptionWithWebsocket
                    }
                />
                <Wrapper>
                    <Graveyard
                        gameState={this.state.gameState}
                        colorIndex={0}
                    />
                    <Board
                        gameState={this.state.gameState}
                        handleSelectWithWebsocket={
                            this.handleSelectWithWebsocket
                        }
                    />
                    <Graveyard
                        gameState={this.state.gameState}
                        colorIndex={1}
                    />
                    <Log gameState={this.state.gameState} />
                </Wrapper>
            </View>
        );
    }
}

const View = styled.div`
    display: flex;
    justify-content: center;
    flex-direction: column;
    align-items: center;
    min-height: 100vh;
    user-select: none;
    color: ${props => props.theme.color1};
`;

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
`;
