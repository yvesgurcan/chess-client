import React from 'react';
import ReactDOM from 'react-dom';
import { Switch } from 'react-router';
import { HashRouter, Route } from 'react-router-dom';
import { ThemeProvider, createGlobalStyle } from 'styled-components';
import darkTheme from './themes/dark';
import lightTheme from './themes/light';

import GameView from './views/GameView';

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
                    <Route path="/" component={GameView} />
                </Switch>
            </HashRouter>
        </div>
    </ThemeProvider>,
    document.getElementById('app')
);
