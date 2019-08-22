import React, { Fragment } from 'react';
import ReactDOM from 'react-dom';
import { Switch } from 'react-router';
import { HashRouter, Route } from 'react-router-dom';
import { createGlobalStyle } from 'styled-components';

import GameView from './components/GameView';

const GlobalStyle = createGlobalStyle`
    body {
        margin: 0;
    }
`;

ReactDOM.render(
    <Fragment>
        <GlobalStyle />
        <HashRouter>
            <Switch>
                <Route path="/" component={GameView} />
            </Switch>
        </HashRouter>
    </Fragment>,
    document.getElementById('app')
);
