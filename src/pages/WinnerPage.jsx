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
        safeLog.info('Winner details loaded:', winnerData.winner.winner_details);
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
              safeLog.info('Winner details calculated:', winnerData.winner.winner_details);
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
                safeLog.info('Winner details calculated after deadline:', winnerData.winner.winner_details);
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

    // Navigate to the SocialSharePage with trip data
    navigate('/share', {
      state: {
        winnerDestination: {
          destination: winnerDetails.location,
          city: winnerDetails.location,
          country: winnerDetails.country,
          location: winnerDetails.location
        },
        dates: optimalDateRanges.length > 0
          ? `${optimalDateRanges[0].start} - ${optimalDateRanges[0].end.split(',')[0]}`
          : 'Dates to be determined',
        travelers: tripData.participants ? `${tripData.participants.length} travelers` : 'Unknown number of travelers',
        tripId: tripId,
        imageUrl: destinationImage
      }
    });
  };

  const handleDownload = async () => {
    if (!winnerDetails || !tripData) {return;}

    try {
      setLoading(true);

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const tripDetails = getTripDetailsObject();
      if (!tripDetails) {
        setError('Trip details not available for PDF generation');
        setLoading(false);
        return;
      }

      // Page setup
      const pageWidth = 210;
      const pageHeight = 297;
      const margin = 20;
      let currentY = margin;

      // Orange theme colors (from site variables)
      const primaryOrange = [255, 107, 44]; // #FF6B2C
      const darkOrange = [229, 90, 31]; // #E55A1F
      const lightOrange = [255, 143, 94]; // #FF8F5E
      const backgroundBeige = [255, 248, 243]; // #FFF8F3
      const darkNavy = [26, 34, 56]; // #1A2238
      const mediumGray = [102, 102, 102]; // #666666

      // Set default font
      pdf.setFont('helvetica');

      // Background color for the page
      pdf.setFillColor(backgroundBeige[0], backgroundBeige[1], backgroundBeige[2]);
      pdf.rect(0, 0, pageWidth, pageHeight, 'F');

      // Header section with orange theme
      pdf.setFillColor(primaryOrange[0], primaryOrange[1], primaryOrange[2]);
      pdf.rect(0, 0, pageWidth, 60, 'F');

      // Header text - clean and professional
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(32);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Trip Confirmed!', pageWidth / 2, 25, { align: 'center' });

      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Your group adventure awaits!', pageWidth / 2, 40, { align: 'center' });

      currentY = 70; // Moved up from 80

      // Try to add destination image if available
      if (destinationImage) {
        try {
          // Add image
          pdf.addImage(destinationImage, 'JPEG', margin, currentY, pageWidth - (margin * 2), 70, null, 'FAST'); // Reduced height from 80 to 70

          // Add overlay with destination name
          pdf.setFillColor(0, 0, 0, 0.6); // Semi-transparent overlay
          pdf.rect(margin, currentY + 40, pageWidth - (margin * 2), 30, 'F');

          pdf.setTextColor(255, 255, 255);
          pdf.setFontSize(28);
          pdf.setFont('helvetica', 'bold');
          pdf.text(tripDetails.destination, pageWidth / 2, currentY + 57, { align: 'center' });

          if (tripDetails.country) {
            pdf.setFontSize(14);
            pdf.setFont('helvetica', 'normal');
            pdf.text(tripDetails.country, pageWidth / 2, currentY + 65, { align: 'center' });
          }

          currentY += 85; // Reduced from 100
        } catch (imageError) {
          // If image fails, fall back to text-only destination section
          pdf.setFillColor(255, 255, 255);
          pdf.roundedRect(margin, currentY, pageWidth - (margin * 2), 40, 8, 8, 'F'); // Reduced height from 50 to 40

          pdf.setDrawColor(primaryOrange[0], primaryOrange[1], primaryOrange[2]);
          pdf.setLineWidth(2);
          pdf.roundedRect(margin, currentY, pageWidth - (margin * 2), 40, 8, 8, 'S');

          pdf.setTextColor(primaryOrange[0], primaryOrange[1], primaryOrange[2]);
          pdf.setFontSize(32); // Reduced from 36
          pdf.setFont('helvetica', 'bold');
          pdf.text(tripDetails.destination, pageWidth / 2, currentY + 22, { align: 'center' });

          if (tripDetails.country) {
            pdf.setTextColor(mediumGray[0], mediumGray[1], mediumGray[2]);
            pdf.setFontSize(16); // Reduced from 18
            pdf.setFont('helvetica', 'normal');
            pdf.text(tripDetails.country, pageWidth / 2, currentY + 35, { align: 'center' });
          }

          currentY += 55; // Reduced from 70
        }
      } else {
        // No image available, use text-only destination section
        pdf.setFillColor(255, 255, 255);
        pdf.roundedRect(margin, currentY, pageWidth - (margin * 2), 40, 8, 8, 'F'); // Reduced height

        pdf.setDrawColor(primaryOrange[0], primaryOrange[1], primaryOrange[2]);
        pdf.setLineWidth(2);
        pdf.roundedRect(margin, currentY, pageWidth - (margin * 2), 40, 8, 8, 'S');

        pdf.setTextColor(primaryOrange[0], primaryOrange[1], primaryOrange[2]);
        pdf.setFontSize(32); // Reduced from 36
        pdf.setFont('helvetica', 'bold');
        pdf.text(tripDetails.destination, pageWidth / 2, currentY + 22, { align: 'center' });

        if (tripDetails.country) {
          pdf.setTextColor(mediumGray[0], mediumGray[1], mediumGray[2]);
          pdf.setFontSize(16);
          pdf.setFont('helvetica', 'normal');
          pdf.text(tripDetails.country, pageWidth / 2, currentY + 35, { align: 'center' });
        }

        currentY += 55;
      }

      // Trip details section - now positioned higher and more centered
      pdf.setFillColor(255, 255, 255);
      pdf.roundedRect(margin, currentY, pageWidth - (margin * 2), 70, 8, 8, 'F');

      pdf.setTextColor(primaryOrange[0], primaryOrange[1], primaryOrange[2]);
      pdf.setFontSize(20);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Trip Details', pageWidth / 2, currentY + 20, { align: 'center' });

      // Calculate optimal duration from overlapping ranges
      let optimalDuration = tripDetails.duration;
      if (optimalDateRanges && optimalDateRanges.length > 0) {
        // Find the longest overlapping segment
        const longestRange = optimalDateRanges.reduce((longest, current) =>
          current.days > longest.days ? current : longest, optimalDateRanges[0]);
        optimalDuration = `${longestRange.days} days`;
      }

      // Details in a clean list format
      const details = [
        { label: 'Dates', value: tripDetails.dates },
        { label: 'Duration', value: optimalDuration },
        { label: 'Group Size', value: tripDetails.travelers }
      ];

      let detailY = currentY + 35;
      pdf.setFontSize(14);

      details.forEach((detail) => {
        // Add bullet point
        pdf.setFontSize(14);
        pdf.setTextColor(primaryOrange[0], primaryOrange[1], primaryOrange[2]);
        pdf.text('•', margin + 15, detailY);

        // Add label
        pdf.setTextColor(darkNavy[0], darkNavy[1], darkNavy[2]);
        pdf.setFont('helvetica', 'bold');
        pdf.text(`${detail.label}:`, margin + 25, detailY);

        // Add value
        pdf.setTextColor(mediumGray[0], mediumGray[1], mediumGray[2]);
        pdf.setFont('helvetica', 'normal');
        pdf.text(detail.value, margin + 75, detailY);

        detailY += 15;
      });

      currentY += 90;

      // Date options section
      if (optimalDateRanges && optimalDateRanges.length > 0) {
        pdf.setFillColor(255, 255, 255);
        const sectionHeight = 40 + (optimalDateRanges.length * 15);
        pdf.roundedRect(margin, currentY, pageWidth - (margin * 2), sectionHeight, 8, 8, 'F');

        pdf.setTextColor(primaryOrange[0], primaryOrange[1], primaryOrange[2]);
        pdf.setFontSize(18);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Available Dates', pageWidth / 2, currentY + 20, { align: 'center' });

        let dateY = currentY + 35;
        pdf.setFontSize(12);

        optimalDateRanges.slice(0, 4).forEach((range, index) => {
          const isRecommended = index === 0;

          if (isRecommended) {
            pdf.setTextColor(primaryOrange[0], primaryOrange[1], primaryOrange[2]);
          } else {
            pdf.setTextColor(darkNavy[0], darkNavy[1], darkNavy[2]);
          }
          pdf.setFont('helvetica', isRecommended ? 'bold' : 'normal');

          const dateText = `${range.start} - ${range.end.split(',')[0]} (${range.days} days)`;
          pdf.text('•', margin + 15, dateY);
          pdf.text(dateText, margin + 25, dateY);

          if (isRecommended) {
            pdf.setTextColor(76, 175, 80); // Green
            pdf.setFontSize(10);
            pdf.text('OPTIMAL', pageWidth - margin - 35, dateY);
          }

          dateY += 15;
        });

        currentY += sectionHeight + 20;
      }

      // Description section (if available and not too long)
      if (tripDetails.description && tripDetails.description !== 'No description available' && tripDetails.description.length < 200) {
        pdf.setFillColor(255, 255, 255);
        pdf.roundedRect(margin, currentY, pageWidth - (margin * 2), 60, 8, 8, 'F');

        pdf.setTextColor(primaryOrange[0], primaryOrange[1], primaryOrange[2]);
        pdf.setFontSize(16);
        pdf.setFont('helvetica', 'bold');
        pdf.text('About This Destination', pageWidth / 2, currentY + 20, { align: 'center' });

        pdf.setTextColor(darkNavy[0], darkNavy[1], darkNavy[2]);
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'normal');

        // Split text to fit width
        const lines = pdf.splitTextToSize(tripDetails.description, pageWidth - (margin * 2) - 20);
        pdf.text(lines.slice(0, 3), margin + 10, currentY + 35);

        currentY += 80;
      }

      // Footer with orange theme
      pdf.setFillColor(primaryOrange[0], primaryOrange[1], primaryOrange[2]);
      pdf.rect(0, pageHeight - 40, pageWidth, 40, 'F');

      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Created with PackVote', pageWidth / 2, pageHeight - 25, { align: 'center' });

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Plan your perfect group trip together', pageWidth / 2, pageHeight - 15, { align: 'center' });

      // Generate clean filename
      const cleanDestination = tripDetails.destination.replace(/[^a-zA-Z0-9]/g, '-');
      const today = new Date().toISOString().split('T')[0];
      const filename = `PackVote-${cleanDestination}-${today}.pdf`;

      pdf.save(filename);

    } catch (error) {
      safeLog.error('Error generating PDF:', error);
      setError('Failed to generate PDF. Please try again later.');
    } finally {
      setLoading(false);
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
    window.open('https://www.paypal.com/donate/?hosted_button_id=J68S3LM4HXDGU', '_blank');
  };

  const getTripDetailsObject = () => {
    if (!winnerDetails || !tripData) {return null;}

    return {
      location: winnerDetails.location || winnerDetails.city || winnerDetails.destination || 'Unknown Location',
      country: winnerDetails.country || '',
      destination: winnerDetails.location || winnerDetails.city || winnerDetails.destination || 'Unknown Location',
      dates: optimalDateRanges.length > 0
        ? `${optimalDateRanges[0].start} - ${optimalDateRanges[0].end}`
        : 'Dates to be determined',
      duration: tripData.preferredTripLength
        ? `${tripData.preferredTripLength.average} days`
        : 'Duration to be determined',
      travelers: tripData.participants ? `${tripData.participants.length} travelers` : 'Unknown number of travelers',
      description: winnerDetails.description || 'No description available',
      price: 'Price varies'
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

  // Add safety check for missing trip details
  if (!tripDetails) {
    return (
      <Container maxWidth="md" sx={{ pt: 12, pb: 8 }}>
        <Alert severity="warning" sx={{ mb: 4 }}>
          Winner details are not available yet. Please try refreshing the page.
        </Alert>
        <Button variant="contained" onClick={() => window.location.reload()}>
          Refresh Page
        </Button>
      </Container>
    );
  }

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
              alt={`${tripDetails?.destination || 'Destination'} view`}
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
                {tripDetails?.destination || winnerDetails?.location || winnerDetails?.city || 'Winning Destination'}
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
                  📅 {tripDetails?.dates || 'Dates TBD'}
                </Typography>
                <Typography variant="body1">
                  👥 {tripDetails?.travelers || 'Group size TBD'}
                </Typography>
                <Typography variant="body1">
                  💰 {tripDetails?.price || 'Price varies'}
                </Typography>
              </Box>
            </Box>
          </Box>
        </Card>

        {/* Additional Date Options */}
        {optimalDateRanges && optimalDateRanges.length > 0 && (
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
              {optimalDateRanges.length > 1 ? 'Date Options' : 'Optimal Dates'}
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
              {optimalDateRanges.length > 1
                ? 'These dates work for everyone based on your survey responses:'
                : 'These dates work best for everyone based on your survey responses:'
              }
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