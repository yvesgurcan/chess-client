import React, { Component } from 'react';
import styled from 'styled-components';
import icons from './icons';
import GameState from '../models/GameState';
import { BOARD_SIDE_SIZE, ONE_SECOND } from '../lib/constants';

export default class GameView extends Component {
    constructor() {
        super();
        const gameState = new GameState();
        gameState.initPieces();
        this.state = { gameState };
        window.gameState = gameState;
    }

    componentDidMount() {
        setInterval(() => {
            const { gameState } = this.state;
            gameState.updateTimePlayed();
            this.updateGameState(gameState);
        }, ONE_SECOND);
    }

    updateGameState = gameState => this.setState({ gameState });

    handleSelect = ({ x, y, piece }) => {
        const { gameState } = this.state;
        const { selected } = gameState;
        if (selected) {
            if (selected.x === x && selected.y === y) {
                gameState.unselect();
            } else if (selected.piece) {
                const moved = gameState.moveSelectedPiece({ x, y });

                if (!moved) {
                    gameState.select({ x, y, piece });
                }
            } else {
                gameState.select({ x, y, piece });
            }
        } else {
            gameState.select({ x, y, piece });
        }

        this.updateGameState(gameState);
    };

    renderPieceIcon = ({ id, type, player }) => {
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
            </GameStats>
        );
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
                if (x === 0 && y === 0) {
                    squares.push(<Side key={`${x}-${y}`} />);
                } else if (x === 9) {
                    squares.push(
                        <Side
                            key={`${x}-${y}`}
                            border={y > 0 && y < 9 && 'left'}
                        />
                    );
                } else if (y === 9) {
                    squares.push(
                        <Side key={`${x}-${y}`} border={x > 0 && 'top'} />
                    );
                } else if (x === 0) {
                    squares.push(
                        <Side key={`${x}-${y}`} border="right">
                            {y}
                        </Side>
                    );
                } else if (y === 0) {
                    squares.push(
                        <Side key={`${x}-${y}`} border="bottom">
                            {String.fromCharCode(96 + x)}
                        </Side>
                    );
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

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
`;

const Graveyard = styled.div`
    width: 95%;
    display: flex;
    flex-wrap: wrap;
    height: 5vw;

    @media screen and (orientation: landscape) {
        height: 5vh;
    }
`;

const Tomb = styled.div`
    width: 5vw;

    @media screen and (orientation: landscape) {
        width: 5vh;
    }
`;

const Board = styled.div`
    display: grid;
    grid-template: repeat(10, calc(85vw / 10)) / repeat(10, calc(85vw / 10));

    @media screen and (orientation: landscape) {
        grid-template: repeat(10, calc((85vh - 50px) / 10)) / repeat(
                10,
                calc(85vh / 10)
            );
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
