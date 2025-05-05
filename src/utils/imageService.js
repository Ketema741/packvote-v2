/**
 * Image service for fetching destination images with caching
 */
import axios from 'axios';

// Unsplash API configuration
const UNSPLASH_API_URL = 'https://api.unsplash.com/search/photos';
const UNSPLASH_ACCESS_KEY = process.env.REACT_APP_UNSPLASH_ACCESS_KEY;

// Log if API key is available (safely without exposing key)
console.log('Unsplash API key available:', !!UNSPLASH_ACCESS_KEY);

// Featured travel collections on Unsplash with high-quality location images
const TRAVEL_COLLECTIONS = [
  '317099', // Travel Spots
  '3349676', // City Views
  '789974',  // Landmarks
  '3682272'  // Architecture & Travel
];

// Local cache to reduce API calls
const imageCache = {
  destinations: {},
  categories: {},
  timestamp: Date.now()
};

// Cache duration in milliseconds (1 day)
const CACHE_DURATION = 24 * 60 * 60 * 1000;

// Fallback images if API fails or quota exceeded
const FALLBACK_IMAGES = {
  default: [
    'https://images.unsplash.com/photo-1503220317375-aaad61436b1b?w=800&q=80',
    'https://images.unsplash.com/photo-1500835556837-99ac94a94552?w=800&q=80',
    'https://images.unsplash.com/photo-1488085061387-422e29b40080?w=800&q=80',
  ],
  beach: [
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80',
    'https://images.unsplash.com/photo-1519046904884-53103b34b206?w=800&q=80',
  ],
  mountain: [
    'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80',
    'https://images.unsplash.com/photo-1464278533981-50e57c3a85bf?w=800&q=80',
  ],
  city: [
    'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800&q=80',
    'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=800&q=80',
  ],
  landmark: [
    'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=800&q=80',
    'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800&q=80',
  ]
};

/**
 * Clear the cache if it's older than the cache duration
 */
const clearCacheIfNeeded = () => {
  const now = Date.now();
  if (now - imageCache.timestamp > CACHE_DURATION) {
    imageCache.destinations = {};
    imageCache.categories = {};
    imageCache.timestamp = now;
    console.log('Image cache cleared due to age');
  }
};

/**
 * Get a random image from the fallback array based on destination name
 * @param {string} destination - Destination name
 * @returns {string} - Image URL
 */
const getFallbackImage = (destination) => {
  if (!destination) return FALLBACK_IMAGES.default[0];
  
  // Check for specific location categories
  const lowercaseDest = destination.toLowerCase();
  let category = 'default';
  
  if (lowercaseDest.includes('beach') || lowercaseDest.includes('island') || 
      lowercaseDest.includes('coast') || lowercaseDest.includes('sea') ||
      lowercaseDest.includes('ocean')) {
    category = 'beach';
  } else if (lowercaseDest.includes('mountain') || lowercaseDest.includes('alps') || 
             lowercaseDest.includes('peak') || lowercaseDest.includes('hill')) {
    category = 'mountain';
  } else if (lowercaseDest.includes('city') || lowercaseDest.includes('town') || 
             lowercaseDest.includes('urban')) {
    category = 'city';
  } else if (lowercaseDest.includes('monument') || lowercaseDest.includes('temple') || 
             lowercaseDest.includes('cathedral') || lowercaseDest.includes('castle')) {
    category = 'landmark';
  }
  
  // Get random image from the category
  const images = FALLBACK_IMAGES[category] || FALLBACK_IMAGES.default;
  const index = Math.abs(
    destination.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0)
  ) % images.length;
  
  return images[index];
};

/**
 * Fetch destination image from Unsplash API with caching
 * @param {Object} destination - Destination object with name/city/country information
 * @returns {Promise<string>} - Image URL
 */
