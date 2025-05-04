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
    // Ensure all array fields are properly formatted
    const ensureArray = (value) => {
      if (!value) return [];
      if (Array.isArray(value)) return value;
      return [value];
    };

    // Transform the data to match the backend's expected format
    const backendData = {
      trip_id: responseData.tripId,
      user_id: responseData.userId || participantId,
      name: responseData.name,
      live_location: responseData.liveLocation,
      budget: responseData.budget,
      preferred_dates: ensureArray(responseData.preferredDates),
      blackout_dates: ensureArray(responseData.blackoutDates),
      min_trip_days: parseInt(responseData.minTripDays),
      max_trip_days: parseInt(responseData.maxTripDays),
      vibe_choices: ensureArray(responseData.vibeChoices),
      more_questions: responseData.moreQuestions,
      past_liked: responseData.pastLiked,
      revisit: responseData.revisit,
      past_disliked: responseData.pastDisliked,
      wish_list: responseData.wishList,
      activities: responseData.activities,
      priorities: ensureArray(responseData.priorities)
    };

    console.log('Sending survey response:', backendData);

    // Use proper JSON stringification with replacer to handle non-serializable values
    const stringified = JSON.stringify(backendData, (key, value) => {
      // Handle special cases for array serialization if needed
      if (Array.isArray(value)) {
        return value;
      }
      return value;
    });
    console.log('JSON stringified data:', stringified);

    const response = await fetch(`${API_BASE_URL}/survey-response`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: stringified,
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

  console.log('Calculating survey stats from', responses.length, 'responses');
  
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

  // Parse all preferred date ranges
  const preferredDateRanges = responses.flatMap(r => {
    // Handle multiple preferred date ranges separated by semicolons
    const dateRangesStr = r.preferred_dates || "";
    return dateRangesStr.split(';').map(range => {
      const [start, end] = range.trim().split(' - ');
      return {
        start: new Date(start),
        end: new Date(end)
      };
    });
  }).filter(d => !isNaN(d.start?.getTime()) && !isNaN(d.end?.getTime()));

  console.log('All preferred date ranges:', preferredDateRanges.map(d => 
    `${d.start.toLocaleDateString()} - ${d.end.toLocaleDateString()}`
  ));

  // Parse all blackout date ranges
  const blackoutDateRanges = responses.flatMap(r => {
    // Handle multiple blackout date ranges separated by semicolons
    const dateRangesStr = r.blackout_dates || "";
    if (!dateRangesStr) return [];
    
    return dateRangesStr.split(';').map(range => {
      const [start, end] = range.trim().split(' - ');
      return {
        start: new Date(start),
        end: new Date(end)
      };
    });
  }).filter(d => !isNaN(d.start?.getTime()) && !isNaN(d.end?.getTime()));

  console.log('All blackout date ranges:', blackoutDateRanges.map(d => 
    `${d.start.toLocaleDateString()} - ${d.end.toLocaleDateString()}`
  ));

  // Group preferred date ranges by user
  const preferredDatesByUser = responses.map(r => {
    const dateRangesStr = r.preferred_dates || "";
    if (!dateRangesStr) return [];
    
    return dateRangesStr.split(';')
      .map(range => {
        const [start, end] = range.trim().split(' - ');
        return {
          start: new Date(start),
          end: new Date(end)
        };
      })
      .filter(d => !isNaN(d.start?.getTime()) && !isNaN(d.end?.getTime()));
  }).filter(ranges => ranges.length > 0);

  console.log('Preferred dates by user:', preferredDatesByUser.map(
    (ranges, i) => `User ${i+1}: ${ranges.map(d => 
      `${d.start.toLocaleDateString()} - ${d.end.toLocaleDateString()}`
    ).join(', ')}`
  ));

  // Function to check if two date ranges overlap
  const checkOverlap = (range1, range2) => {
    return range1.start <= range2.end && range2.start <= range1.end;
  };

  // Function to get the overlap between two date ranges
  const getOverlap = (range1, range2) => {
    return {
      start: new Date(Math.max(range1.start.getTime(), range2.start.getTime())),
      end: new Date(Math.min(range1.end.getTime(), range2.end.getTime()))
    };
  };

  // Function to check if a date range overlaps with any blackout period
  const overlapsWithBlackout = (range) => {
    return blackoutDateRanges.some(blackout => checkOverlap(range, blackout));
  };

  // Find overlapping date ranges across all users
  let overlappingRanges = [];

  if (preferredDatesByUser.length > 0) {
    // Start with the first user's preferred dates
    overlappingRanges = [...preferredDatesByUser[0]];
    console.log('Starting with first user ranges:', overlappingRanges.map(d => 
      `${d.start.toLocaleDateString()} - ${d.end.toLocaleDateString()}`
    ));
    
    // For each subsequent user, find overlaps with current overlapping ranges
    for (let i = 1; i < preferredDatesByUser.length; i++) {
      const userRanges = preferredDatesByUser[i];
      const newOverlaps = [];
      
      // Check each current overlap against each of this user's ranges
      for (const currentOverlap of overlappingRanges) {
        for (const userRange of userRanges) {
          if (checkOverlap(currentOverlap, userRange)) {
            newOverlaps.push(getOverlap(currentOverlap, userRange));
          }
        }
      }
      
      overlappingRanges = newOverlaps;
      console.log(`After processing user ${i+1}, overlapping ranges:`, overlappingRanges.map(d => 
        `${d.start.toLocaleDateString()} - ${d.end.toLocaleDateString()}`
      ));
      
      // If we have no more overlaps, break early
      if (overlappingRanges.length === 0) break;
    }
  }

  // Remove any overlapping ranges that conflict with blackout dates
  const validOverlaps = overlappingRanges.filter(range => !overlapsWithBlackout(range));
  console.log('Overlapping ranges after removing blackout dates:', validOverlaps.map(d => 
    `${d.start.toLocaleDateString()} - ${d.end.toLocaleDateString()}`
  ));

  // Sort valid overlaps by start date
  validOverlaps.sort((a, b) => a.start.getTime() - b.start.getTime());

  // Calculate the date range from the valid overlapping periods
  const dateRange = validOverlaps.length > 0
    ? {
        start: validOverlaps[0].start,
        end: validOverlaps[validOverlaps.length - 1].end,
        window: Math.max(...validOverlaps.map(d => 
          Math.ceil((d.end - d.start) / (1000 * 60 * 60 * 24))
        ))
      }
    : {
        start: null,
        end: null,
        window: null
      };

  console.log('Final date range:', dateRange.start ? 
    `${dateRange.start.toLocaleDateString()} - ${dateRange.end.toLocaleDateString()} (${dateRange.window} days)` : 
    'No valid dates found'
  );

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
    totalResponses: responses.length,
    // Add overlapping ranges for more detailed display if needed
    overlappingRanges: validOverlaps
  };
};

/**
 * Generate travel recommendations for a trip
 * @param {string} tripId - Trip ID
 * @param {Object} options - Additional options (numRecommendations, temperature)
 * @returns {Promise<Object>} Generated recommendations
 */
export const generateTravelRecommendations = async (tripId, options = {}) => {
  try {
    const { numRecommendations = 3, temperature = 0.7 } = options;
    
    const response = await fetch(`${API_BASE_URL}/recommendations/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        trip_id: tripId,
        num_recommendations: numRecommendations,
        temperature: temperature
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `HTTP error! Status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error generating travel recommendations:', error);
    throw error;
  }
};

/**
 * Get stored travel recommendations for a trip
 * @param {string} tripId - Trip ID
 * @returns {Promise<Object>} Stored recommendations
 */
export const getTravelRecommendations = async (tripId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/recommendations/${tripId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      // If 404, it means no recommendations yet - this is not an error
      if (response.status === 404) {
        return { recommendations: [] };
      }
      
      const errorData = await response.json();
      throw new Error(errorData.detail || `HTTP error! Status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting travel recommendations:', error);
    throw error;
  }
}; 