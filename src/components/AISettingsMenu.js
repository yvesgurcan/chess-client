import React from 'react';
import styled from 'styled-components';
import SettingsMenuBase from './SettingsMenuBase';
import Slider from './Slider';
import Checkbox from './Checkbox';
import SettingDropdown from './SettingDropdown';
import { SettingsItem } from './SettingsMenu';

const AICheckbox = ({ name, value, updateSetting }) => (
    <span>
        <Checkbox
            onChange={() =>
                updateSetting({
                    name,
                    value: !value
                })
            }
            checked={value}
        />{' '}
        {value ? 'Enabled' : 'Disabled'}
    </span>
);

const AISlider = ({ name, value, min, max, updateSetting }) => (
    <Slider
        onChange={({ target: { value } }) =>
            updateSetting({
                name,
                value: Math.floor(value)
            })
        }
        value={value}
        min={min}
        max={max}
    />
);

const AIDropdown = ({ name, value, select, updateSetting }) => (
    <SettingDropdown
        onChange={({ target: { value } }) =>
            updateSetting({
                name,
                value
            })
        }
        value={value}
    >
        {select}
    </SettingDropdown>
);

const aiSettingInputs = {
    check: AICheckbox,
    spin: AISlider,
    combo: AIDropdown
};

export default ({
    gameState,
    settingsOpened,
    handleUpdateAIOptionWithWebsocket
}) => {
    if (
        !settingsOpened ||
        !gameState.artificialIntelligenceStatus.initialized
    ) {
        return null;
    }

    const updateSetting = ({ name, value }) => {
        gameState.setArtificialIntelligenceOption({ name, value });
        handleUpdateAIOptionWithWebsocket({ name, value });
    };

    return (
        <div>
            <AISettingsMenuAnchor>
                <AISettingsMenu>
                    {gameState.aiSettings.map(setting => {
                        const AISettingInput = aiSettingInputs[
                            setting.type
                        ] || <span>{String(setting.value)}</span>;
                        return (
                            <SettingsItem key={setting.name}>
                                <span>{setting.name.replace(/_/g, ' ')}:</span>
                                <AISettingInput
                                    {...setting}
                                    updateSetting={updateSetting}
                                />
                            </SettingsItem>
                        );
                    })}
                </AISettingsMenu>
            </AISettingsMenuAnchor>
        </div>
    );
};

const AISettingsMenuAnchor = styled.div`
    margin-left: -197px;
`;

const AISettingsMenu = styled(SettingsMenuBase)`
    width: 320px;
`;
