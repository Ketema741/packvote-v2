import React from 'react';
import { render, screen } from '@testing-library/react';
import Home from './Home';

describe('Home', () => {
  it('renders the home page with correct content', () => {
    render(<Home />);
    
    // Check if the header content is present
    expect(screen.getByRole('heading', { name: /group travel app/i })).toBeInTheDocument();
    expect(screen.getByText(/plan your perfect group trip with ai assistance/i)).toBeInTheDocument();
    
    // Check if the TravelPlanForm is rendered
    expect(screen.getByLabelText(/destination/i)).toBeInTheDocument();
  });

  it('has the correct container class', () => {
    render(<Home />);
    const container = screen.getByTestId('home-container');
    expect(container).toHaveClass('home-container');
  });
}); 