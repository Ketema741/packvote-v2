/**
 * API service for interacting with the backend
 */
import { startApiRequest, trackApiRequest, captureError } from './monitoring';
import { safeLog, sanitizeForLogging } from './loggingSanitizer';
import { rateLimitedFetch, checkRateLimit } from './rateLimiter';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/api';

/**
 * Enhanced fetch wrapper that handles rate limiting and standard error processing
 * @param {string} url - URL to fetch
 * @param {Object} options - Fetch options
 * @param {boolean} respectRateLimit - Whether to respect client-side rate limits
 * @returns {Promise<Response>} - Fetch response
 */
const apiRequest = async (url, options = {}, respectRateLimit = true) => {
  // Check rate limit before making request
  if (respectRateLimit) {
    const limitStatus = checkRateLimit(url);
    if (!limitStatus.allowed) {
      const error = new Error(`Rate limit exceeded. Please wait ${limitStatus.retryAfter} seconds before retrying.`);
      error.code = 'RATE_LIMIT_EXCEEDED';
      error.retryAfter = limitStatus.retryAfter;
      throw error;
    }
  }
  
  // Use rate limited fetch
  const response = await rateLimitedFetch(url, options, respectRateLimit);
  
  // Handle rate limit responses from server
  if (response.status === 429) {
    const retryAfter = response.headers.get('Retry-After') || 60;
    const error = new Error(`Server rate limit exceeded. Please wait ${retryAfter} seconds before retrying.`);
    error.code = 'SERVER_RATE_LIMIT_EXCEEDED';
    error.retryAfter = parseInt(retryAfter);
    throw error;
  }
  
  return response;
};

/**
 * Create a new trip with participants
 * @param {Object} tripData - Trip creation data
 * @returns {Promise<Object>} Trip creation result
 */
export const createTrip = async (tripData) => {
  const url = `${API_BASE_URL}/trips/`;
  const startTime = startApiRequest(url, 'POST');

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

    const response = await apiRequest(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(backendData)
    });

    // Track API response
    trackApiRequest(url, 'POST', startTime, response.status);

    if (!response.ok) {
      const errorData = await response.json();

      // Handle duplicate trip error
      if (errorData.detail && errorData.detail.code === 'DUPLICATE_TRIP') {
        const error = new Error('A trip with this name and participants already exists. Please create a new trip with a different name or participants.');
        captureError(error, {
          endpoint: url,
          status: response.status,
          errorCode: 'DUPLICATE_TRIP'
        });
        throw error;
      }

      const error = new Error(errorData.detail?.message || errorData.detail || `HTTP error! Status: ${response.status}`);
      captureError(error, {
        endpoint: url,
        status: response.status,
        errorType: 'API_ERROR'
      });
      throw error;
    }

    return await response.json();
  } catch (error) {
    safeLog.error('Error creating trip:', error);
    
    // Handle rate limit errors specifically
    if (error.code === 'RATE_LIMIT_EXCEEDED' || error.code === 'SERVER_RATE_LIMIT_EXCEEDED') {
      safeLog.warn(`Rate limit hit for trip creation: ${error.message}`);
      // Don't capture rate limit errors as they're expected behavior
      throw error;
    }
    
    // If the error wasn't already captured (e.g., network error)
    if (!error.message.includes('A trip with this name') && !error.message.includes('HTTP error')) {
      captureError(error, {
        endpoint: url,
        errorType: 'NETWORK_ERROR'
      });
    }
    throw error;
  }
};

/**
 * Send SMS to a specific participant
 * @param {string} participantId - Participant ID
 * @returns {Promise<Object>} SMS sending result
 */
