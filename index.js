import React from 'react';
import {render} from 'react-dom';

import App from './components/App';
import registerServiceWorker from './registerServiceWorker';

import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import createLogger from 'redux-logger';
import {AppContainer} from 'react-hot-loader';
import reducer from './reducers';
import { Provider } from 'react-redux';

// react bootstrap
import 'bootstrap/dist/css/bootstrap.css';

import ons from 'onsenui';
import 'onsenui/css/onsenui.css';
import './stylus/index.styl';

const logger = createLogger();

const store = createStore(
  reducer,
  window.devToolsExtension ? window.devToolsExtension() : f => f,
  process.env.NODE_ENV === 'production'
    ? applyMiddleware(thunk)
    : applyMiddleware(thunk, logger)
);

ons.ready(() => render(
  <AppContainer>
    <Provider store={store}>
        <App />
    </Provider>
  </AppContainer>,
  document.getElementById('root')
));

if (module.hot) {
  module.hot.accept('./components/App', () => {
    const NextApp = require('./components/App').default;
    render(
      <AppContainer>
        <Provider store={store}>
          <NextApp />
        </Provider>
      </AppContainer>,
      document.getElementById('root')
    );
  });
}

registerServiceWorker();
