import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Switch, 
  FormControlLabel, 
  Card, 
  Button, 
  Divider, 
  Badge 
} from '@mui/material';
import { toggleDevelopmentMode } from '../utils/imageService';

/**
 * Development settings panel accessible only in development mode
 */
const DevSettings = () => {
  const [forceFallbackImages, setForceFallbackImages] = useState(
    localStorage.getItem('force_image_fallbacks') === 'true'
  );
  const [cachedImagesCount, setCachedImagesCount] = useState(0);
  
  // Load cached images count
  useEffect(() => {
    try {
      const cacheData = localStorage.getItem('unsplash_image_cache');
      if (cacheData) {
        const cache = JSON.parse(cacheData);
        const count = Object.keys(cache.destinations || {}).length;
        setCachedImagesCount(count);
      }
    } catch (error) {
      console.error('Error loading cache data:', error);
    }
  }, []);
  
  // Handle toggling image fallbacks
  const handleToggleFallbackImages = (event) => {
    const newValue = event.target.checked;
    setForceFallbackImages(newValue);
    toggleDevelopmentMode(newValue);
  };
  
  // Handle clearing image cache
  const handleClearImageCache = () => {
    try {
      localStorage.removeItem('unsplash_image_cache');
      setCachedImagesCount(0);
      alert('Image cache cleared successfully');
    } catch (error) {
      console.error('Error clearing cache:', error);
      alert('Error clearing cache: ' + error.message);
    }
  };
  
  return (
    <Card sx={{ 
      p: 3, 
      mb: 4, 
      border: '1px dashed', 
      borderColor: 'warning.main',
      maxWidth: 600,
      mx: 'auto'
    }}>
      <Typography variant="h6" color="warning.main" gutterBottom>
        Development Settings
      </Typography>
      
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        These settings are only available in development mode to help with testing.
      </Typography>
      
      <Divider sx={{ my: 2 }} />
      
      <Typography variant="subtitle1" gutterBottom>
        Image API Controls
      </Typography>
      
      <FormControlLabel
        control={
          <Switch
            checked={forceFallbackImages}
            onChange={handleToggleFallbackImages}
            color="warning"
          />
        }
        label={
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <Typography variant="body2">
              Use cached/fallback images only
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Saves Unsplash API quota during development
            </Typography>
          </Box>
        }
        sx={{ mb: 2, ml: 0 }}
      />
      
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Typography variant="body2" sx={{ mr: 2 }}>
          Cached Images:
        </Typography>
        <Badge
          badgeContent={cachedImagesCount}
          color="primary"
          showZero
          sx={{ '& .MuiBadge-badge': { position: 'static', transform: 'none' } }}
        />
        <Button 
          variant="outlined" 
          size="small" 
          color="warning"
          sx={{ ml: 2 }}
          onClick={handleClearImageCache}
          disabled={cachedImagesCount === 0}
        >
          Clear Cache
        </Button>
      </Box>
      
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
        Reminder: Unsplash API has a limit of 50 requests per hour.
      </Typography>
    </Card>
  );
};

export default DevSettings; 