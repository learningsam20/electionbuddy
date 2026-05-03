import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import MaturityQuiz from '../components/MaturityQuiz';
import { vi } from 'vitest';

vi.mock('../store', () => ({
  default: () => ({
    token: 'mock-token',
    user: { role: 'citizen' }
  })
}));

describe('MaturityQuiz Component', () => {
  it('renders the quiz heading', () => {
    render(<MaturityQuiz />);
    expect(screen.getByText(/Voter Maturity Assessment/i)).toBeInTheDocument();
  });

  it('displays the first question', () => {
    render(<MaturityQuiz />);
    expect(screen.getByText(/What is the primary role of the Election Commission of India/i)).toBeInTheDocument();
  });
});
