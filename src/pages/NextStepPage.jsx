import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Container, 
  Typography, 
  Box, 
  Button, 
  Paper,
  AppBar,
  Toolbar,
  Link
} from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import '../styles/LandingPage.css';

const NextStepPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const tripId = location.state?.tripId;

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

      <Container maxWidth="lg">
        <Box sx={{ pt: 12, pb: 8 }}>
          <Paper 
            elevation={3} 
            sx={{ 
              p: 6, 
              borderRadius: 3, 
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              backgroundImage: 'linear-gradient(to bottom, rgba(255,255,255,0.95), rgba(255,255,255,0.95))',
              backgroundSize: 'cover',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {/* Background unsplash image with overlay */}
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: -1,
                backgroundImage: 'url(https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1600&q=80)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                filter: 'blur(2px)',
                opacity: 0.8
              }}
            />

            <Typography 
              variant="h3" 
              component="h1" 
              gutterBottom
              sx={{ 
                color: 'primary.main', 
                fontWeight: 700, 
                mb: 3, 
                position: 'relative',
                textShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}
            >
              Ready for takeoff!
            </Typography>

            <Box sx={{ maxWidth: 600, mx: 'auto', position: 'relative', mb: 5 }}>
              <Typography 
                variant="h6" 
                color="text.secondary" 
                gutterBottom
                sx={{ mb: 4, fontWeight: 400, lineHeight: 1.6 }}
              >
                Thank you for filling out the survey.<br/>
                Check out the dashboard to see who else has filled in the form and get your destination recommendations!
              </Typography>

              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <img 
                  src="https://images.unsplash.com/photo-1488085061387-422e29b40080?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80" 
                  alt="Travel adventure" 
                  style={{ 
                    maxWidth: '100%', 
                    borderRadius: 16, 
                    boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                    maxHeight: '300px',
                    objectFit: 'cover'
                  }}
                />
              </Box>
            </Box>

            <Button 
              variant="contained" 
              size="large" 
              endIcon={<ArrowForwardIcon />}
              onClick={() => navigate(tripId ? `/dashboard/${tripId}` : '/dashboard')}
              sx={{ 
                mt: 4, 
                py: 1.5, 
                px: 4, 
                borderRadius: 2,
                boxShadow: '0 4px 14px rgba(66, 99, 235, 0.4)',
                fontWeight: 600
              }}
            >
              Go to Dashboard
            </Button>
          </Paper>
        </Box>
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

export default NextStepPage; 