import React from 'react';
import ReactDOM from 'react-dom';
import { Switch } from 'react-router';
import { HashRouter, Route } from 'react-router-dom';
import { ThemeProvider, createGlobalStyle } from 'styled-components';
import { DEBUG } from './lib/constants';
import GameView from './views/GameView';
import darkTheme from './themes/dark';
import lightTheme from './themes/light';

// import DEBUG_GAME from '../test/fixtures/unused_kingBlackPawnAndBishop.json';

const GlobalStyle = createGlobalStyle`
    body {
        margin: 0;
        background: ${props => props.theme.background1};
    }
`;

ReactDOM.render(
    <ThemeProvider theme={darkTheme}>
        <div>
            <GlobalStyle />
            <HashRouter>
                <Switch>
                    <Route
                        exact
                        path="/game"
                        component={props => (
                            <GameView
                                gameData={
                                    DEBUG &&
                                    typeof DEBUG_GAME !== 'undefined' &&
                                    DEBUG_GAME
                                }
                                history={props.history}
                                location={props.location}
                            />
                        )}
                    />
                    <Route
                        exact
                        path="/game/new"
                        component={props => (
                            <GameView
                                gameData={
                                    DEBUG &&
                                    typeof DEBUG_GAME !== 'undefined' &&
                                    DEBUG_GAME
                                }
                                history={props.history}
                                location={props.location}
                            />
                        )}
                    />
                    <Route
                        exact
                        path="/game/:gameId"
                        component={props => (
                            <GameView
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
                </Switch>
            </HashRouter>
        </div>
    </ThemeProvider>,
    document.getElementById('app')
);
