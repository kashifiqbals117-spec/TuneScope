import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.js';
import { AuthProvider } from './context/AuthContext.js';
import { SpotifyProvider } from './context/SpotifyContext.js';
import { SocketProvider } from './context/SocketContext.js';
import { ToastProvider } from './context/ToastContext.js';
import { ErrorBoundary } from './components/common/ErrorBoundary.js';
import './index.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <SpotifyProvider>
            <SocketProvider>
              <ToastProvider>
                <App />
              </ToastProvider>
            </SocketProvider>
          </SpotifyProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
);