export const sendSMS = async (participantId) => {
  const url = `${API_BASE_URL}/send-sms`;
  const startTime = startApiRequest(url, 'POST');

  try {
    const response = await apiRequest(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ participant_id: participantId })
    });

    // Track API response
    trackApiRequest(url, 'POST', startTime, response.status);

    if (!response.ok) {
      const error = new Error(`HTTP error! Status: ${response.status}`);
      captureError(error, {
        endpoint: url,
        status: response.status,
        participantId
      });
      throw error;
    }

    return await response.json();
  } catch (error) {
    safeLog.error('Error sending SMS:', error);
    
    // Handle rate limit errors specifically
    if (error.code === 'RATE_LIMIT_EXCEEDED' || error.code === 'SERVER_RATE_LIMIT_EXCEEDED') {
      safeLog.warn(`Rate limit hit for SMS sending: ${error.message}`);
      throw error;
    }
    
    if (!error.message.includes('HTTP error')) {
      captureError(error, {
        endpoint: url,
        errorType: 'NETWORK_ERROR',
        participantId
      });
    }
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
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ trip_id: tripId })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    safeLog.error('Error sending all SMS:', error);
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
  const url = `${API_BASE_URL}/survey-response`;
  const startTime = startApiRequest(url, 'POST');

  try {
    // Ensure all array fields are properly formatted
    const ensureArray = (value) => {
      if (!value) {return [];}
      if (Array.isArray(value)) {return value;}
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

    // Log sanitized data
    safeLog.info('Sending survey response:', sanitizeForLogging(backendData));

    // Use proper JSON stringification with replacer to handle non-serializable values
    const stringified = JSON.stringify(backendData, (key, value) => {
      // Handle special cases for array serialization if needed
      if (Array.isArray(value)) {
        return value;
      }
      return value;
    });

    // For debugging, log only the length, not the content
    safeLog.info(`JSON stringified data length: ${stringified.length} chars`);

    const response = await apiRequest(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: stringified
    });

    // Track API response
    trackApiRequest(url, 'POST', startTime, response.status);

    if (!response.ok) {
      const error = new Error(`HTTP error! Status: ${response.status}`);
      captureError(error, {
        endpoint: url,
        status: response.status,
        participantId
      });
      throw error;
    }

    return await response.json();
  } catch (error) {
    safeLog.error('Error saving survey response:', error);
    
    // Handle rate limit errors specifically
    if (error.code === 'RATE_LIMIT_EXCEEDED' || error.code === 'SERVER_RATE_LIMIT_EXCEEDED') {
      safeLog.warn(`Rate limit hit for survey response: ${error.message}`);
      throw error;
    }
    
    if (!error.message.includes('HTTP error')) {
      captureError(error, {
        endpoint: url,
        errorType: 'NETWORK_ERROR',
        participantId
      });
    }
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

  safeLog.info(`Calculating survey stats from ${responses.length} responses`);

  // Calculate median budget
  const budgets = responses
    .map(r => {
      // Handle budget ranges like "$1,000 - $1,500"
      const budgetStr = r.budget || '';

      // Special case: less than $500
      if (budgetStr.includes('< $500')) {
        return 500; // Use the upper bound
      }

      // Special case: $2,500+
      if (budgetStr.includes('$2,500+')) {
        return 2500; // Use the lower bound
      }

      // Handle regular ranges like "$500 - $1,000"
      const matches = budgetStr.match(/\$?([\d,]+)(?:\s*-\s*\$?([\d,]+))?/);

      if (!matches) {return NaN;}

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

  // Helper function to safely parse dates in various formats
  const parseDate = (dateStr) => {
    if (!dateStr) {return null;}

    // Try direct parsing first, but set time to noon to avoid timezone issues
    const dateWithoutTime = dateStr.split('T')[0]; // Remove any time component if present
    const date = new Date(`${dateWithoutTime}T12:00:00`); // Use noon to avoid timezone shifts

    if (!isNaN(date.getTime())) {return date;}

    // Try other formats if direct parsing failed
    // Check for MM/DD/YYYY format
    const usFormat = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
    const usMatch = dateStr.match(usFormat);
    if (usMatch) {
      return new Date(parseInt(usMatch[3]), parseInt(usMatch[1]) - 1, parseInt(usMatch[2]), 12, 0, 0);
    }

    safeLog.info(`Failed to parse date: ${dateStr}`);
    return null;
  };

  // Parse all preferred date ranges
  const preferredDateRanges = responses.flatMap((r, index) => {
    // Don't log user's date preferences - potential PII
    const dateRanges = Array.isArray(r.preferred_dates)
      ? r.preferred_dates
      : (String(r.preferred_dates || '').split(';'));

    return dateRanges.map(range => {
      // Handle various formats of date ranges
      let start, end;

      if (typeof range === 'string') {
        // Try both "to" and "-" separators
        if (range.includes(' to ')) {
          const parts = range.split(' to ');
          start = parseDate(parts[0].trim());
          end = parseDate(parts[1].trim());
        } else if (range.includes(' - ')) {
          const parts = range.split(' - ');
          start = parseDate(parts[0].trim());
          end = parseDate(parts[1].trim());
        } else {
          // Don't log unrecognized data
          return { start: null, end: null };
        }
      } else if (range && typeof range === 'object') {
        // Object with start/end properties
        start = parseDate(range.start);
        end = parseDate(range.end);
      } else {
        // Don't log invalid data
        return { start: null, end: null };
      }

      return { start, end };
    }).filter(d => d.start && d.end && !isNaN(d.start.getTime()) && !isNaN(d.end.getTime()));
  });

  // Only log count, not actual date ranges
  safeLog.info(`Found ${preferredDateRanges.length} valid preferred date ranges`);

  // Parse all blackout date ranges
  const blackoutDateRanges = responses.flatMap((r, index) => {
    // Don't log user's blackout dates - potential PII
    const dateRanges = Array.isArray(r.blackout_dates)
      ? r.blackout_dates
      : (String(r.blackout_dates || '').split(';'));

    return dateRanges.map(range => {
      // Handle various formats of date ranges
      let start, end;

      if (typeof range === 'string') {
        // Try both "to" and "-" separators
        if (range.includes(' to ')) {
          const parts = range.split(' to ');
          start = parseDate(parts[0].trim());
          end = parseDate(parts[1].trim());
        } else if (range.includes(' - ')) {
          const parts = range.split(' - ');
          start = parseDate(parts[0].trim());
          end = parseDate(parts[1].trim());
        } else {
          // Don't log unrecognized data
          return { start: null, end: null };
        }
      } else if (range && typeof range === 'object') {
        // Object with start/end properties
        start = parseDate(range.start);
        end = parseDate(range.end);
      } else {
        // Don't log invalid data
        return { start: null, end: null };
      }

      return { start, end };
    }).filter(d => d.start && d.end && !isNaN(d.start.getTime()) && !isNaN(d.end.getTime()));
  });

  // Only log count, not actual blackout ranges
  safeLog.info(`Found ${blackoutDateRanges.length} valid blackout date ranges`);

  // Group preferred date ranges by user for overlap calculation
  const preferredDatesByUser = responses.map((r, index) => {
    // Don't log individual user data
    const dateRanges = Array.isArray(r.preferred_dates)
      ? r.preferred_dates
      : (String(r.preferred_dates || '').split(';'));

    const parsedRanges = dateRanges.map(range => {
      // Handle various formats of date ranges
      let start, end;

      if (typeof range === 'string') {
        // Try both "to" and "-" separators
        if (range.includes(' to ')) {
          const parts = range.split(' to ');
          start = parseDate(parts[0].trim());
          end = parseDate(parts[1].trim());
        } else if (range.includes(' - ')) {
          const parts = range.split(' - ');
          start = parseDate(parts[0].trim());
          end = parseDate(parts[1].trim());
        } else {
          return { start: null, end: null };
        }
      } else if (range && typeof range === 'object') {
        // Object with start/end properties
        start = parseDate(range.start);
        end = parseDate(range.end);
      } else {
        return { start: null, end: null };
      }

      return { start, end };
    }).filter(d => d.start && d.end && !isNaN(d.start.getTime()) && !isNaN(d.end.getTime()));

    return parsedRanges;
  }).filter(ranges => ranges.length > 0);

  safeLog.info(`Found date preferences from ${preferredDatesByUser.length} users`);

  // Function to check if two date ranges overlap
  const checkOverlap = (range1, range2) => {
    // Make sure we have valid dates
    if (!range1.start || !range1.end || !range2.start || !range2.end) {
      return false;
    }

    // Two ranges overlap if one starts before the other ends
    return range1.start <= range2.end && range2.start <= range1.end;
  };

  // Function to get the overlap between two date ranges
  const getOverlap = (range1, range2) => {
    const start = new Date(Math.max(range1.start.getTime(), range2.start.getTime()));
    const end = new Date(Math.min(range1.end.getTime(), range2.end.getTime()));
    return { start, end };
  };

  // Function to check if a date range overlaps with any blackout period
  const overlapsWithBlackout = (range) => {
    // If we have no blackout dates, nothing can overlap
    if (blackoutDateRanges.length === 0) {
      return false;
    }

    // Check each blackout date range
    for (const blackout of blackoutDateRanges) {
      // A range overlaps with a blackout if they share any days
      const hasOverlap = range.start <= blackout.end && blackout.start <= range.end;

      if (hasOverlap) {
        return true;
      }
    }
    return false;
  };

  // Find overlapping date ranges across all users
  let overlappingRanges = [];

  if (preferredDatesByUser.length > 0) {
    // Start with the first user's preferred dates
    overlappingRanges = [...preferredDatesByUser[0]];

    // For each subsequent user, find overlaps with current overlapping ranges
    for (let i = 1; i < preferredDatesByUser.length; i++) {
      const userRanges = preferredDatesByUser[i];
      const newOverlaps = [];

      // Check each current overlap against each of this user's ranges
      for (const currentOverlap of overlappingRanges) {
        for (const userRange of userRanges) {
          if (checkOverlap(currentOverlap, userRange)) {
            const overlap = getOverlap(currentOverlap, userRange);
            newOverlaps.push(overlap);
          }
        }
      }

      overlappingRanges = newOverlaps;

      // If we have no more overlaps, break early
      if (overlappingRanges.length === 0) {break;}
    }
  }

  safeLog.info(`Found ${overlappingRanges.length} total overlapping ranges between users`);

  // Remove any overlapping ranges that conflict with blackout dates
  let validOverlaps = overlappingRanges.filter(range => !overlapsWithBlackout(range));

  safeLog.info(`Found ${validOverlaps.length} valid overlapping ranges after removing blackout conflicts`);

  // If for some reason we found no valid overlaps but have overlapping ranges,
  // we might have an issue with the blackout date filtering
  if (validOverlaps.length === 0 && overlappingRanges.length > 0) {
    safeLog.info('WARNING: Found overlapping ranges but none are valid after blackout filtering.');

    // As a fallback, let's use the overlapping ranges even if they conflict with blackout dates
    // This ensures we show something to the user rather than nothing
    safeLog.info('Using overlapping ranges as fallback since no valid overlaps found after blackout filtering');
    validOverlaps = overlappingRanges;
  }

  // Sort valid overlaps by start date
  validOverlaps.sort((a, b) => a.start.getTime() - b.start.getTime());

  // Calculate the date range from the valid overlapping periods
  const dateRange = validOverlaps.length > 0
    ? {
      start: validOverlaps[0].start,
      end: validOverlaps[validOverlaps.length - 1].end,
      window: Math.max(...validOverlaps.map(d =>
        Math.ceil((d.end - d.start) / (1000 * 60 * 60 * 24)) + 1 // +1 to include both start and end days
      ))
    }
    : {
      start: null,
      end: null,
      window: null
    };

  // Log formatted date range for debugging - safe to log as it's just calculated dates, not user input
  if (dateRange.start) {
    safeLog.info(`Final date range: ${dateRange.start.toLocaleDateString()} to ${dateRange.end.toLocaleDateString()} (${dateRange.window} days)`);
  } else {
    safeLog.info('No valid dates found');
  }

  // Calculate most common vibes
  const allVibes = responses.flatMap(r => r.vibe_choices || []);

  const vibeCounts = allVibes.reduce((acc, vibe) => {
    if (vibe) {
      acc[vibe] = (acc[vibe] || 0) + 1;
    }
    return acc;
  }, {});

  const commonVibes = Object.entries(vibeCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([vibe]) => vibe);

  safeLog.info(`Found ${commonVibes.length} common vibes`);

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
    const {
      numRecommendations = 3,
      temperature = 0.7,
      feedback = null,
      previousRecommendations = null
    } = options;

    safeLog.info('Generating travel recommendations for trip:', tripId);

    const response = await apiRequest(`${API_BASE_URL}/recommendations/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        trip_id: tripId,
        num_recommendations: numRecommendations,
        temperature: temperature,
        feedback: feedback,
        previous_recommendations: previousRecommendations
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();

    // Process the recommendations to handle field mapping and filter invalid ones
    if (data && data.recommendations) {
      data.recommendations = data.recommendations
        .filter(rec => rec && (rec.city || rec.destination)) // Filter out invalid recommendations
        .map(rec => {
          // Map city to destination and vice versa for consistency
          if (rec.city && !rec.destination) {
            rec.destination = rec.city;
          } else if (rec.destination && !rec.city) {
            rec.city = rec.destination;
          }
          return rec;
        });
    }

    return data;
  } catch (error) {
    safeLog.error('Error generating travel recommendations:', error);
    
    // Handle rate limit errors specifically
    if (error.code === 'RATE_LIMIT_EXCEEDED' || error.code === 'SERVER_RATE_LIMIT_EXCEEDED') {
      safeLog.warn(`Rate limit hit for recommendation generation: ${error.message}`);
      throw error;
    }
    
    throw error;
  }
};

/**
 * Submit feedback for a recommendation
 * @param {string} recommendationId - Recommendation ID
 * @param {string} feedback - User feedback text
 * @returns {Promise<Object>} Response with success message
 */
export const submitRecommendationFeedback = async (recommendationId, feedback) => {
  try {
    const response = await fetch(`${API_BASE_URL}/recommendations/feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        recommendation_id: recommendationId,
        feedback: feedback
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `HTTP error! Status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    safeLog.error('Error submitting recommendation feedback:', error);
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
    safeLog.info('Getting travel recommendations for trip:', tripId);

    const response = await fetch(`${API_BASE_URL}/recommendations/${tripId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
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

    const data = await response.json();
    safeLog.info('Raw recommendation data from API:', data);

    // Process the recommendations to handle field mapping and filter invalid ones
    if (data && data.recommendations) {
      const missingIds = data.recommendations.filter(rec => !rec.id);
      if (missingIds.length > 0) {
        safeLog.error('Error: Recommendations missing IDs:', missingIds);
        throw new Error(`${missingIds.length} recommendations are missing IDs. Unable to proceed with voting.`);
      }

      const tempIds = data.recommendations.filter(rec => rec.id && rec.id.startsWith('temp-'));
      if (tempIds.length > 0) {
        safeLog.error('Error: Recommendations with temporary IDs:', tempIds);
        throw new Error(`${tempIds.length} recommendations have temporary IDs. Unable to proceed with voting.`);
      }

      data.recommendations = data.recommendations
        .filter(rec => rec && (rec.city || rec.destination)) // Filter out invalid recommendations
        .map(rec => {
          // Map city to destination and vice versa for consistency
          if (rec.city && !rec.destination) {
            rec.destination = rec.city;
          } else if (rec.destination && !rec.city) {
            rec.city = rec.destination;
          }
          return rec;
        });

      safeLog.info('Processed recommendations:', data.recommendations);
    }

    return data;
  } catch (error) {
    safeLog.error('Error getting travel recommendations:', error);
    throw error;
  }
};

/**
 * Submit user votes/rankings for travel recommendations
 * @param {Object} voteData - Object containing trip_id and rankings array
 * @returns {Promise<Object>} Submission result
 */
export const submitVotes = async (voteData) => {
  try {
    safeLog.info('submitVotes called with data:', voteData);

    // Validate data before sending
    if (!voteData.trip_id) {
      throw new Error('Missing trip_id in vote data');
    }

    if (!voteData.user_id) {
      throw new Error('Missing user_id in vote data');
    }

    if (!voteData.rankings || !Array.isArray(voteData.rankings) || voteData.rankings.length === 0) {
      throw new Error('Missing or invalid rankings array in vote data');
    }


    // Helper to check if string is a valid UUID
    const isValidUUID = (id) => {
      const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      return uuidPattern.test(id);
    };

    // Check each ranking for recommendation_id and ensure it's a valid UUID
    const invalidIds = [];
    const tempIds = [];

    for (const ranking of voteData.rankings) {
      if (!ranking.recommendation_id) {
        safeLog.error('Ranking missing recommendation_id:', ranking);
        invalidIds.push('missing');
      } else if (ranking.recommendation_id.startsWith('temp-')) {
        safeLog.error('Temporary ID detected:', ranking.recommendation_id);
        tempIds.push(ranking.recommendation_id);
      } else if (!isValidUUID(ranking.recommendation_id)) {
        safeLog.error('Invalid recommendation_id format:', ranking.recommendation_id);
        invalidIds.push(ranking.recommendation_id);
      }
    }

    // Reject votes with temporary or invalid IDs
    if (tempIds.length > 0) {
      throw new Error(`Cannot submit votes with temporary IDs. Found ${tempIds.length} temporary IDs. Please reload the page.`);
    }

    if (invalidIds.length > 0) {
      throw new Error(`Cannot submit votes with invalid IDs. Found ${invalidIds.length} invalid recommendation IDs.`);
    }

    safeLog.info('Sending vote request to API:', `${API_BASE_URL}/recommendations/vote`);
    safeLog.info('Final vote data:', voteData);

    const response = await apiRequest(`${API_BASE_URL}/recommendations/vote`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(voteData)
    });

    // Get the response body for error details
    const responseText = await response.text();
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch (e) {
      responseData = { detail: responseText };
    }

    if (!response.ok) {
      safeLog.error('Error response from vote API:', responseData);

      // Format a more helpful error message
      const statusError = `Status: ${response.status}`;
      const detailError = responseData.detail ? `Detail: ${responseData.detail}` : '';
      throw new Error([
        'Failed to submit votes',
        statusError,
        detailError
      ].filter(Boolean).join(' - '));
    }

    safeLog.info('Vote submission successful:', responseData);

    // Verify that votes were actually saved by calling the getVotes function
    try {
      safeLog.info('Verifying votes were saved...');
      const verifyResult = await getVotes(voteData.trip_id, voteData.user_id);

      if (verifyResult.count === 0) {
        safeLog.error('Votes were not saved to the database!');
        throw new Error('Votes were submitted successfully but were not found in the database');
      }

      safeLog.info(`Verified ${verifyResult.count} votes were saved to the database`);

      // Add verification result to the response
      responseData.verification = {
        count: verifyResult.count,
        votes: verifyResult.votes
      };
    } catch (verifyError) {
      safeLog.error('Error verifying votes:', verifyError);
      // Don't throw here, just log the error
    }

    return responseData;
  } catch (error) {
    safeLog.error('Error submitting votes:', error);
    
    // Handle rate limit errors specifically
    if (error.code === 'RATE_LIMIT_EXCEEDED' || error.code === 'SERVER_RATE_LIMIT_EXCEEDED') {
      safeLog.warn(`Rate limit hit for vote submission: ${error.message}`);
      throw error;
    }
    
    throw error;
  }
};

/**
 * Get votes/rankings for a trip, optionally filtered by user
 * @param {string} tripId - Trip ID
 * @param {string} userId - Optional user ID to filter votes by
 * @returns {Promise<Object>} Votes data
 */
export const getVotes = async (tripId, userId = null) => {
  try {
    safeLog.info(`Getting votes for trip ${tripId}${userId ? ` and user ${userId}` : ''}`);

    let url = `${API_BASE_URL}/recommendations/votes/${tripId}`;
    if (userId) {
      url += `?user_id=${userId}`;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Handle response
    if (!response.ok) {
      const errorText = await response.text();
      let errorDetail;

      try {
        const errorData = JSON.parse(errorText);
        errorDetail = errorData.detail || `HTTP error! Status: ${response.status}`;
      } catch (e) {
        errorDetail = errorText || `HTTP error! Status: ${response.status}`;
      }

      throw new Error(errorDetail);
    }

    const data = await response.json();
    safeLog.info('Received vote data:', data);
    return data;
  } catch (error) {
    safeLog.error('Error getting votes:', error);
    throw error;
  }
};

/**
 * Calculate and update the winner for a trip
 * @param {string} tripId - The ID of the trip
 * @returns {Promise<Object>} The winner details
 */
export const calculateWinner = async (tripId) => {
  try {
    safeLog.info(`Calculating winner for trip ${tripId}`);

    const response = await fetch(`${API_BASE_URL}/recommendations/calculate-winner/${tripId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Handle response
    if (!response.ok) {
      const errorText = await response.text();
      let errorDetail;

      try {
        const errorData = JSON.parse(errorText);
        errorDetail = errorData.detail || `HTTP error! Status: ${response.status}`;
      } catch (e) {
        errorDetail = errorText || `HTTP error! Status: ${response.status}`;
      }

      throw new Error(errorDetail);
    }

    const data = await response.json();
    safeLog.info('Winner calculation result:', data);
    return data;
  } catch (error) {
    safeLog.error('Error calculating winner:', error);
    throw error;
  }
};

/**
 * Get the winner for a trip
 * @param {string} tripId - The ID of the trip
 * @returns {Promise<Object>} The winner details or status of voting
 */
export const getTripWinner = async (tripId) => {
  try {
    safeLog.info(`Getting winner for trip ${tripId}`);

    const response = await fetch(`${API_BASE_URL}/recommendations/winner/${tripId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Handle response
    if (!response.ok) {
      const errorText = await response.text();
      let errorDetail;

      try {
        const errorData = JSON.parse(errorText);
        errorDetail = errorData.detail || `HTTP error! Status: ${response.status}`;
      } catch (e) {
        errorDetail = errorText || `HTTP error! Status: ${response.status}`;
      }

      throw new Error(errorDetail);
    }

    const data = await response.json();
    safeLog.info('Winner data:', data);
    return data;
  } catch (error) {
    safeLog.error('Error getting trip winner:', error);
    throw error;
  }
};