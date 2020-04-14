import React from 'react';
import ReactDOM from 'react-dom';
import { Switch } from 'react-router';
import { HashRouter, Route } from 'react-router-dom';
import { ThemeProvider, createGlobalStyle } from 'styled-components';
import ApolloClient from 'apollo-boost';
import { ApolloProvider } from 'react-apollo';
import token from '../token';
import GameView from './views/GameView';
import darkTheme from './themes/dark';
import lightTheme from './themes/light';

const DEBUG = location.hostname === 'localhost';
// import DEBUG_GAME from '../test/fixtures/unused_kingBlackPawnAndBishop.json';
// import DEBUG_TOKEN from '../token.ignore.js';

// GitHub API v4
const client = new ApolloClient({
    uri: 'https://api.github.com/graphql',
    request: operation => {
        operation.setContext({
            headers: {
                authorization: `Bearer ${
                    DEBUG && typeof DEBUG_TOKEN !== 'undefined'
                        ? DEBUG_TOKEN
                        : token
                }`
            }
        });
    }
});

const GlobalStyle = createGlobalStyle`
    body {
        margin: 0;
        background: ${props => props.theme.background1};
    }
`;

ReactDOM.render(
    <ApolloProvider client={client}>
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
        </ThemeProvider>
    </ApolloProvider>,
    document.getElementById('app')
);
