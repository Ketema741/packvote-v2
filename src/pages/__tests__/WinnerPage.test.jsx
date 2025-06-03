import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import WinnerPage from '../WinnerPage';
import * as api from '../../utils/api';

// Mock the API module
jest.mock('../../utils/api');

// Mock jsPDF to prevent canvas issues in tests
jest.mock('jspdf', () => {
  return jest.fn().mockImplementation(() => ({
    setFont: jest.fn(),
    setFillColor: jest.fn(),
    rect: jest.fn(),
    setTextColor: jest.fn(),
    setFontSize: jest.fn(),
    text: jest.fn(),
    roundedRect: jest.fn(),
    setDrawColor: jest.fn(),
    setLineWidth: jest.fn(),
    addImage: jest.fn(),
    splitTextToSize: jest.fn(() => ['line1', 'line2']),
    save: jest.fn()
  }));
});

// Mock the imageService
jest.mock('../../utils/imageService', () => ({
  getDestinationImage: jest.fn(() => Promise.resolve('https://example.com/image.jpg')),
  getImageSync: jest.fn(() => 'https://example.com/sync-image.jpg')
}));

// Mock react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useLocation: () => ({ state: null }),
  useParams: () => ({ tripId: 'mock-trip-id' })
}));

const theme = createTheme();

describe('WinnerPage', () => {

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Reset API mocks to default implementations
    api.getTripDetails.mockResolvedValue({
      participants: [],
      survey_responses: []
    });
    
    api.getTripWinner.mockResolvedValue({
      status: 'error',
      message: 'No winner yet'
    });
    
    api.calculateWinner.mockResolvedValue({
      status: 'success'
    });
    
    api.calculateSurveyStats.mockReturnValue({
      overlappingRanges: []
    });
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
        { id: '1', name: 'John Doe', phone: '1234567890' }
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
      expect(screen.getByText(/share on socials/i)).toBeInTheDocument();
    });

    // Click the share button
    const shareButton = screen.getByText(/share on socials/i);
    fireEvent.click(shareButton);

    // The button should navigate to the share page
    expect(mockNavigate).toHaveBeenCalledWith('/share', {
      state: {
        winnerDestination: {
          destination: 'Paris',
          city: 'Paris',
          country: 'France',
          location: 'Paris'
        },
        dates: 'Dates to be determined',
        travelers: '1 travelers',
        tripId: 'mock-trip-id',
        imageUrl: '' // The image might still be loading or empty in tests
      }
    });
  });

  it('calculates winner when the button is clicked', async () => {
    // Setup API mocks for voting in progress
    api.getTripDetails.mockResolvedValue({
      participants: [
        { id: '1', name: 'John Doe', phone: '1234567890' }
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