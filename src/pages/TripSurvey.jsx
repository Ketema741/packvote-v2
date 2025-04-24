import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Container, 
  Typography, 
  Box, 
  Button, 
  AppBar,
  Toolbar,
  Link,
  Paper,
  LinearProgress
} from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import '../styles/LandingPage.css';
import '../styles/TripSurvey.css';

const TripSurvey = () => {
  const navigate = useNavigate();

  const handleDone = () => {
    // TODO: Handle survey completion
    navigate('/next-step');
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

      <Container maxWidth="md" sx={{ pt: 12, pb: 8 }}>
        <Paper elevation={3} sx={{ p: 4, borderRadius: 3, maxWidth: '800px', mx: 'auto' }}>
          {/* Progress indicator */}
          <Box sx={{ mb: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Step 1 of 2
              </Typography>
              <Typography variant="body2" color="text.secondary">
                50%
              </Typography>
            </Box>
            <LinearProgress variant="determinate" value={50} sx={{ height: 8, borderRadius: 4 }} />
          </Box>

          {/* Survey content */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography variant="h3" component="h1" gutterBottom>
              Travel Preferences
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
              Helps us match budgets, dates & vibes for everyone.
            </Typography>
          </Box>

          {/* Placeholder for future Typeform embed */}
          <Box 
            className="typeform-container" 
            sx={{ 
              bgcolor: '#f5f5f5', 
              height: '300px', 
              borderRadius: 2,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              mb: 4
            }}
          >
            <Typography variant="body1" color="text.secondary">
              Typeform will be embedded here
            </Typography>
          </Box>

          <Box 
            className="survey-actions"
            sx={{ 
              display: 'flex', 
              flexDirection: { xs: 'column', sm: 'row' },
              gap: 2,
              justifyContent: 'center',
              mt: 4
            }}
          >
            <Button 
              variant="contained" 
              onClick={handleDone}
              className="primary-button"
              endIcon={<ArrowForwardIcon />}
              sx={{ minWidth: '150px' }}
            >
              Done
            </Button>
            <Button 
              variant="outlined" 
              startIcon={<OpenInNewIcon />}
            >
              Open form in new tab
            </Button>
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

export default TripSurvey; 