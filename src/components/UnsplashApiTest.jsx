import React, { useState, useEffect } from 'react';
import { Box, TextField, Button, Typography, Card, CardMedia, CircularProgress, Alert, ButtonGroup, Divider, Chip } from '@mui/material';
import { getDestinationImage } from '../utils/imageService';
import DevSettings from './DevSettings';

// Popular landmarks to test with
const POPULAR_LANDMARKS = [
  { name: 'Eiffel Tower', city: 'Paris', country: 'France' },
  { name: 'Colosseum', city: 'Rome', country: 'Italy' },
  { name: 'Statue of Liberty', city: 'New York', country: 'USA' },
  { name: 'Taj Mahal', city: 'Agra', country: 'India' },
  { name: 'Great Wall', city: 'Beijing', country: 'China' }
];

/**
 * A component to test Unsplash API integration
 */
const UnsplashApiTest = () => {
  const [destination, setDestination] = useState('Paris, France');
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [error, setError] = useState('');
  const [apiKey] = useState(!!process.env.REACT_APP_UNSPLASH_ACCESS_KEY);
  const [testResults, setTestResults] = useState([]);
  const [imageTags, setImageTags] = useState([]);

  const handleTest = async () => {
    setLoading(true);
    setError('');
    setImageTags([]);
    
    try {
      // Create a destination object similar to what our app uses
      const destObj = {
        city: destination.split(',')[0].trim(),
        country: destination.includes(',') ? destination.split(',')[1].trim() : ''
      };
      
      console.log('Testing Unsplash API with destination:', destObj);
      const startTime = Date.now();
      
      // Set up a listener to capture image metadata from the console logs
      const originalConsoleLog = console.log;
      const capturedLogs = [];
      
      console.log = (...args) => {
        capturedLogs.push(args);
        originalConsoleLog(...args);
      };
      
      const url = await getDestinationImage(destObj);
      
      // Restore console.log
      console.log = originalConsoleLog;
      
      // Process the captured logs to find image metadata
      let tags = [];
      let usesFeaturedCollection = false;
      
      capturedLogs.forEach(logEntry => {
        const logString = JSON.stringify(logEntry);
        
        // Check for collection info
        if (logString.includes('collection')) {
          usesFeaturedCollection = true;
        }
        
        // Try to extract tags if they were logged
        if (logString.includes('tags') && logString.includes('title')) {
          try {
            // Find objects that might contain tags
            const match = logString.match(/tags.*?\[(.*?)\]/);
            if (match && match[1]) {
              const tagText = match[1];
              // Extract title values
              const titleMatches = tagText.match(/title":"(.*?)"/g);
              if (titleMatches) {
                tags = titleMatches.map(m => m.replace(/title":"(.*?)"/, '$1'));
              }
            }
          } catch (e) {
            console.error('Error parsing tags', e);
          }
        }
      });
      
      const endTime = Date.now();
      setImageUrl(url);
      
      // Set tags if found
      if (tags.length > 0) {
        setImageTags(tags);
      } else {
        setImageTags([usesFeaturedCollection ? 'Using featured collection' : 'No collection used']);
      }
      
      // Check if the URL is from Unsplash or a fallback
      const isUnsplashUrl = url.includes('unsplash.com');
      console.log('Received URL:', url);
      console.log('Is Unsplash URL:', isUnsplashUrl);
      
      if (!isUnsplashUrl) {
        setError('Received a fallback image instead of an Unsplash image. Check the console for details.');
      }
      
      // Add to test results
      setTestResults(prev => [
        {
          destination: `${destObj.city}${destObj.country ? ', ' + destObj.country : ''}`,
          success: isUnsplashUrl,
          time: `${endTime - startTime}ms`,
          timestamp: new Date().toLocaleTimeString()
        },
        ...prev.slice(0, 4) // Keep last 5 tests
      ]);
      
    } catch (err) {
      console.error('Error testing Unsplash API:', err);
      setError(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  const handleTestLandmark = async (landmark) => {
    setDestination(`${landmark.city}, ${landmark.country}`);
    await new Promise(resolve => setTimeout(resolve, 10)); // Small delay to ensure state updates
    handleTest();
  };

  useEffect(() => {
    // Check if API key is set
    if (!apiKey) {
      setError('No Unsplash API key found in environment variables. Please set REACT_APP_UNSPLASH_ACCESS_KEY.');
    }
  }, [apiKey]);

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Unsplash API Test
      </Typography>
      
      {/* Development Settings Panel */}
      <DevSettings />
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      <Box sx={{ mb: 3 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          API Key Status: {apiKey ? '✅ Found' : '❌ Not found'}
        </Typography>
        
        <TextField
          label="Destination (City, Country)"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          fullWidth
          sx={{ mb: 2 }}
        />
        
        <Button 
          variant="contained" 
          onClick={handleTest}
          disabled={loading || !destination}
          sx={{ mb: 2 }}
        >
          {loading ? <CircularProgress size={24} /> : 'Test API'}
        </Button>
        
        <Typography variant="body2" sx={{ mb: 1, mt: 2 }}>
          Quick Test with Popular Landmarks:
        </Typography>
        
        <ButtonGroup variant="outlined" sx={{ flexWrap: 'wrap', gap: 1 }}>
          {POPULAR_LANDMARKS.map((landmark) => (
            <Button 
              key={landmark.name}
              onClick={() => handleTestLandmark(landmark)}
              disabled={loading}
              size="small"
            >
              {landmark.city}
            </Button>
          ))}
        </ButtonGroup>
      </Box>
      
      {imageUrl && (
        <Card sx={{ mb: 4 }}>
          <CardMedia
            component="img"
            height="300"
            image={imageUrl}
            alt={destination}
          />
          <Box sx={{ p: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Image Source: {imageUrl.includes('unsplash.com') ? '✅ Unsplash API' : '⚠️ Fallback Image'}
            </Typography>
            
            {imageTags.length > 0 && (
              <Box sx={{ mt: 1, mb: 1.5 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                  Image Tags:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {imageTags.map((tag, idx) => (
                    <Chip 
                      key={idx} 
                      label={tag} 
                      size="small" 
                      variant="outlined"
                      color={tag.toLowerCase().includes(destination.split(',')[0].toLowerCase()) ? 'primary' : 'default'} 
                    />
                  ))}
                </Box>
              </Box>
            )}
            
            <Typography variant="caption" component="div" sx={{ wordBreak: 'break-all', mt: 1 }}>
              URL: {imageUrl}
            </Typography>
          </Box>
        </Card>
      )}
      
      {testResults.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>Recent Test Results</Typography>
          <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
            {testResults.map((result, index) => (
              <React.Fragment key={index}>
                {index > 0 && <Divider />}
                <Box sx={{ p: 1.5, display: 'flex', alignItems: 'center' }}>
                  <Box sx={{ 
                    width: 20, 
                    height: 20, 
                    borderRadius: '50%', 
                    backgroundColor: result.success ? 'success.main' : 'error.main',
                    mr: 1.5,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '12px'
                  }}>
                    {result.success ? '✓' : '✗'}
                  </Box>
                  <Box>
                    <Typography variant="body2">{result.destination}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {result.timestamp} • {result.time}
                    </Typography>
                  </Box>
                </Box>
              </React.Fragment>
            ))}
          </Box>
        </Box>
      )}
      
      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" gutterBottom>Troubleshooting</Typography>
        <Typography variant="body2">
          1. Check your console logs for detailed API responses<br />
          2. Verify your .env file has the REACT_APP_UNSPLASH_ACCESS_KEY set<br />
          3. Make sure you've registered your application with Unsplash<br />
          4. If using a brand new API key, there might be a delay before it's activated<br />
          5. Remember: Unsplash free tier has a limit of 50 requests per hour<br />
          6. Check that your Unsplash API key has the correct permissions (public access)<br />
          7. Try restarting your development server after updating environment variables
        </Typography>
      </Box>
    </Box>
  );
};

export default UnsplashApiTest; 