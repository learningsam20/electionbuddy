import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import Timeline from '../pages/Timeline';

// Mock the store
import useStore from '../store';
import { vi } from 'vitest';

vi.mock('../store', () => ({
  default: () => ({
    token: 'mock-token',
    user: { role: 'citizen', district: 'Pune' }
  })
}));

describe('Timeline Component', () => {
  it('renders loading state initially', () => {
    render(<Timeline />);
    expect(screen.getByText(/Syncing Election Timeline/i)).toBeInTheDocument();
  });
});
