import React from 'react';
import styled from 'styled-components';
import PieceIcon from './PieceIcon';

export default ({ gameState, colorIndex }) => (
    <Graveyard>
        {gameState.removedPieces[colorIndex].map(piece => (
            <Tomb key={piece.id}>
                <PieceIcon {...piece} />
            </Tomb>
        ))}
    </Graveyard>
);

const Graveyard = styled.div`
    width: 95%;
    display: flex;
    flex-wrap: wrap;
    min-height: 4vw;
    background: ${props => props.theme.background2};
    padding: 1vh;
    border: 1px solid black;
    border-radius: 5px;

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
