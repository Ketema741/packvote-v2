import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { 
  Container, 
  Typography, 
  Box, 
  Button, 
  AppBar,
  Toolbar,
  Link,
  Paper,
  IconButton,
  Chip,
  CircularProgress,
  Alert
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import HowToVoteIcon from '@mui/icons-material/HowToVote';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import BeachAccessIcon from '@mui/icons-material/BeachAccess';
import { getTravelRecommendations, submitVotes } from '../utils/api';
import '../styles/LandingPage.css';
import '../styles/VotingPage.css';

const VotingPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { tripId: urlTripId } = useParams();
  
  // Get tripId either from URL params or from location state
  const tripId = urlTripId || (location.state && location.state.tripId);
  
  // Initialize with recommendations from location state if available
  const [destinations, setDestinations] = useState(location.state?.recommendations || []);
  const [loading, setLoading] = useState(!location.state?.recommendations);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // If recommendations weren't passed via location state, fetch them
    if (!location.state?.recommendations && tripId) {
      const fetchRecommendations = async () => {
        try {
          setLoading(true);
          const result = await getTravelRecommendations(tripId);
          if (result.recommendations && result.recommendations.length > 0) {
            setDestinations(result.recommendations);
          } else {
            setError('No recommendations found for this trip');
          }
        } catch (err) {
          setError(`Failed to load recommendations: ${err.message}`);
        } finally {
          setLoading(false);
        }
      };
      
      fetchRecommendations();
    }
  }, [tripId, location.state]);

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const items = Array.from(destinations);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setDestinations(items);
  };

  const handleMoveUp = (index) => {
    if (index === 0) return;
    
    const items = Array.from(destinations);
    const [item] = items.splice(index, 1);
    items.splice(index - 1, 0, item);
    
    setDestinations(items);
  };
  
  const handleMoveDown = (index) => {
    if (index === destinations.length - 1) return;
    
    const items = Array.from(destinations);
    const [item] = items.splice(index, 1);
    items.splice(index + 1, 0, item);
    
    setDestinations(items);
  };

  const handleSubmitVote = async () => {
    if (!tripId) {
      setError('Trip ID is missing');
      return;
    }
    
    try {
      setSubmitting(true);
      
      // Create vote data with ranking positions
      const voteData = {
        trip_id: tripId,
        rankings: destinations.map((destination, index) => ({
          recommendation_id: destination.id,
          rank_position: index + 1
        }))
      };
      
      // Submit to backend
      await submitVotes(voteData);
      
      // Navigate to winner page or show success message
      navigate('/winner', { state: { tripId } });
    } catch (err) {
      setError(`Failed to submit votes: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  // Utility function to format budget tier
  const formatBudgetTier = (tier) => {
    switch (tier) {
      case 'budget':
        return { text: 'Budget-Friendly', icon: <AttachMoneyIcon /> };
      case 'moderate':
        return { text: 'Moderate', icon: <><AttachMoneyIcon /><AttachMoneyIcon /></> };
      case 'luxury':
        return { text: 'Luxury', icon: <><AttachMoneyIcon /><AttachMoneyIcon /><AttachMoneyIcon /></> };
      default:
        return { text: tier, icon: <AttachMoneyIcon /> };
    }
  };

  // Get image URL for a destination
  const getImageUrl = (destination) => {
    if (destination.image_url) return destination.image_url;
    
    // Generate fallback image URL using Unsplash
    const dest = destination.destination.toLowerCase().replace(/,/g, '').replace(/ /g, '-');
    const country = destination.country.toLowerCase().replace(/ /g, '-');
    return `https://source.unsplash.com/featured/1200x800/?${dest},${country},travel`;
  };

  if (loading) {
    return (
      <div className="landing-page">
        <AppBar position="fixed" elevation={0} sx={{ bgcolor: 'background.paper' }}>
          <Toolbar sx={{ justifyContent: 'space-between' }}>
            <Typography 
              variant="h6" 
              component="div" 
              sx={{ 
                color: 'primary.main', 
                fontWeight: 600,
                cursor: 'pointer'
              }}
              onClick={() => navigate('/')}
            >
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
              Loading destinations...
            </Typography>
          </Box>
        </Container>
      </div>
    );
  }

  return (
    <div className="landing-page">
      {/* Navigation */}
      <AppBar position="fixed" elevation={0} sx={{ bgcolor: 'background.paper' }}>
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Typography 
            variant="h6" 
            component="div" 
            sx={{ 
              color: 'primary.main', 
              fontWeight: 600,
              cursor: 'pointer'
            }}
            onClick={() => navigate('/')}
          >
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

      <Container maxWidth="md" sx={{ pt: 12, pb: 8 }}>
        <Box sx={{ mb: 4, display: 'flex', alignItems: 'center' }}>
          <Button 
            startIcon={<ArrowBackIcon />} 
            onClick={() => navigate(-1)}
            sx={{ color: 'text.secondary' }}
          >
            Back
          </Button>
        </Box>
        
        {error && (
          <Alert severity="error" sx={{ mb: 4 }}>
            {error}
          </Alert>
        )}
        
        <Paper elevation={3} sx={{ p: 4, borderRadius: 3, mb: 4 }}>
          <Typography variant="h3" component="h1" gutterBottom align="center">
            Rank Destinations
          </Typography>
          
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
            <Chip
              icon={<AccessTimeIcon />}
              label="Voting ends in 23h"
              color="primary"
              variant="outlined"
            />
          </Box>

          <Typography 
            variant="body1" 
            align="center" 
            color="text.secondary" 
            sx={{ mb: 4 }}
          >
            Drag and drop to rank your preferences
          </Typography>

          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="destinations">
              {(provided) => (
                <Box
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  sx={{ mb: 4 }}
                >
                  {destinations.map((destination, index) => (
                    <Draggable
                      key={destination.id || `destination-${index}`}
                      draggableId={destination.id || `destination-${index}`}
                      index={index}
                    >
                      {(provided, snapshot) => (
                        <Paper
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          elevation={snapshot.isDragging ? 6 : 1}
                          sx={{ 
                            mb: 2, 
                            display: 'flex', 
                            alignItems: 'center',
                            p: 2,
                            borderRadius: 2,
                            bgcolor: snapshot.isDragging ? 'rgba(0, 0, 0, 0.02)' : 'background.paper',
                            transition: 'all 0.2s'
                          }}
                        >
                          <Box 
                            {...provided.dragHandleProps} 
                            sx={{ 
                              mr: 2, 
                              color: 'text.secondary',
                              cursor: 'grab'
                            }}
                          >
                            <DragIndicatorIcon />
                          </Box>
                          <Box 
                            sx={{ 
                              width: '80px', 
                              height: '60px', 
                              borderRadius: 1, 
                              overflow: 'hidden',
                              mr: 2,
                              flexShrink: 0
                            }}
                          >
                            <img 
                              src={getImageUrl(destination)} 
                              alt={destination.destination} 
                              style={{ 
                                width: '100%', 
                                height: '100%', 
                                objectFit: 'cover' 
                              }} 
                            />
                          </Box>
                          <Box sx={{ flexGrow: 1 }}>
                            <Typography 
                              variant="h6" 
                              sx={{ 
                                fontWeight: 500
                              }}
                            >
                              {destination.destination}
                              <Typography 
                                component="span" 
                                color="text.secondary" 
                                sx={{ ml: 1, fontSize: '0.9rem' }}
                              >
                                {destination.country}
                              </Typography>
                            </Typography>
                            
                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                              {/* Budget tier */}
                              <Chip 
                                size="small" 
                                variant="outlined" 
                                label={formatBudgetTier(destination.budget_tier).text}
                                icon={formatBudgetTier(destination.budget_tier).icon}
                              />
                              
                              {/* One matching vibe */}
                              {destination.matching_vibes && destination.matching_vibes.length > 0 && (
                                <Chip 
                                  size="small" 
                                  variant="outlined" 
                                  icon={<BeachAccessIcon />}
                                  label={destination.matching_vibes[0]}
                                />
                              )}
                            </Box>
                          </Box>
                          <Box>
                            <IconButton 
                              size="small" 
                              aria-label="Move up"
                              disabled={index === 0}
                              sx={{ color: index === 0 ? 'text.disabled' : 'text.secondary' }}
                              onClick={() => handleMoveUp(index)}
                            >
                              <ArrowUpwardIcon />
                            </IconButton>
                            <IconButton 
                              size="small" 
                              aria-label="Move down"
                              disabled={index === destinations.length - 1}
                              sx={{ color: index === destinations.length - 1 ? 'text.disabled' : 'text.secondary' }}
                              onClick={() => handleMoveDown(index)}
                            >
                              <ArrowDownwardIcon />
                            </IconButton>
                          </Box>
                        </Paper>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </Box>
              )}
            </Droppable>
          </DragDropContext>

          <Box sx={{ textAlign: 'center' }}>
            <Button 
              variant="contained" 
              startIcon={<HowToVoteIcon />}
              onClick={handleSubmitVote}
              className="primary-button"
              size="large"
              sx={{ mb: 1 }}
              disabled={submitting || destinations.length === 0}
            >
              {submitting ? 'Submitting...' : 'Submit my vote'}
            </Button>
            <Typography variant="body2" color="text.secondary">
              You can edit until the deadline
            </Typography>
          </Box>
        </Paper>
      </Container>

      {/* Footer */}
      <footer className="footer">
        <Container maxWidth="lg">
          <div className="footer-content">
            <div className="footer-donate">
              <div className="footer-donate-text">
                <LightbulbIcon />
                <Typography>Keep the API lights on</Typography>
              </div>
              <Button 
                variant="contained"
                onClick={() => navigate('/donate')}
                className="footer-donate-button"
              >
                Donate
              </Button>
            </div>
            <Typography variant="body1" align="center" className="footer-tagline">
              ✈️ Made for group travel lovers
            </Typography>
            <div className="footer-links">
              <Link href="/privacy">Privacy</Link>
              <Link href="/contact">Contact</Link>
            </div>
          </div>
        </Container>
      </footer>
    </div>
  );
};

export default VotingPage; 