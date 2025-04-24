import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Link
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import LinkIcon from '@mui/icons-material/Link';
import CloseIcon from '@mui/icons-material/Close';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import '../styles/LandingPage.css';
import '../styles/SocialSharePage.css';

const SocialSharePage = () => {
  const navigate = useNavigate();
  const [caption, setCaption] = useState('');
  
  const handleDownload = () => {
    // TODO: Implement image download functionality
    console.log('Downloading PNG...');
  };

  const handleCopyLink = () => {
    // TODO: Implement copy link functionality
    console.log('Copying share link...');
  };

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
          
            <Box className="share-preview" sx={{ 
              my: 4, 
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2,
              overflow: 'hidden'
            }}>
              <Box className="preview-illustration" sx={{ 
                bgcolor: '#f8f9fa', 
                p: 2,
                height: '200px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
              }}>
                {/* TODO update this to match the chosen location */}
                <Box className="illustration-elements">
                  <Box className="scene" sx={{ position: 'relative', height: '100%', width: '100%' }}>
                    <Box className="sun" sx={{ 
                      position: 'absolute',
                      top: '20px',
                      right: '40px',
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      bgcolor: '#FFD700'
                    }}></Box>
                    <Box className="palm-trees" sx={{ 
                      position: 'absolute',
                      bottom: '0',
                      left: '30px',
                      color: '#2E7D32'
                    }}>🌴🌴</Box>
                    <Box className="beach-chair" sx={{ 
                      position: 'absolute',
                      bottom: '10px',
                      left: '120px'
                    }}>🏖️</Box>
                    <Box className="building" sx={{ 
                      position: 'absolute',
                      bottom: '20px',
                      right: '60px'
                    }}>🏛️</Box>
                  </Box>
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
                <Typography variant="h3" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                  Paris!
                </Typography>
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
                >
                  Copy Share Link
                </Button>
              </Box>
            </Box>
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

export default SocialSharePage; 