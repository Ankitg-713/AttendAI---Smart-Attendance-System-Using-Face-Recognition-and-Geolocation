import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import './index.css';
import { Toaster } from 'react-hot-toast';
import ErrorBoundary from './components/ErrorBoundary.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <App />
      {/* 👇 add toaster here once, it will handle popups globally */}
      <Toaster
        position="bottom-right"
        reverseOrder={false}
        toastOptions={{
          success: {
            duration: 2000,
            style: {
              background: "#ecfdf5", // light green
              color: "#065f46",
              borderRadius: "12px"
            },
            iconTheme: { primary: "#10b981", secondary: "white" },
          },
          error: {
            duration: 4000,
            style: {
              background: "#fee2e2", // light red
              color: "#991b1b",
              borderRadius: "12px"
            },
            iconTheme: { primary: "#ef4444", secondary: "white" },
          },
        }}
      />
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
);
