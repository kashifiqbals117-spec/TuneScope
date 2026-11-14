import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.js';
import { AuthProvider } from './context/AuthContext.js';
import { SpotifyProvider } from './context/SpotifyContext.js';
import { SocketProvider } from './context/SocketContext.js';
import './index.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <SpotifyProvider>
          <SocketProvider>
            <App />
          </SocketProvider>
        </SpotifyProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);

