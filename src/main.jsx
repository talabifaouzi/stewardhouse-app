import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { IntakeProvider } from './contexts/IntakeContext.jsx';
import './styles/global.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <IntakeProvider>
        <App />
      </IntakeProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
