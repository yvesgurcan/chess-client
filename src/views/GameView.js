import React, { Component } from 'react';
import styled from 'styled-components';
import moment from 'moment';
import GameState from '../models/GameState';
import icons from '../components/icons';
import { BOARD_SIDE_SIZE, ONE_SECOND, PLAYER_COLORS } from '../lib/constants';
import { getPackageInfo, sendRequest } from '../lib/util';

export default class GameView extends Component {
    constructor(props) {
        super(props);
        const gameState = new GameState();

        let entrypoint = 'UNKNOWN';

        if (props.gameData) {
            entrypoint = 'LOCAL';
        } else if (!props.gameId) {
            entrypoint = 'NEW';
        } else {
            entrypoint = 'REMOTE';
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

        console.log(entrypoint);

        this.state = {
            gameState,
            settingsOpened: false,
            aiSettingsOpened: false
        };

        window.gameState = gameState;
        const { name, version, repository, author } = getPackageInfo();
        console.log(`${name} v${version} by ${author}`);
        console.log(`repository: ${repository}`);
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
                gameState.import(result.gameData);
                gameState.resume();
                this.setState({ gameState, oid: result.oid });
            } else {
                console.error('Game not found. New game created instead.');
                gameState.newGame();
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

    updateGameState = gameState => {
        this.setState({ gameState });
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
                <CurrentTurn>#{String(gameState.currentTurn + 1)}:</CurrentTurn>
                <CurrentPlayer player={gameState.currentPlayer}>
                    {gameState.currentPlayer ? 'Black' : 'White'}
                </CurrentPlayer>
                <TimePlayed>
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
            return (
                <div>
                    <SettingsMenuAnchor>
                        <SettingsMenu>
                            {PLAYER_COLORS.map((colorString, index) => (
                                <SettingsItem
                                    key={colorString}
                                    onClick={() => {
                                        this.state.gameState.togglePlayerControl(
                                            index
                                        );
                                        this.updateGameState(
                                            this.state.gameState
                                        );
                                    }}
                                >
                                    <span>{colorString}:</span>{' '}
                                    {
                                        this.state.gameState.players[index]
                                            .control
                                    }
                                </SettingsItem>
                            ))}
                            <SettingsItem>
                                <span>Time limit:</span> None
                            </SettingsItem>
                            <SettingsItem>
                                <span>Offline mode:</span> Disabled
                            </SettingsItem>
                            <SettingsItem onClick={this.exportGame}>
                                <span>Save:</span> &gt;&gt;
                            </SettingsItem>
                            <SettingsItem onClick={this.handleImportGame}>
                                <span>Load:</span> &lt;&lt;
                            </SettingsItem>
                        </SettingsMenu>
                    </SettingsMenuAnchor>
                    <HiddenFileLoader onChange={this.importGame} />
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
                            {gameState.aiOptions.map(
                                ({ name, value, type }) => {
                                    let nameComponent = <span>{name}:</span>;
                                    let valueComponent = String(value);

                                    switch (type) {
                                        default: {
                                            break;
                                        }
                                        case 'button': {
                                            nameComponent = <span>{name}</span>;
                                            valueComponent = null;
                                            break;
                                        }

                                        case 'check': {
                                            valueComponent = (
                                                <span
                                                    onClick={() => {
                                                        this.state.gameState.setArtificialIntelligenceOption(
                                                            {
                                                                name,
                                                                value: !value
                                                            }
                                                        );
                                                    }}
                                                >
                                                    {String(value)}
                                                </span>
                                            );
                                            break;
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
                                this.handleSelect({
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

const CurrentTurn = styled.div`
    margin-right: 2px;
`;

const CurrentPlayer = styled.div`
    text-transform: uppercase;
    font-weight: bold;
    color: ${props => (props.player ? 'black' : 'white')};
    width: 60px;
    margin-right: 20px;
`;

const TimePlayed = styled.div``;

const OpenSettings = styled.div`
    font-size: 14px;
    margin-left: 10px;
    box-sizing: border-box;
    ${props =>
        props.open &&
        `
        margin: -1px;
        margin-left: 9px;
        border: 1px inset white;
        `};
`;

const SettingsMenuAnchor = styled.div`
    margin-left: -60px;
`;

const AISettingsMenuAnchor = styled.div`
    margin-left: -120px;
`;

const SettingsMenu = styled.div`
    width: 160px;
    position: absolute;
    margin-top: -10px;
    padding: 10px;
    background: ${props => props.theme.background2};
    color: ${props => props.theme.color2};
    border: 1px solid black;
`;

const AISettingsMenu = styled(SettingsMenu)`
    width: 220px;
`;

const SettingsItem = styled.div`
    display: flex;
    justify-content: space-between;
    text-transform: capitalize;
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
    background: rgb(118, 118, 118);
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
    grid-template: repeat(10, calc(80vw / 10)) / repeat(10, calc(80vw / 10));

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
    margin-top: 4rem;
    margin-bottom: 4rem;
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
