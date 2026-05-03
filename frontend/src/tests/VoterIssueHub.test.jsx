import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import VoterIssueHub from '../components/VoterIssueHub';
import { vi } from 'vitest';

vi.mock('../store', () => ({
  default: () => ({
    token: 'mock-token',
    user: { role: 'citizen', assembly_constituency: 'Pune Central' }
  })
}));

describe('VoterIssueHub Component', () => {
  it('renders the issue hub heading', () => {
    render(<VoterIssueHub />);
    expect(screen.getByText(/Voice of the Voter/i)).toBeInTheDocument();
  });

  it('renders the description textarea', () => {
    render(<VoterIssueHub />);
    expect(screen.getByPlaceholderText(/Describe the issue in your area/i)).toBeInTheDocument();
  });
});
