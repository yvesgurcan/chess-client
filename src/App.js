import React, { useState } from 'react';
import { Switch } from 'react-router';
import { HashRouter, Route } from 'react-router-dom';
import { ThemeProvider, createGlobalStyle } from 'styled-components';
import { v4 as uuid } from 'uuid';
import { DEBUG } from './lib/constants';
import Home from './views/Home';
import GameView from './views/GameView';
import darkTheme from './themes/dark';
import lightTheme from './themes/light';

export default () => {
    const [userId] = useState(uuid());
    return (
        <ThemeProvider theme={darkTheme}>
            <div>
                <GlobalStyle />
                <HashRouter>
                    <Switch>
                        <Route
                            exact
                            path="/game/:gameId"
                            component={props => (
                                <GameView
                                    userId={userId}
                                    gameData={
                                        DEBUG &&
                                        typeof DEBUG_GAME !== 'undefined' &&
                                        DEBUG_GAME
                                    }
                                    gameId={props.match.params.gameId}
                                    history={props.history}
                                    location={props.location}
                                />
                            )}
                        />
                        <Route
                            path="/"
                            component={() => <Home userId={userId} />}
                        />
                    </Switch>
                </HashRouter>
            </div>
        </ThemeProvider>
    );
};

const GlobalStyle = createGlobalStyle`
    body {
        margin: 0;
        background: ${props => props.theme.background1};
    }

    a {
        text-decoration: none;
        color: ${props => props.theme.link.normal};
    }
`;
