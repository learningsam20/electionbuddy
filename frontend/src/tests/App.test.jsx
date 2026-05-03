import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import App from '../App';

describe('App Component', () => {
  it('renders login page by default', () => {
    render(<App />);
    expect(screen.getByText(/ElectionBuddy/i)).toBeInTheDocument();
  });
});
