import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Header from './Header';

describe('Header', () => {
  it('renders the app title', () => {
    render(<Header />);
    expect(screen.getByText('Jevil Travels')).toBeInTheDocument();
  });

  it('renders default subtitle when none provided', () => {
    render(<Header />);
    expect(screen.getByText('Your Journey is Our Priority.')).toBeInTheDocument();
  });

  it('renders custom subtitle when provided', () => {
    render(<Header subtitle="Driver Mode" />);
    expect(screen.getByText('Driver Mode')).toBeInTheDocument();
  });

  it('does not render active count when showActiveCount is undefined', () => {
    render(<Header />);
    expect(screen.queryByText(/Active/)).not.toBeInTheDocument();
  });

  it('renders active count when showActiveCount is provided', () => {
    render(<Header showActiveCount={3} />);
    expect(screen.getByText('3 Active')).toBeInTheDocument();
  });

  it('renders active count of 0', () => {
    render(<Header showActiveCount={0} />);
    expect(screen.getByText('0 Active')).toBeInTheDocument();
  });
});
