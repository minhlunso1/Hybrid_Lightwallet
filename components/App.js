import React, {Component} from 'react';
import '../App.css';
import 'react-s-alert/dist/s-alert-default.css';
import 'react-s-alert/dist/s-alert-css-effects/slide.css';

import GetStarted from './GetStarted';

import {Toolbar} from 'react-onsenui';

class App extends Component {
  render() {
    return (
      <div className='App'>
        <GetStarted />
      </div>
    );
  }
}

export default App;
