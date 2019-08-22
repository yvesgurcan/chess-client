import React, { Component } from 'react';
import styled from 'styled-components';
import Piece from '../models/Piece';

const BOARD_SIDE_SIZE = 7;

const PLAYER1 = 0;
const PLAYER2 = 1;

const ROOK = 'rook';
const KNIGHT = 'knight';
const BISHOP = 'bishop';
const QUEEN = 'queen';
const KING = 'king';
const PAWN = 'pawn';

const LATERAL_BACK_ROW_PIECES = [ROOK, KNIGHT, BISHOP];
const LEFT_BACK_ROW_PIECES = [...LATERAL_BACK_ROW_PIECES, QUEEN];
const RIGHT_BACK_ROW_PIECES = [KING, ...LATERAL_BACK_ROW_PIECES.reverse()];

const initPieces = () => {
    let pieces = [];
    [PLAYER1, PLAYER2].forEach(player => {
        [...LEFT_BACK_ROW_PIECES, ...RIGHT_BACK_ROW_PIECES].forEach(
            (type, index) => {
                const piece = new Piece({
                    x: index,
                    y: player ? 0 : BOARD_SIDE_SIZE,
                    player,
                    type
                });
                const pawn = new Piece({
                    x: index,
                    y: player ? 1 : BOARD_SIDE_SIZE - 1,
                    player,
                    type: PAWN
                });
                pieces.push(pawn);
                pieces.push(piece);
            }
        );
    });
    console.log({ pieces });
    return pieces;
};

export default class Home extends Component {
    constructor() {
        super();
        this.state = { pieces: initPieces() };
    }

    getPieceAt = ({ x, y }) => {
        const piece = this.state.pieces.find(
            piece => piece.x === x && piece.y === y
        );

        return piece || {};
    };

    renderSquares = () => {
        let squares = [];
        for (let y = 0; y <= BOARD_SIDE_SIZE + 2; y++) {
            for (let x = 0; x <= BOARD_SIDE_SIZE + 2; x++) {
                if (x === 0 && y === 0) {
                    squares.push(<div key={`${x}-${y}`} />);
                } else if (x === 9 || y === 9) {
                    squares.push(<div key={`${x}-${y}`} />);
                } else if (x === 0) {
                    squares.push(<Side key={`${x}-${y}`}>{y}</Side>);
                } else if (y === 0) {
                    squares.push(
                        <Side key={`${x}-${y}`}>
                            {String.fromCharCode(96 + x)}
                        </Side>
                    );
                } else {
                    const { type, player } = this.getPieceAt({
                        x: x - 1,
                        y: y - 1
                    });
                    squares.push(
                        <Square
                            key={`${x}-${y}`}
                            even={(x + y) % 2 === 0}
                            player={player}
                        >
                            {type}
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
`;

const Board = styled.div`
    display: grid;
    grid-template: repeat(10, calc(95vw / 10)) / repeat(10, calc(95vw / 10));

    @media screen and (orientation: landscape) {
        grid-template: repeat(10, calc(95vh / 10)) / repeat(10, calc(95vh / 10));
    }
`;

const Square = styled.div`
    border: 1px solid black;
    background: ${props => (props.even ? 'white' : 'black')};
    color: ${props => (props.player === 0 ? 'white' : 'black')};
    display: flex;
    justify-content: center;
    align-items: center;
`;

const Side = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
`;
