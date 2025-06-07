import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '../../test-utils/test-utils';
import AnalysisBuilder from '../../components/AnalysisBuilder/AnalysisBuilder';

describe('AnalysisBuilder', () => {
  it('renders the analysis builder interface', () => {
    render(<AnalysisBuilder />);
    
    expect(screen.getByText(/Analysis Builder/i)).toBeInTheDocument();
    expect(screen.getByText(/Basic Information/i)).toBeInTheDocument();
  });

  it('shows all steps in the stepper', () => {
    render(<AnalysisBuilder />);
    
    expect(screen.getByText('Basic Information')).toBeInTheDocument();
    expect(screen.getByText('Analysis Set')).toBeInTheDocument();
    expect(screen.getByText('Where Clause')).toBeInTheDocument();
    expect(screen.getByText('Grouping')).toBeInTheDocument();
    expect(screen.getByText('Method')).toBeInTheDocument();
    expect(screen.getByText('Results')).toBeInTheDocument();
  });

  it('allows navigation between steps', async () => {
    const user = userEvent.setup();
    render(<AnalysisBuilder />);
    
    // Initially on step 0
    expect(screen.getByText(/Basic Information/i)).toHaveClass('ant-steps-item-active');
    
    // Click next
    const nextButton = screen.getByRole('button', { name: /next/i });
    await user.click(nextButton);
    
    // Should move to step 1
    await waitFor(() => {
      expect(screen.getByText(/Analysis Set/i)).toHaveClass('ant-steps-item-active');
    });
    
    // Click previous
    const prevButton = screen.getByRole('button', { name: /previous/i });
    await user.click(prevButton);
    
    // Should go back to step 0
    await waitFor(() => {
      expect(screen.getByText(/Basic Information/i)).toHaveClass('ant-steps-item-active');
    });
  });

  it('validates required fields before allowing next step', async () => {
    const user = userEvent.setup();
    render(<AnalysisBuilder />);
    
    // Try to go to next step without filling required fields
    const nextButton = screen.getByRole('button', { name: /next/i });
    await user.click(nextButton);
    
    // Should show validation errors
    await waitFor(() => {
      expect(screen.getByText(/Please input the analysis ID/i)).toBeInTheDocument();
      expect(screen.getByText(/Please input the analysis name/i)).toBeInTheDocument();
    });
  });

  it('fills and submits the analysis form', async () => {
    const user = userEvent.setup();
    const mockOnFinish = vi.fn();
    
    render(<AnalysisBuilder onFinish={mockOnFinish} />);
    
    // Fill basic information
    await user.type(screen.getByLabelText(/Analysis ID/i), 'AN001');
    await user.type(screen.getByLabelText(/Analysis Name/i), 'Test Analysis');
    await user.type(screen.getByLabelText(/Description/i), 'Test description');
    
    // Select reason and purpose
    await user.click(screen.getByLabelText(/Reason/i));
    await user.click(screen.getByText('SPECIFIED'));
    
    await user.click(screen.getByLabelText(/Purpose/i));
    await user.click(screen.getByText('PRIMARY_OUTCOME_MEASURE'));
    
    // Navigate through steps
    const nextButton = screen.getByRole('button', { name: /next/i });
    
    // Go through all steps
    for (let i = 0; i < 5; i++) {
      await user.click(nextButton);
      await waitFor(() => {
        expect(screen.getByText(/Analysis Set|Where Clause|Grouping|Method|Results/i))
          .toHaveClass('ant-steps-item-active');
      });
    }
    
    // Submit on the last step
    const finishButton = screen.getByRole('button', { name: /finish/i });
    await user.click(finishButton);
    
    await waitFor(() => {
      expect(mockOnFinish).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'AN001',
          name: 'Test Analysis',
          description: 'Test description',
          reason: 'SPECIFIED',
          purpose: 'PRIMARY_OUTCOME_MEASURE',
        })
      );
    });
  });

  it('shows preview of the analysis configuration', async () => {
    const user = userEvent.setup();
    render(<AnalysisBuilder />);
    
    // Fill some basic information
    await user.type(screen.getByLabelText(/Analysis ID/i), 'AN001');
    await user.type(screen.getByLabelText(/Analysis Name/i), 'Demographics Analysis');
    
    // Should show preview
    expect(screen.getByText(/Preview/i)).toBeInTheDocument();
    expect(screen.getByText('AN001')).toBeInTheDocument();
    expect(screen.getByText('Demographics Analysis')).toBeInTheDocument();
  });
});