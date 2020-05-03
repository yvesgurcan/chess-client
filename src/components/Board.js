import React from 'react';
import styled from 'styled-components';
import { BOARD_SIDE_SIZE } from '../lib/constants';
import PieceIcon from './PieceIcon';

export default ({ gameState, handleSelectWithWebsocket }) => {
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
                            handleSelectWithWebsocket({
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
                        <PieceIcon {...piece} />
                    </Square>
                );
            }
        }
    }

    return <Board>{squares}</Board>;
};

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
