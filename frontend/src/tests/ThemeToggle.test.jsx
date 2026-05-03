import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import ThemeToggle from '../components/ThemeToggle';

describe('ThemeToggle Component', () => {
  it('toggles dark mode class on document element', () => {
    render(<ThemeToggle />);
    const button = screen.getByRole('button');
    
    // Initial state check (depends on mock setup, but usually starts light)
    fireEvent.click(button);
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    
    fireEvent.click(button);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });
});
