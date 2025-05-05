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
  CircularProgress
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
        tripId: location.state.tripId || ''
      });
      
      // Set a default caption
      const destName = destination.city || destination.destination || 'our trip';
      setCaption(`I'm excited to announce we're going to ${destName}${destination.country ? `, ${destination.country}` : ''}! Join me for an amazing adventure!`);
      setLoading(false);
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

  // Add an effect to load destination images
  useEffect(() => {
    if (!tripData || !tripData.destination) return;
    
    // Create a temporary destination object with the properties needed for the image service
    const destinationObj = {
      city: tripData.destination.split(',')[0], // First part before comma
      country: tripData.destination.includes(',') ? tripData.destination.split(',')[1].trim() : ''
    };
    
    // Start with a fallback image
    setDestinationImage(getImageSync(destinationObj));
    
    // Then load from API
    const loadImage = async () => {
      try {
        setLoading(true);
        const imageUrl = await getDestinationImage(destinationObj);
        setDestinationImage(imageUrl);
      } catch (err) {
        console.error('Error loading destination image:', err);
        // Keep fallback image if there's an error
      } finally {
        setLoading(false);
      }
    };
    
    loadImage();
  }, [tripData]);

  const handleDownload = async () => {
    if (!shareCardRef.current) return;

    try {
      setLoading(true);
      
      // Create a canvas from the share card
      const canvas = await html2canvas(shareCardRef.current, {
        scale: 2, // Higher quality
        logging: false,
        useCORS: true, // Allow loading cross-origin images
        backgroundColor: '#FFFFFF'
      });
      
      // Convert to data URL and download
      const image = canvas.toDataURL('image/png', 1.0);
      const downloadLink = document.createElement('a');
      downloadLink.href = image;
      downloadLink.download = `${tripData.destination.toLowerCase().replace(/\s+/g, '-')}-trip.png`;
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
              className="share-preview" 
              sx={{ 
                my: 4, 
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                overflow: 'hidden',
                backgroundColor: 'white'
              }}
            >
              <Box className="preview-illustration" sx={{ 
                backgroundImage: `url(${destinationImage})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                p: 3,
                height: '230px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'flex-end',
                position: 'relative'
              }}>
                <Box 
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.3)', // Dark overlay
                    backdropFilter: 'blur(1px)'
                  }}
                />
                <Box 
                  sx={{
                    position: 'relative',
                    zIndex: 1,
                    backgroundColor: 'rgba(255, 255, 255, 0.8)',
                    borderRadius: '8px',
                    padding: '4px 12px',
                    mb: 2
                  }}
                >
                  <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                    {destinationEmojis.scene} {tripData?.destination.split(',')[0]}
                  </Typography>
                </Box>
              </Box>
              <Box className="preview-text" sx={{ 
                bgcolor: 'white', 
                p: 3,
                textAlign: 'center'
              }}>
                <Typography variant="body1" sx={{ fontSize: '1.1rem', color: 'text.secondary' }}>
                  We're going to
                </Typography>
                <Typography variant="h3" sx={{ fontWeight: 'bold', color: 'primary.main', mb: 1 }}>
                  {tripData?.destination}
                  {tripData?.country ? `, ${tripData.country}` : ''}
                </Typography>
                {tripData?.dates && (
                  <Typography variant="body1" sx={{ color: 'text.secondary', mt: 1 }}>
                    📅 {tripData.dates}
                  </Typography>
                )}
                {tripData?.travelers && (
                  <Typography variant="body1" sx={{ color: 'text.secondary', mt: 0.5 }}>
                    👥 {tripData.travelers}
                  </Typography>
                )}
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