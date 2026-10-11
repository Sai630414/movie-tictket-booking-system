import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './styles/index.css';
import './styles/after-hours.css';
import ButtonMotion from './components/ButtonMotion.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ButtonMotion />
    <App />
  </React.StrictMode>
);
