import React from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  AppBar,
  Toolbar,
  Button,
  Link
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import '../styles/LandingPage.css';

const PrivacyPolicy = () => {
  const navigate = useNavigate();

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
          <Typography variant="h3" component="h1" gutterBottom>
            Privacy Policy
          </Typography>

          <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
            1. Information We Collect
          </Typography>
          <Typography paragraph>
            We collect and use your data to provide the PackVote service,
            including creating and managing your trip preferences and recommendations.
          </Typography>
          <Box component="ul" sx={{ pl: 4 }}>
            <Typography component="li">Personal information (name, email address)</Typography>
            <Typography component="li">Travel preferences and interests</Typography>
            <Typography component="li">Group travel information and coordination details</Typography>
            <Typography component="li">Survey responses and voting data</Typography>
            <Typography component="li">Communication preferences</Typography>
          </Box>

          <Typography variant="h5" gutterBottom sx={{ mt: 3 }}>
            2. How We Use Your Information
          </Typography>
          <Typography paragraph>
            We use the collected information to:
          </Typography>
          <Box component="ul" sx={{ pl: 4 }}>
            <Typography component="li">Facilitate group travel planning and coordination</Typography>
            <Typography component="li">Provide personalized travel recommendations</Typography>
            <Typography component="li">Enable voting and decision-making features</Typography>
            <Typography component="li">Improve our services and user experience</Typography>
            <Typography component="li">Send important updates about your trips</Typography>
            <Typography component="li">Ensure the security of your account</Typography>
          </Box>

          <Typography variant="h5" gutterBottom sx={{ mt: 3 }}>
            3. Information Sharing
          </Typography>
          <Typography paragraph>
            We share your information only with:
          </Typography>
          <Box component="ul" sx={{ pl: 4 }}>
            <Typography component="li">Other group members (only for shared trip details)</Typography>
            <Typography component="li">Service providers who assist in operating our platform</Typography>
            <Typography component="li">Legal authorities when required by law</Typography>
          </Box>
          <Typography paragraph>
            We never sell your personal information to third parties.
          </Typography>

          <Typography variant="h5" gutterBottom sx={{ mt: 3 }}>
            4. Data Security
          </Typography>
          <Typography paragraph>
            We implement appropriate security measures to protect your personal information
            from unauthorized access, alteration, or disclosure. However, no internet
            transmission is completely secure, and we cannot guarantee absolute security.
          </Typography>

          <Typography variant="h5" gutterBottom sx={{ mt: 3 }}>
            5. Your Rights
          </Typography>
          <Typography paragraph>
            You have the right to:
          </Typography>
          <Box component="ul" sx={{ pl: 4 }}>
            <Typography component="li">Access your personal information</Typography>
            <Typography component="li">Correct inaccurate data</Typography>
            <Typography component="li">Request deletion of your data</Typography>
            <Typography component="li">Opt-out of marketing communications</Typography>
            <Typography component="li">Export your data</Typography>
          </Box>

          <Typography variant="h5" gutterBottom sx={{ mt: 3 }}>
            6. Cookies and Tracking
          </Typography>
          <Typography paragraph>
            We use cookies and similar technologies to enhance your experience
            and collect usage data. You can control cookie settings through
            your browser preferences.
          </Typography>

          <Typography variant="h5" gutterBottom sx={{ mt: 3 }}>
            7. Changes to Privacy Policy
          </Typography>
          <Typography paragraph>
            Changes to this privacy policy will be posted on this page.
          </Typography>

          <Typography variant="h5" gutterBottom sx={{ mt: 3 }}>
            8. Contact Us
          </Typography>
          <Typography paragraph>
            If you have any questions about this Privacy Policy,
            please contact us using the information below.
          </Typography>

          <Typography variant="body2" sx={{ mt: 4, color: 'text.secondary', fontStyle: 'italic' }}>
            Last updated: {new Date().toLocaleDateString()}
          </Typography>
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

export default PrivacyPolicy;