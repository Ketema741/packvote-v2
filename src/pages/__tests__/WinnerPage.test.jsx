import React from 'react';
import { render, screen, waitFor, fireEvent } from '../../test-utils/test-utils';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import WinnerPage from '../WinnerPage';
import * as api from '../../utils/api';

// Create a theme instance
const theme = createTheme();

// Mock the API calls
jest.mock('../../utils/api', () => ({
  getTripDetails: jest.fn(),
  getTripWinner: jest.fn(),
  calculateWinner: jest.fn(),
  calculateSurveyStats: jest.fn(),
}));

// Mock the html2canvas library
jest.mock('html2canvas', () => jest.fn(() => Promise.resolve({
  toDataURL: jest.fn(() => 'data:image/png;base64,mocked'),
  height: 400,
  width: 600
})));

// Mock the jsPDF library
jest.mock('jspdf', () => {
  return jest.fn().mockImplementation(() => ({
    setProperties: jest.fn(),
    setFontSize: jest.fn(),
    setTextColor: jest.fn(),
    text: jest.fn(),
    addImage: jest.fn(),
    save: jest.fn(),
    internal: {
      pageSize: {
        getWidth: jest.fn(() => 210),
        getHeight: jest.fn(() => 297)
      }
    }
  }));
});

// Mock the useNavigate and useParams hook
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useParams: () => ({ tripId: 'mock-trip-id' }),
}));

describe('WinnerPage', () => {
  
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
  });
  
  it('displays loading state initially', async () => {
    // Setup API mocks for loading state
    api.getTripDetails.mockImplementation(() => new Promise(() => {})); // Never resolves to stay in loading
    api.getTripWinner.mockImplementation(() => new Promise(() => {}));
    
    await render(
      <ThemeProvider theme={theme}>
        <BrowserRouter>
          <WinnerPage />
        </BrowserRouter>
      </ThemeProvider>
    );
    
    expect(screen.getByText(/loading your trip details/i)).toBeInTheDocument();
  });
  
  it('displays error state when API fails', async () => {
    // Setup API mocks for error
    api.getTripDetails.mockRejectedValue(new Error('Failed to load trip data'));
    
    await render(
      <ThemeProvider theme={theme}>
        <BrowserRouter>
          <WinnerPage />
        </BrowserRouter>
      </ThemeProvider>
    );
    
    await waitFor(() => {
      expect(screen.getByText(/failed to load trip data/i)).toBeInTheDocument();
    });
  });
  
  it('displays voting in progress when no winner yet', async () => {
    // Setup API mocks for voting in progress
    api.getTripDetails.mockResolvedValue({
      participants: [
        { id: '1', name: 'John Doe', phone: '1234567890' },
        { id: '2', name: 'Jane Smith', phone: '0987654321' }
      ],
      survey_responses: []
    });
    
    api.getTripWinner.mockResolvedValue({
      status: 'error',
      message: 'No winner yet'
    });
    
    await render(
      <ThemeProvider theme={theme}>
        <BrowserRouter>
          <WinnerPage />
        </BrowserRouter>
      </ThemeProvider>
    );
    
    await waitFor(() => {
      expect(screen.getByText(/voting in progress/i)).toBeInTheDocument();
    });
  });
  
  it('displays winner details when voting is complete', async () => {
    // Setup API mocks for winner
    api.getTripDetails.mockResolvedValue({
      id: 'mock-trip-id',
      participants: [
        { id: '1', name: 'John Doe', phone: '1234567890' },
        { id: '2', name: 'Jane Smith', phone: '0987654321' }
      ],
      survey_responses: []
    });
    
    api.getTripWinner.mockResolvedValue({
      status: 'success',
      winner: {
        winner_details: {
          city: 'Paris',
          location: 'Paris',
          country: 'France',
          image_urls: ['https://example.com/paris.jpg'],
          budget_tier: '$1000-$1500',
          ideal_months: ['June', 'July']
        }
      }
    });
    
    api.calculateSurveyStats.mockReturnValue({
      overlappingRanges: []
    });
    
    await render(
      <ThemeProvider theme={theme}>
        <BrowserRouter>
          <WinnerPage />
        </BrowserRouter>
      </ThemeProvider>
    );
    
    await waitFor(() => {
      expect(screen.getByText(/trip confirmed/i)).toBeInTheDocument();
    });
    
    // Further confirm the component rendered correctly
    expect(screen.getByText(/what's next/i)).toBeInTheDocument();
  });
  
  it('allows navigation to share page', async () => {
    // Setup API mocks for winner
    api.getTripDetails.mockResolvedValue({
      id: 'mock-trip-id',
      participants: [
        { id: '1', name: 'John Doe', phone: '1234567890' },
      ],
      survey_responses: []
    });
    
    api.getTripWinner.mockResolvedValue({
      status: 'success',
      winner: {
        winner_details: {
          city: 'Paris',
          country: 'France',
          location: 'Paris',
          image_urls: ['https://example.com/paris.jpg']
        }
      }
    });
    
    // Mock window.alert
    const originalAlert = window.alert;
    window.alert = jest.fn();
    
    await render(
      <ThemeProvider theme={theme}>
        <BrowserRouter>
          <WinnerPage />
        </BrowserRouter>
      </ThemeProvider>
    );
    
    await waitFor(() => {
      expect(screen.getByText(/share on socials/i)).toBeInTheDocument();
    });
    
    // Click the share button
    const shareButton = screen.getByText(/share on socials/i);
    shareButton.click();
    
    // The button calls copyToClipboard which shows an alert
    expect(window.alert).toHaveBeenCalledWith('Link copied to clipboard!');
    
    // Clean up the mock
    window.alert = originalAlert;
  });
  
  it('calculates winner when the button is clicked', async () => {
    // Setup API mocks for voting in progress
    api.getTripDetails.mockResolvedValue({
      participants: [
        { id: '1', name: 'John Doe', phone: '1234567890' },
      ],
      survey_responses: []
    });
    
    api.getTripWinner.mockResolvedValue({
      status: 'error',
      message: 'No winner yet'
    });
    
    api.calculateWinner.mockResolvedValue({
      status: 'success',
      winner: {
        winner_details: {
          city: 'Rome',
          country: 'Italy',
          image_urls: ['https://example.com/rome.jpg']
        }
      }
    });
    
    api.calculateSurveyStats.mockReturnValue({
      overlappingRanges: [
        {
          start: new Date('2023-06-01'),
          end: new Date('2023-06-10')
        }
      ]
    });
    
    await render(
      <ThemeProvider theme={theme}>
        <BrowserRouter>
          <WinnerPage />
        </BrowserRouter>
      </ThemeProvider>
    );
    
    await waitFor(() => {
      expect(screen.getByText(/voting in progress/i)).toBeInTheDocument();
    });
    
    // Click the calculate winner button
    const calculateButton = screen.getByRole('button', { name: /calculate winner now/i });
    fireEvent.click(calculateButton);
    
    // Verify calculateWinner was called
    expect(api.calculateWinner).toHaveBeenCalledWith('mock-trip-id');
    
    // Mock the response for getTripDetails called after calculateWinner
    api.getTripDetails.mockResolvedValueOnce({
      participants: [{ id: '1', name: 'John Doe', phone: '1234567890' }],
      survey_responses: [{ trip_length: '7' }]
    });
    
    // Wait for the winner to be displayed
    await waitFor(() => {
      expect(api.calculateSurveyStats).toHaveBeenCalled();
    });
  });
}); 