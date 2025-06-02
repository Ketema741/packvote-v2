import React from 'react';
import {
  Container,
  Typography,
  Box,
  Button,
  AppBar,
  Toolbar,
  Link,
  Paper
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import '../styles/LandingPage.css';
import '../styles/DonationPage.css';

const DonationPage = () => {
  const navigate = useNavigate();

  const handlePayPalDonation = () => {
    window.open('https://www.paypal.com/donate/?hosted_button_id=J68S3LM4HXDGU', '_blank');
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
            PackVote
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Link
              href="/docs"
              color="text.secondary"
              underline="none"
              sx={{ '&:hover': { color: 'text.primary' } }}
            >
              Docs
            </Link>
            <Link
              href="/donate"
              color="text.secondary"
              underline="none"
              sx={{ '&:hover': { color: 'text.primary' } }}
            >
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
        <Paper elevation={3} sx={{ p: 4, borderRadius: 3 }}>
          <Box className="donation-header" sx={{ textAlign: 'center', mb: 4 }}>
            <Typography variant="h3" component="h1" gutterBottom>
              Support PackVote
            </Typography>
            <Typography variant="h6" color="text.secondary" className="subtitle">
              Help us keep travel planning magical & free ✨
            </Typography>
          </Box>

          <Box className="donation-card" sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 3
          }}>
            <div className="coffee-icon">
              <svg
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path
                  d={[
                    'M18 8H19C20.0609 8 21.0783 8.42143 21.8284 9.17157C22.5786 9.92172',
                    '23 10.9391 23 12C23 13.0609 22.5786 14.0783 21.8284 14.8284C21.0783',
                    '15.5786 20.0609 16 19 16H18M18 8H2V17C2 18.0609 2.42143 19.0783',
                    '3.17157 19.8284C3.92172 20.5786 4.93913 21 6 21H14C15.0609 21',
                    '16.0783 20.5786 16.8284 19.8284C17.5786 19.0783 18 18.0609 18 17V8Z'
                  ].join(' ')}
                />
              </svg>
            </div>

            <Box className="donation-text" sx={{ maxWidth: '700px' }}>
              <Typography paragraph>
                We're committed to keeping PackVote completely free for everyone. Your support helps us cover essential costs like:
              </Typography>
              <ul className="features-list costs">
                <li>🤖 AI API costs for smart recommendations</li>
                <li>☁️ Cloud hosting and servers</li>
                <li>🔒 Security and data protection</li>
                <li>🛠️ Development of new features</li>
              </ul>
              <Typography
                paragraph
                className="support-message"
              >
                Even a small donation helps us maintain and improve this free service for the entire travel community!
              </Typography>
            </Box>

            <Button
              variant="contained"
              size="large"
              onClick={handlePayPalDonation}
              className="primary-button"
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                py: 1.5,
                px: 3
              }}
            >
              <img
                src="https://www.paypalobjects.com/webstatic/mktg/Logo/pp-logo-100px.png"
                alt="PayPal Logo"
                className="paypal-logo"
                style={{ height: '24px' }}
              />
              Support with PayPal
            </Button>

            <Box className="thank-you-note" sx={{ textAlign: 'center', mt: 3 }}>
              <Typography paragraph>Thank you for your support! 💙</Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                className="small-text"
              >
                Your contribution helps keep group travel planning free for everyone
              </Typography>
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

export default DonationPage;