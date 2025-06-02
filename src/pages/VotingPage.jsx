import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
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
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Snackbar
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import HowToVoteIcon from '@mui/icons-material/HowToVote';
import { getTravelRecommendations, submitVotes, getTripDetails } from '../utils/api';
import { getDestinationImage, getImageSync } from '../utils/imageService';
import { safeLog } from '../utils/loggingSanitizer';
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
  const [imagesLoaded, setImagesLoaded] = useState({});
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [destinationImages, setDestinationImages] = useState({});
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });

  // Log tripId for debugging
  useEffect(() => {
    safeLog.info('VotingPage - Current tripId:', tripId);
    safeLog.info('VotingPage - Location state:', location.state);

    if (!tripId) {
      setError('No trip ID provided. Please go back and try again.');
    }
  }, [tripId, location.state]);

  const processRecommendations = useCallback((recs) => {
    if (!recs || recs.length === 0) {return [];}

    // Process recommendations to ensure proper structures
    return recs.map((rec, index) => {
      // Skip invalid recommendations
      if (!rec) {return null;}

      // Create a copy of the recommendation
      const processed = { ...rec };

      // Ensure ID is present - throw an error if missing instead of generating a temp ID
      if (!processed.id) {
        const errorMsg = `Recommendation missing ID for ${processed.city || processed.destination || 'unknown destination'}`;
        safeLog.error(errorMsg, processed);
        throw new Error(errorMsg);
      } else {
        // Log the existing ID for debugging
        safeLog.info(`Using recommendation ID: ${processed.id} for ${processed.city || processed.destination}`);
      }

      // Determine location name from available fields
      processed.locationDisplayName = processed.city || processed.destination || 'Unknown Location';

      return processed;
    }).filter(Boolean); // Filter out any null entries
  }, []);

  // Function to format time remaining as string
  const formatTimeRemaining = (milliseconds) => {
    if (!milliseconds || milliseconds <= 0) {return 'Voting ended';}

    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days}d ${hours % 24}h remaining`;
    } else if (hours > 0) {
      return `${hours}h ${minutes % 60}m remaining`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s remaining`;
    } else {
      return `${seconds}s remaining`;
    }
  };

  // Effect for countdown timer
  useEffect(() => {
    if (!timeRemaining) {return;}

    const timer = setInterval(() => {
      setTimeRemaining(prevTime => {
        if (prevTime <= 1000) {
          clearInterval(timer);
          return 0;
        }
        return prevTime - 1000;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining]);

  // Fetch trip details and calculate deadline
  useEffect(() => {
    if (!tripId) {return;}

    const fetchTripDetails = async () => {
      try {
        const data = await getTripDetails(tripId);

        // Get participants who completed the survey
        if (data.participants && data.survey_responses) {
          // Find participants who have responded
          const respondedParticipants = data.participants.filter(participant => {
            return data.survey_responses.some(response => response.user_id === participant.id);
          });

          setParticipants(respondedParticipants);
        }

        // Find the latest survey response timestamp
        if (data.survey_responses && data.survey_responses.length > 0) {
          // Sort by created_at timestamp, newest first
          const sortedResponses = [...data.survey_responses].sort((a, b) => {
            return new Date(b.created_at) - new Date(a.created_at);
          });

          // Calculate deadline (48 hours after the last survey)
          const latestResponse = sortedResponses[0];
          const latestTimestamp = new Date(latestResponse.created_at);
          const deadlineTimestamp = new Date(latestTimestamp.getTime() + (48 * 60 * 60 * 1000));

          // Calculate time remaining
          const now = new Date();
          const msRemaining = deadlineTimestamp - now;

          setTimeRemaining(Math.max(0, msRemaining));
        }
      } catch (err) {
        safeLog.error('Error fetching trip details:', err);
      }
    };

    fetchTripDetails();
  }, [tripId]);

  useEffect(() => {
    // If recommendations weren't passed via location state, fetch them
    if (!location.state?.recommendations && tripId) {
      const fetchRecommendations = async () => {
        try {
          setLoading(true);
          const result = await getTravelRecommendations(tripId);
          if (result.recommendations && result.recommendations.length > 0) {
            // Log the raw recommendations to debug
            safeLog.info('Raw recommendations from API:', result.recommendations);

            // Verify that each recommendation has a valid ID
            const missingIds = result.recommendations.filter(rec => !rec.id);
            if (missingIds.length > 0) {
              safeLog.error('Recommendations with missing IDs:', missingIds);
              setError(`Error: ${missingIds.length} destinations are missing IDs. Please contact support.`);
              setLoading(false);
              return;
            }

            // Sort by timestamp to get the most recent recommendations
            const sortedRecommendations = [...result.recommendations];

            // Check if recommendations have timestamps
            if (sortedRecommendations[0] && sortedRecommendations[0].created_at) {
              // Sort by timestamp, newest first
              sortedRecommendations.sort((a, b) => {
                const dateA = new Date(a.created_at || 0);
                const dateB = new Date(b.created_at || 0);
                return dateB - dateA;
              });

              // Group recommendations by timestamp (to find distinct sets)
              const recommendationSets = sortedRecommendations.reduce((sets, rec) => {
                const timestamp = rec.created_at || 'unknown';
                if (!sets[timestamp]) {
                  sets[timestamp] = [];
                }
                sets[timestamp].push(rec);
                return sets;
              }, {});

              // Get the most recent set of recommendations
              const timestamps = Object.keys(recommendationSets).sort((a, b) => {
                // Sort timestamps, newest first (if they are valid dates)
                if (a === 'unknown') {return 1;}
                if (b === 'unknown') {return -1;}
                return new Date(b) - new Date(a);
              });

              if (timestamps.length > 0) {
                const mostRecentTimestamp = timestamps[0];
                safeLog.info(`Using most recent recommendation set from: ${mostRecentTimestamp}`);
                const mostRecentSet = recommendationSets[mostRecentTimestamp];

                // Verify all recommendations in set have valid IDs
                const validRecs = mostRecentSet.filter(rec => rec.id);
                if (validRecs.length < mostRecentSet.length) {
                  safeLog.warn(`Filtered out ${mostRecentSet.length - validRecs.length} recommendations with missing IDs`);
                }

                // Check if we have enough valid recommendations for voting
                if (validRecs.length < 2) {
                  setError('Not enough valid recommendations found. Please contact support.');
                  setLoading(false);
                  return;
                }

                try {
                  const processed = processRecommendations(validRecs);
                  safeLog.info('Processed recommendations:', processed);
                  setDestinations(processed);
                } catch (processError) {
                  safeLog.error('Error processing recommendations:', processError);
                  setError(`Error processing destinations: ${processError.message}`);
                }
              } else {
                // No timestamps found, use the top results after filtering by valid IDs
                const validRecs = sortedRecommendations.filter(rec => rec.id).slice(0, 3);

                // Check if we have enough valid recommendations for voting
                if (validRecs.length < 2) {
                  setError('Not enough valid recommendations found. Please contact support.');
                  setLoading(false);
                  return;
                }

                try {
                  const processed = processRecommendations(validRecs);
                  safeLog.info('Processed recommendations:', processed);
                  setDestinations(processed);
                } catch (processError) {
                  safeLog.error('Error processing recommendations:', processError);
                  setError(`Error processing destinations: ${processError.message}`);
                }
              }
            } else {
              try {
                const processed = processRecommendations(sortedRecommendations);
                safeLog.info('Processed recommendations:', processed);
                setDestinations(processed);
              } catch (processError) {
                safeLog.error('Error processing recommendations:', processError);
                setError(`Error processing destinations: ${processError.message}`);
              }
            }
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
    } else if (location.state?.recommendations) {
      // Log recommendations from location state
      safeLog.info('Recommendations from location state:', location.state.recommendations);

      // Verify all recommendations have valid IDs
      const recommendations = location.state.recommendations || [];
      const validRecs = recommendations.filter(rec => rec && rec.id);

      if (validRecs.length < recommendations.length) {
        safeLog.warn(`Filtered out ${recommendations.length - validRecs.length} recommendations with missing IDs from location state`);
      }

      // Check if we have enough valid recommendations for voting
      if (validRecs.length < 2) {
        setError('Not enough valid recommendations found in navigation state. Please try again from the dashboard.');
        return;
      }

      try {
        const processed = processRecommendations(validRecs);
        safeLog.info('Processed recommendations from state:', processed);
        setDestinations(processed);
      } catch (processError) {
        safeLog.error('Error processing recommendations from state:', processError);
        setError(`Error processing destinations: ${processError.message}`);
      }
    }
  }, [tripId, location.state, processRecommendations]);

  const handleMoveUp = (index) => {
    if (index === 0) {return;}

    const items = Array.from(destinations);
    const [item] = items.splice(index, 1);
    items.splice(index - 1, 0, item);

    setDestinations(items);
  };

  const handleMoveDown = (index) => {
    if (index === destinations.length - 1) {return;}

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

    // If no user is selected, open the dialog to select one
    if (!selectedUserId) {
      setUserDialogOpen(true);
      return;
    }

    try {
      setSubmitting(true);

      // Check if all destinations have valid IDs
      const missingIds = destinations.filter(dest => !dest.id);
      if (missingIds.length > 0) {
        safeLog.error('Destinations missing IDs:', missingIds);
        setError(`${missingIds.length} destinations are missing IDs. Cannot submit vote.`);
        return;
      }

      // Check for temporary IDs that should not be submitted
      const tempIds = destinations.filter(dest => dest.id && dest.id.startsWith('temp-'));
      if (tempIds.length > 0) {
        safeLog.error('Found destinations with temporary IDs:', tempIds);
        setError(`Error: ${tempIds.length} destinations have temporary IDs. Please reload the page or contact support.`);
        return;
      }

      // Check for duplicate IDs
      const idCounts = {};
      destinations.forEach(dest => {
        if (dest.id) {
          idCounts[dest.id] = (idCounts[dest.id] || 0) + 1;
        }
      });

      const duplicateIds = Object.entries(idCounts)
        .filter(([, count]) => count > 1)
        .map(([id]) => id);

      if (duplicateIds.length > 0) {
        safeLog.error('Duplicate recommendation IDs found:', duplicateIds);
        setError(`Found ${duplicateIds.length} duplicate recommendation IDs. Please reload the page and try again.`);
        return;
      }

      // Create vote data with ranking positions and user ID
      const voteData = {
        trip_id: tripId,
        user_id: selectedUserId,
        rankings: destinations.map((destination, index) => {
          safeLog.info(`Destination ${index+1}:`, destination.destination || destination.city, 'ID:', destination.id);
          return {
            recommendation_id: destination.id,
            rank_position: index + 1
          };
        })
      };

      safeLog.info('Submitting vote data:', voteData);

      try {
        // Submit to backend
        const response = await submitVotes(voteData);
        safeLog.info('Vote submission response:', response);

        // Show success message
        setToast({
          open: true,
          message: 'Your vote has been submitted successfully!',
          severity: 'success'
        });

        // Navigate back to dashboard
        setTimeout(() => {
          navigate(`/dashboard/${tripId}`);
        }, 2000);
      } catch (submitError) {
        safeLog.error('Error during submission:', submitError);
        const errorMessage = submitError.message || 'Unknown error during vote submission';
        setError(`Failed to submit votes: ${errorMessage}`);
      }
    } catch (err) {
      const errorMessage = err.message || 'Unknown error preparing vote data';
      setError(`Failed to submit votes: ${errorMessage}`);
      safeLog.error('Vote submission error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUserSelect = (userId) => {
    // Set the selected user ID first
    setSelectedUserId(userId);

    // Then proceed with submission
    try {
      setSubmitting(true);
      setUserDialogOpen(false);

      // Check for destinations with temporary IDs
      const tempIds = destinations.filter(dest => dest.id && dest.id.startsWith('temp-'));
      if (tempIds.length > 0) {
        safeLog.error('Found destinations with temporary IDs:', tempIds);
        setError(`Error: ${tempIds.length} destinations have temporary IDs. Please reload the page or contact support.`);
        setSubmitting(false);
        return;
      }

      // Create vote data with ranking positions and user ID
      const voteData = {
        trip_id: tripId,
        user_id: userId,
        rankings: destinations.map((destination, index) => {
          safeLog.info(`Destination ${index+1}:`, destination.destination || destination.city, 'ID:', destination.id);
          return {
            recommendation_id: destination.id,
            rank_position: index + 1
          };
        })
      };

      safeLog.info('Submitting vote data:', voteData);

      // Submit to backend
      submitVotes(voteData)
        .then(() => {
          // Show success message
          setToast({
            open: true,
            message: 'Your vote has been submitted successfully!',
            severity: 'success'
          });

          // Navigate back to dashboard
          setTimeout(() => {
            navigate(`/dashboard/${tripId}`);
          }, 2000);
        })
        .catch(err => {
          setError(`Failed to submit votes: ${err.message}`);
          safeLog.error('Vote submission error:', err);
          setSubmitting(false);
        });
    } catch (err) {
      setError(`Failed to prepare vote data: ${err.message}`);
      safeLog.error('Vote preparation error:', err);
      setSubmitting(false);
      setUserDialogOpen(false);
    }
  };

  const handleImageLoaded = useCallback((id) => {
    setImagesLoaded(prev => ({ ...prev, [id]: true }));
  }, []);

  // Load destination images when destinations change
  useEffect(() => {
    if (!destinations || destinations.length === 0) {return;}

    // Initialize with fallback/sync images for immediate display
    const initialImages = {};
    destinations.forEach((destination, index) => {
      if (!destination) {return;}
      initialImages[index] = getImageSync(destination);
    });
    setDestinationImages(initialImages);

    // Then load images from API asynchronously
    const loadImages = async () => {
      const imagePromises = destinations.map(async (destination, index) => {
        if (!destination) {return null;}

        try {
          const imageUrl = await getDestinationImage(destination);
          return { index, imageUrl };
        } catch (err) {
          safeLog.error('Error loading image for', destination.locationDisplayName, err);
          return { index, imageUrl: getImageSync(destination) };
        }
      });

      // Update images as they load
      const results = await Promise.all(imagePromises);
      const newImages = { ...initialImages };

      results.forEach(result => {
        if (result) {
          newImages[result.index] = result.imageUrl;
        }
      });

      setDestinationImages(newImages);
    };

    loadImages();
  }, [destinations]);

  const handleCloseToast = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setToast(prev => ({ ...prev, open: false }));
  };

  // Render loading state
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

      <Container maxWidth="md" sx={{ pt: 12, pb: 8 }}>
        <Box sx={{ mb: 4, display: 'flex', alignItems: 'center' }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => {
              // When going back, preserve the regenerationsRemaining count if available
              if (location.state?.regenerationsRemaining !== undefined) {
                navigate(`/recommendations/${tripId}`, {
                  state: {
                    tripId: tripId,
                    regenerationsRemaining: location.state.regenerationsRemaining
                  }
                });
              } else {
                navigate(-1);
              }
            }}
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

        {!tripId && (
          <Alert severity="warning" sx={{ mb: 4 }}>
            Trip ID is missing. Please go back to the dashboard or recommendations page.
          </Alert>
        )}

        <Paper elevation={3} sx={{ p: 4, borderRadius: 3, mb: 4 }}>
          <Typography variant="h3" component="h1" gutterBottom align="center">
            Rank Destinations
          </Typography>

          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
            <Chip
              icon={<AccessTimeIcon />}
              label={timeRemaining !== null ? formatTimeRemaining(timeRemaining) : 'Calculating time...'}
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
            Use the arrows to rank your preferences
          </Typography>

          <Box sx={{ mb: 4 }}>
            {destinations.map((destination, index) => (
              <Paper
                key={destination.id || `destination-${index}`}
                elevation={1}
                sx={{
                  mb: 2,
                  display: 'flex',
                  alignItems: 'center',
                  p: 2,
                  borderRadius: 2,
                  bgcolor: 'background.paper',
                  transition: 'all 0.2s'
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: 'primary.main',
                    color: 'white',
                    fontWeight: 'bold',
                    mr: 2,
                    flexShrink: 0
                  }}
                >
                  {index + 1}
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
                  className={`card-image ${!imagesLoaded[index] ? 'loading' : ''}`}
                >
                  <img
                    src={destinationImages[index] || getImageSync(destination)}
                    alt={destination.destination}
                    onLoad={() => handleImageLoaded(index)}
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
            ))}
          </Box>

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

      {/* User selection dialog */}
      <Dialog open={userDialogOpen} onClose={() => setUserDialogOpen(false)}>
        <DialogTitle>Who are you?</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Please select your name to submit your vote.
          </DialogContentText>
          {participants.length > 0 ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 2 }}>
              {participants.map((participant) => (
                <Button
                  key={participant.id}
                  variant="outlined"
                  onClick={() => handleUserSelect(participant.id)}
                  sx={{ py: 1.5, textAlign: 'left', justifyContent: 'flex-start' }}
                >
                  {participant.name}
                </Button>
              ))}
            </Box>
          ) : (
            <Typography color="error">
              No participants found who completed the survey.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUserDialogOpen(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>

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

export default VotingPage;