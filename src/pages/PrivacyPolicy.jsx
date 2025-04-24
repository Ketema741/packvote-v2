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
        <Paper elevation={3} sx={{ p: 4, borderRadius: 3 }}>
          <Typography variant="h3" component="h1" gutterBottom>
            Privacy Policy
          </Typography>
          
          <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
            1. Information We Collect
          </Typography>
          <Typography paragraph>
            We collect information that you provide directly to us when using the AI Travel App, including:
            • Personal information (name, email address)
            • Travel preferences and interests
            • Group travel information and coordination details
            • Survey responses and voting data
            • Communication preferences
          </Typography>

          <Typography variant="h5" gutterBottom sx={{ mt: 3 }}>
            2. How We Use Your Information
          </Typography>
          <Typography paragraph>
            We use the collected information to:
            • Facilitate group travel planning and coordination
            • Provide personalized travel recommendations
            • Enable voting and decision-making features
            • Improve our services and user experience
            • Send important updates about your trips
            • Ensure the security of your account
          </Typography>

          <Typography variant="h5" gutterBottom sx={{ mt: 3 }}>
            3. Information Sharing
          </Typography>
          <Typography paragraph>
            We share your information only with:
            • Other group members (only for shared trip details)
            • Service providers who assist in operating our platform
            • Legal authorities when required by law
            We never sell your personal information to third parties.
          </Typography>

          <Typography variant="h5" gutterBottom sx={{ mt: 3 }}>
            4. Data Security
          </Typography>
          <Typography paragraph>
            We implement appropriate security measures to protect your personal information from unauthorized access, alteration, or disclosure. However, no internet transmission is completely secure, and we cannot guarantee absolute security.
          </Typography>

          <Typography variant="h5" gutterBottom sx={{ mt: 3 }}>
            5. Your Rights
          </Typography>
          <Typography paragraph>
            You have the right to:
            • Access your personal information
            • Correct inaccurate data
            • Request deletion of your data
            • Opt-out of marketing communications
            • Export your data
          </Typography>

          <Typography variant="h5" gutterBottom sx={{ mt: 3 }}>
            6. Cookies and Tracking
          </Typography>
          <Typography paragraph>
            We use cookies and similar technologies to enhance your experience and collect usage data. You can control cookie settings through your browser preferences.
          </Typography>

          <Typography variant="h5" gutterBottom sx={{ mt: 3 }}>
            7. Changes to Privacy Policy
          </Typography>
          <Typography paragraph>
            We may update this privacy policy periodically. We will notify you of any material changes through our platform or via email.
          </Typography>

          <Typography variant="h5" gutterBottom sx={{ mt: 3 }}>
            8. Contact Us
          </Typography>
          <Typography paragraph>
            If you have questions about this privacy policy or your personal data, please contact us at privacy@aitravelapp.com.
          </Typography>

          <Typography variant="body2" sx={{ mt: 4, color: 'text.secondary' }}>
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