import React, { Fragment, useState } from 'react';
import styled from 'styled-components';
import { PLAYER_COLORS } from '../lib/constants';
import SettingsMenu from '../components/SettingsMenu';
import AISettingsMenu from '../components/AISettingsMenu';

export default ({
    userId,
    gameState,
    updateGameState,
    spectators,
    removeSpectator,
    addSpectator,
    themeIndex,
    setThemeIndex,
    handleUpdateOptionWithWebsocket,
    handleUpdateAIOptionWithWebsocket
}) => {
    const [settingsOpened, setSettingsOpened] = useState({
        game: false,
        ai: false
    });

    const toggleSettingsMenu = key => {
        let updatedSettingsOpened = null;
        switch (key) {
            default: {
                updatedSettingsOpened = {
                    game: !settingsOpened.game,
                    ai: false
                };
                break;
            }
            case 'ai': {
                updatedSettingsOpened = { ai: !settingsOpened.ai, game: false };
                break;
            }
        }

        setSettingsOpened(updatedSettingsOpened);

        if (updatedSettingsOpened[key]) {
            gameState.pause();
        } else {
            gameState.resume();
        }

        gameState.unselect();
        updateGameState(gameState);
    };

    return (
        <Fragment>
            <GameStats>
                <CurrentPlayer player={gameState.currentPlayer}>
                    {PLAYER_COLORS[gameState.currentPlayer]}
                </CurrentPlayer>
                <TimePlayed>
                    ⏱️{' '}
                    {gameState.totalTimePlayed.format('hh:mm:ss', {
                        trim: false
                    })}
                </TimePlayed>
                <OpenSettings
                    open={settingsOpened.game}
                    onClick={() => toggleSettingsMenu('game')}
                >
                    ⚙️
                </OpenSettings>
                {gameState.artificialIntelligenceStatus.initialized && (
                    <OpenSettings
                        open={settingsOpened.ai}
                        onClick={() => toggleSettingsMenu('ai')}
                    >
                        🤖
                    </OpenSettings>
                )}
            </GameStats>
            <SettingsMenu
                userId={userId}
                gameState={gameState}
                spectators={spectators}
                settingsOpened={settingsOpened.game}
                handleUpdateOptionWithWebsocket={
                    handleUpdateOptionWithWebsocket
                }
                themeIndex={themeIndex}
                setThemeIndex={setThemeIndex}
                updateGameState={updateGameState}
                removeSpectator={removeSpectator}
                addSpectator={addSpectator}
            />
            <AISettingsMenu
                gameState={gameState}
                settingsOpened={settingsOpened.ai}
                handleUpdateAIOptionWithWebsocket={
                    handleUpdateAIOptionWithWebsocket
                }
            />
        </Fragment>
    );
};

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
    color: ${props => PLAYER_COLORS[props.player]};
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
