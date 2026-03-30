import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#1A1A1A',
            color: '#F5F5F5',
            border: '1px solid rgba(255,255,255,0.08)',
            fontFamily: 'Space Grotesk, sans-serif',
            fontSize: '14px',
          },
          success: { iconTheme: { primary: '#E85D04', secondary: '#0D0D0D' } },
          error: { iconTheme: { primary: '#D62828', secondary: '#F5F5F5' } },
        }}
      />
    </BrowserRouter>
  </React.StrictMode>
);
