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
    if (!milliseconds || milliseconds <= 0) return 'Voting ended';
    
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
      setError("No trip ID provided");
      setLoading(false);
      return;
    }
    
    try {
      console.log(`Fetching data for trip ${tripId}`);
      setLoading(true);
      
      // Get trip details which includes participants and survey responses
      const tripDetails = await getTripDetails(tripId);
      console.log('Trip details:', tripDetails);
      
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
          console.log('Average preferred trip length:', avgLength, 'days');
          
          // Set trip data with preferred length
          setTripData(prevData => ({
            ...prevData,
            preferredTripLength: {
              average: avgLength,
              allLengths: tripLengths
            }
          }));
        }
      }
      
      // Get winner information which also checks voting status
      const winnerData = await getTripWinner(tripId);
      console.log('Winner data:', winnerData);
      
      if (winnerData.status === 'success') {
        // We have a winner
        setVotingComplete(true);
        setWinnerDetails(winnerData.winner.winner_details);
        console.log('Winner details:', winnerData.winner.winner_details);
      } else if (winnerData.message === 'No winner yet' || winnerData.message === 'Voting in progress') {
        // No winner yet, keep the voting view
        console.log('Voting still in progress');
        setVotingComplete(false);
      } else {
        // Some error occurred
        setError(winnerData.message || 'Failed to get winner data');
      }
    } catch (error) {
      console.error("Error fetching trip data:", error);
      setError(error.message || "Failed to load trip data");
    } finally {
      setLoading(false);
    }
  }, [tripId]);
  
  // Function to calculate winner when deadline reaches
  const handleCalculateWinner = useCallback(async () => {
    try {
      console.log('Calculating winner...');
      setLoading(true);
      
      // Call API to calculate winner
      const result = await calculateWinner(tripId);
      console.log('Winner calculation result:', result);
      
      if (result.status === 'success' && result.winner) {
        setVotingComplete(true);
        setWinnerDetails(result.winner.winner_details);
        
        // Fetch updated trip details to get all survey responses
        const updatedTripDetails = await getTripDetails(tripId);
        setTripData(updatedTripDetails);
        
        // Recalculate trip stats for dates
        if (updatedTripDetails.survey_responses && updatedTripDetails.survey_responses.length > 0) {
          const stats = calculateSurveyStats(updatedTripDetails.survey_responses);
          console.log('Recalculated trip stats:', stats);
          
          // Set optimal date ranges based on overlapping dates
          if (stats.overlappingRanges && stats.overlappingRanges.length > 0) {
            // Sort by longest duration first
            const sortedRanges = [...stats.overlappingRanges].sort((a, b) => {
              const daysA = Math.ceil((a.end - a.start) / (1000 * 60 * 60 * 24)) + 1;
              const daysB = Math.ceil((b.end - b.start) / (1000 * 60 * 60 * 24)) + 1;
              return daysB - daysA; // Descending order
            });
            
            // Format date ranges for display
            const formattedRanges = sortedRanges.map(range => {
              const days = Math.ceil((range.end - range.start) / (1000 * 60 * 60 * 24)) + 1;
              return {
                start: range.start.toLocaleDateString('en-US', { month: 'long', day: 'numeric' }),
                end: range.end.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
                days: days
              };
            });
            
            setOptimalDateRanges(formattedRanges);
          }
          
          // Extract preferred trip lengths from survey responses
          const tripLengths = updatedTripDetails.survey_responses
            .map(response => response.trip_length)
            .filter(length => !!length);
            
          // Calculate average trip length if available
          if (tripLengths.length > 0) {
            const totalDays = tripLengths.reduce((sum, length) => sum + parseInt(length, 10), 0);
            const avgLength = Math.round(totalDays / tripLengths.length);
            console.log('Average preferred trip length:', avgLength, 'days');
            
            // Set trip data with preferred length
            setTripData(prevData => ({
              ...prevData,
              ...updatedTripDetails,
              preferredTripLength: {
                average: avgLength,
                allLengths: tripLengths
              }
            }));
          } else {
            // If no trip lengths, just update the trip data
            setTripData(updatedTripDetails);
          }
        }
        
        // Show success message or update UI
        console.log('Winner selected successfully');
      } else {
        // If calculation failed, show error
        setError('Could not determine a winner. There might be a tie or no votes.');
      }
    } catch (err) {
      console.error('Error calculating winner:', err);
      setError(`Failed to calculate winner: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [tripId]);

  // Effect for countdown timer with auto-calculation of winner when expired
  useEffect(() => {
    if (!timeRemaining) return;
    
    const timer = setInterval(() => {
      setTimeRemaining(prevTime => {
        if (prevTime <= 1000) {
          clearInterval(timer);
          // When timer ends, calculate winner automatically
          handleCalculateWinner();
          return 0;
        }
        return prevTime - 1000;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [timeRemaining, handleCalculateWinner]);

  // Replace the getDestinationImage function with our new version
  useEffect(() => {
    if (!winnerDetails) return;
    
    // Initialize with a fallback image
    setDestinationImage(getImageSync(winnerDetails));
    
    // Then load from API
    const loadImage = async () => {
      try {
        const imageUrl = await getDestinationImage(winnerDetails);
        setDestinationImage(imageUrl);
      } catch (err) {
        console.error('Error loading winner destination image:', err);
        // Keep the fallback image if there's an error
      }
    };
    
    loadImage();
  }, [winnerDetails]);

  // Initial data load
  useEffect(() => {
    fetchData();
  }, [tripId, fetchData]);

  const handleShare = () => {
    const tripDetails = getTripDetailsObject();
    
    // Prepare the data to pass to the share page
    const shareData = {
      winnerDestination: winnerDetails,
      tripId: tripId,
      dates: tripDetails.dates,
      travelers: tripDetails.travelers,
      price: tripDetails.price
    };
    
    // Navigate to the share page with the data
    navigate('/share', { state: shareData });
  };

  const handleDownload = async () => {
    if (winnerDetails && tripCardRef.current) {
      try {
        // Create a new jsPDF instance
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4'
        });
        
        // Capture the trip card
        const canvas = await html2canvas(tripCardRef.current, {
          scale: 2, // Increase quality
          logging: false,
          useCORS: true, // To handle cross-origin images
          allowTaint: true
        });
        
        // Convert canvas to image and add to PDF
        const imgData = canvas.toDataURL('image/jpeg', 1.0);
        const pageWidth = pdf.internal.pageSize.getWidth();
        const imgWidth = pageWidth - 20; // Margin on both sides
        const imgHeight = canvas.height * imgWidth / canvas.width;
        
        // Set PDF title and author
        pdf.setProperties({
          title: `${winnerDetails.city || winnerDetails.destination} Trip Details`,
          author: 'PackVote'
        });
        
        // Add title
        pdf.setFontSize(24);
        pdf.setTextColor(0, 0, 0);
        pdf.text('Your Group Trip Details', 105, 20, { align: 'center' });
        
        // Add trip image from canvas
        pdf.addImage(imgData, 'JPEG', 10, 30, imgWidth, imgHeight);
        
        // Add date options if available
        if (optimalDateRanges && optimalDateRanges.length > 1) {
          const yPosition = 30 + imgHeight + 15; // Position after the image with some margin
          
          pdf.setFontSize(16);
          pdf.setTextColor(0, 0, 0);
          pdf.text('Potential Date Options:', 105, yPosition, { align: 'center' });
          
          // Add each date range
          let currentY = yPosition + 10;
          optimalDateRanges.forEach((range, index) => {
            pdf.setFontSize(12);
            pdf.text(`Option ${index + 1}: ${range.start} to ${range.end.split(',')[0]} (${range.days} days)`, 20, currentY);
            currentY += 7; // Increment Y position for next line
          });
        }
        
        // Add footer
        pdf.setFontSize(10);
        pdf.setTextColor(102, 102, 102); // #666666
        pdf.text('Generated by PackVote', 105, 287, { align: 'center' });
        
        // Download PDF
        const destination = winnerDetails?.city || winnerDetails?.destination || 'travel';
        pdf.save(`${destination.toLowerCase().replace(/\s+/g, '-')}-trip-details.pdf`);
      } catch (error) {
        console.error('Error generating PDF:', error);
        alert('There was an error generating your PDF. Please try again.');
      }
    }
  };

  const handleBuyCoffee = () => {
    navigate('/donate');
  };

  // Get winner trip details
  const getTripDetailsObject = () => {
    if (!winnerDetails) return {
      destination: 'Destination To Be Determined',
      dates: 'Dates TBD',
      travelers: 'Travelers TBD',
      price: 'Price TBD'
    };
    
    // Format destination name
    const destName = winnerDetails.city || winnerDetails.destination || "Unknown Location";
    const countryName = winnerDetails.country || '';
    const fullDestination = countryName ? `${destName}, ${countryName}` : destName;
    
    // Determine approximate price from budget
    let price = 'Price varies';
    if (tripData && tripData.budget && tripData.budget.amount) {
      price = `~$${tripData.budget.amount}/person`;
    } else if (winnerDetails.budget_tier) {
      // Use budget tier as fallback
      price = winnerDetails.budget_tier;
    }
    
    // Get number of travelers
    let travelers = '0 Travelers';
    if (tripData && tripData.participants) {
      travelers = `${tripData.participants.length} Travelers`;
    }
    
    // Get date range - use overlapping dates if available
    let dates = 'Dates TBD';
    if (optimalDateRanges && optimalDateRanges.length > 0) {
      // Use the first (longest) optimal date range
      const bestRange = optimalDateRanges[0];
      dates = `${bestRange.start} to ${bestRange.end.split(',')[0]} (${bestRange.days} days)`;
    } else if (tripData && tripData.dateRange && tripData.dateRange.start) {
      dates = `${tripData.dateRange.start} - ${tripData.dateRange.end}`;
    } else if (winnerDetails.ideal_months && winnerDetails.ideal_months.length) {
      // Use ideal months as fallback
      dates = `Best in ${winnerDetails.ideal_months.join(', ')}`;
    }
    
    return {
      destination: fullDestination,
      dates,
      travelers,
      price
    };
  };

  // Render loading state
  if (loading) {
    return (
      <Container maxWidth="md" sx={{ pt: 12, pb: 8, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading your trip details...
        </Typography>
      </Container>
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
                label={timeRemaining !== null ? formatTimeRemaining(timeRemaining) : "Calculating time..."}
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
              "& .MuiChip-icon": { fontSize: '1.5rem' }
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
                      variant={index === 0 ? "filled" : "outlined"}
                      sx={{ fontWeight: index === 0 ? 'bold' : 'regular' }}
                    />
                    {tripData?.preferredTripLength?.average && (
                      <Tooltip title={
                        Math.abs(range.days - tripData.preferredTripLength.average) <= 1 
                          ? "Perfect match with preferred trip length!" 
                          : `${Math.abs(range.days - tripData.preferredTripLength.average)} days ${range.days > tripData.preferredTripLength.average ? 'longer' : 'shorter'} than preferred length`
                      }>
                        <Chip
                          icon={Math.abs(range.days - tripData.preferredTripLength.average) <= 1 ? <CheckCircleIcon /> : <TuneIcon />} 
                          label={Math.abs(range.days - tripData.preferredTripLength.average) <= 1 ? "Ideal" : "Adjust"}
                          size="small"
                          color={Math.abs(range.days - tripData.preferredTripLength.average) <= 1 ? "success" : "default"}
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