import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '../../test-utils/test-utils';
import WhereClauseBuilder from '../../components/WhereClauseBuilder/AdvancedWhereClauseBuilder';

describe('WhereClauseBuilder', () => {
  it('renders the where clause builder interface', () => {
    render(<WhereClauseBuilder />);
    
    expect(screen.getByText(/Where Clause Builder/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Add Condition/i })).toBeInTheDocument();
  });

  it('adds a simple condition', async () => {
    const user = userEvent.setup();
    render(<WhereClauseBuilder />);
    
    // Click add condition
    await user.click(screen.getByRole('button', { name: /Add Condition/i }));
    
    // Fill condition fields
    await user.type(screen.getByLabelText(/Dataset/i), 'ADSL');
    await user.type(screen.getByLabelText(/Variable/i), 'SAFFL');
    
    // Select comparator
    await user.click(screen.getByLabelText(/Comparator/i));
    await user.click(screen.getByText('EQ'));
    
    // Enter value
    await user.type(screen.getByLabelText(/Value/i), 'Y');
    
    // Verify condition is displayed
    expect(screen.getByText('ADSL')).toBeInTheDocument();
    expect(screen.getByText('SAFFL')).toBeInTheDocument();
    expect(screen.getByText('EQ')).toBeInTheDocument();
    expect(screen.getByText('Y')).toBeInTheDocument();
  });

  it('creates a compound expression with multiple conditions', async () => {
    const user = userEvent.setup();
    render(<WhereClauseBuilder />);
    
    // Add first condition
    await user.click(screen.getByRole('button', { name: /Add Condition/i }));
    await user.type(screen.getAllByLabelText(/Dataset/i)[0], 'ADSL');
    await user.type(screen.getAllByLabelText(/Variable/i)[0], 'SAFFL');
    await user.click(screen.getAllByLabelText(/Comparator/i)[0]);
    await user.click(screen.getByText('EQ'));
    await user.type(screen.getAllByLabelText(/Value/i)[0], 'Y');
    
    // Add compound expression
    await user.click(screen.getByRole('button', { name: /Add Compound Expression/i }));
    
    // Select logical operator
    await user.click(screen.getByLabelText(/Logical Operator/i));
    await user.click(screen.getByText('AND'));
    
    // Add second condition
    await user.click(screen.getAllByRole('button', { name: /Add Condition/i })[1]);
    await user.type(screen.getAllByLabelText(/Dataset/i)[1], 'ADSL');
    await user.type(screen.getAllByLabelText(/Variable/i)[1], 'AGE');
    await user.click(screen.getAllByLabelText(/Comparator/i)[1]);
    await user.click(screen.getByText('GE'));
    await user.type(screen.getAllByLabelText(/Value/i)[1], '18');
    
    // Verify compound expression
    expect(screen.getByText('AND')).toBeInTheDocument();
    expect(screen.getByText('SAFFL')).toBeInTheDocument();
    expect(screen.getByText('AGE')).toBeInTheDocument();
  });

  it('validates where clause expressions', async () => {
    const user = userEvent.setup();
    render(<WhereClauseBuilder />);
    
    // Add an incomplete condition
    await user.click(screen.getByRole('button', { name: /Add Condition/i }));
    await user.type(screen.getByLabelText(/Dataset/i), 'ADSL');
    // Don't fill variable or value
    
    // Try to validate
    await user.click(screen.getByRole('button', { name: /Validate/i }));
    
    // Should show validation errors
    await waitFor(() => {
      expect(screen.getByText(/Variable is required/i)).toBeInTheDocument();
      expect(screen.getByText(/Value is required/i)).toBeInTheDocument();
    });
  });

  it('tests where clause against sample data', async () => {
    const user = userEvent.setup();
    render(<WhereClauseBuilder />);
    
    // Add a condition
    await user.click(screen.getByRole('button', { name: /Add Condition/i }));
    await user.type(screen.getByLabelText(/Dataset/i), 'ADSL');
    await user.type(screen.getByLabelText(/Variable/i), 'SAFFL');
    await user.click(screen.getByLabelText(/Comparator/i));
    await user.click(screen.getByText('EQ'));
    await user.type(screen.getByLabelText(/Value/i), 'Y');
    
    // Click test expression
    await user.click(screen.getByRole('button', { name: /Test Expression/i }));
    
    // Should show test results
    await waitFor(() => {
      expect(screen.getByText(/Test Results/i)).toBeInTheDocument();
      expect(screen.getByText(/records matched/i)).toBeInTheDocument();
    });
  });

  it('saves where clause to library', async () => {
    const user = userEvent.setup();
    const mockOnSave = vi.fn();
    
    render(<WhereClauseBuilder onSave={mockOnSave} />);
    
    // Add a condition
    await user.click(screen.getByRole('button', { name: /Add Condition/i }));
    await user.type(screen.getByLabelText(/Dataset/i), 'ADSL');
    await user.type(screen.getByLabelText(/Variable/i), 'ITTFL');
    await user.click(screen.getByLabelText(/Comparator/i));
    await user.click(screen.getByText('EQ'));
    await user.type(screen.getByLabelText(/Value/i), 'Y');
    
    // Save to library
    await user.type(screen.getByLabelText(/Clause Name/i), 'ITT Population');
    await user.click(screen.getByRole('button', { name: /Save to Library/i }));
    
    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith(
        expect.objectContaining({
          label: 'ITT Population',
          condition: {
            dataset: 'ADSL',
            variable: 'ITTFL',
            comparator: 'EQ',
            value: ['Y'],
          },
        })
      );
    });
  });

  it('loads where clause from library', async () => {
    const user = userEvent.setup();
    render(<WhereClauseBuilder />);
    
    // Open library
    await user.click(screen.getByRole('button', { name: /Load from Library/i }));
    
    // Should show library modal
    expect(screen.getByText(/Where Clause Library/i)).toBeInTheDocument();
    
    // Select a clause
    await user.click(screen.getByText('Safety Population'));
    await user.click(screen.getByRole('button', { name: /Load/i }));
    
    // Should populate the builder
    await waitFor(() => {
      expect(screen.getByDisplayValue('ADSL')).toBeInTheDocument();
      expect(screen.getByDisplayValue('SAFFL')).toBeInTheDocument();
    });
  });
});