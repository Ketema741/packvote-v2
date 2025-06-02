import React from 'react';
import { render, screen, waitFor } from '../../test-utils/test-utils';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CreateTrip from '../CreateTrip';
import userEvent from '@testing-library/user-event';
import * as api from '../../utils/api';

// Create a theme instance
const theme = createTheme();

// Mock the API calls
jest.mock('../../utils/api', () => ({
  createTrip: jest.fn()
}));

// Set up the mock implementation before each test
const mockApiResponse = {
  trip_id: '123',
  organizer: {
    id: '456',
    name: 'John Doe',
    phone: '+15551000401'
  },
  participants: [
    {
      id: '789',
      name: 'Jane Doe',
      phone: '+15551000402'
    }
  ]
};

// Mock the useNavigate hook
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

describe('CreateTrip', () => {
  const renderComponent = async () => {
    await render(
      <ThemeProvider theme={theme}>
        <BrowserRouter>
          <CreateTrip />
        </BrowserRouter>
      </ThemeProvider>
    );
  };

  beforeEach(() => {
    // Clear mocks before each test
    mockNavigate.mockClear();
    api.createTrip.mockClear();

    // Set up the API mock to resolve successfully
    api.createTrip.mockImplementation(() => Promise.resolve(mockApiResponse));
  });

  it('renders the form with all required fields', async () => {
    await renderComponent();
    expect(screen.getByLabelText(/trip name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/your name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/your phone/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add participant/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create trip/i })).toBeInTheDocument();
  });

  it('allows adding participants', async () => {
    await renderComponent();
    // Fill in trip name
    await userEvent.type(screen.getByLabelText(/trip name/i), 'Test Trip');

    // Add a participant
    await userEvent.click(screen.getByRole('button', { name: /add participant/i }));

    // Wait for participant inputs to appear and find them by label rather than participant name/phone
    await waitFor(() => {
      // After adding a participant, we should have inputs with label "Name" and "Phone"
      const nameInputs = screen.getAllByLabelText(/name/i);
      // We should have 3 name inputs (trip name, your name, participant name)
      expect(nameInputs.length).toBe(3);
    });

    await waitFor(() => {
      const phoneInputs = screen.getAllByLabelText(/phone/i);
      // And 2 phone inputs (your phone, participant phone)
      expect(phoneInputs.length).toBe(2);
    });
  });

  it('allows removing participants', async () => {
    await renderComponent();
    // Fill in trip name
    await userEvent.type(screen.getByLabelText(/trip name/i), 'Test Trip');

    // Add a participant
    await userEvent.click(screen.getByRole('button', { name: /add participant/i }));

    // Wait for participant inputs to appear
    await waitFor(() => {
      // After adding a participant, we should now have delete icon buttons
      const deleteButtons = screen.getAllByTestId('DeleteIcon');
      expect(deleteButtons.length).toBeGreaterThan(0);
    });

    // Count inputs before removing
    const nameInputsBefore = screen.getAllByLabelText(/name/i);
    const phoneInputsBefore = screen.getAllByLabelText(/phone/i);

    // Remove the participant by clicking the delete icon
    const deleteButtons = screen.getAllByTestId('DeleteIcon');
    await userEvent.click(deleteButtons[0]);

    // Verify participant was removed - should have fewer inputs now
    await waitFor(() => {
      const nameInputsAfter = screen.getAllByLabelText(/name/i);
      expect(nameInputsAfter.length).toBeLessThan(nameInputsBefore.length);
    });

    await waitFor(() => {
      const phoneInputsAfter = screen.getAllByLabelText(/phone/i);
      expect(phoneInputsAfter.length).toBeLessThan(phoneInputsBefore.length);
    });
  });

  it('validates required fields', async () => {
    await renderComponent();
    // Try to submit without filling required fields
    await userEvent.click(screen.getByRole('button', { name: /create trip/i }));

    // Check for validation messages
    await waitFor(() => {
      // Look for one of these specific messages
      const errorMessage = screen.getByText('Trip name is required');
      expect(errorMessage).toBeInTheDocument();
    });
  });

  it('submits the form with valid data', async () => {
    await renderComponent();
    // Fill in trip name
    await userEvent.type(screen.getByLabelText(/trip name/i), 'Test Trip');

    // Fill in organizer details
    await userEvent.type(screen.getByLabelText(/your name/i), 'John Doe');
    await userEvent.type(screen.getByLabelText(/your phone/i), '5555550101');

    // Add a participant
    await userEvent.click(screen.getByRole('button', { name: /add participant/i }));

    // Wait for participant inputs to appear
    await waitFor(() => {
      const deleteButtons = screen.getAllByTestId('DeleteIcon');
      expect(deleteButtons.length).toBeGreaterThan(0);
    });

    // Find participant inputs by labels
    const nameInputs = screen.getAllByLabelText(/name/i);
    const phoneInputs = screen.getAllByLabelText(/phone/i);

    // The last name input should be the participant name input
    const participantNameInput = nameInputs[nameInputs.length - 1];
    // The last phone input should be the participant phone input
    const participantPhoneInput = phoneInputs[phoneInputs.length - 1];

    // Fill in participant details
    await userEvent.type(participantNameInput, 'Jane Doe');
    await userEvent.type(participantPhoneInput, '1234567890');

    // Submit the form
    await userEvent.click(screen.getByRole('button', { name: /create trip/i }));

    // Verify API was called with correct data
    await waitFor(() => {
      expect(api.createTrip).toHaveBeenCalledWith({
        organizer_name: 'John Doe',
        organizer_phone: '+15555550101',
        trip_name: 'Test Trip',
        participants: [{
          name: 'Jane Doe',
          phone: '+11234567890'
        }]
      });
    });

    // Verify navigation occurred with the correct state
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/trip-links', {
        state: {
          tripData: {
            tripId: mockApiResponse.trip_id,
            organizer: mockApiResponse.organizer,
            participants: mockApiResponse.participants
          }
        }
      });
    });
  });
});