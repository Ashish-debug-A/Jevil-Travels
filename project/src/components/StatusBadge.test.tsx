import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import StatusBadge from './StatusBadge';

describe('StatusBadge', () => {
  it('renders "Idle" label for idle status', () => {
    render(<StatusBadge status="idle" />);
    expect(screen.getByText('Idle')).toBeInTheDocument();
  });

  it('renders "On Trip" label for on_trip status', () => {
    render(<StatusBadge status="on_trip" />);
    expect(screen.getByText('On Trip')).toBeInTheDocument();
  });

  it('renders "Completed" label for completed status', () => {
    render(<StatusBadge status="completed" />);
    expect(screen.getByText('Completed')).toBeInTheDocument();
  });

  it('applies correct CSS class for idle', () => {
    render(<StatusBadge status="idle" />);
    expect(screen.getByText('Idle')).toHaveClass('status-idle');
  });

  it('applies correct CSS class for on_trip', () => {
    render(<StatusBadge status="on_trip" />);
    expect(screen.getByText('On Trip')).toHaveClass('status-on_trip');
  });

  it('applies correct CSS class for completed', () => {
    render(<StatusBadge status="completed" />);
    expect(screen.getByText('Completed')).toHaveClass('status-completed');
  });
});
