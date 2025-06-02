import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  TextField,
  Paper,
  IconButton,
  AppBar,
  Toolbar,
  Link,
  Snackbar,
  Alert,
  CircularProgress,
  CardMedia
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import LinkIcon from '@mui/icons-material/Link';
import CloseIcon from '@mui/icons-material/Close';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import html2canvas from 'html2canvas';
import { getDestinationImage, getImageSync } from '../utils/imageService';
import '../styles/LandingPage.css';
import '../styles/SocialSharePage.css';

const SocialSharePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [caption, setCaption] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [tripData, setTripData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [destinationImage, setDestinationImage] = useState('');
  const shareCardRef = useRef(null);

  // Set default caption based on destination
  useEffect(() => {
    if (location.state && (location.state.winnerDestination || location.state.tripId)) {
      const destination = location.state.winnerDestination || {};
      setTripData({
        destination: destination.city || destination.destination || 'our trip',
        country: destination.country || '',
        dates: location.state.dates || 'soon',
        travelers: location.state.travelers || '',
        price: location.state.price || '',
        tripId: location.state.tripId || '',
        // Store the original winnerDestination object to use with image service
        winnerDestination: location.state.winnerDestination
      });

      // Also set the destination image directly if it was passed
      if (location.state.imageUrl) {
        setDestinationImage(location.state.imageUrl);
        setLoading(false);
      }

      // Set a default caption
      const destName = destination.city || destination.destination || 'our trip';
      setCaption(`I'm excited to announce we're going to ${destName}${destination.country ? `, ${destination.country}` : ''}!`);
    } else {
      setLoading(false);
      // If no data was passed, use default values
      setTripData({
        destination: 'our trip',
        country: '',
        dates: 'soon',
        travelers: '',
        price: '',
        tripId: ''
      });
    }
  }, [location.state]);

  // Load destination image - using same approach as WinnerPage
  useEffect(() => {
    if (!tripData) {return;}

    // Skip if we already have an image from the location state
    if (location.state && location.state.imageUrl) {
      setDestinationImage(location.state.imageUrl);
      setLoading(false);
      return;
    }

    // Initialize with a fallback image
    if (tripData.winnerDestination) {
      setDestinationImage(getImageSync(tripData.winnerDestination));
    }

    // Then load from API
    const loadImage = async () => {
      try {
        setLoading(true);
        // Use the original winnerDestination object for the image service
        const imageUrl = await getDestinationImage(tripData.winnerDestination || {});
        if (imageUrl) {
          // Preload the image to ensure it's fully loaded before rendering
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => {
            setDestinationImage(imageUrl);
            setLoading(false);
          };
          img.onerror = () => {
            console.error('Error loading destination image');
            setLoading(false);
          };
          img.src = imageUrl;
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.error('Error loading destination image:', err);
        // Keep the fallback image if there's an error
        setLoading(false);
      }
    };

    if (tripData.winnerDestination) {
      loadImage();
    } else {
      setLoading(false);
    }
  }, [tripData, location.state]);

  const handleDownload = async () => {
    if (!shareCardRef.current) {return;}

    try {
      setLoading(true);

      // Create a canvas from the share card
      const canvas = await html2canvas(shareCardRef.current, {
        scale: 3, // Increased scale for better quality
        logging: false,
        useCORS: true, // Allow loading cross-origin images
        allowTaint: true,
        backgroundColor: '#FFFFFF',
        imageTimeout: 15000, // Longer timeout for images
        removeContainer: false // Helps with rendering
      });

      // Convert to data URL and download
      const image = canvas.toDataURL('image/png', 1.0);
      const downloadLink = document.createElement('a');
      downloadLink.href = image;
      downloadLink.download = `${tripData?.destination ? tripData.destination.toLowerCase().replace(/\s+/g, '-') : 'trip'}-share.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);

      setSnackbar({
        open: true,
        message: 'Image downloaded successfully!',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error generating image:', error);
      setSnackbar({
        open: true,
        message: 'Failed to download image. Please try again.',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    if (!tripData.tripId) {
      setSnackbar({
        open: true,
        message: 'No trip ID available to generate a share link.',
        severity: 'error'
      });
      return;
    }

    // Create a share link to the winner page for this trip
    const baseUrl = window.location.origin;
    const shareLink = `${baseUrl}/winner/${tripData.tripId}`;

    // Copy to clipboard
    navigator.clipboard.writeText(shareLink)
      .then(() => {
        setSnackbar({
          open: true,
          message: 'Share link copied to clipboard!',
          severity: 'success'
        });
      })
      .catch(err => {
        console.error('Failed to copy link:', err);
        setSnackbar({
          open: true,
          message: 'Failed to copy link. Please try again.',
          severity: 'error'
        });
      });
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  // Get the appropriate illustration based on destination
  const getDestinationEmojis = () => {
    const destination = tripData?.destination?.toLowerCase() || '';

    // Match destination to appropriate emojis
    if (destination.includes('beach') || destination.includes('island') || destination.includes('coast') ||
        destination.includes('bali') || destination.includes('hawaii') || destination.includes('caribbean')) {
      return { scene: '🏝️', elements: ['🌴', '🏖️', '🌊'] };
    } else if (destination.includes('mountain') || destination.includes('alps') ||
              destination.includes('hiking') || destination.includes('trek')) {
      return { scene: '🏔️', elements: ['⛰️', '🥾', '🌲'] };
    } else if (destination.includes('paris') || destination.includes('france')) {
      return { scene: '🗼', elements: ['🥐', '🥖', '🍷'] };
    } else if (destination.includes('rome') || destination.includes('italy')) {
      return { scene: '🏛️', elements: ['🍕', '🍝', '🏺'] };
    } else if (destination.includes('tokyo') || destination.includes('japan')) {
      return { scene: '⛩️', elements: ['🍣', '🗾', '🌸'] };
    } else if (destination.includes('new york') || destination.includes('nyc')) {
      return { scene: '🗽', elements: ['🏙️', '🚕', '🍎'] };
    } else {
      // Default travel theme
      return { scene: '✈️', elements: ['🧳', '🗺️', '📸'] };
    }
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ pt: 12, pb: 8, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 200px)' }}>
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress />
          <Typography variant="h6" sx={{ mt: 2 }}>
            Preparing your share card...
          </Typography>
        </Box>
      </Container>
    );
  }

  // Get destination emojis for illustration
  const destinationEmojis = getDestinationEmojis();

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

      <Container maxWidth="md" sx={{ pt: 12, pb: 8, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 200px)' }}>
        <Paper elevation={3} sx={{
          p: 4,
          borderRadius: 3,
          width: '100%',
          maxWidth: '700px',
          position: 'relative'
        }}>
          <IconButton
            aria-label="close"
            onClick={() => navigate(-1)}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: 'text.secondary'
            }}
          >
            <CloseIcon />
          </IconButton>

          <Box sx={{ pt: 2 }}>
            <Typography variant="h4" component="h1" gutterBottom align="center">
              Share Your Trip
            </Typography>

            <Box
              ref={shareCardRef}
              id="social-share-card"
              className="share-preview"
              sx={{
                my: 4,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                overflow: 'hidden',
                backgroundColor: 'white',
                width: '100%',
                maxWidth: '360px', // Adjusted width for phone size
                height: '640px', // 9:16 aspect ratio (360px × 1.778 ≈ 640px)
                margin: '0 auto',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              {/* PackVote Brand Banner at the top */}
              <Box sx={{
                bgcolor: 'primary.main',
                color: 'white',
                py: 0.75,
                px: 2,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                zIndex: 2
              }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                  PackVote
                </Typography>
                <Typography variant="caption">
                  Plan your perfect trip together ♡
                </Typography>
              </Box>

              <Box
                className="preview-illustration"
                sx={{
                  height: '40%', // 40% of the card height
                  position: 'relative',
                  flexShrink: 0,
                  overflow: 'hidden', // Ensure image stays within bounds
                  borderBottom: '3px solid #f5f5f5' // Add a subtle separator
                }}
              >
                {/* Using CardMedia just like WinnerPage */}
                <CardMedia
                  component="img"
                  image={destinationImage}
                  alt={`${tripData?.destination || 'Destination'} view`}
                  crossOrigin="anonymous"
                  sx={{
                    height: '100%',
                    width: '100%',
                    objectFit: 'cover',
                    objectPosition: 'center',
                    display: 'block', // Prevents inline display issues
                    imageRendering: 'auto' // Let browser optimize image rendering
                  }}
                />

                {/* Loading indicator */}
                {loading && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      bgcolor: 'rgba(255, 255, 255, 0.7)',
                      zIndex: 3
                    }}
                  >
                    <CircularProgress size={40} />
                  </Box>
                )}

                {/* Image overlay */}
                <Box
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.25)', // Slightly lighter overlay
                    backdropFilter: 'blur(0px)', // Remove blur for sharper image
                    zIndex: 1
                  }}
                />
              </Box>
              <Box className="preview-text" sx={{
                bgcolor: 'white',
                p: 3,
                pt: 5, // Even more top padding for better separation
                mt: 1, // Small margin at top
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                flex: 1,
                position: 'relative', // For positioning
                zIndex: 2 // Ensure it's above the image
              }}>
                <Typography variant="body1" sx={{ fontSize: '1.1rem', color: 'text.secondary' }}>
                  We're going to
                </Typography>
                <Typography
                  variant="h3"
                  sx={{
                    fontWeight: 'bold',
                    color: 'primary.main',
                    mb: 1,
                    fontSize: '2.2rem',
                    lineHeight: 1.2,
                    wordBreak: 'break-word',
                    mt: 1
                  }}
                >
                  {tripData?.destination}
                </Typography>
                {tripData?.country && (
                  <Typography
                    variant="h5"
                    sx={{
                      color: 'text.secondary',
                      mb: 2,
                      fontWeight: 'medium'
                    }}
                  >
                    {tripData.country}
                  </Typography>
                )}

                {/* Emoji elements to make it more visually appealing */}
                <Box sx={{
                  display: 'flex',
                  gap: 2,
                  fontSize: '2rem',
                  my: 3,
                  justifyContent: 'center'
                }}>
                  {destinationEmojis.scene}
                  {destinationEmojis.elements.map((emoji, index) => (
                    <span key={index}>{emoji}</span>
                  ))}
                </Box>

                <Box sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 1,
                  mt: 2
                }}>
                  {tripData?.dates && (
                    <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                      📅 {tripData.dates}
                    </Typography>
                  )}
                  {tripData?.travelers && (
                    <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                      👥 {tripData.travelers}
                    </Typography>
                  )}
                </Box>
              </Box>

              {/* PackVote Watermark */}
              <Box sx={{
                bgcolor: 'primary.light',
                color: 'primary.contrastText',
                py: 1.5,
                px: 2,
                textAlign: 'center',
                fontSize: '0.75rem',
                fontWeight: 'medium',
                mt: 'auto'
              }}>
                Created with PackVote.com
              </Box>
            </Box>

            <Box className="share-form" sx={{ mt: 4 }}>
              <Box className="form-group" sx={{ mb: 3 }}>
                <Typography variant="subtitle1" component="label" htmlFor="caption" sx={{ mb: 1, display: 'block' }}>
                  Caption
                </Typography>
                <TextField
                  id="caption"
                  multiline
                  rows={4}
                  placeholder="Add your message here..."
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  fullWidth
                  variant="outlined"
                />
              </Box>

              <Box className="share-actions" sx={{
                display: 'flex',
                gap: 2,
                justifyContent: 'center',
                flexWrap: 'wrap'
              }}>
                <Button
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  onClick={handleDownload}
                  sx={{ minWidth: '180px' }}
                >
                  Download PNG
                </Button>
                <Button
                  variant="contained"
                  startIcon={<LinkIcon />}
                  onClick={handleCopyLink}
                  className="primary-button"
                  sx={{ minWidth: '180px' }}
                  disabled={!tripData?.tripId}
                >
                  Copy Share Link
                </Button>
              </Box>
            </Box>
          </Box>
        </Paper>
      </Container>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

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

export default SocialSharePage;