export const getDestinationImage = async (destination) => {
  clearCacheIfNeeded();
  
  // Extract destination details
  const destName = destination?.city || destination?.destination || destination?.locationDisplayName;
  const country = destination?.country || '';
  let queryText = destName ? `${destName}${country ? ' ' + country : ''}` : '';
  
  console.log('Fetching image for destination:', queryText);
  
  // Return fallback for empty destination
  if (!queryText) {
    console.warn('No destination information provided for image');
    return FALLBACK_IMAGES.default[0];
  }
  
  // Check cache first
  if (imageCache.destinations[queryText]) {
    console.log(`Using cached image for ${queryText}`);
    return imageCache.destinations[queryText];
  }
  
  // Don't make API call if no access key
  if (!UNSPLASH_ACCESS_KEY) {
    console.warn('Unsplash API key not found. Configure REACT_APP_UNSPLASH_ACCESS_KEY in your environment');
    console.log('Using fallback image for', queryText);
    return getFallbackImage(queryText);
  }
  
  try {
    // Focus the query on the specific location only - adding more terms often dilutes results
    // The simpler the query, the more likely we get relevant location images
    queryText = destName;
    
    // Add a random collection ID to help improve results
    const randomCollectionIndex = Math.floor(Math.random() * TRAVEL_COLLECTIONS.length);
    const collectionId = TRAVEL_COLLECTIONS[randomCollectionIndex];
    
    // Make API request - using very specific parameters for better results
    console.log(`Making Unsplash API request for "${queryText}" with collection ${collectionId}`);
    
    // Build the URL with optimal parameters
    const url = `${UNSPLASH_API_URL}?query=${encodeURIComponent(queryText)}`
      + `&collections=${collectionId}`
      + `&orientation=landscape`
      + `&content_filter=high` // High quality content only
      + `&per_page=10`; // Get more options to choose from
    
    const headers = {
      'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}`
    };
    
    console.log('Request URL:', url);
    
    const response = await fetch(url, { headers });
    
    if (!response.ok) {
      throw new Error(`Unsplash API returned ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    console.log(`Unsplash API response for "${queryText}":`, {
      totalResults: data.total,
      resultCount: data.results?.length || 0
    });
    
    // Check if we have results
    if (data.results && data.results.length > 0) {
      // Sort results by relevance score if available
      const sortedResults = [...data.results].sort((a, b) => {
        // First prioritize results with location data that matches our query
        const aHasLocation = a.tags?.some(tag => 
          tag.title?.toLowerCase().includes(queryText.toLowerCase())
        );
        const bHasLocation = b.tags?.some(tag => 
          tag.title?.toLowerCase().includes(queryText.toLowerCase())
        );
        
        if (aHasLocation && !bHasLocation) return -1;
        if (!aHasLocation && bHasLocation) return 1;
        
        // Then sort by relevance
        return b.likes - a.likes;
      });
      
      // Get a result from the top 3 to ensure quality
      const randomIndex = Math.floor(Math.random() * Math.min(3, sortedResults.length));
      const imageUrl = sortedResults[randomIndex].urls.regular;
      
      // Cache the result
      imageCache.destinations[queryText] = imageUrl;
      console.log(`✅ Successfully fetched and cached Unsplash image for ${queryText}:`, imageUrl);
      
      return imageUrl;
    } else {
      console.log(`No results found for "${queryText}" with collection, trying without collection`);
      
      // Try again without collection constraint
      const urlWithoutCollection = `${UNSPLASH_API_URL}?query=${encodeURIComponent(queryText)}`
        + `&orientation=landscape`
        + `&content_filter=high`
        + `&per_page=10`;
      
      const secondResponse = await fetch(urlWithoutCollection, { headers });
      
      if (!secondResponse.ok) {
        throw new Error(`Unsplash API returned ${secondResponse.status}: ${secondResponse.statusText}`);
      }
      
      const secondData = await secondResponse.json();
      
      if (secondData.results && secondData.results.length > 0) {
        // Get the most relevant result - prioritize those with location tags
        const sortedResults = [...secondData.results].sort((a, b) => {
          // First prioritize results with location tags
          const aHasLocation = a.tags?.some(tag => 
            tag.title?.toLowerCase().includes(queryText.toLowerCase())
          );
          const bHasLocation = b.tags?.some(tag => 
            tag.title?.toLowerCase().includes(queryText.toLowerCase())
          );
          
          if (aHasLocation && !bHasLocation) return -1;
          if (!aHasLocation && bHasLocation) return 1;
          
          // Then sort by relevance/likes
          return b.likes - a.likes;
        });
        
        const imageUrl = sortedResults[0].urls.regular;
        
        // Cache the result
        imageCache.destinations[queryText] = imageUrl;
        console.log(`✅ Successfully fetched and cached Unsplash image for ${queryText} without collection:`, imageUrl);
        
        return imageUrl;
      }
    }
    
    // If city name alone doesn't work, try with country
    if (country) {
      console.log(`Trying with country: "${destName}, ${country}"`);
      const countryUrl = `${UNSPLASH_API_URL}?query=${encodeURIComponent(`${destName} ${country}`)}`
        + `&orientation=landscape`
        + `&content_filter=high`
        + `&per_page=10`;
      
      const countryResponse = await fetch(countryUrl, { headers });
      
      if (!countryResponse.ok) {
        throw new Error(`Unsplash API returned ${countryResponse.status}: ${countryResponse.statusText}`);
      }
      
      const countryData = await countryResponse.json();
      
      console.log(`Country search results for "${destName}, ${country}":`, {
        totalResults: countryData.total,
        resultCount: countryData.results?.length || 0
      });
      
      if (countryData.results && countryData.results.length > 0) {
        // Get the best result
        const sortedResults = [...countryData.results].sort((a, b) => b.likes - a.likes);
        const imageUrl = sortedResults[0].urls.regular;
        
        // Cache the result
        imageCache.destinations[queryText] = imageUrl;
        console.log(`✅ Successfully fetched and cached image for "${destName}, ${country}":`, imageUrl);
        return imageUrl;
      }
    }
    
    // If all else fails, use fallback
    console.log(`⚠️ Using fallback image for ${queryText} - no results from Unsplash`);
    return getFallbackImage(queryText);
  } catch (error) {
    console.error('❌ Error fetching image from Unsplash:', error);
    if (error.response) {
      console.error('Error response data:', error.response.data);
      console.error('Error response status:', error.response.status);
    }
    return getFallbackImage(queryText);
  }
};

/**
 * Get image for a specific category like "beach", "mountain", etc.
 * @param {string} category - Category name
 * @returns {Promise<string>} - Image URL 
 */
export const getCategoryImage = async (category) => {
  clearCacheIfNeeded();
  
  // Return fallback for empty category
  if (!category) {
    return FALLBACK_IMAGES.default[0];
  }
  
  // Check cache first
  if (imageCache.categories[category]) {
    return imageCache.categories[category];
  }
  
  // Check if we have fallbacks for this category
  if (FALLBACK_IMAGES[category]) {
    const randomIndex = Math.floor(Math.random() * FALLBACK_IMAGES[category].length);
    return FALLBACK_IMAGES[category][randomIndex];
  }
  
  // Don't make API call if no access key
  if (!UNSPLASH_ACCESS_KEY) {
    return FALLBACK_IMAGES.default[0];
  }
  
  try {
    // Make API request
    const response = await axios.get(UNSPLASH_API_URL, {
      params: {
        query: `${category} travel`,
        orientation: 'landscape',
        per_page: 3
      },
      headers: {
        Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`
      }
    });
    
    // Check if we have results
    if (response.data.results && response.data.results.length > 0) {
      const randomIndex = Math.floor(Math.random() * Math.min(3, response.data.results.length));
      const imageUrl = response.data.results[randomIndex].urls.regular;
      
      // Cache the result
      imageCache.categories[category] = imageUrl;
      
      return imageUrl;
    }
    
    // If no results, use fallback
    return FALLBACK_IMAGES.default[0];
  } catch (error) {
    console.error('Error fetching category image from Unsplash:', error);
    return FALLBACK_IMAGES.default[0];
  }
};

/**
 * Get image synchronously (from cache or fallback only)
 * @param {Object} destination - Destination object 
 * @returns {string} - Image URL
 */
export const getImageSync = (destination) => {
  // Extract destination info
  const destName = destination?.city || destination?.destination || destination?.locationDisplayName;
  const country = destination?.country || '';
  const queryText = destName ? `${destName}${country ? ' ' + country : ''}` : '';
  
  // Check cache first
  if (imageCache.destinations[queryText]) {
    return imageCache.destinations[queryText];
  }
  
  // Use fallback if not in cache
  return getFallbackImage(queryText);
}; 