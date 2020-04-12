import React, { Component } from 'react';
import styled from 'styled-components';
import moment from 'moment';
import GameState from '../models/GameState';
// import artificialIntelligence from '../models/ArtificialIntelligence';
import icons from '../components/icons';
import { BOARD_SIDE_SIZE, ONE_SECOND } from '../lib/constants';
import { getPackageInfo } from '../lib/util';

const DEBUG = location.hostname === 'localhost';
import DEBUG_GAME from '../test/fixtures/castling1.json';

export default class GameView extends Component {
    constructor(props) {
        super(props);
        const gameState = new GameState();
        // artificialIntelligence.init({});
        if (DEBUG && typeof DEBUG_GAME !== 'undefined') {
            gameState.import(DEBUG_GAME);
            gameState.resume();
            this.props.history.push(`/game/${gameState.gameId}`);
        } else {
            gameState.initPieces();
            this.props.history.push(`/game/${gameState.gameId}`);
        }

        this.state = { gameState, settingsOpened: false };
        window.gameState = gameState;
        const { name, version, repository, author } = getPackageInfo();
        console.log(`${name} v${version} by ${author}`);
        console.log(`repository: ${repository}`);
    }

    componentDidMount() {
        setInterval(() => {
            if (!gameState.gameEndedAt) {
                const { gameState } = this.state;
                gameState.updateTimePlayed();
                this.updateGameState(gameState);
            }
        }, ONE_SECOND);
    }

    updateGameState = gameState => {
        this.setState({ gameState });
    };

    handleSelect = ({ x, y, piece }) => {
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
                    gameState.select({ x, y, piece });
                }
                // select
            } else {
                gameState.select({ x, y, piece });
            }
        } else {
            // select
            gameState.select({ x, y, piece });
        }

        // debug
        window.gameState = gameState;
        this.updateGameState(gameState);
    };

    toggleSettingsMenu = settingsOpened => {
        this.setState({ settingsOpened });
        if (settingsOpened) {
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
            </GameStats>
        );
    };

    renderSettingsMenu = () => {
        if (this.state.settingsOpened) {
            return (
                <div>
                    <SettingsMenuAnchor>
                        <SettingsMenu>
                            <SettingsItem>
                                <span>White:</span> Human
                            </SettingsItem>
                            <SettingsItem>
                                <span>Black:</span> Human
                            </SettingsItem>
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

    render() {
        return (
            <View>
                {this.renderGameStats()}
                {this.renderSettingsMenu()}
                <Wrapper>
                    <Graveyard>{this.renderGraveyard(0)}</Graveyard>
                    <Board>{this.renderSquares()}</Board>
                    <Graveyard>{this.renderGraveyard(1)}</Graveyard>
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
    margin-left: -80px;
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

const SettingsItem = styled.div`
    display: flex;
    justify-content: space-between;
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
    height: 4vw;
    background: rgb(118, 118, 118);
    padding: 10px;
    border: 1px solid black;

    @media screen and (orientation: landscape) {
        height: 4vh;
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
