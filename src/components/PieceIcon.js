import React from 'react';
import styled from 'styled-components';
import icons from './icons';
import { PLAYER_COLORS, PLAYER_COLORS_INVERTED } from '../lib/constants';

export default ({ type, player }) => {
    if (!type) {
        return null;
    }

    const Icon = icons[type];

    if (Icon) {
        return (
            <IconContainer title={type}>
                <Icon
                    color1={PLAYER_COLORS[player]}
                    color2={PLAYER_COLORS_INVERTED[player]}
                />
            </IconContainer>
        );
    }

    return type;
};

const IconContainer = styled.div`
    svg {
        width: 100%;
        height: 100%;
    }
`;
