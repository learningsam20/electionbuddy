import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import React from 'react';
import Layout from '../components/Layout';

describe('Layout Accessibility', () => {
  it('contains a skip to content link', () => {
    render(
      <BrowserRouter>
        <Layout>
          <div>Content</div>
        </Layout>
      </BrowserRouter>
    );
    
    const skipLink = screen.getByText(/Skip to Content/i);
    expect(skipLink).toBeDefined();
    expect(skipLink.getAttribute('href')).toBe('#main-content');
  });

  it('contains a main content landmark', () => {
    render(
      <BrowserRouter>
        <Layout>
          <div>Content</div>
        </Layout>
      </BrowserRouter>
    );
    
    const main = screen.getByRole('main');
    expect(main).toBeDefined();
    expect(main.id).toBe('main-content');
  });
});
