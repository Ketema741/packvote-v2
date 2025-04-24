import React from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  Button, 
  AppBar,
  Toolbar,
  Link,
  useTheme
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import LinkIcon from '@mui/icons-material/Link';
import QuestionAnswerIcon from '@mui/icons-material/QuestionAnswer';
import ExploreIcon from '@mui/icons-material/Explore';
import HowToVoteIcon from '@mui/icons-material/HowToVote';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import PhoneIphoneIcon from '@mui/icons-material/PhoneIphone';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import '../styles/LandingPage.css';

const LandingPage = () => {
  const navigate = useNavigate();
  const theme = useTheme();

  return (
    <div className="landing-page">
      {/* Navigation */}
      <AppBar position="fixed" elevation={0} sx={{ bgcolor: 'background.paper' }}>
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Typography variant="h6" component="div" sx={{ color: 'primary.main', fontWeight: 600 }}>
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

      {/* Hero Section */}
      <Container maxWidth="lg">
        <div className="hero-section">
          <div className="hero-text">
            <Typography variant="h1" component="h1" gutterBottom>
              Where should we go?
            </Typography>
            <Typography variant="h6" color="text.secondary" paragraph>
              AI-powered planning that picks the perfect destination for your crew in minutes.
            </Typography>
            <Button
              variant="contained"
              size="large"
              endIcon={<ArrowForwardIcon />}
              onClick={() => navigate('/create-trip')}
              className="primary-button"
            >
              Start a Trip
            </Button>
          </div>
          <div className="hero-image">
            <img 
              src="https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80" 
              alt="Scenic mountain road trip view"
            />
          </div>
        </div>
      </Container>

      {/* How It Works */}
      <Container maxWidth="lg">
        <Typography variant="h2" align="center" gutterBottom className="section-title">
          How It Works
        </Typography>
        <div className="features-section">
          <div className="feature">
            <div className="feature-icon">
              <LinkIcon />
            </div>
            <h3>1. Create a trip link</h3>
            <p>Start your adventure with one click</p>
          </div>
          <div className="feature">
            <div className="feature-icon">
              <QuestionAnswerIcon />
            </div>
            <h3>2. Friends fill one quick questionnaire</h3>
            <p>Quick preferences from everyone</p>
          </div>
          <div className="feature">
            <div className="feature-icon">
              <ExploreIcon />
            </div>
            <h3>3. AI suggests 3 perfect destinations</h3>
            <p>Matched to your group's needs</p>
          </div>
          <div className="feature">
            <div className="feature-icon">
              <HowToVoteIcon />
            </div>
            <h3>4. Vote and book</h3>
            <p>Democracy wins!</p>
          </div>
        </div>
      </Container>

      {/* Benefits */}
      <Container maxWidth="lg">
        <div className="benefits-section">
          <div className="benefit">
            <AccessTimeIcon />
            <p>Skips annoying back-and-forth</p>
          </div>
          <div className="benefit">
            <AccountBalanceWalletIcon />
            <p>Aligns budgets & vibes</p>
          </div>
          <div className="benefit">
            <PhoneIphoneIcon />
            <p>No app download required</p>
          </div>
        </div>
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

export default LandingPage; 