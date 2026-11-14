import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Badge } from '../components/common/Badge.js';
import { Button } from '../components/common/Button.js';
import { GlassCard } from '../components/common/GlassCard.js';
import { AudioPlayerPreview } from '../components/common/AudioPlayerPreview.js';
import { EmptyState } from '../components/common/EmptyState.js';
import { ErrorMessage } from '../components/common/ErrorMessage.js';
import { Skeleton } from '../components/common/Skeleton.js';
import { getUserFriendlyError } from '../utils/errors.js';
import { Music2 } from 'lucide-react';

describe('Frontend Common Components', () => {
  it('renders Badge with correct variant styling', () => {
    render(<Badge variant="emerald">Live</Badge>);
    const badge = screen.getByText('Live');
    expect(badge).toBeInTheDocument();
    expect(badge.className).toContain('text-emerald-400');
  });

  it('renders Button with text and handles loading state', () => {
    const { rerender } = render(<Button variant="primary">Click Me</Button>);
    expect(screen.getByText('Click Me')).toBeInTheDocument();

    rerender(<Button variant="primary" isLoading>Click Me</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('renders GlassCard with children', () => {
    render(
      <GlassCard hoverEffect>
        <p>Test Card Content</p>
      </GlassCard>
    );
    expect(screen.getByText('Test Card Content')).toBeInTheDocument();
  });

  it('renders AudioPlayerPreview with track metadata', () => {
    render(
      <AudioPlayerPreview
        trackTitle="Get Lucky"
        artistName="Daft Punk"
        coverUrl="https://example.com/cover.jpg"
      />
    );
    expect(screen.getByText('Get Lucky')).toBeInTheDocument();
    expect(screen.getByText('Daft Punk')).toBeInTheDocument();
  });

  it('renders EmptyState with icon, title, description, and action button', () => {
    render(
      <EmptyState
        icon={Music2}
        title="No Songs Found"
        description="Try searching for another artist."
        actionText="Reset Filter"
        onAction={() => {}}
      />
    );
    expect(screen.getByText('No Songs Found')).toBeInTheDocument();
    expect(screen.getByText('Try searching for another artist.')).toBeInTheDocument();
    expect(screen.getByText('Reset Filter')).toBeInTheDocument();
  });

  it('renders ErrorMessage with user-friendly translation and retry button', () => {
    const technicalError = new Error('ECONNREFUSED: connect to 127.0.0.1:5000 failed');
    render(<ErrorMessage error={technicalError} onRetry={() => {}} />);

    expect(screen.getByText('Connection Issue')).toBeInTheDocument();
    expect(
      screen.getByText("We're having trouble connecting to the server. Please check your connection and try again shortly.")
    ).toBeInTheDocument();
    expect(screen.getByText('Retry')).toBeInTheDocument();
  });

  it('renders Skeleton component with animation classes', () => {
    const { container } = render(<Skeleton className="w-20 h-4" />);
    const el = container.firstChild as HTMLElement;
    expect(el.className).toContain('animate-pulse');
  });

  it('translates 403 Spotify Developer errors into clear policy explanations', () => {
    const error = {
      status: 403,
      message: 'Active premium subscription required for the owner of the app.',
    };
    const friendly = getUserFriendlyError(error);
    expect(friendly.title).toBe('Spotify Access Restricted');
    expect(friendly.message).toContain('active Spotify Premium subscription');
  });
});
