import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { 
  AppBar,
  Toolbar,
  Typography,
  Box,
  Link,
  Button,
  CircularProgress,
  Alert,
  Snackbar,
  Container,
  Chip
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import { getTravelRecommendations, generateTravelRecommendations, getTripDetails } from '../utils/api';
import '../styles/AIRecommendationsPage.css';
import '../styles/LandingPage.css';

const AIRecommendationsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { tripId } = useParams();
  
  const [recommendations, setRecommendations] = useState([]);
  const [tripData, setTripData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [imagesLoaded, setImagesLoaded] = useState({});
  const [expandedCards, setExpandedCards] = useState({});
  const [toast, setToast] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // Get trip ID from params or from location state
  const effectiveTripId = tripId || (location.state && location.state.tripId);

  const processRecommendations = useCallback((recs) => {
    if (!recs || recs.length === 0) {
      console.log('No recommendations to process');
      return [];
    }
    
    console.log(`Processing ${recs.length} recommendations`);
    
    // Process recommendations to limit activities and ensure proper structures
    const processedRecs = recs.map((rec, index) => {
      // Skip invalid recommendations
      if (!rec) {
        console.log(`Recommendation at index ${index} is null or undefined`);
        return null;
      }
      
      // Create a copy of the recommendation
      const processed = { ...rec };
      
      // Ensure ID is present - create a temporary one if missing
      if (!processed.id) {
        console.warn(`Recommendation missing ID for ${processed.city || processed.destination || "unknown destination"} - generating temporary ID`);
        // Generate a temporary ID for display purposes
        processed.id = `temp-${Date.now()}-${index}`;
        processed.has_temp_id = true; // Mark this so we know it's not a real DB ID
      }
      
      // Log the recommendation ID for debugging
      console.log(`Processing recommendation with ID: ${processed.id} for ${processed.city || processed.destination || "unknown"}`);
      
      // Determine location name from available fields
      processed.locationDisplayName = processed.city || processed.destination || "Unknown Location";
      
      // Limit activities to max 3 for display
      if (processed.activities && processed.activities.length > 0) {
        processed.displayActivities = processed.activities.slice(0, 3);
        processed.extraActivitiesCount = Math.max(0, processed.activities.length - 3);
      } else {
        processed.displayActivities = [];
        processed.extraActivitiesCount = 0;
      }
      
      return processed;
    }).filter(Boolean); // Filter out any null entries
    
    console.log(`After processing: ${processedRecs.length} valid recommendations remain`);
    
    return processedRecs;
  }, []);

  const fetchRecommendations = useCallback(async () => {
    if (!effectiveTripId) {
      setError('No trip ID provided. Please go back to the dashboard and try again.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Get trip details
      const tripDetails = await getTripDetails(effectiveTripId);
      setTripData(tripDetails);
      console.log('Loaded trip details:', tripDetails);
      
      // First, try to get existing recommendations from the database
      try {
        console.log('Fetching existing recommendations...');
        const result = await getTravelRecommendations(effectiveTripId);
        
        if (result && result.recommendations && result.recommendations.length > 0) {
          console.log('Found existing recommendations:', result.recommendations.length);
          console.log('Raw recommendations from API:', JSON.stringify(result.recommendations));
          
          // Check for recommendations with missing IDs
          const missingIds = result.recommendations.filter(rec => !rec.id);
          if (missingIds.length > 0) {
            console.error(`Found ${missingIds.length} recommendations with missing IDs:`, missingIds);
            setToast({
              open: true,
              message: `Found ${missingIds.length} recommendations with missing IDs. Will regenerate recommendations.`,
              severity: 'warning'
            });
            
            // Throw error to trigger regeneration
            throw new Error('Recommendations with missing IDs detected');
          }
          
          // Sort the recommendations by timestamp if available
          // For multiple recommendation sets, this will ensure we only show the latest
          const sortedRecommendations = [...result.recommendations];
          console.log('Recommendations before sorting:', sortedRecommendations.length);
          
          // Sort recommendations by timestamp, newest first
          if (sortedRecommendations[0] && sortedRecommendations[0].created_at) {
            sortedRecommendations.sort((a, b) => {
              const dateA = new Date(a.created_at || 0);
              const dateB = new Date(b.created_at || 0);
              return dateB - dateA;
            });
            console.log('Sorted recommendations by timestamp, newest first');
          }
          
          // Take only the most recent 3 recommendations
          const mostRecentRecs = sortedRecommendations.slice(0, 3);
          console.log(`Taking the ${mostRecentRecs.length} most recent recommendations`);
          
          // Process the recommendations
          const processed = processRecommendations(mostRecentRecs);
          console.log(`Processed ${processed.length} of ${mostRecentRecs.length} recommendations`);
          console.log('Processed recommendations:', processed);
          
          // Check if any recommendations were filtered out
          if (processed.length < mostRecentRecs.length) {
            console.warn(`${mostRecentRecs.length - processed.length} recommendations were filtered out due to issues`);
            
            if (processed.length === 0) {
              // If all recommendations were filtered out, generate new ones
              throw new Error('All recommendations were filtered out due to issues');
            }
            
            setToast({
              open: true,
              message: `${mostRecentRecs.length - processed.length} recommendations were filtered out due to issues. You can regenerate if needed.`,
              severity: 'warning'
            });
          }
          
          setRecommendations(processed);
          setLoading(false);
          return;
        } else {
          console.log('No existing recommendations found, will generate new ones');
        }
      } catch (fetchErr) {
        // Log the error and continue to generate new recommendations
        console.log('Error fetching existing recommendations:', fetchErr.message);
      }
      
      // If we're here, we need to generate new recommendations
      setGenerating(true);
      console.log('Generating new recommendations...');
      try {
        const newRecommendations = await generateTravelRecommendations(effectiveTripId);
        console.log('Successfully generated new recommendations:', newRecommendations.recommendations.length);
        console.log('Raw generated recommendations:', JSON.stringify(newRecommendations.recommendations));
        
        // Check for recommendations with missing IDs
        const missingIds = newRecommendations.recommendations.filter(rec => !rec.id);
        if (missingIds.length > 0) {
          console.error(`Generated ${missingIds.length} recommendations with missing IDs:`, missingIds);
          
          // Filter out recommendations that are missing IDs
          const validRecs = newRecommendations.recommendations.filter(rec => rec.id);
          
          if (validRecs.length === 0) {
            setToast({
              open: true,
              message: 'All generated recommendations are missing IDs. Please try again later.',
              severity: 'error'
            });
            return;
          }
          
          setToast({
            open: true,
            message: `Filtered out ${missingIds.length} recommendations that were missing IDs.`,
            severity: 'warning'
          });
          
          // Sort by created_at if available and take only the 3 most recent
          const sortedValidRecs = [...validRecs];
          if (sortedValidRecs[0] && sortedValidRecs[0].created_at) {
            sortedValidRecs.sort((a, b) => {
              const dateA = new Date(a.created_at || 0);
              const dateB = new Date(b.created_at || 0);
              return dateB - dateA;
            });
          }
          const mostRecentRecs = sortedValidRecs.slice(0, 3);
          
          setRecommendations(processRecommendations(mostRecentRecs));
        } else {
          // Sort by created_at if available and take only the 3 most recent
          const sortedRecs = [...newRecommendations.recommendations];
          if (sortedRecs[0] && sortedRecs[0].created_at) {
            sortedRecs.sort((a, b) => {
              const dateA = new Date(a.created_at || 0);
              const dateB = new Date(b.created_at || 0);
              return dateB - dateA;
            });
          }
          const mostRecentRecs = sortedRecs.slice(0, 3);
          
          // Process the most recent recommendations
          const processed = processRecommendations(mostRecentRecs);
          
          // Check if any were filtered out during processing
          if (processed.length < mostRecentRecs.length) {
            setToast({
              open: true,
              message: `${mostRecentRecs.length - processed.length} recommendations were filtered out due to issues.`,
              severity: 'warning'
            });
          } else {
            setToast({
              open: true,
              message: 'New recommendations generated successfully!',
              severity: 'success'
            });
          }
          
          setRecommendations(processed);
        }
      } catch (genErr) {
        console.error('Failed to generate recommendations:', genErr);
        setError(`Failed to generate recommendations: ${genErr.message}`);
        // Try to get recommendations again in case they were saved despite the error
        try {
          const retryResult = await getTravelRecommendations(effectiveTripId);
          if (retryResult && retryResult.recommendations && retryResult.recommendations.length > 0) {
            console.log('Found recommendations on retry');
            
            // Sort recommendations by timestamp, newest first
            const sortedRetryRecs = [...retryResult.recommendations];
            if (sortedRetryRecs[0] && sortedRetryRecs[0].created_at) {
              sortedRetryRecs.sort((a, b) => {
                const dateA = new Date(a.created_at || 0);
                const dateB = new Date(b.created_at || 0);
                return dateB - dateA;
              });
              console.log('Sorted retry recommendations by timestamp, newest first');
            }
            
            // Take only the most recent 3 recommendations
            const mostRecentRetryRecs = sortedRetryRecs.slice(0, 3);
            console.log(`Taking the ${mostRecentRetryRecs.length} most recent retry recommendations`);
            
            // Process the recommendations
            const processed = processRecommendations(mostRecentRetryRecs);
            if (processed.length > 0) {
              console.log(`Found ${processed.length} valid recommendations from retry`);
              setRecommendations(processed);
            }
          }
        } catch (retryErr) {
          console.error('Retry fetch failed:', retryErr);
        }
      } finally {
        setGenerating(false);
      }
    } catch (err) {
      setError(`Failed to fetch recommendations: ${err.message}`);
      console.error('Error in fetchRecommendations:', err);
    } finally {
      setLoading(false);
    }
  }, [effectiveTripId, processRecommendations]);

  const handleRegenerateRecommendations = async () => {
    if (!effectiveTripId) return;
    
    try {
      setGenerating(true);
      setToast({
        open: true,
        message: 'Generating new recommendations (this could take a few minutes)...',
        severity: 'info'
      });
      
      console.log('Calling generateTravelRecommendations API with tripId:', effectiveTripId);
      
      // Set a higher temperature for more variety
      const newRecommendations = await generateTravelRecommendations(effectiveTripId, {
        temperature: 0.9
      });
      
      console.log('API Response from generateTravelRecommendations:', newRecommendations);
      console.log('Recommendations count:', newRecommendations.recommendations?.length || 0);
      console.log('Sample recommendation:', newRecommendations.recommendations?.[0]);
      
      // Check for recommendations with missing IDs
      const missingIds = newRecommendations.recommendations.filter(rec => !rec.id);
      if (missingIds.length > 0) {
        console.error(`Generated ${missingIds.length} recommendations with missing IDs:`, missingIds);
        
        // Filter out recommendations that are missing IDs
        const validRecs = newRecommendations.recommendations.filter(rec => rec.id);
        
        if (validRecs.length === 0) {
          setToast({
            open: true,
            message: 'All generated recommendations are missing IDs. Please try again later.',
            severity: 'error'
          });
          return;
        }
        
        setToast({
          open: true,
          message: `Filtered out ${missingIds.length} recommendations that were missing IDs.`,
          severity: 'warning'
        });
        
        // Sort by created_at if available and take only the 3 most recent
        const sortedValidRecs = [...validRecs];
        if (sortedValidRecs[0] && sortedValidRecs[0].created_at) {
          sortedValidRecs.sort((a, b) => {
            const dateA = new Date(a.created_at || 0);
            const dateB = new Date(b.created_at || 0);
            return dateB - dateA;
          });
        }
        const mostRecentRecs = sortedValidRecs.slice(0, 3);
        
        setRecommendations(processRecommendations(mostRecentRecs));
      } else {
        // Sort by created_at if available and take only the 3 most recent
        const sortedRecs = [...newRecommendations.recommendations];
        if (sortedRecs[0] && sortedRecs[0].created_at) {
          sortedRecs.sort((a, b) => {
            const dateA = new Date(a.created_at || 0);
            const dateB = new Date(b.created_at || 0);
            return dateB - dateA;
          });
        }
        const mostRecentRecs = sortedRecs.slice(0, 3);
        
        // Process the most recent recommendations
        const processed = processRecommendations(mostRecentRecs);
        
        // Check if any were filtered out during processing
        if (processed.length < mostRecentRecs.length) {
          setToast({
            open: true,
            message: `${mostRecentRecs.length - processed.length} recommendations were filtered out due to issues.`,
            severity: 'warning'
          });
        } else {
          setToast({
            open: true,
            message: 'New recommendations generated successfully!',
            severity: 'success'
          });
        }
        
        setRecommendations(processed);
      }
    } catch (err) {
      setError(`Failed to generate new recommendations: ${err.message}`);
      setToast({
        open: true,
        message: `Failed to generate new recommendations: ${err.message}`,
        severity: 'error'
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleImageLoaded = useCallback((id) => {
    setImagesLoaded(prev => ({ ...prev, [id]: true }));
  }, []);

  const handleCloseToast = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setToast(prev => ({ ...prev, open: false }));
  };

  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  // Preload images when recommendations change
  useEffect(() => {
    if (!recommendations || recommendations.length === 0) return;
    
    recommendations.forEach((recommendation, index) => {
      if (!recommendation) return; // Skip if recommendation is undefined
      
      // Determine which placeholder image to use based on the destination name
      const placeholderImages = [
        'https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2', // Travel generic
        'https://images.pexels.com/photos/1051073/pexels-photo-1051073.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2', // Beach
        'https://images.pexels.com/photos/466685/pexels-photo-466685.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',  // City
        'https://images.pexels.com/photos/2662116/pexels-photo-2662116.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2', // Mountain
        'https://images.pexels.com/photos/1271619/pexels-photo-1271619.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2', // Landmark
      ];
      
      // Select a placeholder image based on destination name for consistency
      const locationText = recommendation.locationDisplayName || recommendation.city || recommendation.destination || "Unknown";
      const placeholderIndex = Math.abs(locationText.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0)) % placeholderImages.length;
      const imageUrl = placeholderImages[placeholderIndex];
      
      // Preload the image
      const img = new Image();
      img.src = imageUrl; 
      img.onload = () => handleImageLoaded(index);
    });
  }, [recommendations, handleImageLoaded]);

  const handleStartVote = () => {
    // Ensure we have a valid tripId and make it explicit in the state
    console.log('AIRecommendationsPage - Starting vote with tripId:', effectiveTripId);
    
    if (!effectiveTripId) {
      setToast({
        open: true,
        message: 'Trip ID is missing. Cannot start voting.',
        severity: 'error'
      });
      return;
    }
    
    // Check if we have enough recommendations to start voting (at least 2)
    if (recommendations.length < 2) {
      setToast({
        open: true,
        message: 'Need at least 2 recommendations to start voting. Try regenerating.',
        severity: 'error'
      });
      return;
    }
    
    // Double-check for recommendations without IDs
    const missingIds = recommendations.filter(rec => !rec || !rec.id);
    if (missingIds.length > 0) {
      console.error('Recommendations missing IDs:', missingIds);
      
      // Count the number of recommendations that DO have IDs
      const validRecs = recommendations.filter(rec => rec && rec.id);
      
      // If we still have at least 2 valid recommendations, we can proceed with just those
      if (validRecs.length >= 2) {
        setToast({
          open: true,
          message: `Proceeding with ${validRecs.length} valid recommendations, filtering out ${missingIds.length} invalid ones.`,
          severity: 'warning'
        });
        
        // Navigate to the tripId-specific voting route with only the valid recommendations
        navigate(`/voting/${effectiveTripId}`, { 
          state: { 
            tripId: effectiveTripId, 
            recommendations: validRecs 
          }
        });
        return;
      }
      
      // Otherwise, show an error and suggest regenerating
      setToast({
        open: true,
        message: `${missingIds.length} recommendations are missing IDs. Please regenerate recommendations.`,
        severity: 'error'
      });
      return;
    }
    
    // Navigate to the tripId-specific voting route with recommendations in state
    navigate(`/voting/${effectiveTripId}`, { 
      state: { 
        tripId: effectiveTripId, 
        recommendations 
      }
    });
  };

  const handleGoBack = () => {
    navigate(`/dashboard/${effectiveTripId}`);
  };

  const toggleCardExpansion = (index) => {
    setExpandedCards(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  // Get the budget tier text in a readable format
  const getBudgetTierText = (tier) => {
    switch (tier) {
      case 'budget':
        return 'Budget-friendly';
      case 'moderate':
        return 'Moderate';
      case 'luxury':
        return 'Luxury';
      default:
        return tier;
    }
  };

  if (loading) {
    return (
      <div className="landing-page">
        <AppBar position="fixed" elevation={0} sx={{ bgcolor: 'background.paper' }}>
          <Toolbar sx={{ justifyContent: 'space-between' }}>
            <Typography variant="h6" component="div" sx={{ color: 'primary.main', fontWeight: 600, cursor: 'pointer' }} onClick={() => navigate('/')}>
              PackVote
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <Link href="/docs" color="text.secondary" underline="none" sx={{ '&:hover': { color: 'text.primary' } }}>
                Docs
              </Link>
              <Link href="/donate" color="text.secondary" underline="none" sx={{ '&:hover': { color: 'text.primary' } }}>
                Donate
              </Link>
              <Button 
                variant="contained" 
                onClick={() => navigate('/create-trip')}
                className="primary-button"
              >
                Start a Trip
              </Button>
            </Box>
          </Toolbar>
        </AppBar>

        <Container sx={{ pt: 12, pb: 8, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          <Box sx={{ textAlign: 'center' }}>
            <CircularProgress size={60} />
            <Typography variant="h6" sx={{ mt: 2 }}>
              Loading recommendations...
            </Typography>
          </Box>
        </Container>
      </div>
    );
  }

  return (
    <div className="ai-recommendations-page landing-page">
      {/* Navigation */}
      <AppBar position="fixed" elevation={0} sx={{ bgcolor: 'background.paper' }}>
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Typography variant="h6" component="div" sx={{ color: 'primary.main', fontWeight: 600, cursor: 'pointer' }} onClick={() => navigate('/')}>
            PackVote
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Link href="/docs" color="text.secondary" underline="none" sx={{ '&:hover': { color: 'text.primary' } }}>
              Docs
            </Link>
            <Link href="/donate" color="text.secondary" underline="none" sx={{ '&:hover': { color: 'text.primary' } }}>
              Donate
            </Link>
            <Button 
              variant="contained" 
              onClick={() => navigate('/create-trip')}
              className="primary-button"
            >
              Start a Trip
            </Button>
          </Box>
        </Toolbar>
      </AppBar>
    
      <Container maxWidth="lg" sx={{ pt: 12, pb: 8 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 4 }}>
            {error}
          </Alert>
        )}
        
        <Box className="content-container">
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box>
              <Typography variant="h4" component="h1" className="page-title">
                Destination Recommendations
              </Typography>
              <Typography variant="h6" component="p" color="text.secondary" className="page-subtitle">
                Tailored to your group's budgets, dates & vibes
              </Typography>
            </Box>
            <Box>
              <Button 
                variant="outlined" 
                onClick={handleGoBack}
                sx={{ mr: 2 }}
              >
                Back to Dashboard
              </Button>
              <Button 
                variant="contained" 
                startIcon={<RefreshIcon />}
                onClick={handleRegenerateRecommendations}
                disabled={generating}
                className="primary-button"
              >
                {generating ? 'Generating...' : 'Regenerate'}
              </Button>
            </Box>
          </Box>
          
          {tripData && (
            <Box className="filters-container" sx={{ mb: 4 }}>
              {tripData.budget && (
                <Chip 
                  label={`💰 Budget ~$${tripData.budget.amount.toLocaleString()}`} 
                  className="filter-tag"
                  color="primary"
                  variant="outlined"
                />
              )}
              {tripData.dateRange && tripData.dateRange.start && (
                <Chip 
                  label={`📅 ${tripData.dateRange.start} to ${tripData.dateRange.end}`}
                  className="filter-tag"
                  color="primary"
                  variant="outlined"
                />
              )}
              {tripData.vibes && tripData.vibes.length > 0 && (
                <Chip 
                  label={`✨ ${tripData.vibes.slice(0, 3).join(', ')}${tripData.vibes.length > 3 ? '...' : ''}`}
                  className="filter-tag"
                  color="primary"
                  variant="outlined"
                />
              )}
              {tripData.participants && (
                <Chip 
                  label={`👥 Group: ${tripData.participants.length} people`}
                  className="filter-tag"
                  color="primary"
                  variant="outlined"
                />
              )}
            </Box>
          )}
          
          {generating && (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', my: 4 }}>
              <CircularProgress size={40} />
              <Typography variant="h6" sx={{ ml: 2 }}>
                Generating new recommendations (this could take a few minutes)...
              </Typography>
            </Box>
          )}
          
          <Box component="main" className="destinations-grid" sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: 3,
            alignItems: 'start' // This ensures cards start from the top
          }}>
            {recommendations.map((recommendation, index) => {
              if (!recommendation) return null; // Skip if recommendation is undefined
              
              // Determine which placeholder image to use based on the destination name
              const placeholderImages = [
                'https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2', // Travel generic
                'https://images.pexels.com/photos/1051073/pexels-photo-1051073.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2', // Beach
                'https://images.pexels.com/photos/466685/pexels-photo-466685.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',  // City
                'https://images.pexels.com/photos/2662116/pexels-photo-2662116.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2', // Mountain
                'https://images.pexels.com/photos/1271619/pexels-photo-1271619.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2', // Landmark
              ];
              
              // Select a placeholder image based on destination name for consistency
              const locationText = recommendation.locationDisplayName || recommendation.city || recommendation.destination || "Unknown";
              const placeholderIndex = Math.abs(locationText.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0)) % placeholderImages.length;
              const imageUrl = placeholderImages[placeholderIndex];
              
              const isExpanded = expandedCards[index] || false;
              
              return (
                <Box key={index} className={`destination-card ${isExpanded ? 'expanded' : ''}`} sx={{
                  transition: 'all 0.3s ease-in-out',
                  display: 'flex',
                  flexDirection: 'column',
                  border: '1px solid rgba(0, 0, 0, 0.12)',
                  borderRadius: 2,
                  overflow: 'hidden',
                  height: '100%',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)'
                }}>
                  <Box className={`card-image ${!imagesLoaded[index] ? 'loading' : ''}`} sx={{
                    height: '180px',
                    overflow: 'hidden'
                  }}>
                    <img 
                      src={imageUrl} 
                      alt={recommendation.locationDisplayName || recommendation.city || recommendation.destination || "Unknown Location"}
                      onLoad={() => handleImageLoaded(index)}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </Box>
                  <Box className="card-content" sx={{ p: 2, display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                    <Box className="destination-header">
                      <Typography variant="h5" component="h3">{recommendation.locationDisplayName || recommendation.city || recommendation.destination || "Unknown Location"}</Typography>
                      <Typography variant="body1" className="country">{recommendation.country || "Unknown Country"}</Typography>
                    </Box>
                    <Box className="destination-details" sx={{ my: 1 }}>
                      <Box className="detail">
                        <span>💰 {getBudgetTierText(recommendation.budget_tier)}</span>
                      </Box>
                      <Box className="detail">
                        <span>🗓️ Best time: {recommendation.ideal_months ? recommendation.ideal_months.join(', ') : 'Any time'}</span>
                      </Box>
                      {recommendation.matching_vibes && recommendation.matching_vibes.length > 0 && (
                        <Box className="detail">
                          <span>✨ Vibes: {recommendation.matching_vibes.join(', ')}</span>
                        </Box>
                      )}
                    </Box>
                    
                    <Typography variant="body2" sx={{ 
                      my: 1.5,
                      transition: 'all 0.3s ease',
                      lineHeight: 1.6,
                      ...(isExpanded && {
                        backgroundColor: 'rgba(0, 0, 0, 0.02)',
                        p: 1.5,
                        borderRadius: 1,
                        borderLeft: '3px solid',
                        borderColor: 'primary.light',
                        mb: 2
                      })
                    }}>
                      {isExpanded 
                        ? recommendation.description
                        : recommendation.description && recommendation.description.length > 100
                          ? `${recommendation.description.substring(0, 100)}...`
                          : recommendation.description || "No description available"}
                    </Typography>
                    
                    {recommendation.description && recommendation.description.length > 100 && (
                      <Button 
                        variant="text" 
                        size="small"
                        onClick={() => toggleCardExpansion(index)}
                        sx={{ 
                          alignSelf: 'flex-start',
                          mb: 1.5,
                          fontSize: '0.8rem',
                          textTransform: 'none',
                          p: 0,
                          minWidth: 'auto',
                          color: 'primary.main',
                          fontWeight: 'medium'
                        }}
                      >
                        {isExpanded ? 'Show less' : 'Read more'}
                      </Button>
                    )}
                    
                    <Box sx={{ 
                      display: 'flex', 
                      flexWrap: 'wrap', 
                      gap: 0.8, 
                      mb: 2,
                      mt: 'auto'
                    }}>
                      {recommendation.displayActivities && recommendation.displayActivities.map((activity, i) => (
                        <Chip 
                          key={i} 
                          label={activity} 
                          size="small" 
                          variant="outlined"
                          color="primary"
                          sx={{ borderRadius: '4px' }}
                        />
                      ))}
                      {recommendation.extraActivitiesCount > 0 && (
                        <Chip 
                          label={`+${recommendation.extraActivitiesCount} more`} 
                          size="small"
                          variant="outlined"
                          sx={{ borderRadius: '4px' }}
                        />
                      )}
                    </Box>
                  </Box>
                </Box>
              );
            })}
          </Box>

          <Box className="vote-section" sx={{ mt: 4, textAlign: 'center' }}>
            <Button 
              variant="contained" 
              className="start-vote-button primary-button"
              onClick={handleStartVote}
              disabled={recommendations.length === 0}
              size="large"
            >
              Start the Vote
            </Button>
          </Box>
        </Box>
      </Container>
      
      {/* Toast notification */}
      <Snackbar
        open={toast.open}
        autoHideDuration={6000}
        onClose={handleCloseToast}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseToast}
          severity={toast.severity}
          sx={{ width: '100%' }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default AIRecommendationsPage; 