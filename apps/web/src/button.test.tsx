import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Button } from './components/ui/button';

describe('Button Component', () => {
  it('renders correctly with children', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me') as HTMLElement).toBeInTheDocument();
  });
});
