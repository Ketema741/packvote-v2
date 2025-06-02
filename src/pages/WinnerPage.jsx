import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import {
  Container,
  Typography,
  Box,
  Button,
  AppBar,
  Toolbar,
  Link,
  Paper,
  Card,
  CardMedia,
  Chip,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  Tooltip
} from '@mui/material';
import ShareIcon from '@mui/icons-material/Share';
import GetAppIcon from '@mui/icons-material/GetApp';
import LocalCafeIcon from '@mui/icons-material/LocalCafe';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import CelebrationIcon from '@mui/icons-material/Celebration';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import TuneIcon from '@mui/icons-material/Tune';
import { getTripDetails, getTripWinner, calculateWinner, calculateSurveyStats } from '../utils/api';
import { getDestinationImage, getImageSync } from '../utils/imageService';
import { safeLog } from '../utils/loggingSanitizer';
import '../styles/LandingPage.css';
import '../styles/WinnerPage.css';

const WinnerPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { tripId: urlTripId } = useParams();
  const tripCardRef = useRef(null);

  // Get tripId from URL params, with location state as fallback
  const tripId = urlTripId || (location.state && location.state.tripId);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tripData, setTripData] = useState(null);
  const [winnerDetails, setWinnerDetails] = useState(null);
  const [votingComplete, setVotingComplete] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [pendingVoters, setPendingVoters] = useState([]);
  const [optimalDateRanges, setOptimalDateRanges] = useState([]);
  const [destinationImage, setDestinationImage] = useState('');

  // If we have a tripId in location state but not in URL, redirect to the URL version
  useEffect(() => {
    if (!urlTripId && location.state && location.state.tripId) {
      navigate(`/winner/${location.state.tripId}`, { replace: true });
    }
  }, [urlTripId, location.state, navigate]);

  // Format time remaining as string
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

  // Fetch all required data
  const fetchData = useCallback(async () => {
    if (!tripId) {
      setError('No trip ID provided');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Get trip details which includes participants and survey responses
      const tripDetails = await getTripDetails(tripId);

      if (tripDetails && tripDetails.participants) {
        setTripData(tripDetails);

        // Calculate remaining voters if voting isn't complete
        const votedParticipants = new Set(tripDetails.votes ? tripDetails.votes.map(vote => vote.user_id) : []);
        const pendingParticipants = tripDetails.participants.filter(p => !votedParticipants.has(p.id));
        setPendingVoters(pendingParticipants);

        // Calculate voting deadline if provided
        if (tripDetails.voting_deadline) {
          const deadline = new Date(tripDetails.voting_deadline).getTime();
          const now = new Date().getTime();
          const remaining = deadline - now;

          if (remaining > 0) {
            setTimeRemaining(remaining);
          } else {
            // If deadline has passed, set to zero to trigger calculation
            setTimeRemaining(0);
          }
        }

        // Extract trip lengths from survey responses if available
        const tripLengths = tripDetails.survey_responses
          .map(response => response.trip_length)
          .filter(length => !!length);

        // Calculate average trip length if available
        if (tripLengths.length > 0) {
          const totalDays = tripLengths.reduce((sum, length) => sum + parseInt(length, 10), 0);
          const avgLength = Math.round(totalDays / tripLengths.length);

          // Set trip data with preferred length
          setTripData(prevData => ({
            ...prevData,
            preferredTripLength: {
              average: avgLength,
              allLengths: tripLengths
            }
          }));
        }

        // Calculate overlapping date ranges from survey responses
        if (tripDetails.survey_responses && tripDetails.survey_responses.length > 0) {
          const stats = calculateSurveyStats(tripDetails.survey_responses);

          // Format overlapping date ranges for display
          if (stats.overlappingRanges && stats.overlappingRanges.length > 0) {
            const formattedRanges = stats.overlappingRanges.map(range => {
              const days = Math.ceil((range.end - range.start) / (1000 * 60 * 60 * 24)) + 1;
              return {
                start: range.start.toLocaleDateString('en-US', { month: 'long', day: 'numeric' }),
                end: range.end.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
                days: days
              };
            });

            // Sort by longest duration first
            formattedRanges.sort((a, b) => b.days - a.days);

            setOptimalDateRanges(formattedRanges);
          }
        }
      }

      // Get winner information - try to get existing winner first
      let winnerData = await getTripWinner(tripId);

      if (winnerData.status === 'success') {
        // We have an existing winner
        setVotingComplete(true);
        setWinnerDetails(winnerData.winner.winner_details);
      } else if (winnerData.status === 'ready_to_calculate') {
        // All votes are in, calculate winner and send SMS notification
        safeLog.info('All votes in, calculating winner with SMS notification');
        try {
          const calculateResult = await calculateWinner(tripId);
          if (calculateResult && calculateResult.status === 'success') {
            // Get the updated winner data
            winnerData = await getTripWinner(tripId);
            if (winnerData.status === 'success') {
              setVotingComplete(true);
              setWinnerDetails(winnerData.winner.winner_details);
            }
          } else {
            // Calculation failed, show voting in progress
            setVotingComplete(false);
          }
        } catch (calcError) {
          safeLog.error('Error calculating winner:', calcError);
          // Fall back to voting in progress view
          setVotingComplete(false);
        }
      } else if (winnerData.message === 'No winner yet' || winnerData.message === 'Voting in progress') {
        // No winner yet - need to check if we should calculate one

        // Recalculate pending participants in this scope
        const votedParticipants = new Set(tripDetails.votes ? tripDetails.votes.map(vote => vote.user_id) : []);
        const currentPendingParticipants = tripDetails.participants.filter(p => !votedParticipants.has(p.id));

        // Check if all participants have voted or if voting deadline has passed
        const allVoted = currentPendingParticipants.length === 0;
        const deadlinePassed = tripDetails.voting_deadline && new Date() > new Date(tripDetails.voting_deadline);

        if (allVoted || deadlinePassed) {
          // Calculate winner and send SMS notification
          safeLog.info('All votes in or deadline passed, calculating winner with SMS notification');
          try {
            const calculateResult = await calculateWinner(tripId);
            if (calculateResult && calculateResult.status === 'success') {
              // Get the updated winner data
              winnerData = await getTripWinner(tripId);
              if (winnerData.status === 'success') {
                setVotingComplete(true);
                setWinnerDetails(winnerData.winner.winner_details);
              }
            } else {
              // Calculation failed, show voting in progress
              setVotingComplete(false);
            }
          } catch (calcError) {
            safeLog.error('Error calculating winner:', calcError);
            // Fall back to voting in progress view
            setVotingComplete(false);
          }
        } else {
          // Not ready to calculate winner yet, keep voting view
          setVotingComplete(false);
        }
      } else {
        // Some error occurred
        setError(winnerData.message || 'Failed to get winner data');
      }
    } catch (error) {
      safeLog.error('Error fetching trip data:', error);
      setError(error.message || 'Failed to load trip data');
    } finally {
      setLoading(false);
    }
  }, [tripId]);

  // Function to calculate winner when deadline reaches
  const handleCalculateWinner = useCallback(async () => {
    try {
      setLoading(true);

      // Call API to calculate winner
      const result = await calculateWinner(tripId);

      if (result && result.status === 'success') {
        // Refresh data to show the winner
        fetchData();
      } else {
        // Some error occurred
        setError(result.message || 'Failed to calculate winner');
        setLoading(false);
      }
    } catch (err) {
      safeLog.error('Error calculating winner:', err);
      setError(err.message || 'Failed to calculate winner');
      setLoading(false);
    }
  }, [tripId, fetchData]);

  // Load data when component mounts or tripId changes
  useEffect(() => {
    if (tripId) {
      fetchData();
    }
  }, [tripId, fetchData]);

  // Start timer for calculating winner when necessary
  useEffect(() => {
    if (timeRemaining !== null && timeRemaining <= 0 && !votingComplete) {
      // If time is up and we don't have a winner yet, calculate it
      handleCalculateWinner();
    }
  }, [timeRemaining, votingComplete, handleCalculateWinner]);

  // Load destination image for the winner
  useEffect(() => {
    // Only try to load the image if we have a winner and it has a location
    if (winnerDetails && winnerDetails.location) {
      const loadImage = async () => {
        try {
          // First set the fallback image for immediate display
          setDestinationImage(getImageSync({
            destination: winnerDetails.location,
            country: winnerDetails.country
          }));

          // Then try to load a better image asynchronously
          const imageUrl = await getDestinationImage({
            destination: winnerDetails.location,
            country: winnerDetails.country
          });

          setDestinationImage(imageUrl);
        } catch (err) {
          safeLog.error('Error loading winner destination image:', err);

          // On error, ensure we at least have the fallback image
          setDestinationImage(getImageSync({
            destination: winnerDetails.location,
            country: winnerDetails.country
          }));
        }
      };

      loadImage();
    }
  }, [winnerDetails]);

  const handleShare = () => {
    if (!winnerDetails || !tripData) {return;}

    // Create share URL
    const shareUrl = `${window.location.origin}/share-trip/${tripId}`;

    // Use Web Share API if available
    if (navigator.share) {
      navigator.share({
        title: `We're going to ${winnerDetails.location}!`,
        text: `Check out our upcoming trip to ${winnerDetails.location}`,
        url: shareUrl
      }).catch(() => {
        // Fallback to copying link on error
        copyToClipboard(shareUrl);
      });
    } else {
      // Fallback for browsers that don't support the Web Share API
      copyToClipboard(shareUrl);
    }
  };

  const handleDownload = async () => {
    if (!tripCardRef.current) {return;}

    try {
      const canvas = await html2canvas(tripCardRef.current, {
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: true
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const imgWidth = 210; // A4 width in mm
      const imgHeight = canvas.height * imgWidth / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`PackVote-Trip-${tripData.trip_name.replace(/\s+/g, '-')}.pdf`);
    } catch (error) {
      safeLog.error('Error generating PDF:', error);
      setError('Failed to generate PDF. Please try again later.');
    }
  };

  const copyToClipboard = (text) => {
    // Check if clipboard API is available (not available in test environment)
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text)
        .then(() => {
          alert('Link copied to clipboard!');
        })
        .catch(() => {
          // Fallback method for older browsers
          const textArea = document.createElement('textarea');
          textArea.value = text;
          document.body.appendChild(textArea);
          textArea.select();
          document.execCommand('copy');
          document.body.removeChild(textArea);
          alert('Link copied to clipboard!');
        });
    } else {
      // Handle test environment or browsers without clipboard API
      console.log('Clipboard API not available, would copy:', text);
      // In tests, we can just simulate success
      alert('Link copied to clipboard!');
    }
  };

  const handleBuyCoffee = () => {
    window.open('https://www.buymeacoffee.com/packvote', '_blank');
  };

  const getTripDetailsObject = () => {
    if (!winnerDetails || !tripData) {return null;}

    return {
      location: winnerDetails.location,
      country: winnerDetails.country,
      dates: optimalDateRanges.length > 0
        ? `${optimalDateRanges[0].start} - ${optimalDateRanges[0].end}`
        : 'Dates to be determined',
      duration: tripData.preferredTripLength
        ? `${tripData.preferredTripLength.average} days`
        : 'Duration to be determined',
      travelers: tripData.participants ? `${tripData.participants.length} travelers` : 'Unknown number of travelers',
      organizer: tripData.organizer_name || 'Unknown organizer',
      description: winnerDetails.description || 'No description available'
    };
  };

  // Render loading state
  if (loading) {
    return (
      <div className="landing-page winner-page">
        <AppBar position="fixed" elevation={0} sx={{ bgcolor: 'background.paper', zIndex: 1100 }}>
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

        <Container maxWidth="md" sx={{ pt: 12, pb: 8, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '50vh' }}>
          <CircularProgress color="primary" />
          <Typography variant="h6" sx={{ mt: 2 }}>
            Loading your trip details...
          </Typography>
        </Container>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <Container maxWidth="md" sx={{ pt: 12, pb: 8 }}>
        <Alert severity="error" sx={{ mb: 4 }}>
          {error}
        </Alert>
        <Button variant="contained" onClick={() => navigate(-1)}>
          Go Back
        </Button>
      </Container>
    );
  }

  // If voting is not complete, show the waiting placeholder
  if (!votingComplete) {
    return (
      <div className="landing-page">
        <AppBar position="fixed" elevation={0} sx={{ bgcolor: 'background.paper', zIndex: 1100 }}>
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
          <Paper elevation={3} sx={{ p: 4, borderRadius: 3, maxWidth: '700px', mx: 'auto' }}>
            <Typography variant="h4" align="center" gutterBottom>
              Voting in Progress
            </Typography>

            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3, mt: 2 }}>
              <Chip
                icon={<AccessTimeIcon />}
                label={timeRemaining !== null ? formatTimeRemaining(timeRemaining) : 'Calculating time...'}
                color="primary"
                variant="outlined"
                sx={{ fontSize: '1rem', py: 1 }}
              />
            </Box>

            {pendingVoters.length > 0 && (
              <Box sx={{ mt: 3, mb: 4 }}>
                <Typography variant="h6" gutterBottom>
                  Waiting for votes from:
                </Typography>
                <List dense>
                  {pendingVoters.map(voter => (
                    <ListItem key={voter.id}>
                      <ListItemText
                        primary={voter.name}
                        secondary={`${voter.email || ''} ${voter.phone || ''}`}
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}

            <Typography variant="body1" align="center" color="text.secondary" sx={{ mb: 3 }}>
              The final destination will be revealed when all votes are in or when the voting period ends.
            </Typography>

            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
              <Button
                variant="outlined"
                onClick={() => navigate(-1)}
              >
                Go Back
              </Button>

              <Button
                variant="contained"
                onClick={handleCalculateWinner}
                className="primary-button"
                disabled={loading || pendingVoters.length === 0}
              >
                Calculate Winner Now
              </Button>
            </Box>
          </Paper>
        </Container>
      </div>
    );
  }

  // Otherwise, show the winner
  const tripDetails = getTripDetailsObject();

  return (
    <div className="landing-page winner-page">
      {/* Confetti animation container - positioned fixed to appear behind content */}
      <div className="confetti-container" style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none'
      }}>
        {/* Confetti dots will be added via CSS */}
      </div>

      {/* Navigation */}
      <AppBar position="fixed" elevation={0} sx={{ bgcolor: 'background.paper', zIndex: 1100 }}>
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

      <Container maxWidth="md" sx={{ pt: 12, pb: 8, position: 'relative', zIndex: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
          <Chip
            icon={<CelebrationIcon />}
            label="Trip Confirmed!"
            color="primary"
            sx={{
              fontSize: '1.1rem',
              py: 2.5,
              px: 2,
              '& .MuiChip-icon': { fontSize: '1.5rem' }
            }}
          />
        </Box>

        {/* Trip card */}
        <Card
          ref={tripCardRef}
          elevation={3}
          sx={{
            borderRadius: 3,
            overflow: 'hidden',
            mb: 5,
            maxWidth: '700px',
            mx: 'auto',
            position: 'relative',
            zIndex: 1
          }}
        >
          <Box sx={{ position: 'relative' }}>
            <CardMedia
              component="img"
              height="400"
              image={destinationImage || getImageSync(winnerDetails)}
              alt={`${tripDetails.destination} view`}
              crossOrigin="anonymous"
            />
            <Box
              sx={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                bgcolor: 'rgba(0, 0, 0, 0.75)',
                color: 'white',
                padding: 3,
                backdropFilter: 'blur(3px)'
              }}
            >
              <Typography
                variant="h3"
                component="h1"
                gutterBottom
                sx={{
                  color: 'white',
                  textShadow: '1px 1px 3px rgba(0,0,0,0.7)'
                }}
              >
                {tripDetails.destination}
              </Typography>
              <Box sx={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 1.5,
                '& .MuiTypography-root': {
                  fontWeight: 500,
                  textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
                  color: 'white'
                }
              }}>
                <Typography variant="body1">
                  📅 {tripDetails.dates}
                </Typography>
                <Typography variant="body1">
                  👥 {tripDetails.travelers}
                </Typography>
                <Typography variant="body1">
                  💰 {tripDetails.price}
                </Typography>
              </Box>
            </Box>
          </Box>
        </Card>

        {/* Additional Date Options */}
        {optimalDateRanges && optimalDateRanges.length > 1 && (
          <Paper
            elevation={3}
            sx={{
              p: 4,
              borderRadius: 3,
              maxWidth: '700px',
              mx: 'auto',
              mb: 4,
              position: 'relative',
              zIndex: 1
            }}
          >
            <Typography
              variant="h5"
              component="h2"
              gutterBottom
              align="center"
              sx={{ mb: 3 }}
            >
              Date Options
            </Typography>

            {/* Add preferred trip length info */}
            {tripData?.preferredTripLength?.average && (
              <Box sx={{ mb: 3, textAlign: 'center' }}>
                <Typography variant="body1" color="text.secondary" gutterBottom>
                  Based on everyone's preferences, the ideal trip length is:
                </Typography>
                <Chip
                  label={`${tripData.preferredTripLength.average} days`}
                  color="primary"
                  sx={{ fontWeight: 'bold', px: 2, py: 1, fontSize: '1rem' }}
                />
              </Box>
            )}

            <Typography variant="body2" color="text.secondary" sx={{ mb: 2, textAlign: 'center' }}>
              These dates work for everyone based on your survey responses:
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {optimalDateRanges.map((range, index) => (
                <Box
                  key={index}
                  sx={{
                    p: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 2,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    bgcolor: index === 0 ? 'rgba(25, 118, 210, 0.08)' : 'transparent'
                  }}
                >
                  <Typography sx={{ fontWeight: index === 0 ? 'medium' : 'regular' }}>
                    {range.start} to {range.end.split(',')[0]}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip
                      label={`${range.days} days`}
                      size="small"
                      color="primary"
                      variant={index === 0 ? 'filled' : 'outlined'}
                      sx={{ fontWeight: index === 0 ? 'bold' : 'regular' }}
                    />
                    {tripData?.preferredTripLength?.average && (
                      <Tooltip title={
                        Math.abs(range.days - tripData.preferredTripLength.average) <= 1
                          ? 'Perfect match with preferred trip length!'
                          : `${Math.abs(range.days - tripData.preferredTripLength.average)} days ${range.days > tripData.preferredTripLength.average ? 'longer' : 'shorter'} than preferred length`
                      }>
                        <Chip
                          icon={Math.abs(range.days - tripData.preferredTripLength.average) <= 1 ? <CheckCircleIcon /> : <TuneIcon />}
                          label={Math.abs(range.days - tripData.preferredTripLength.average) <= 1 ? 'Ideal' : 'Adjust'}
                          size="small"
                          color={Math.abs(range.days - tripData.preferredTripLength.average) <= 1 ? 'success' : 'default'}
                          variant="outlined"
                        />
                      </Tooltip>
                    )}
                  </Box>
                </Box>
              ))}
            </Box>
          </Paper>
        )}

        {/* What's Next section */}
        <Paper
          elevation={3}
          sx={{
            p: 4,
            borderRadius: 3,
            maxWidth: '700px',
            mx: 'auto',
            position: 'relative',
            zIndex: 1
          }}
        >
          <Typography
            variant="h4"
            component="h2"
            gutterBottom
            align="center"
            sx={{ mb: 4 }}
          >
            What's Next?
          </Typography>

          <Box sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'center',
            gap: 2,
            mb: 2
          }}>
            <Button
              variant="outlined"
              startIcon={<ShareIcon />}
              onClick={handleShare}
              fullWidth
              sx={{ py: 1.5 }}
            >
              Share on Socials
            </Button>

            <Button
              variant="outlined"
              startIcon={<GetAppIcon />}
              onClick={handleDownload}
              fullWidth
              sx={{ py: 1.5 }}
            >
              Download Trip PDF
            </Button>

            <Button
              variant="contained"
              startIcon={<LocalCafeIcon />}
              onClick={handleBuyCoffee}
              className="primary-button"
              fullWidth
              sx={{ py: 1.5 }}
            >
              Buy us a coffee
            </Button>
          </Box>
        </Paper>
      </Container>

      {/* Footer */}
      <footer className="footer" style={{
        position: 'relative',
        zIndex: 1,
        width: '100%',
        marginTop: 'auto',
        left: 0,
        right: 0,
        bottom: 0
      }}>
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

export default WinnerPage;