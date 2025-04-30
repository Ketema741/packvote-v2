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
    // Transform the data to match the backend's expected format
    const backendData = {
      trip_id: responseData.tripId,
      user_id: participantId,
      name: responseData.name,
      live_location: responseData.liveLocation,
      budget: responseData.budget,
      preferred_dates: responseData.preferredDates,
      min_trip_days: parseInt(responseData.minTripDays),
      max_trip_days: parseInt(responseData.maxTripDays),
      vibe_choices: responseData.vibe || [],
      blackout_dates: responseData.blackoutDates,
      more_questions: responseData.moreQuestions,
      past_liked: responseData.pastLiked,
      revisit: responseData.revisit,
      past_disliked: responseData.pastDisliked,
      wish_list: responseData.wishList,
      activities: responseData.activities,
      priorities: responseData.priorities
    };

    const response = await fetch(`${API_BASE_URL}/survey-response`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(backendData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `HTTP error! Status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error saving survey response:', error);
    throw error;
  }
};

/**
 * Get trip details including survey responses
 * @param {string} tripId - Trip ID
 * @returns {Promise<Object>} Trip details with survey responses
 */
export const getTripDetails = async (tripId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/trips/${tripId}?include_responses=true`);

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting trip details:', error);
    throw error;
  }
};

/**
 * Calculate statistics from survey responses
 * @param {Array} responses - Array of survey responses
 * @returns {Object} Calculated statistics
 */
export const calculateSurveyStats = (responses) => {
  if (!responses || responses.length === 0) {
    return {
      medianBudget: 0,
      dateRange: {
        start: null,
        end: null,
        window: null
      },
      commonVibes: [],
      totalResponses: 0
    };
  }

  // Calculate median budget
  const budgets = responses
    .map(r => {
      // Handle budget ranges like "$1,000 - $1,500"
      const budgetStr = r.budget || "";
      
      // Special case: less than $500
      if (budgetStr.includes("< $500")) {
        return 500; // Use the upper bound
      }
      
      // Special case: $2,500+
      if (budgetStr.includes("$2,500+")) {
        return 2500; // Use the lower bound
      }
      
      // Handle regular ranges like "$500 - $1,000"
      const matches = budgetStr.match(/\$?([\d,]+)(?:\s*-\s*\$?([\d,]+))?/);
      
      if (!matches) return NaN;
      
      // If it's a range, calculate the average
      if (matches[2]) {
        const min = parseInt(matches[1].replace(/,/g, ''));
        const max = parseInt(matches[2].replace(/,/g, ''));
        return Math.round((min + max) / 2);
      }
      
      // If it's a single value
      return parseInt(matches[1].replace(/,/g, ''));
    })
    .filter(b => !isNaN(b))
    .sort((a, b) => a - b);
  
  const medianBudget = budgets.length > 0 
    ? budgets[Math.floor(budgets.length / 2)]
    : 0;

  // Calculate date ranges
  const dateRanges = responses.map(r => {
    const [start, end] = r.preferred_dates.split(' - ');
    return {
      start: new Date(start),
      end: new Date(end)
    };
  });

  const validDateRanges = dateRanges.filter(d => !isNaN(d.start.getTime()) && !isNaN(d.end.getTime()));
  
  const dateRange = validDateRanges.length > 0
    ? {
        start: new Date(Math.min(...validDateRanges.map(d => d.start.getTime()))),
        end: new Date(Math.max(...validDateRanges.map(d => d.end.getTime()))),
        window: Math.max(...validDateRanges.map(d => 
          Math.ceil((d.end - d.start) / (1000 * 60 * 60 * 24))
        ))
      }
    : {
        start: null,
        end: null,
        window: null
      };

  // Calculate most common vibes
  const allVibes = responses.flatMap(r => r.vibe_choices);
  const vibeCounts = allVibes.reduce((acc, vibe) => {
    acc[vibe] = (acc[vibe] || 0) + 1;
    return acc;
  }, {});

  const commonVibes = Object.entries(vibeCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([vibe]) => vibe);

  return {
    medianBudget,
    dateRange,
    commonVibes,
    totalResponses: responses.length
  };
}; 