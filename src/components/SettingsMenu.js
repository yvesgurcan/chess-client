import React from 'react';
import styled from 'styled-components';
import moment from 'moment';
import { YOU, HUMAN_PLAYER, AI_PLAYER, PLAYER_COLORS } from '../lib/constants';
import useServiceWorker from '../lib/useServiceWorker';
import SettingsMenuBase from './SettingsMenuBase';
import SettingDropdown from './SettingDropdown';
import Button from './Button';
import themes from '../themes';
import Checkbox from './Checkbox';

export default ({
    userId,
    gameState,
    spectators,
    settingsOpened,
    themeIndex,
    setThemeIndex,
    handleUpdateOptionWithWebsocket,
    updateGameState,
    removeSpectator,
    addSpectator
}) => {
    const [serviceWorkEnabled, setServiceWorkEnabled] = useServiceWorker();

    if (!settingsOpened) {
        return null;
    }

    const exportGame = () => {
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

    const importGame = async event => {
        const file = event.target.files[0];
        const gameToImport = await file.text();
        gameState.import(gameToImport);
        updateGameState(gameState);
    };

    const handleImportGame = () => {
        const fileInput = document.getElementById('load-file-input');
        fileInput.click();
    };

    let connectedPlayers = [
        ...gameState.players
            .filter(player => player.playerId)
            .map(player => ({
                value: player.playerId,
                colorIndex: player.color,
                role: PLAYER_COLORS[player.color]
            })),
        ...spectators.map(spectatorId => ({
            value: spectatorId,
            role: 'spectator'
        }))
    ];

    const getRole = (colorIndex, player) => {
        return player.colorIndex === colorIndex ||
            connectedPlayers.filter(pl => pl.colorIndex !== undefined)
                .length === 1 ||
            (gameState.players[0].playerId === gameState.players[1].playerId &&
                spectators.length === 0)
            ? ''
            : `${player.role}: `;
    };

    const getName = (_, player) => {
        return player.value === userId
            ? (spectators.length === 0 &&
                  connectedPlayers.filter(pl => pl.colorIndex !== undefined)
                      .length === 1) ||
              (gameState.players[0].playerId ===
                  gameState.players[1].playerId &&
                  spectators.length === 0)
                ? HUMAN_PLAYER
                : YOU
            : player.value;
    };

    const updatePlayer = (colorIndex, playerId) => {
        const previousPlayerId = gameState.players[colorIndex].playerId;

        gameState.setPlayerControl(colorIndex, playerId);

        updateGameState(gameState);

        const updatedPlayers = gameState.players;

        if (spectators.includes(playerId)) {
            removeSpectator(playerId);
        }

        if (
            previousPlayerId &&
            !updatedPlayers
                .map(player => player.playerId)
                .includes(previousPlayerId)
        ) {
            addSpectator(previousPlayerId);
        }

        handleUpdateOptionWithWebsocket({
            name: 'setPlayerControl',
            value: {
                colorIndex,
                playerId
            }
        });
    };

    const getPlayerList = colorIndex => [
        ...[...connectedPlayers]
            .map(player => ({
                value: player.value,
                text: `${getRole(colorIndex, player)}${getName(
                    colorIndex,
                    player
                )}`
            }))
            .reduce(
                (unique, player) =>
                    unique.map(pl => pl.text).includes(player.text)
                        ? unique
                        : [...unique, player],
                []
            ),
        AI_PLAYER
    ];

    return (
        <div>
            <SettingsMenuAnchor>
                <SettingsMenuBase>
                    {PLAYER_COLORS.map((colorString, colorIndex) => (
                        <SettingsItem key={colorString}>
                            <span>{colorString}:</span>{' '}
                            <SettingDropdown
                                value={
                                    gameState.players[colorIndex].playerId ||
                                    gameState.players[colorIndex].control
                                }
                                onChange={({ target: { value: playerId } }) =>
                                    updatePlayer(colorIndex, playerId)
                                }
                            >
                                {getPlayerList(colorIndex)}
                            </SettingDropdown>
                        </SettingsItem>
                    ))}
                    <SettingsItem>
                        <span>Time limit:</span> None
                    </SettingsItem>
                    <SettingsItem>
                        <span>Offline mode:</span>{' '}
                        <span>
                            <Checkbox
                                onChange={() =>
                                    setServiceWorkEnabled(!serviceWorkEnabled)
                                }
                                checked={serviceWorkEnabled}
                            />
                            {serviceWorkEnabled ? 'Enabled' : 'Disabled'}
                        </span>
                    </SettingsItem>
                    <SettingsItem>
                        <span>Theme:</span>{' '}
                        <SettingDropdown
                            value={themeIndex}
                            onChange={({ target: { value } }) =>
                                setThemeIndex(value)
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
                        <Button onClick={exportGame}>Export Game</Button>
                        <Button onClick={handleImportGame}>Import Game</Button>
                    </SettingsItemBase>
                </SettingsMenuBase>
            </SettingsMenuAnchor>
            <HiddenFileLoader onChange={importGame} accept="application/json" />
        </div>
    );
};

const SettingsMenuAnchor = styled.div`
    margin-left: -117px;
`;

const settingItemsCommon = `
    display: flex;
    justify-content: space-between;
    text-transform: capitalize;
    cursor: pointer;
    font-family: sans-serif;
    padding: 2px;
`;

export const SettingsItem = styled.label`
    ${settingItemsCommon}
    &:hover {
        background: lightblue;
        color: black;
    }
`;

const SettingsItemBase = styled.div`
    ${settingItemsCommon}
    justify-content: space-around;
`;

const HiddenFileLoader = styled.input.attrs({
    type: 'file',
    id: 'load-file-input'
})`
    display: none;
`;
