import React from 'react';
import ReactDOM from 'react-dom';
import { Switch } from 'react-router';
import { HashRouter, Route } from 'react-router-dom';

import Home from './Home';

ReactDOM.render(
    <HashRouter>
        <Switch>
            <Route path="/" component={Home} />
        </Switch>
    </HashRouter>,
    document.getElementById('app')
);
