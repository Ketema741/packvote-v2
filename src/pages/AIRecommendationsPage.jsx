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
  Chip,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControlLabel,
  Checkbox,
  FormGroup
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import { getTravelRecommendations, generateTravelRecommendations, getTripDetails } from '../utils/api';
import { getDestinationImage, getImageSync } from '../utils/imageService';
import { safeLog } from '../utils/loggingSanitizer';
import '../styles/AIRecommendationsPage.css';
import '../styles/LandingPage.css';

/*
 * TODO: Break this large component (1191 lines) into smaller, manageable components:
 * - RecommendationCard: Individual recommendation display with actions
 * - RecommendationsList: Grid/list of recommendations with filtering
 * - TripSummaryCard: Display trip overview and participant info
 * - RegenerationDialog: Handle recommendation regeneration with options
 * - FeedbackDialog: Handle feedback submission for recommendations
 * - RecommendationFilters: Filter and sort recommendations
 * - VotingProgress: Show voting status if voting has started
 *
 * TODO: Implement virtualization for large recommendation lists
 * TODO: Add proper loading skeletons for each component section
 * TODO: Implement recommendation caching to avoid unnecessary API calls
 * TODO: Add image lazy loading for recommendation photos
 * TODO: Implement infinite scroll or pagination for recommendations
 */

const AIRecommendationsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { tripId } = useParams();

  // Get trip ID from params or from location state
  const effectiveTripId = tripId || (location.state && location.state.tripId);

  const [recommendations, setRecommendations] = useState([]);
  const [selectedRecIds, setSelectedRecIds] = useState([]);
  const [expandedRecIds, setExpandedRecIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [imagesLoaded, setImagesLoaded] = useState({});
  const [destinationImages, setDestinationImages] = useState({});

  // Initialize regenerationsRemaining from location state if available
  const [regenerationsRemaining, setRegenerationsRemaining] = useState(
    location.state?.regenerationsRemaining !== undefined
      ? location.state.regenerationsRemaining
      : 3
  );

  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [toast, setToast] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // Set regenerations remaining from location state if available
  useEffect(() => {
    if (location.state && location.state.regenerationsRemaining !== undefined) {
      setRegenerationsRemaining(location.state.regenerationsRemaining);
    }
  }, [location.state]);

  const processRecommendations = useCallback((recs) => {
    if (!recs || recs.length === 0) {
      return [];
    }

    // Process recommendations to limit activities and ensure proper structures
    const processedRecs = recs.map((rec, index) => {
      // Skip invalid recommendations
      if (!rec) {
        return null;
      }

      // Create a copy of the recommendation
      const processed = { ...rec };

      // Ensure ID is present - create a temporary one if missing
      if (!processed.id) {
        // Generate a temporary ID for display purposes
        processed.id = `temp-${Date.now()}-${index}`;
        processed.has_temp_id = true; // Mark this so we know it's not a real DB ID
      }

      // Determine location name from available fields
      processed.locationDisplayName = processed.city || processed.destination || 'Unknown Location';

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

      // Get trip details to check if recommendations exist
      const tripDetails = await getTripDetails(effectiveTripId);

      // Store regenerations_remaining from trip details
      // This will be used if we can't get it from recommendation endpoints
      const tripRegenerationsRemaining = tripDetails.regenerations_remaining !== undefined
        ? parseInt(tripDetails.regenerations_remaining, 10)
        : 3;

      // PRIORITY 1: Always try to get existing recommendations from the database first
      let existingRecommendationsFound = false;

      try {
        // Only try to get recommendations if the flag indicates they exist
        if (tripDetails.has_recommendations === true) {
          const result = await getTravelRecommendations(effectiveTripId);

          if (result && result.recommendations && result.recommendations.length > 0) {
            existingRecommendationsFound = true;

            // Update regenerations_remaining from API response if available
            if (result.regenerations_remaining !== undefined) {
              setRegenerationsRemaining(parseInt(result.regenerations_remaining, 10));
            } else {
              // Fallback to trip details value
              setRegenerationsRemaining(tripRegenerationsRemaining);
            }

            // Sort the recommendations by timestamp, newest first
            const sortedRecommendations = [...result.recommendations];

            if (sortedRecommendations[0] && sortedRecommendations[0].created_at) {
              sortedRecommendations.sort((a, b) => {
                const dateA = new Date(a.created_at || 0);
                const dateB = new Date(b.created_at || 0);
                return dateB - dateA;
              });
            }

            // Take only the most recent 3 recommendations
            const mostRecentRecs = sortedRecommendations.slice(0, 3);

            // Process the recommendations
            const processed = processRecommendations(mostRecentRecs);

            if (processed.length > 0) {
              // Set the recommendations and finish
              setRecommendations(processed);
              setLoading(false);
              return;
            } else {
              existingRecommendationsFound = false;
            }
          }
        }
      } catch (fetchErr) {
        // Log the error and continue to generate new recommendations
        safeLog.error('Error fetching existing recommendations:', fetchErr.message);
        // Fallback to trip details value for regenerations_remaining
        setRegenerationsRemaining(tripRegenerationsRemaining);
      }

      // PRIORITY 2: Only generate new recommendations if none exist or there was an error
      if (!existingRecommendationsFound) {
        safeLog.info('Need to generate new recommendations');
        setGenerating(true);
        try {
          safeLog.info('Calling generateTravelRecommendations API...');
          const newRecommendations = await generateTravelRecommendations(effectiveTripId);
          safeLog.info('Successfully generated new recommendations:', newRecommendations.recommendations.length);

          // Update regenerations_remaining from API response if available
          if (newRecommendations.regenerations_remaining !== undefined) {
            safeLog.info('Setting regenerations_remaining from generate API:', newRecommendations.regenerations_remaining);
            setRegenerationsRemaining(parseInt(newRecommendations.regenerations_remaining, 10));
          } else {
            // Fallback to trip details value
            safeLog.info('No regenerations_remaining in generate API, using trip details value:', tripRegenerationsRemaining);
            setRegenerationsRemaining(tripRegenerationsRemaining);
          }

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
        } catch (genErr) {
          safeLog.error('Failed to generate recommendations:', genErr);
          setError(`Failed to generate recommendations: ${genErr.message}`);
          // Use regenerations_remaining from trip details as fallback
          setRegenerationsRemaining(tripRegenerationsRemaining);
        } finally {
          setGenerating(false);
        }
      }
    } catch (err) {
      setError(`Failed to fetch recommendations: ${err.message}`);
      safeLog.error('Error in fetchRecommendations:', err);
      setGenerating(false);
    } finally {
      setLoading(false);
    }
  }, [effectiveTripId, processRecommendations]);

  const handleOpenFeedbackDialog = () => {
    // Only proceed if regenerations remain
    if (regenerationsRemaining <= 0) {
      setToast({
        open: true,
        message: 'You have used all your free regenerations for this trip.',
        severity: 'error'
      });
      return;
    }

    // If no recommendations are selected, select all of them
    if (selectedRecIds.length === 0) {
      const allRecIds = recommendations.map(rec => rec.id);
      setSelectedRecIds(allRecIds);
    }
    setFeedbackDialogOpen(true);
  };

  const handleCloseFeedbackDialog = () => {
    setFeedbackDialogOpen(false);
  };

  const handleRegenerateWithFeedback = async () => {
    setFeedbackDialogOpen(false);

    if (!effectiveTripId) {return;}

    if (regenerationsRemaining <= 0) {
      setToast({
        open: true,
        message: 'You have used all your free regenerations for this trip.',
        severity: 'error'
      });
      return;
    }

    try {
      setGenerating(true);
      setToast({
        open: true,
        message: 'Generating new recommendations based on your feedback (this could take a few minutes)...',
        severity: 'info'
      });

      // Get IDs of selected recommendations to regenerate
      const recIdsToRegenerate = selectedRecIds.length > 0 ? selectedRecIds : recommendations.map(rec => rec.id);

      const newRecommendations = await generateTravelRecommendations(effectiveTripId, {
        temperature: 0.9,
        feedback: feedbackText,
        previousRecommendations: recIdsToRegenerate
      });

      // Always update regenerations_remaining from the API response if available
      if (newRecommendations.regenerations_remaining !== undefined) {
        const updatedRegenerationsCount = parseInt(newRecommendations.regenerations_remaining, 10);
        setRegenerationsRemaining(updatedRegenerationsCount);
      } else {
        // If API doesn't return regenerations_remaining, refresh from trip details as fallback
        try {
          const tripDetails = await getTripDetails(effectiveTripId);
          if (tripDetails.regenerations_remaining !== undefined) {
            const fallbackCount = parseInt(tripDetails.regenerations_remaining, 10);
            setRegenerationsRemaining(fallbackCount);
          } else {
            // Last resort - decrement current count
            const decrementedCount = Math.max(0, regenerationsRemaining - 1);
            setRegenerationsRemaining(decrementedCount);
          }
        } catch (refreshErr) {
          safeLog.error('Error refreshing regenerations count from trip details:', refreshErr);
          // Last resort - decrement current count
          const decrementedCount = Math.max(0, regenerationsRemaining - 1);
          setRegenerationsRemaining(decrementedCount);
        }
      }

      // Process and set new recommendations
      if (newRecommendations && newRecommendations.recommendations) {
        // Replace only the selected recommendations
        if (selectedRecIds.length > 0 && selectedRecIds.length < recommendations.length) {
          const newRecsMap = {};
          newRecommendations.recommendations.forEach(rec => {
            newRecsMap[rec.id] = rec;
          });

          // Initialize updatedRecs as a copy of the current recommendations
          const updatedRecs = [...recommendations];

          // Get list of existing destination names to avoid duplicates
          const existingDestinations = updatedRecs.map(rec =>
            rec.city?.toLowerCase() || rec.destination?.toLowerCase() || ''
          );

          // Debug the list of destinations to avoid duplicates
          safeLog.info('Existing destinations:', existingDestinations);

          // Track which selected recommendations have been successfully replaced
          const replacedIds = [];

          // Now map through and replace selected recommendations
          for (let i = 0; i < updatedRecs.length; i++) {
            if (selectedRecIds.includes(updatedRecs[i].id)) {
              // Find a new recommendation that hasn't been used and has a different destination
              const newRec = newRecommendations.recommendations.find(r => {
                // Check if this recommendation is already used in the updated recs
                const isAlreadyUsed = updatedRecs.some(existingRec =>
                  existingRec.id === r.id && !selectedRecIds.includes(existingRec.id)
                );

                // Get the destination names
                const newDestinationName = r.city?.toLowerCase() || r.destination?.toLowerCase() || '';
                const currentDestinationName = updatedRecs[i].city?.toLowerCase() || updatedRecs[i].destination?.toLowerCase() || '';

                // Check if this destination already exists in any recommendation (including the one being replaced)
                const isDestinationInOtherRecs = updatedRecs.some((existingRec, index) => {
                  // Skip comparing with the current recommendation being replaced
                  if (index === i) {return false;}

                  const existingDestName = existingRec.city?.toLowerCase() || existingRec.destination?.toLowerCase() || '';
                  return existingDestName === newDestinationName;
                });

                // Also ensure it's not the same as the one we're replacing
                const isSameAsCurrentDestination = newDestinationName === currentDestinationName;

                // Only use recommendations that have unique destinations and aren't already used
                return !isAlreadyUsed && !isDestinationInOtherRecs && !isSameAsCurrentDestination && !replacedIds.includes(r.id);
              });

              if (newRec) {
                updatedRecs[i] = newRec;
                replacedIds.push(newRec.id);
              }
            }
          }

          // If we couldn't find valid replacements, show a warning
          if (replacedIds.length < selectedRecIds.length) {
            setToast({
              open: true,
              message: 'Some destinations could not be replaced with unique alternatives. Try regenerating all recommendations.',
              severity: 'warning'
            });
          }

          setRecommendations(processRecommendations(updatedRecs));
        } else {
          // Replace all recommendations
          setRecommendations(processRecommendations(newRecommendations.recommendations));
        }

        // Get the current regenerations count for display
        const currentRegenerationsRemaining = newRecommendations.regenerations_remaining !== undefined ?
          parseInt(newRecommendations.regenerations_remaining, 10) :
          regenerationsRemaining;

        setToast({
          open: true,
          message: `New recommendations generated! (${currentRegenerationsRemaining} regeneration${currentRegenerationsRemaining === 1 ? '' : 's'} remaining)`,
          severity: 'success'
        });
      }

      // Clear selected recommendations and feedback
      setSelectedRecIds([]);
      setExpandedRecIds([]);
      setFeedbackText('');
    } catch (err) {
      safeLog.error('Error regenerating recommendations:', err);

      // Check for specific error about no regenerations remaining
      if (err.message && err.message.includes('No regenerations remaining')) {
        safeLog.info('Server indicates no regenerations remaining, updating UI state');
        // Force update the UI state to match server
        setRegenerationsRemaining(0);
      }

      // Force refresh trip details to ensure we have the latest count
      try {
        const tripDetails = await getTripDetails(effectiveTripId);
        if (tripDetails && tripDetails.regenerations_remaining !== undefined) {
          const serverCount = parseInt(tripDetails.regenerations_remaining, 10);
          safeLog.info('Server says regenerations remaining:', serverCount);

          // Always use server value
          safeLog.info(`Updating regenerations from ${regenerationsRemaining} to ${serverCount}`);
          setRegenerationsRemaining(serverCount);

          if (serverCount === 0) {
            setToast({
              open: true,
              message: 'You have used all available regenerations for this trip.',
              severity: 'info'
            });
          }
        }
      } catch (refreshErr) {
        safeLog.error('Failed to refresh trip details after error:', refreshErr);
      }

      setToast({
        open: true,
        message: `Error: ${err.message}`,
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

  // Monitor selectedRecIds changes
  useEffect(() => {
    safeLog.info('Selected recommendation IDs updated:', selectedRecIds);
    // Validate that all IDs in selectedRecIds exist in recommendations
    const recommendationIds = recommendations.map(rec => rec.id);
    const invalidIds = selectedRecIds.filter(id => !recommendationIds.includes(id));
    if (invalidIds.length > 0) {
      safeLog.warn('Found invalid IDs in selection:', invalidIds);
      // Clean up invalid IDs
      setSelectedRecIds(prev => prev.filter(id => recommendationIds.includes(id)));
    }
  }, [selectedRecIds, recommendations]);

  // Added back the regenerate function
  const handleRegenerateRecommendations = async () => {
    if (selectedRecIds.length === 0) {
      // If no recommendations are selected, open the feedback dialog
      handleOpenFeedbackDialog();
      return;
    }

    if (regenerationsRemaining <= 0) {
      setToast({
        open: true,
        message: 'You have used all your free regenerations for this trip.',
        severity: 'error'
      });
      return;
    }

    // Confirm if they really want to regenerate
    const confirmed = window.confirm(
      `Regenerating will replace ${selectedRecIds.length === recommendations.length ? 'all' : 'selected'} recommendations and they can't be recovered. You have ${regenerationsRemaining} regenerations remaining. Continue?`
    );

    if (!confirmed) {return;}

    // Open the feedback dialog to get user input
    handleOpenFeedbackDialog();
  };

  // Force refetch trip details and regeneration count when navigating back
  useEffect(() => {
    const fetchTripDetailsOnly = async () => {
      if (!effectiveTripId) {return;}

      try {
        safeLog.info('Fetching trip details without setting generating state...');

        // Get latest trip details to update regeneration count
        const tripDetails = await getTripDetails(effectiveTripId);
        safeLog.info('Fetched trip details:', tripDetails);

        // Update regenerations remaining from server data
        if (tripDetails && tripDetails.regenerations_remaining !== undefined) {
          const serverCount = parseInt(tripDetails.regenerations_remaining, 10);
          safeLog.info('Server says regenerations remaining:', serverCount);
          setRegenerationsRemaining(serverCount);
        }
      } catch (err) {
        safeLog.error('Error fetching trip details:', err);
      }
    };

    const refreshTripDetails = async () => {
      if (!effectiveTripId) {return;}

      try {
        safeLog.info('Refreshing trip details from server...');
        // Store the original generating state
        const wasGenerating = generating;
        safeLog.info('Current generating state before refresh:', generating);

        // Only set generating to true if it wasn't already and we're not in initial load
        if (!wasGenerating) {
          safeLog.info('Setting generating to true for trip details refresh');
          setGenerating(true);
        }

        // Get latest trip details to update regeneration count
        const tripDetails = await getTripDetails(effectiveTripId);
        safeLog.info('Refreshed trip details:', tripDetails);

        // Update regenerations remaining from server data
        if (tripDetails && tripDetails.regenerations_remaining !== undefined) {
          const serverCount = parseInt(tripDetails.regenerations_remaining, 10);
          safeLog.info('Server says regenerations remaining:', serverCount);

          // If there's a discrepancy between UI and server, always use server value
          if (serverCount !== regenerationsRemaining) {
            safeLog.info(`Updating regenerations from ${regenerationsRemaining} to ${serverCount}`);
            setRegenerationsRemaining(serverCount);

            // If server says zero but UI shows more, show a message to user
            if (serverCount === 0 && regenerationsRemaining > 0) {
              setToast({
                open: true,
                message: 'You have used all available regenerations for this trip.',
                severity: 'info'
              });
            }
          }
        }

        // Always reset generating state to ensure it doesn't get stuck
        setGenerating(false);
        safeLog.info('Reset generating state to false after trip details refresh');
      } catch (err) {
        safeLog.error('Error refreshing trip details:', err);
        // Always reset the generating state if we set it
        setGenerating(false);
        safeLog.info('Reset generating state to false after error in trip details refresh');
      }
    };

    // Listen for the 'focus' event on the window (when user navigates back to this page)
    const handleFocus = () => {
      safeLog.info('Window focused, refreshing trip details');
      refreshTripDetails();
    };

    // Initial fetch - don't set generating state
    safeLog.info('Running initial trip details fetch...');
    fetchTripDetailsOnly();

    // Add event listener
    window.addEventListener('focus', handleFocus);

    // Cleanup
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [effectiveTripId]);

  // Manual check to ensure generating state isn't stuck
  useEffect(() => {
    safeLog.info('Generating state changed to:', generating);

    // If generating is true, set a safety timeout to reset it after 30 seconds
    if (generating) {
      const safetyTimer = setTimeout(() => {
        safeLog.info('Safety timeout reached - resetting generating state');
        setGenerating(false);
      }, 30000); // 30 second safety timeout

      return () => clearTimeout(safetyTimer);
    }
  }, [generating]);

  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  // Load destination images when recommendations change
  useEffect(() => {
    if (!recommendations || recommendations.length === 0) {return;}

    // Initialize with fallback/sync images first for immediate display
    const initialImages = {};
    recommendations.forEach((recommendation, index) => {
      if (!recommendation) {return;}
      initialImages[index] = getImageSync(recommendation);
    });
    setDestinationImages(initialImages);

    // Then load images from Unsplash API asynchronously
    const loadImages = async () => {
      const imagePromises = recommendations.map(async (recommendation, index) => {
        if (!recommendation) {return null;}

        try {
          const imageUrl = await getDestinationImage(recommendation);
          return { index, imageUrl };
        } catch (err) {
          safeLog.error('Error loading image for', recommendation.locationDisplayName, err);
          return { index, imageUrl: getImageSync(recommendation) };
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
  }, [recommendations]);

  // Replace the preload images effect with our new imageService
  useEffect(() => {
    if (!recommendations || recommendations.length === 0) {return;}

    recommendations.forEach((recommendation, index) => {
      if (!recommendation) {return;}

      // Use the image from our state (either sync or async loaded)
      const imageUrl = destinationImages[index] || getImageSync(recommendation);

      // Preload the image
      const img = new Image();
      img.src = imageUrl;
      img.onload = () => handleImageLoaded(index);
    });
  }, [recommendations, destinationImages, handleImageLoaded]);

  const handleStartVote = () => {
    // Ensure we have a valid tripId and make it explicit in the state
    safeLog.info('AIRecommendationsPage - Starting vote with tripId:', effectiveTripId);
    safeLog.info('AIRecommendationsPage - Current regenerations remaining:', regenerationsRemaining);

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
        message: 'Need at least 2 recommendations to start voting. Please regenerate or try again later.',
        severity: 'warning'
      });
      return;
    }

    // Double-check for recommendations without IDs
    const missingIds = recommendations.filter(rec => !rec || !rec.id);
    if (missingIds.length > 0) {
      safeLog.error('Recommendations missing IDs:', missingIds);

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
            recommendations: validRecs,
            regenerationsRemaining: regenerationsRemaining
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
        recommendations,
        regenerationsRemaining: regenerationsRemaining
      }
    });
  };

  const handleGoBack = () => {
    navigate(`/dashboard/${effectiveTripId}`, {
      state: {
        fromRecommendations: true,
        regenerationsRemaining: regenerationsRemaining
      }
    });
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

  // Add this section to render feedback dialog
  const renderFeedbackDialog = () => {
    const selectedCount = selectedRecIds.length;
    const totalCount = recommendations.length;

    return (
      <Dialog
        open={feedbackDialogOpen}
        onClose={handleCloseFeedbackDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Why don't you like {selectedCount === 0 || selectedCount === totalCount
            ? 'these recommendations'
            : `${selectedCount} of ${totalCount} recommendations`}?
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Your feedback helps us generate better recommendations.
            After submitting, you'll have {regenerationsRemaining > 0 ? regenerationsRemaining - 1 : 0} regenerations remaining.
          </DialogContentText>
          {selectedCount === 0 && (
            <DialogContentText sx={{ color: 'primary.main', mb: 2 }}>
              All recommendations will be regenerated.
            </DialogContentText>
          )}
          {selectedCount > 0 && selectedCount < totalCount && (
            <DialogContentText sx={{ color: 'primary.main', mb: 2 }}>
              Only selected destinations will be regenerated.
            </DialogContentText>
          )}
          <TextField
            autoFocus
            margin="dense"
            id="feedback"
            label="Your Feedback"
            fullWidth
            multiline
            rows={4}
            variant="outlined"
            value={feedbackText}
            onChange={(e) => setFeedbackText(e.target.value)}
            placeholder="Example: These destinations are too expensive, I'm looking for budget-friendly options. Or: These don't match our vibe, we want more adventure activities."
          />

          {selectedCount === 0 && (
            <FormGroup sx={{ mt: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Select destinations to regenerate:
              </Typography>
              {recommendations.map((rec, index) => (
                <FormControlLabel
                  key={rec.id}
                  control={
                    <Checkbox
                      checked={selectedRecIds.includes(rec.id)}
                      onClick={(e) => {
                        // Using onClick instead of onChange and stopping propagation
                        e.stopPropagation();
                      }}
                      onChange={(e) => {
                        safeLog.info('Checkbox direct toggle for:', rec.id, e.target.checked);
                        // Direct selection based on the checkbox state
                        if (e.target.checked) {
                          setSelectedRecIds(prev => [...prev, rec.id]);
                        } else {
                          setSelectedRecIds(prev => prev.filter(id => id !== rec.id));
                        }
                      }}
                    />
                  }
                  label={rec.city || rec.destination}
                />
              ))}
            </FormGroup>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseFeedbackDialog}>Cancel</Button>
          <Button
            onClick={handleRegenerateWithFeedback}
            variant="contained"
            color="primary"
            disabled={regenerationsRemaining <= 0}
          >
            Regenerate {selectedCount > 0 && selectedCount < totalCount ? 'Selected' : ''} Recommendations
          </Button>
        </DialogActions>
      </Dialog>
    );
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
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              {regenerationsRemaining >= 0 && (
                <Chip
                  label={`${regenerationsRemaining} regeneration${regenerationsRemaining === 1 ? '' : 's'} remaining`}
                  color={regenerationsRemaining === 0 ? 'error' : regenerationsRemaining === 1 ? 'warning' : 'success'}
                  sx={{ mr: 1 }}
                />
              )}
              <Button
                variant="outlined"
                onClick={handleGoBack}
                className="secondary-button"
              >
                Back to Trip
              </Button>
              <Button
                variant="contained"
                onClick={handleStartVote}
                className="primary-button"
              >
                Start Vote
              </Button>
            </Box>
          </Box>

          {recommendations.length > 0 && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                <Button
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  onClick={handleRegenerateRecommendations}
                  disabled={generating || regenerationsRemaining <= 0}
                  className="secondary-button"
                >
                  {selectedRecIds.length > 0
                    ? `Regenerate Selected (${selectedRecIds.length})`
                    : regenerationsRemaining <= 0 ? 'No Regenerations Left' : 'Regenerate All'}
                </Button>
              </Box>

              <div className="recommendations-grid">
                {recommendations.map((recommendation, index) => {
                  // Extract ID for clarity and debugging
                  const recId = recommendation.id;

                  // Check if this recommendation is selected
                  const isSelected = selectedRecIds.includes(recId);

                  return (
                    <div
                      key={recId || index}
                      className={`recommendation-card ${isSelected ? 'selected' : ''}`}
                      onClick={() => {
                        if (regenerationsRemaining > 0) {
                          safeLog.info('Card clicked for:', recId);
                          // Direct selection toggle for regeneration
                          setSelectedRecIds(prev =>
                            prev.includes(recId)
                              ? prev.filter(id => id !== recId)
                              : [...prev, recId]
                          );
                        }
                      }}
                      style={{ cursor: regenerationsRemaining > 0 ? 'pointer' : 'default' }}
                    >
                      <div className="recommendation-card-content">
                        {regenerationsRemaining > 0 && (
                          <div className="recommendation-selection">
                            <Checkbox
                              checked={isSelected}
                              onClick={(e) => {
                                // Prevent the card click from also firing
                                e.stopPropagation();
                              }}
                              onChange={(e) => {
                                safeLog.info('Checkbox clicked for:', recId, e.target.checked);
                                // Direct selection based on the checkbox state
                                setSelectedRecIds(prev =>
                                  e.target.checked
                                    ? [...prev, recId]
                                    : prev.filter(id => id !== recId)
                                );
                              }}
                            />
                          </div>
                        )}

                        <Box className={`card-image ${!imagesLoaded[index] ? 'loading' : ''}`} sx={{
                          height: '180px',
                          overflow: 'hidden'
                        }}>
                          <img
                            src={destinationImages[index] || getImageSync(recommendation)}
                            alt={recommendation.locationDisplayName || recommendation.city || recommendation.destination || 'Unknown Location'}
                            onLoad={() => handleImageLoaded(index)}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        </Box>
                        <Box className="card-content" sx={{ p: 2, display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                          <Box className="destination-header">
                            <Typography variant="h5" component="h3">{recommendation.locationDisplayName || recommendation.city || recommendation.destination || 'Unknown Location'}</Typography>
                            <Typography variant="body1" className="country">{recommendation.country || 'Unknown Country'}</Typography>
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
                            ...(expandedRecIds.includes(recommendation.id) && {
                              backgroundColor: 'rgba(0, 0, 0, 0.02)',
                              p: 1.5,
                              borderRadius: 1,
                              borderLeft: '3px solid',
                              borderColor: 'primary.light',
                              mb: 2
                            })
                          }}>
                            {expandedRecIds.includes(recommendation.id)
                              ? recommendation.description
                              : recommendation.description && recommendation.description.length > 100
                                ? `${recommendation.description.substring(0, 100)}...`
                                : recommendation.description || 'No description available'}
                          </Typography>

                          {recommendation.description && recommendation.description.length > 100 && (
                            <Button
                              variant="text"
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                safeLog.info('Read more/less clicked for:', recId);
                                // Toggle expansion for this recommendation
                                setExpandedRecIds(prev =>
                                  prev.includes(recId)
                                    ? prev.filter(id => id !== recId)
                                    : [...prev, recId]
                                );
                              }}
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
                              {expandedRecIds.includes(recommendation.id) ? 'Show less' : 'Read more'}
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
                      </div>
                    </div>
                  );
                })}
              </div>
            </Box>
          )}

          {generating && (
            <Box sx={{ textAlign: 'center', mt: 4 }}>
              <CircularProgress size={40} />
              <Typography variant="body1" sx={{ mt: 2 }}>
                Generating recommendations based on your feedback...
              </Typography>
              <Button
                variant="text"
                size="small"
                onClick={() => setGenerating(false)}
                sx={{ mt: 2 }}
              >
                Cancel Loading
              </Button>
            </Box>
          )}

          {renderFeedbackDialog()}

          <Snackbar
            open={toast.open}
            autoHideDuration={6000}
            onClose={handleCloseToast}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          >
            <Alert onClose={handleCloseToast} severity={toast.severity} sx={{ width: '100%' }}>
              {toast.message}
            </Alert>
          </Snackbar>
        </Box>
      </Container>
    </div>
  );
};

export default AIRecommendationsPage;