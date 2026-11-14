import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Sidebar } from '../components/layout/Sidebar.js';
import { AuthProvider } from '../context/AuthContext.js';
import { SpotifyProvider } from '../context/SpotifyContext.js';

describe('Sidebar Navigation', () => {
  it('renders all required persistent navigation links', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <SpotifyProvider>
            <Sidebar />
          </SpotifyProvider>
        </AuthProvider>
      </BrowserRouter>
    );

    // Prompt requirements: Overview, Discover, Listening History, Artists, Tracks, Recaps, Friends, Profile, Settings
    expect(screen.getByText('Overview')).toBeInTheDocument();
    expect(screen.getByText('Discover')).toBeInTheDocument();
    expect(screen.getByText('Listening History')).toBeInTheDocument();
    expect(screen.getByText('Artists')).toBeInTheDocument();
    expect(screen.getByText('Tracks')).toBeInTheDocument();
    expect(screen.getByText('Recaps')).toBeInTheDocument();
    expect(screen.getByText('Friends')).toBeInTheDocument();
    expect(screen.getByText('Profile')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });
});

