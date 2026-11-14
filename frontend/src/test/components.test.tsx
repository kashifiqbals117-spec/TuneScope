import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Badge } from '../components/common/Badge.js';
import { Button } from '../components/common/Button.js';
import { GlassCard } from '../components/common/GlassCard.js';
import { AudioPlayerPreview } from '../components/common/AudioPlayerPreview.js';

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
});

