import React from 'react';
import { render, screen } from '../../test-utils/test-utils';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import DocsPage from '../DocsPage';

// Create a theme instance
const theme = createTheme();

// Mock the useNavigate hook
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('DocsPage', () => {
  beforeEach(async () => {
    // Clear mocks before each test
    mockNavigate.mockClear();
    
    // Render the component
    await render(
      <ThemeProvider theme={theme}>
        <BrowserRouter>
          <DocsPage />
        </BrowserRouter>
      </ThemeProvider>
    );
  });

  it('renders the documentation title', () => {
    expect(screen.getByText('Documentation')).toBeInTheDocument();
  });

  it('displays the Getting Started section', () => {
    expect(screen.getByText('Getting Started')).toBeInTheDocument();
    expect(screen.getByText('1. Create a Trip Link')).toBeInTheDocument();
    expect(screen.getByText('2. Complete the Survey')).toBeInTheDocument();
    expect(screen.getByText('3. Review AI Recommendations')).toBeInTheDocument();
    expect(screen.getByText('4. Vote and Decide')).toBeInTheDocument();
  });

  it('displays the Survey Questions section', () => {
    expect(screen.getByText('Survey Questions Explained')).toBeInTheDocument();
    expect(screen.getByText('Budget Range')).toBeInTheDocument();
    expect(screen.getByText('Travel Dates')).toBeInTheDocument();
    expect(screen.getByText('Activity Preferences')).toBeInTheDocument();
  });

  it('displays the Privacy & Security section', () => {
    expect(screen.getByText('Privacy & Security')).toBeInTheDocument();
    expect(screen.getByText('Data Protection')).toBeInTheDocument();
    expect(screen.getByText('Group Privacy')).toBeInTheDocument();
  });

  it('displays the Payment & Donations section', () => {
    expect(screen.getByText('Payment & Donations')).toBeInTheDocument();
    expect(screen.getByText('Free to Use')).toBeInTheDocument();
    expect(screen.getByText('Support Development')).toBeInTheDocument();
  });

  it('navigates to home when clicking the logo', async () => {
    const logo = screen.getByText('PackVote');
    await logo.click();
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('navigates to create trip when clicking the start button', async () => {
    const startButton = screen.getByText('Start a Trip');
    await startButton.click();
    expect(mockNavigate).toHaveBeenCalledWith('/create-trip');
  });
}); 