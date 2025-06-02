import React from 'react';
import { render, screen, fireEvent } from '../test-utils/test-utils';
import TravelPlanForm from './TravelPlanForm';

describe('TravelPlanForm', () => {
  it('renders the form with all required fields', async () => {
    await render(<TravelPlanForm />);

    // Check if the form elements are present
    expect(screen.getByLabelText(/destination/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /generate travel plan/i })).toBeInTheDocument();
  });

  it('updates form data when input changes', async () => {
    await render(<TravelPlanForm />);

    const destinationInput = screen.getByLabelText(/destination/i);
    fireEvent.change(destinationInput, { target: { value: 'Paris' } });

    expect(destinationInput.value).toBe('Paris');
  });

  it('submits the form with correct data', async () => {
    const consoleSpy = jest.spyOn(console, 'log');

    await render(<TravelPlanForm />);

    const destinationInput = screen.getByLabelText(/destination/i);
    fireEvent.change(destinationInput, { target: { value: 'Paris' } });

    const submitButton = screen.getByRole('button', { name: /generate travel plan/i });
    fireEvent.click(submitButton);

    expect(consoleSpy).toHaveBeenCalledWith('Form submitted:', expect.objectContaining({
      destination: 'Paris',
      dates: '',
      budget: '',
      preferences: ''
    }));

    consoleSpy.mockRestore();
  });
});