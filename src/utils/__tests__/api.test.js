import { createTrip, sendSMS, saveSurveyResponse } from '../api';
import * as monitoring from '../monitoring';

// Mock fetch
global.fetch = jest.fn();

// Mock monitoring functions
jest.mock('../monitoring', () => ({
  startApiRequest: jest.fn(),
  trackApiRequest: jest.fn(),
  captureError: jest.fn()
}));

describe('API utilities with monitoring', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    fetch.mockClear();
  });

  it('handles successful createTrip call', async () => {
    // Mock successful response
    const mockResponse = {
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue({ trip_id: 'trip123' })
    };
    fetch.mockResolvedValue(mockResponse);

    // Test data
    const tripData = {
      trip_name: 'Test Trip',
      organizer_name: 'John Doe',
      organizer_phone: '1234567890',
      participants: [
        { name: 'Jane Doe', phone: '0987654321' }
      ]
    };

    // Call the function
    const result = await createTrip(tripData);

    // Verify API call was made
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/trips'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.any(Object),
        body: expect.any(String)
      })
    );

    // Verify startApiRequest was called
    expect(monitoring.startApiRequest).toHaveBeenCalled();

    // Verify trackApiRequest was called
    expect(monitoring.trackApiRequest).toHaveBeenCalled();

    // Check result
    expect(result).toEqual({ trip_id: 'trip123' });
  });

  it('handles error in createTrip call', async () => {
    // Mock failed response
    const errorResponse = {
      ok: false,
      status: 400,
      json: jest.fn().mockResolvedValue({
        detail: { message: 'Invalid data', code: 'VALIDATION_ERROR' }
      })
    };
    fetch.mockResolvedValue(errorResponse);

    // Test data
    const tripData = {
      trip_name: 'Test Trip',
      organizer_name: 'John Doe',
      organizer_phone: '1234567890',
      participants: []
    };

    // Call the function and expect it to throw
    await expect(createTrip(tripData)).rejects.toThrow();

    // Verify startApiRequest was called
    expect(monitoring.startApiRequest).toHaveBeenCalled();

    // Verify trackApiRequest was called
    expect(monitoring.trackApiRequest).toHaveBeenCalled();

    // Verify error was captured
    expect(monitoring.captureError).toHaveBeenCalled();
  });

  it('handles successful sendSMS call', async () => {
    // Mock successful response
    const mockResponse = {
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue({ status: 'success' })
    };
    fetch.mockResolvedValue(mockResponse);

    // Call the function
    const result = await sendSMS('participant123');

    // Verify API call was made
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/send-sms'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.any(Object),
        body: expect.any(String)
      })
    );

    // Verify startApiRequest was called
    expect(monitoring.startApiRequest).toHaveBeenCalled();

    // Verify trackApiRequest was called
    expect(monitoring.trackApiRequest).toHaveBeenCalled();

    // Check result
    expect(result).toEqual({ status: 'success' });
  });

  it('handles successful saveSurveyResponse call', async () => {
    // Mock successful response
    const mockResponse = {
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue({ status: 'success' })
    };
    fetch.mockResolvedValue(mockResponse);

    // Test data
    const responseData = {
      tripId: 'trip123',
      name: 'Jane Doe',
      budget: '$1,000 - $1,500',
      preferredDates: ['2023-06-01', '2023-06-15'],
      minTripDays: '5',
      maxTripDays: '10',
      vibeChoices: ['beach', 'relaxing']
    };

    // Call the function
    const result = await saveSurveyResponse('participant123', responseData);

    // Verify API call was made
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/survey-response'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.any(Object),
        body: expect.any(String)
      })
    );

    // Verify startApiRequest was called
    expect(monitoring.startApiRequest).toHaveBeenCalled();

    // Verify trackApiRequest was called
    expect(monitoring.trackApiRequest).toHaveBeenCalled();

    // Check result
    expect(result).toEqual({ status: 'success' });
  });
});