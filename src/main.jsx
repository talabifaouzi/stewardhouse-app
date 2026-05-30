import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { IntakeProvider } from './contexts/IntakeContext.jsx';
import { CohortMemberProvider } from './contexts/CohortMemberContext.jsx';
import { ModalStackProvider } from './contexts/ModalStackContext.jsx';
import './styles/global.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ModalStackProvider>
      <BrowserRouter>
        <IntakeProvider>
          <CohortMemberProvider>
            <App />
          </CohortMemberProvider>
        </IntakeProvider>
      </BrowserRouter>
    </ModalStackProvider>
  </React.StrictMode>,
);
