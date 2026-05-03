import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import ErrorBoundary from '../components/ErrorBoundary';

const ThrowError = () => {
  throw new Error("Test error");
};

describe('ErrorBoundary', () => {
  it('renders children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <div>Safe Content</div>
      </ErrorBoundary>
    );
    expect(screen.getByText('Safe Content')).toBeDefined();
  });

  it('renders fallback UI when an error occurs', () => {
    // Suppress console.error for this test as we expect an error
    vi.spyOn(console, 'error').mockImplementation(() => {});
    
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );
    
    expect(screen.getByText(/Something went wrong/i)).toBeDefined();
    expect(screen.getByText(/Reload Application/i)).toBeDefined();
  });
});
