// components/AddTransactionForm.test.tsx - RED phase: Test add transaction form

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import AddTransactionForm from './AddTransactionForm';

describe('AddTransactionForm', () => {
  it('should render form fields', () => {
    const mockOnSubmit = vi.fn();
    render(<AddTransactionForm onSubmit={mockOnSubmit} />);
    
    expect(screen.getByLabelText(/Description/i)).toBeDefined();
    expect(screen.getByLabelText(/Amount/i)).toBeDefined();
    expect(screen.getByLabelText(/Category/i)).toBeDefined();
    expect(screen.getByLabelText(/Owner/i)).toBeDefined();
    expect(screen.getByLabelText(/Date/i)).toBeDefined();
  });

  it('should have expense and income type options', () => {
    const mockOnSubmit = vi.fn();
    render(<AddTransactionForm onSubmit={mockOnSubmit} />);
    
    expect(screen.getByText(/Expense/i)).toBeDefined();
    expect(screen.getByText(/Income/i)).toBeDefined();
  });

  it('should have a submit button', () => {
    const mockOnSubmit = vi.fn();
    render(<AddTransactionForm onSubmit={mockOnSubmit} />);
    
    const submitButton = screen.getByRole('button', { name: /Add Transaction/i });
    expect(submitButton).toBeDefined();
  });

  it('should call onSubmit with form data when submitted', async () => {
    const mockOnSubmit = vi.fn();
    render(<AddTransactionForm onSubmit={mockOnSubmit} />);
    
    // Fill form
    const descriptionInput = screen.getByLabelText(/Description/i);
    const amountInput = screen.getByLabelText(/Amount/i);
    const submitButton = screen.getByRole('button', { name: /Add Transaction/i });
    
    fireEvent.change(descriptionInput, { target: { value: 'Test expense' } });
    fireEvent.change(amountInput, { target: { value: '50000' } });
    
    // Submit
    fireEvent.click(submitButton);
    
    // Verify onSubmit was called
    expect(mockOnSubmit).toHaveBeenCalled();
  });

  it('should have a back link to dashboard', () => {
    const mockOnSubmit = vi.fn();
    render(<AddTransactionForm onSubmit={mockOnSubmit} />);
    
    const links = screen.getAllByRole('link');
    const backLink = links.find((link) => link.getAttribute('href') === '/');
    
    expect(backLink).toBeDefined();
  });
});
