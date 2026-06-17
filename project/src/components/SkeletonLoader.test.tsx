import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import SkeletonLoader from './SkeletonLoader';

describe('SkeletonLoader', () => {
  it('renders 4 skeleton rows by default', () => {
    const { container } = render(<SkeletonLoader />);
    const items = container.querySelectorAll('.skeleton-loader');
    expect(items).toHaveLength(4);
  });

  it('renders the specified number of rows', () => {
    const { container } = render(<SkeletonLoader rows={7} />);
    const items = container.querySelectorAll('.skeleton-loader');
    expect(items).toHaveLength(7);
  });

  it('renders zero rows when rows=0', () => {
    const { container } = render(<SkeletonLoader rows={0} />);
    const items = container.querySelectorAll('.skeleton-loader');
    expect(items).toHaveLength(0);
  });

  it('applies staggered animation delays', () => {
    const { container } = render(<SkeletonLoader rows={3} />);
    const items = container.querySelectorAll('.skeleton-loader');
    expect(items[0]).toHaveStyle({ animationDelay: '0s' });
    expect(items[1]).toHaveStyle({ animationDelay: '0.15s' });
    expect(items[2]).toHaveStyle({ animationDelay: '0.3s' });
  });
});
