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
    // Transform the data to match the backend's expected format
    const backendData = {
      trip_name: tripData.trip_name,
      organizer_id: tripData.organizer_phone, // Using phone as ID for now
      participants: [
        // Include organizer as the first participant
        {
          name: tripData.organizer_name,
          phone: tripData.organizer_phone
        },
        // Then include the rest of the participants
        ...tripData.participants.map(p => ({
          name: p.name,
          phone: p.phone
        }))
      ]
    };

    const response = await fetch(`${API_BASE_URL}/trips/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(backendData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      
      // Handle duplicate trip error
      if (errorData.detail && errorData.detail.code === 'DUPLICATE_TRIP') {
        throw new Error("A trip with this name and participants already exists. Please create a new trip with a different name or participants.");
      }
      
      throw new Error(errorData.detail?.message || errorData.detail || `HTTP error! Status: ${response.status}`);
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