import React from 'react';
import { Switch } from 'react-router';
import { HashRouter, Route } from 'react-router-dom';
import { ThemeProvider, createGlobalStyle } from 'styled-components';
import { DEBUG } from './lib/constants';
import useLocalStorage from './lib/useLocalStorage';
import useUser from './lib/useUser';
import Home from './views/Home';
import GameView from './views/GameView';
import themes from './themes';

export default () => {
    const [themeIndex, setThemeIndex] = useLocalStorage('themeIndex', 0);
    const [user] = useUser();
    return (
        <ThemeProvider theme={themes[themeIndex]}>
            <div>
                <GlobalStyle />
                <HashRouter>
                    <Switch>
                        <Route
                            exact
                            path="/game/:gameId"
                            render={props => (
                                <GameView
                                    userId={user && user.userId}
                                    gameData={
                                        DEBUG &&
                                        typeof DEBUG_GAME !== 'undefined' &&
                                        DEBUG_GAME
                                    }
                                    gameId={props.match.params.gameId}
                                    history={props.history}
                                    location={props.location}
                                    themeIndex={themeIndex}
                                    setThemeIndex={setThemeIndex}
                                />
                            )}
                        />
                        <Route
                            path="/"
                            render={() => <Home userId={user && user.userId} />}
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
