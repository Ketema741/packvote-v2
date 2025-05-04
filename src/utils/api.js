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
  // Log raw data for debugging
  console.log('Raw survey responses:', JSON.stringify(responses, null, 2));
  
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

  // Helper function to safely parse dates in various formats
  const parseDate = (dateStr) => {
    if (!dateStr) return null;
    
    // Try direct parsing first, but set time to noon to avoid timezone issues
    const dateWithoutTime = dateStr.split('T')[0]; // Remove any time component if present
    const date = new Date(`${dateWithoutTime}T12:00:00`); // Use noon to avoid timezone shifts
    
    if (!isNaN(date.getTime())) return date;
    
    // Try other formats if direct parsing failed
    // Check for MM/DD/YYYY format
    const usFormat = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
    const usMatch = dateStr.match(usFormat);
    if (usMatch) {
      return new Date(parseInt(usMatch[3]), parseInt(usMatch[1]) - 1, parseInt(usMatch[2]), 12, 0, 0);
    }
    
    console.log(`Failed to parse date: ${dateStr}`);
    return null;
  };

  // Parse all preferred date ranges
  const preferredDateRanges = responses.flatMap((r, index) => {
    console.log(`Processing preferred dates for user ${index + 1}:`, r.preferred_dates);
    
    // Handle preferred dates as either array or semicolon-separated string
    let dateRanges = [];
    if (Array.isArray(r.preferred_dates)) {
      dateRanges = r.preferred_dates;
    } else {
      const dateRangesStr = String(r.preferred_dates || "");
      dateRanges = dateRangesStr ? dateRangesStr.split(';') : [];
    }
    
    return dateRanges.map(range => {
      // Handle various formats of date ranges
      let start, end;
      
      if (typeof range === 'string') {
        console.log(`Parsing string date range: ${range}`);
        // Try both "to" and "-" separators
        if (range.includes(" to ")) {
          const parts = range.split(" to ");
          start = parseDate(parts[0].trim());
          end = parseDate(parts[1].trim());
        } else if (range.includes(" - ")) {
          const parts = range.split(" - ");
          start = parseDate(parts[0].trim());
          end = parseDate(parts[1].trim());
        } else {
          console.log(`Unrecognized date range format: ${range}`);
          return { start: null, end: null };
        }
      } else if (range && typeof range === 'object') {
        console.log(`Parsing object date range:`, range);
        // Object with start/end properties
        start = parseDate(range.start);
        end = parseDate(range.end);
      } else {
        console.log(`Invalid date range: ${JSON.stringify(range)}`);
        return { start: null, end: null };
      }
      
      if (start && end) {
        console.log(`Successfully parsed date range: ${start.toISOString()} to ${end.toISOString()}`);
      } else {
        console.log(`Failed to parse one or both dates in range`);
      }
      
      return { start, end };
    }).filter(d => d.start && d.end && !isNaN(d.start.getTime()) && !isNaN(d.end.getTime()));
  });

  console.log('All parsed preferred date ranges:', preferredDateRanges.map(d => 
    `${d.start.toLocaleDateString()} - ${d.end.toLocaleDateString()}`
  ));

  // Parse all blackout date ranges
  const blackoutDateRanges = responses.flatMap((r, index) => {
    console.log(`Processing blackout dates for user ${index + 1}:`, r.blackout_dates);
    
    // Handle blackout dates as either array or semicolon-separated string
    let dateRanges = [];
    if (Array.isArray(r.blackout_dates)) {
      dateRanges = r.blackout_dates;
    } else {
      const dateRangesStr = String(r.blackout_dates || "");
      dateRanges = dateRangesStr ? dateRangesStr.split(';') : [];
    }
    
    if (dateRanges.length === 0) {
      console.log(`No blackout dates for user ${index + 1}`);
    }
    
    return dateRanges.map(range => {
      // Handle various formats of date ranges
      let start, end;
      
      if (typeof range === 'string') {
        console.log(`Parsing string blackout range: ${range}`);
        // Try both "to" and "-" separators
        if (range.includes(" to ")) {
          const parts = range.split(" to ");
          start = parseDate(parts[0].trim());
          end = parseDate(parts[1].trim());
        } else if (range.includes(" - ")) {
          const parts = range.split(" - ");
          start = parseDate(parts[0].trim());
          end = parseDate(parts[1].trim());
        } else {
          console.log(`Unrecognized blackout range format: ${range}`);
          return { start: null, end: null };
        }
      } else if (range && typeof range === 'object') {
        console.log(`Parsing object blackout range:`, range);
        // Object with start/end properties
        start = parseDate(range.start);
        end = parseDate(range.end);
      } else {
        console.log(`Invalid blackout range: ${JSON.stringify(range)}`);
        return { start: null, end: null };
      }
      
      if (start && end) {
        console.log(`Successfully parsed blackout range: ${start.toISOString()} to ${end.toISOString()}`);
      } else {
        console.log(`Failed to parse one or both dates in blackout range`);
      }
      
      return { start, end };
    }).filter(d => d.start && d.end && !isNaN(d.start.getTime()) && !isNaN(d.end.getTime()));
  });

  console.log('All parsed blackout date ranges:', blackoutDateRanges.map(d => 
    `${d.start.toLocaleDateString()} - ${d.end.toLocaleDateString()}`
  ));

  // Group preferred date ranges by user for overlap calculation
  const preferredDatesByUser = responses.map((r, index) => {
    console.log(`Grouping preferred dates for user ${index + 1}`);
    
    // Handle preferred dates as either array or semicolon-separated string
    let dateRanges = [];
    if (Array.isArray(r.preferred_dates)) {
      dateRanges = r.preferred_dates;
    } else {
      const dateRangesStr = String(r.preferred_dates || "");
      dateRanges = dateRangesStr ? dateRangesStr.split(';') : [];
    }
    
    const parsedRanges = dateRanges.map(range => {
      // Handle various formats of date ranges
      let start, end;
      
      if (typeof range === 'string') {
        // Try both "to" and "-" separators
        if (range.includes(" to ")) {
          const parts = range.split(" to ");
          start = parseDate(parts[0].trim());
          end = parseDate(parts[1].trim());
        } else if (range.includes(" - ")) {
          const parts = range.split(" - ");
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
    
    console.log(`User ${index + 1} has ${parsedRanges.length} valid preferred date ranges`);
    return parsedRanges;
  }).filter(ranges => ranges.length > 0);

  console.log(`Have ${preferredDatesByUser.length} users with valid preferred dates`);
  preferredDatesByUser.forEach((ranges, i) => {
    console.log(`User ${i+1} preferred dates: ${ranges.map(d => 
      `${d.start.toLocaleDateString()} - ${d.end.toLocaleDateString()}`
    ).join(', ')}`);
  });

  // Function to check if two date ranges overlap
  const checkOverlap = (range1, range2) => {
    // Make sure we have valid dates
    if (!range1.start || !range1.end || !range2.start || !range2.end) {
      console.log("Invalid date range passed to checkOverlap");
      return false;
    }
    
    // Two ranges overlap if one starts before the other ends
    const result = range1.start <= range2.end && range2.start <= range1.end;
    console.log(`Checking overlap: ${range1.start.toLocaleDateString()} - ${range1.end.toLocaleDateString()} with ${range2.start.toLocaleDateString()} - ${range2.end.toLocaleDateString()}: ${result}`);
    return result;
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
      console.log("No blackout dates to check against");
      return false;
    }
    
    // Check each blackout date range
    for (const blackout of blackoutDateRanges) {
      // A range overlaps with a blackout if they share any days
      const hasOverlap = range.start <= blackout.end && blackout.start <= range.end;
      
      if (hasOverlap) {
        console.log(`Range ${range.start.toLocaleDateString()} - ${range.end.toLocaleDateString()} conflicts with blackout ${blackout.start.toLocaleDateString()} - ${blackout.end.toLocaleDateString()}`);
        return true;
      }
    }
    console.log(`Range ${range.start.toLocaleDateString()} - ${range.end.toLocaleDateString()} does not conflict with any blackout dates`);
    return false;
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
      
      console.log(`Finding overlaps with user ${i+1}'s preferred dates`);
      
      // Check each current overlap against each of this user's ranges
      for (const currentOverlap of overlappingRanges) {
        for (const userRange of userRanges) {
          if (checkOverlap(currentOverlap, userRange)) {
            const overlap = getOverlap(currentOverlap, userRange);
            console.log(`Found overlap: ${overlap.start.toLocaleDateString()} - ${overlap.end.toLocaleDateString()}`);
            newOverlaps.push(overlap);
          }
        }
      }
      
      overlappingRanges = newOverlaps;
      console.log(`After processing user ${i+1}, found ${overlappingRanges.length} overlapping range(s):`, 
        overlappingRanges.length ? 
          overlappingRanges.map(d => `${d.start.toLocaleDateString()} - ${d.end.toLocaleDateString()}`).join(', ') : 
          'None'
      );
      
      // If we have no more overlaps, break early
      if (overlappingRanges.length === 0) break;
    }
  }

  console.log(`Found ${overlappingRanges.length} total overlapping ranges between users`);

  // Create a copy of the blackout dates for debugging
  console.log(`Checking against ${blackoutDateRanges.length} blackout periods:`, 
    blackoutDateRanges.length ? 
      blackoutDateRanges.map(d => `${d.start.toLocaleDateString()} - ${d.end.toLocaleDateString()}`).join(', ') : 
      'None'
  );

  // Remove any overlapping ranges that conflict with blackout dates
  let validOverlaps = overlappingRanges.filter(range => {
    const isValid = !overlapsWithBlackout(range);
    console.log(`Range ${range.start.toLocaleDateString()} - ${range.end.toLocaleDateString()} is ${isValid ? 'valid' : 'invalid'}`);
    return isValid;
  });

  console.log(`Found ${validOverlaps.length} valid overlapping ranges after removing blackout conflicts`);

  // If for some reason we found no valid overlaps but have overlapping ranges, 
  // we might have an issue with the blackout date filtering
  if (validOverlaps.length === 0 && overlappingRanges.length > 0) {
    console.log("WARNING: Found overlapping ranges but none are valid after blackout filtering.");
    console.log("This might indicate an issue with blackout date handling.");
    
    // As a fallback, let's use the overlapping ranges even if they conflict with blackout dates
    // This ensures we show something to the user rather than nothing
    console.log("Using overlapping ranges as fallback since no valid overlaps found after blackout filtering");
    validOverlaps = overlappingRanges;
    
    // Double-check overlapping dates
    for (const range of overlappingRanges) {
      console.log(`Fallback range: ${range.start.toLocaleDateString()} - ${range.end.toLocaleDateString()}`);
    }
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

  console.log('Final date range:', dateRange.start ? 
    `${dateRange.start.toLocaleDateString()} - ${dateRange.end.toLocaleDateString()} (${dateRange.window} days)` : 
    'No valid dates found'
  );

  // Calculate most common vibes
  const allVibes = responses.flatMap(r => {
    console.log(`Vibe choices for a response:`, r.vibe_choices);
    return r.vibe_choices || [];
  });
  
  console.log('All collected vibes:', allVibes);
  
  const vibeCounts = allVibes.reduce((acc, vibe) => {
    if (vibe) {
      acc[vibe] = (acc[vibe] || 0) + 1;
    }
    return acc;
  }, {});
  
  console.log('Vibe counts:', vibeCounts);
  
  const commonVibes = Object.entries(vibeCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([vibe]) => vibe);
  
  console.log('Final common vibes:', commonVibes);

  // Add more detailed logging for debugging
  console.log('FINAL CALCULATION SUMMARY:');
  console.log('- Total overlapping ranges found:', overlappingRanges.length);
  console.log('- Valid overlaps after blackout filtering:', validOverlaps.length);
  console.log('- Detailed overlaps:', validOverlaps.map(d => 
    `${d.start.toLocaleDateString()} - ${d.end.toLocaleDateString()}`
  ).join(', '));

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
    console.log('Generating travel recommendations for trip:', tripId);
     
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
    console.error('Error getting travel recommendations:', error);
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
    const response = await fetch(`${API_BASE_URL}/recommendations/vote`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(voteData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `HTTP error! Status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error submitting votes:', error);
    throw error;
  }
}; 