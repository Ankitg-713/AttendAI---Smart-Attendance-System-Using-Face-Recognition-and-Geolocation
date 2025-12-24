import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import './index.css';
import { FaceModelProvider } from './context/FaceModelContext.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <FaceModelProvider>
        <App />
      </FaceModelProvider>
    </BrowserRouter>
  </React.StrictMode>
);
