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
  const [imgErrors, setImgErrors] = useState({});
  const [imagesLoaded, setImagesLoaded] = useState({});
  const [toast, setToast] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // Get trip ID from params or from location state
  const effectiveTripId = tripId || (location.state && location.state.tripId);

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
      
      // Try to get existing recommendations
      const result = await getTravelRecommendations(effectiveTripId);
      
      if (result && result.recommendations && result.recommendations.length > 0) {
        setRecommendations(result.recommendations);
      } else {
        // If no recommendations exist, generate new ones
        setGenerating(true);
        const newRecommendations = await generateTravelRecommendations(effectiveTripId);
        setRecommendations(newRecommendations.recommendations);
        setGenerating(false);
      }
    } catch (err) {
      setError(`Failed to fetch recommendations: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [effectiveTripId]);

  const handleRegenerateRecommendations = async () => {
    if (!effectiveTripId) return;
    
    try {
      setGenerating(true);
      setToast({
        open: true,
        message: 'Generating new recommendations...',
        severity: 'info'
      });
      
      // Set a higher temperature for more variety
      const newRecommendations = await generateTravelRecommendations(effectiveTripId, {
        temperature: 0.9
      });
      
      setRecommendations(newRecommendations.recommendations);
      
      setToast({
        open: true,
        message: 'New recommendations generated successfully!',
        severity: 'success'
      });
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

  const handleImageError = useCallback((id) => {
    setImgErrors(prev => ({ ...prev, [id]: true }));
  }, []);

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
      const destination = recommendation.destination.toLowerCase().replace(/,/g, '').replace(/ /g, '-');
      const country = recommendation.country.toLowerCase().replace(/ /g, '-');
      
      // Create destination image URL
      const imageUrl = `https://source.unsplash.com/featured/1200x800/?${destination},${country},travel`;
      
      const img = new Image();
      img.src = imageUrl;
      img.onload = () => handleImageLoaded(index);
      img.onerror = () => handleImageError(index);
    });
  }, [recommendations, handleImageError, handleImageLoaded]);

  const handleViewDetails = (recommendation) => {
    // TODO: Navigate to destination details page
    console.log('View details for destination:', recommendation);
  };

  const handleStartVote = () => {
    navigate('/voting', { state: { tripId: effectiveTripId, recommendations } });
  };

  const handleGoBack = () => {
    navigate(`/dashboard/${effectiveTripId}`);
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
              Group Travel AI
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
            Group Travel AI
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
                Generating new recommendations...
              </Typography>
            </Box>
          )}
          
          <Box component="main" className="destinations-grid">
            {recommendations.map((recommendation, index) => {
              // Create destination image URL based on destination and country
              const destination = recommendation.destination.toLowerCase().replace(/,/g, '').replace(/ /g, '-');
              const country = recommendation.country.toLowerCase().replace(/ /g, '-');
              const imageUrl = `https://source.unsplash.com/featured/1200x800/?${destination},${country},travel`;
              const fallbackImageUrl = `https://source.unsplash.com/random/1200x800/?travel,landscape`;
              
              return (
                <Box key={index} className="destination-card">
                  <Box className={`card-image ${!imagesLoaded[index] ? 'loading' : ''}`}>
                    <img 
                      src={imgErrors[index] ? fallbackImageUrl : imageUrl} 
                      alt={recommendation.destination}
                      onError={() => handleImageError(index)}
                      onLoad={() => handleImageLoaded(index)}
                    />
                    <Box className="fit-score">{recommendation.match_score}% fit</Box>
                  </Box>
                  <Box className="card-content">
                    <Box className="destination-header">
                      <Typography variant="h5" component="h3">{recommendation.destination}</Typography>
                      <Typography variant="body1" className="country">{recommendation.country}</Typography>
                    </Box>
                    <Box className="destination-details">
                      <Box className="detail">
                        <span>💰 {getBudgetTierText(recommendation.budget_tier)}</span>
                      </Box>
                      <Box className="detail">
                        <span>🗓️ Best time: {recommendation.best_time_to_visit}</span>
                      </Box>
                    </Box>
                    <Typography variant="body2" sx={{ my: 1 }}>
                      {recommendation.description.length > 100
                        ? `${recommendation.description.substring(0, 100)}...`
                        : recommendation.description}
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                      {recommendation.activities.slice(0, 3).map((activity, i) => (
                        <Chip 
                          key={i} 
                          label={activity} 
                          size="small" 
                          variant="outlined"
                          color="primary"
                        />
                      ))}
                      {recommendation.activities.length > 3 && (
                        <Chip 
                          label={`+${recommendation.activities.length - 3} more`} 
                          size="small"
                          variant="outlined"
                        />
                      )}
                    </Box>
                    <Button
                      variant="outlined"
                      className="view-details-button"
                      onClick={() => handleViewDetails(recommendation)}
                      fullWidth
                    >
                      View Details →
                    </Button>
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