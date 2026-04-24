import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Input } from '@/components/ui/input';

describe('Input', () => {
  it('renders with placeholder', () => {
    render(<Input placeholder="Enter text" />);
    expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
  });

  it('renders with type password', () => {
    render(<Input type="password" />);
    expect(screen.getByDisplayValue('').closest('input')).toHaveAttribute('type', 'password');
  });

  it('renders as disabled', () => {
    render(<Input disabled />);
    expect(screen.getByRole('textbox')).toBeDisabled();
  });

  it('renders with default value', () => {
    render(<Input defaultValue="test value" />);
    expect(screen.getByRole('textbox')).toHaveValue('test value');
  });
});
