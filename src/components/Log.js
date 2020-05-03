import React from 'react';
import styled from 'styled-components';
import PieceIcon from '../components/PieceIcon';

export default ({ gameState }) => {
    if (!gameState.log.length) {
        return null;
    }

    return (
        <Log>
            {gameState.log.map(({ id, string, piece, endGame }) => (
                <LogEntry key={id}>
                    <LogIconContainer>
                        <PieceIcon {...piece} />
                    </LogIconContainer>
                    {string}
                    {endGame && 'X'}
                </LogEntry>
            ))}
        </Log>
    );
};

const Log = styled.div`
    margin-top: 2.5rem;
    margin-bottom: 1rem;
    width: 95%;
    display: flex;
    flex-wrap: wrap;
    flex-direction: column;
    align-items: space-between;
    background: ${props => props.theme.background2};
    padding: 10px;
    border: 1px solid black;
    max-height: 35vh;
    border-radius: 5px;

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
