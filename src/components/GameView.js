import React, { Component } from 'react';
import styled from 'styled-components';
import icons from './icons';
import GameState from '../models/GameState';
import { BOARD_SIDE_SIZE } from '../lib/constants';

export default class Home extends Component {
    constructor() {
        super();
        const gameState = new GameState();
        gameState.initPieces();
        this.state = { gameState };
        window.gameState = gameState;
    }

    updateGameState = gameState => this.setState({ gameState });

    handleSelect = ({ x, y, piece }) => {
        const { gameState } = this.state;
        const { selected } = gameState;
        if (selected) {
            if (selected.x === x && selected.y === y) {
                gameState.unselect();
            } else if (selected.piece) {
                gameState.moveSelectedPiece({ x, y });
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
                <Board>{this.renderSquares()}</Board>
            </View>
        );
    }
}

const View = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
    user-select: none;
    background: ${props => props.theme.background1};
    color: ${props => props.theme.color1};
`;

const Board = styled.div`
    display: grid;
    grid-template: repeat(10, calc(100vw / 10)) / repeat(10, calc(100vw / 10));

    @media screen and (orientation: landscape) {
        grid-template: repeat(10, calc(100vh / 10)) / repeat(
                10,
                calc(100vh / 10)
            );
    }
`;

const Square = styled.div`
    background: ${props =>
        props.selected
            ? 'green'
            : props.even
            ? 'rgb(210, 210, 210)'
            : 'rgb(150, 150, 150)'};
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
