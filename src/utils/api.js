/**
 * API service for interacting with the backend
 */

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/api';

/**
 * Create a new trip with participants
 * @param {Object} tripData - Trip creation data
 * @returns {Promise<Object>} Trip creation result
 */
export const createTrip = async (tripData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/trips`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(tripData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating trip:', error);
    throw error;
  }
};

/**
 * Send SMS to a specific participant
 * @param {string} participantId - Participant ID
 * @returns {Promise<Object>} SMS sending result
 */
export const sendSMS = async (participantId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/send-sms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ participant_id: participantId }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error sending SMS:', error);
    throw error;
  }
};

/**
 * Send SMS to all participants in a trip
 * @param {string} tripId - Trip ID
 * @returns {Promise<Object>} SMS sending result
 */
export const sendAllSMS = async (tripId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/send-all-sms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ trip_id: tripId }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error sending all SMS:', error);
    throw error;
  }
};

/**
 * Save a participant's survey response
 * @param {string} participantId - Participant ID
 * @param {Object} responseData - Survey response data
 * @returns {Promise<Object>} Save result
 */
export const saveSurveyResponse = async (participantId, responseData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/survey-response`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        participant_id: participantId,
        response_data: responseData,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error saving survey response:', error);
    throw error;
  }
};

/**
 * Get trip details
 * @param {string} tripId - Trip ID
 * @returns {Promise<Object>} Trip details
 */
export const getTripDetails = async (tripId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/trips/${tripId}`);

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting trip details:', error);
    throw error;
  }
}; 