import React, { useState } from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';
import { getPackageInfo } from '../lib/util';

const packageInfo = getPackageInfo();

export default ({ userId }) => {
    const [gameId, setGameId] = useState('');
    return (
        <View>
            <h1>{packageInfo.name}</h1>
            <Menu>
                <MenuItem to="/game/new">New Game</MenuItem>
                <MenuItemWrapper>
                    <MenuItemWithInput to={gameId && `/game/${gameId}`}>
                        Load Game
                    </MenuItemWithInput>{' '}
                    <input
                        placeholder="Enter game identifier."
                        value={gameId}
                        onChange={event => setGameId(event.target.value)}
                    />
                </MenuItemWrapper>
                <ExternalMenuItem href={packageInfo.repository}>
                    Source Code
                </ExternalMenuItem>
                <MenuItemWrapper>User ID: {userId}</MenuItemWrapper>
            </Menu>
        </View>
    );
};

const View = styled.div`
    display: flex;
    justify-content: center;
    flex-direction: column;
    align-items: center;
    min-height: 100vh;
    user-select: none;
    color: ${props => props.theme.color1};
`;

const Menu = styled.div`
    display: flex;
    justify-content: space-around;
    flex-direction: column;
    align-items: center;
`;

const MenuItem = styled(Link)`
    padding: 1rem;
    text-align: center;
    display: block;
`;

const MenuItemWrapper = styled.div`
    padding-bottom: 1rem;
`;

const MenuItemWithInput = styled(MenuItem)`
    padding-bottom: 0;
`;

const ExternalMenuItem = styled.a`
    padding-top: 1rem;
    padding-bottom: 1rem;
    display: block;
`;
