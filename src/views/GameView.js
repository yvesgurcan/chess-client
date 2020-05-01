import React, { Component } from 'react';
import styled from 'styled-components';
import moment from 'moment';
import GameState from '../models/GameState';
import GameSocket from '../models/GameSocket';
import icons from '../components/icons';
import Slider from '../components/Slider';
import Checkbox from '../components/Checkbox';
import Dropdown from '../components/Dropdown';
import Button from '../components/Button';
import {
    YOU,
    HUMAN_PLAYER,
    AI_PLAYER,
    BOARD_SIDE_SIZE,
    ONE_SECOND,
    PLAYER_COLORS,
    STOCKFISH_EVENT_MOVE,
    WEBSOCKET_EVENT_JOIN,
    WEBSOCKET_EVENT_DISCONNECTED,
    WEBSOCKET_EVENT_SELECT,
    WEBSOCKET_EVENT_SET_OPTION,
    WEBSOCKET_EVENT_SET_ARTIFICIAL_INTELLIGENCE_OPTION
} from '../lib/constants';
import { getPackageInfo, sendRequest } from '../lib/util';
import themes from '../themes';

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

        let gameState = null;
        if (entrypoint === 'NEW') {
            gameState = new GameState({
                artificialIntelligenceViewEventHandler: this
                    .saveGameOnArtificialIntelligenceMove,
                firstPlayerId: props.userId
            });
        } else {
            gameState = new GameState({
                artificialIntelligenceViewEventHandler: this
                    .saveGameOnArtificialIntelligenceMove
            });
        }

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

    sendWebSocketAIOptionUpdate = updatedAIOption => {
        const { gameSocket } = this.state;
        gameSocket.sendMessage({
            event: WEBSOCKET_EVENT_SET_ARTIFICIAL_INTELLIGENCE_OPTION,
            ...updatedAIOption
        });
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

    removeSpectator(spectatorToRemove) {
        const updatedSpectators = [...this.state.spectators].filter(
            spectator => spectator !== spectatorToRemove
        );

        if (updatedSpectators.length !== this.state.spectators.length) {
            this.setState({ spectators: updatedSpectators });
        }
    }

    addSpectator(spectatorToAdd) {
        const updatedSpectators = [...this.state.spectators, spectatorToAdd];
        this.setState({ spectators: updatedSpectators });
    }

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
        const { gameSocket, gameState } = this.state;
        gameSocket.sendMessage({
            event: WEBSOCKET_EVENT_SELECT,
            x,
            y
        });
    };

    handleUpdateOptionWithWebsocket({ name, value }) {
        const { gameSocket } = this.state;
        gameSocket.sendMessage({
            event: WEBSOCKET_EVENT_SET_OPTION,
            name,
            value
        });
    }

    toggleSettingsMenu = settingsOpened => {
        this.setState({ settingsOpened, aiSettingsOpened: false });
        if (settingsOpened) {
            gameState.pause();
        } else {
            gameState.resume();
        }

        gameState.unselect();
        this.updateGameState(gameState);
    };

    toggleAISettingsMenu = aiSettingsOpened => {
        this.setState({ aiSettingsOpened, settingsOpened: false });
        if (aiSettingsOpened) {
            gameState.pause();
        } else {
            gameState.resume();
        }

        gameState.unselect();
        this.updateGameState(gameState);
    };

    exportGame = () => {
        const defaultFileName = `chess-${gameState.gameId}-${moment().format(
            'YYYY-MM-DD-HH-mm-ss'
        )}`;
        const fileName = prompt(
            'Enter a name for your saved game.',
            defaultFileName
        );

        if (!fileName) {
            return;
        }

        const game = gameState.export();
        const gameBlob = new Blob([game], { type: 'application/json' });
        const virtualLink = document.createElement('a');
        virtualLink.download = fileName;
        virtualLink.href = URL.createObjectURL(gameBlob);
        virtualLink.click();
    };

    handleImportGame = () => {
        const fileInput = document.getElementById('load-file-input');
        fileInput.click();
    };

    importGame = async event => {
        const file = event.target.files[0];
        const gameToImport = await file.text();
        gameState.import(gameToImport);
        this.updateGameState(gameState);
    };

    renderPieceIcon = ({ type, player }) => {
        if (!type) {
            return null;
        }

        const Icon = icons[type];

        if (Icon) {
            return (
                <IconContainer title={type}>
                    <Icon
                        color1={player ? 'black' : 'white'}
                        color2={player ? 'white' : 'black'}
                    />
                </IconContainer>
            );
        }

        return type;
    };

    renderGameStats = () => {
        const { gameState } = this.state;
        return (
            <GameStats>
                <CurrentPlayer player={gameState.currentPlayer}>
                    {gameState.currentPlayer ? 'Black' : 'White'}
                </CurrentPlayer>
                <TimePlayed>
                    ⏱️{' '}
                    {gameState.totalTimePlayed.format('hh:mm:ss', {
                        trim: false
                    })}
                </TimePlayed>
                <OpenSettings
                    open={this.state.settingsOpened}
                    onClick={() =>
                        this.toggleSettingsMenu(!this.state.settingsOpened)
                    }
                >
                    ⚙️
                </OpenSettings>
                {this.state.gameState.artificialIntelligenceStatus
                    .initialized && (
                    <OpenSettings
                        open={this.state.aiSettingsOpened}
                        onClick={() =>
                            this.toggleAISettingsMenu(
                                !this.state.aiSettingsOpened
                            )
                        }
                    >
                        🤖
                    </OpenSettings>
                )}
            </GameStats>
        );
    };

    renderSettingsMenu = () => {
        if (this.state.settingsOpened) {
            let connectedPlayers = [
                ...this.state.gameState.players
                    .filter(player => player.playerId)
                    .map(player => ({
                        value: player.playerId,
                        colorIndex: player.color,
                        role: PLAYER_COLORS[player.color]
                    })),
                ...this.state.spectators.map(spectatorId => ({
                    value: spectatorId,
                    role: 'spectator'
                }))
            ];
            const getRole = (colorIndex, player) => {
                return player.colorIndex === colorIndex ||
                    connectedPlayers.filter(pl => pl.colorIndex !== undefined)
                        .length === 1 ||
                    (this.state.gameState.players[0].playerId ===
                        this.state.gameState.players[1].playerId &&
                        this.state.spectators.length === 0)
                    ? ''
                    : `${player.role}: `;
            };
            const getName = (_, player) => {
                return player.value === this.props.userId
                    ? (this.state.spectators.length === 0 &&
                          connectedPlayers.filter(
                              pl => pl.colorIndex !== undefined
                          ).length === 1) ||
                      (this.state.gameState.players[0].playerId ===
                          this.state.gameState.players[1].playerId &&
                          this.state.spectators.length === 0)
                        ? HUMAN_PLAYER
                        : YOU
                    : player.value;
            };
            return (
                <div>
                    <SettingsMenuAnchor>
                        <SettingsMenu>
                            {PLAYER_COLORS.map((colorString, colorIndex) => (
                                <SettingsItem key={colorString}>
                                    <span>{colorString}:</span>{' '}
                                    <SettingDropdown
                                        value={
                                            this.state.gameState.players[
                                                colorIndex
                                            ].playerId ||
                                            this.state.gameState.players[
                                                colorIndex
                                            ].control
                                        }
                                        onChange={({
                                            target: { value: playerId }
                                        }) => {
                                            const previousPlayerId = this.state
                                                .gameState.players[colorIndex]
                                                .playerId;

                                            this.state.gameState.setPlayerControl(
                                                colorIndex,
                                                playerId
                                            );

                                            this.updateGameState(
                                                this.state.gameState
                                            );

                                            const updatedPlayers = this.state
                                                .gameState.players;

                                            if (
                                                this.state.spectators.includes(
                                                    playerId
                                                )
                                            ) {
                                                this.removeSpectator(playerId);
                                            }

                                            if (
                                                previousPlayerId &&
                                                !updatedPlayers
                                                    .map(
                                                        player =>
                                                            player.playerId
                                                    )
                                                    .includes(previousPlayerId)
                                            ) {
                                                this.addSpectator(
                                                    previousPlayerId
                                                );
                                            }

                                            this.handleUpdateOptionWithWebsocket(
                                                {
                                                    name: 'setPlayerControl',
                                                    value: {
                                                        colorIndex,
                                                        playerId
                                                    }
                                                }
                                            );
                                        }}
                                    >
                                        {[
                                            ...[...connectedPlayers]
                                                .map(player => ({
                                                    value: player.value,
                                                    text: `${getRole(
                                                        colorIndex,
                                                        player
                                                    )}${getName(
                                                        colorIndex,
                                                        player
                                                    )}`
                                                }))
                                                .reduce(
                                                    (unique, player) =>
                                                        unique
                                                            .map(pl => pl.text)
                                                            .includes(
                                                                player.text
                                                            )
                                                            ? unique
                                                            : [
                                                                  ...unique,
                                                                  player
                                                              ],
                                                    []
                                                ),
                                            AI_PLAYER
                                        ]}
                                    </SettingDropdown>
                                </SettingsItem>
                            ))}
                            <SettingsItem>
                                <span>Time limit:</span> None
                            </SettingsItem>
                            <SettingsItem>
                                <span>Offline mode:</span> Disabled
                            </SettingsItem>
                            <SettingsItem>
                                <span>Theme:</span>{' '}
                                <SettingDropdown
                                    value={this.props.themeIndex}
                                    onChange={({ target: { value } }) =>
                                        this.props.setThemeIndex(value)
                                    }
                                >
                                    {[
                                        ...themes.map((theme, index) => ({
                                            value: index,
                                            text: theme.name
                                        }))
                                    ]}
                                </SettingDropdown>
                            </SettingsItem>
                            <SettingsItemBase>
                                <Button onClick={this.exportGame}>
                                    Export Game
                                </Button>
                                <Button onClick={this.handleImportGame}>
                                    Import Game
                                </Button>
                            </SettingsItemBase>
                        </SettingsMenu>
                    </SettingsMenuAnchor>
                    <HiddenFileLoader
                        onChange={this.importGame}
                        accept="application/json"
                    />
                </div>
            );
        }

        return null;
    };

    renderAISettingsMenu = () => {
        if (!this.state.gameState.artificialIntelligenceStatus.initialized) {
            return;
        }

        if (this.state.aiSettingsOpened) {
            return (
                <div>
                    <AISettingsMenuAnchor>
                        <AISettingsMenu>
                            {gameState.aiSettings.map(
                                ({ name, value, type, min, max, select }) => {
                                    let nameComponent = (
                                        <span>{name.replace(/_/g, ' ')}:</span>
                                    );
                                    let valueComponent = String(value);

                                    switch (type) {
                                        default: {
                                            break;
                                        }
                                        case 'check': {
                                            valueComponent = (
                                                <span>
                                                    <Checkbox
                                                        onChange={() => {
                                                            const {
                                                                gameState
                                                            } = this.state;
                                                            gameState.setArtificialIntelligenceOption(
                                                                {
                                                                    name,
                                                                    value: !value
                                                                }
                                                            );
                                                            this.sendWebSocketAIOptionUpdate(
                                                                {
                                                                    name,
                                                                    value: !value
                                                                }
                                                            );
                                                        }}
                                                        checked={value}
                                                    />{' '}
                                                    {value
                                                        ? 'Enabled'
                                                        : 'Disabled'}
                                                </span>
                                            );
                                            break;
                                        }
                                        case 'spin': {
                                            valueComponent = (
                                                <Slider
                                                    onChange={({
                                                        target: { value }
                                                    }) => {
                                                        const {
                                                            gameState
                                                        } = this.state;
                                                        const roundedDownValue = Math.floor(
                                                            value
                                                        );
                                                        gameState.setArtificialIntelligenceOption(
                                                            {
                                                                name,
                                                                value: roundedDownValue
                                                            }
                                                        );

                                                        this.sendWebSocketAIOptionUpdate(
                                                            {
                                                                name,
                                                                value: roundedDownValue
                                                            }
                                                        );
                                                    }}
                                                    value={value}
                                                    min={min}
                                                    max={max}
                                                />
                                            );
                                            break;
                                        }
                                        case 'combo': {
                                            valueComponent = (
                                                <SettingDropdown
                                                    onChange={({
                                                        target: { value }
                                                    }) => {
                                                        const {
                                                            gameState
                                                        } = this.state;
                                                        gameState.setArtificialIntelligenceOption(
                                                            {
                                                                name,
                                                                value
                                                            }
                                                        );

                                                        this.sendWebSocketAIOptionUpdate(
                                                            {
                                                                name,
                                                                value
                                                            }
                                                        );
                                                    }}
                                                    value={value}
                                                >
                                                    {select}
                                                </SettingDropdown>
                                            );
                                        }
                                    }

                                    return (
                                        <SettingsItem key={name}>
                                            {nameComponent}
                                            {valueComponent}
                                        </SettingsItem>
                                    );
                                }
                            )}
                        </AISettingsMenu>
                    </AISettingsMenuAnchor>
                </div>
            );
        }

        return null;
    };

    renderGraveyard = player => {
        const { gameState } = this.state;
        return gameState.removedPieces[player].map(piece => (
            <Tomb key={piece.id}>{this.renderPieceIcon(piece)}</Tomb>
        ));
    };

    renderSquares = () => {
        const { gameState } = this.state;
        let squares = [];
        for (let y = 0; y <= BOARD_SIDE_SIZE + 2; y++) {
            for (let x = 0; x <= BOARD_SIDE_SIZE + 2; x++) {
                // corners
                if (
                    (x === 0 && y === 0) ||
                    (x === BOARD_SIDE_SIZE + 2 && y === BOARD_SIDE_SIZE + 2) ||
                    (x === BOARD_SIDE_SIZE + 2 && y === 0) ||
                    (x === 0 && y === BOARD_SIDE_SIZE + 2)
                ) {
                    squares.push(<Side key={`${x}-${y}`} />);
                    // first column
                } else if (x === 0) {
                    squares.push(
                        <Side key={`${x}-${y}`} border="right">
                            {BOARD_SIDE_SIZE + 2 - y}
                        </Side>
                    );
                    // last column
                } else if (x === BOARD_SIDE_SIZE + 2) {
                    squares.push(
                        <Side key={`${x}-${y}`} border="left">
                            {BOARD_SIDE_SIZE + 2 - y}
                        </Side>
                    );
                    // first row
                } else if (y === 0) {
                    squares.push(
                        <Side key={`${x}-${y}`} border="bottom">
                            {String.fromCharCode(96 + x)}
                        </Side>
                    );
                    // last row
                } else if (y === BOARD_SIDE_SIZE + 2) {
                    squares.push(
                        <Side key={`${x}-${y}`} border="top">
                            {String.fromCharCode(96 + x)}
                        </Side>
                    );
                    // everything else
                } else {
                    const adjustedX = x - 1;
                    const adjustedY = y - 1;
                    const piece = gameState.getPieceAt({
                        x: adjustedX,
                        y: adjustedY
                    });
                    squares.push(
                        <Square
                            key={`${x}-${y}`}
                            even={(x + y) % 2 === 0}
                            player={piece && piece.player}
                            onClick={() =>
                                this.handleSelectWithWebsocket({
                                    x: adjustedX,
                                    y: adjustedY,
                                    piece
                                })
                            }
                            selected={gameState.isSelectedSquare({
                                x: adjustedX,
                                y: adjustedY
                            })}
                        >
                            {this.renderPieceIcon({ ...piece })}
                        </Square>
                    );
                }
            }
        }

        return squares;
    };

    renderLog = () => {
        if (!this.state.gameState.log.length) {
            return;
        }

        return (
            <Log>
                {this.state.gameState.log.map(
                    ({ id, string, piece, player, endGame }) => (
                        <LogEntry key={id}>
                            <LogIconContainer>
                                {this.renderPieceIcon({ ...piece, player })}
                            </LogIconContainer>
                            {string}
                            {endGame && 'X'}
                        </LogEntry>
                    )
                )}
            </Log>
        );
    };

    render() {
        return (
            <View>
                {this.renderGameStats()}
                {this.renderSettingsMenu()}
                {this.renderAISettingsMenu()}
                <Wrapper>
                    <Graveyard>{this.renderGraveyard(0)}</Graveyard>
                    <Board>{this.renderSquares()}</Board>
                    <Graveyard>{this.renderGraveyard(1)}</Graveyard>
                    {this.renderLog()}
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

const GameStats = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    text-align: center;
    font-family: sans-serif;
    letter-spacing: 1px;
    flex-wrap: wrap;
    margin: 10px;
    padding: 10px;
    border-radius: 5px;
    background: ${props => props.theme.background2};
    color: ${props => props.theme.color2};
    min-height: 40px;
    box-sizing: border-box;
    font-size: 18px;
`;

const CurrentPlayer = styled.div`
    text-transform: uppercase;
    font-weight: bold;
    color: ${props => (props.player ? 'black' : 'white')};
    width: 60px;
    margin-left: 11px;
    margin-right: 20px;
`;

const TimePlayed = styled.div`
    background: hsla(200, 40%, 60%, 80%);
    padding: 4px 8px;
    border-radius: 4px;
`;

const OpenSettings = styled.button`
    font-size: 14px;
    margin-left: 10px;
    box-sizing: border-box;
    padding: 2px;
    cursor: pointer;
    background: none;
    border: none;
    --bg: rgba(0, 0, 0, 0.5);
    border-bottom: 2px solid var(--bg);
    &:hover {
        --bg: red;
    }
    ${props => props.open && '--bg: red;'}
`;

const SettingsMenuAnchor = styled.div`
    margin-left: -117px;
`;

const AISettingsMenuAnchor = styled.div`
    margin-left: -197px;
`;

const SettingsMenu = styled.div`
    width: 240px;
    position: absolute;
    margin-top: -10px;
    padding: 10px;
    background: ${props => props.theme.background2};
    opacity: 0.95;
    color: ${props => props.theme.color2};
    border: 1px solid black;
    z-index: 1;
`;

const AISettingsMenu = styled(SettingsMenu)`
    width: 320px;
`;

const settingItemsCommon = `
    display: flex;
    justify-content: space-between;
    text-transform: capitalize;
    cursor: pointer;
    font-family: sans-serif;
    padding: 2px;
`;

const SettingsItemBase = styled.div`
    ${settingItemsCommon}
    justify-content: space-around;
`;

const SettingsItem = styled.label`
    ${settingItemsCommon}
    &:hover {
        background: lightblue;
        color: black;
    }
`;

const SettingDropdown = styled(Dropdown)`
    width: 130px;
`;

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
`;

const Graveyard = styled.div`
    width: 95%;
    display: flex;
    flex-wrap: wrap;
    min-height: 4vw;
    background: rgba(118, 118, 118, 0.5);
    padding: 1vh;
    border: 1px solid black;

    @media screen and (orientation: landscape) {
        min-height: 4vh;
    }
`;

const Tomb = styled.div`
    width: 4vw;

    @media screen and (orientation: landscape) {
        width: 4vh;
    }
`;

const Board = styled.div`
    display: grid;
    grid-template: repeat(10, calc(96vw / 10)) / repeat(10, calc(96vw / 10));

    @media screen and (orientation: landscape) {
        grid-template:
            repeat(10, calc((80vh - 5rem) / 10)) /
            repeat(10, calc((80vh - 5rem) / 10));
    }
`;

const Square = styled.div`
    background: ${props =>
        props.selected
            ? 'green'
            : props.even
            ? props.theme.evenSquareBackground
            : props.theme.oddSquareBackground};
    color: ${props => (props.player ? 'black' : 'white')};
    text-shadow: 0 0 2px ${props => (props.player ? 'white' : 'black')};
    display: flex;
    justify-content: center;
    align-items: center;
    overflow: hidden;
`;

const Side = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    font-family: monospace;
    opacity: 0.8;
    ${props =>
        props.border ? `border-${props.border}: 1px solid black;` : null}
    font-size: 14px;
`;

const IconContainer = styled.div`
    svg {
        width: 100%;
        height: 100%;
    }
`;

const HiddenFileLoader = styled.input.attrs({
    type: 'file',
    id: 'load-file-input'
})`
    display: none;
`;

const Log = styled.div`
    margin-top: 2.5rem;
    margin-bottom: 1rem;
    width: 95%;
    display: flex;
    flex-wrap: wrap;
    flex-direction: column;
    align-items: space-between;
    background: rgb(118, 118, 118);
    padding: 10px;
    border: 1px solid black;
    max-height: 35vh;

    @media screen and (orientation: landscape) {
        max-height: 35vw;
    }
`;

const LogEntry = styled.div`
    display: flex;
    align-items: center;
    padding: 0.05rem;
`;

const LogIconContainer = styled.div`
    width: 2.75vh;
`;
