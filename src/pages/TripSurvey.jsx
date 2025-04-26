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
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import { Survey, StylesManager, Model } from 'survey-react';
import 'survey-react/survey.css';
import '../styles/LandingPage.css';
import '../styles/TripSurvey.css';

// Apply custom styling
StylesManager.applyTheme("defaultV2");

const TripSurvey = () => {
  const navigate = useNavigate();
  const [survey, setSurvey] = React.useState(null);
  const [currentPage, setCurrentPage] = React.useState(0);
  const [totalPages, setTotalPages] = React.useState(0);

  React.useEffect(() => {
    // Import survey JSON
    import('../data/survey.json').then((surveyJson) => {
      const surveyModel = new Model(surveyJson.default);
      
      // Initialize the total number of pages
      setTotalPages(surveyModel.pages.length);
      
      // Add event handlers for page changes
      surveyModel.onCurrentPageChanged.add((sender, options) => {
        // SurveyJS uses 0-based indexing for pages
        setCurrentPage(sender.currentPageNo + 1);
      });
      
      // Set initial page
      setCurrentPage(1);
      
      setSurvey(surveyModel);
    });
  }, []);

  const handleComplete = (sender) => {
    // Handle survey completion
    console.log('Survey results:', sender.data);
    navigate('/next-step');
  };

  // Calculate progress percentage
  const progressPercentage = totalPages > 0 ? (currentPage / totalPages) * 100 : 0;

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
                Step {currentPage} of {totalPages}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {Math.round(progressPercentage)}%
              </Typography>
            </Box>
            <LinearProgress variant="determinate" value={progressPercentage} sx={{ height: 8, borderRadius: 4 }} />
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

          {/* SurveyJS Component */}
          <Box sx={{ 
            mt: 0,
            mb: 0,
            '& .sv_main': {
              fontFamily: 'inherit',
              backgroundColor: 'transparent',
              marginTop: '0 !important',
              paddingTop: '0 !important',
            },
            '& .sv_container': {
              maxWidth: '100%',
              marginTop: '0 !important',
              paddingTop: '0 !important',
            },
            '& .sv_page': {
              marginTop: '0 !important',
              paddingTop: '0 !important',
            },
            '& .sv_row': {
              marginTop: '0 !important',
              paddingTop: '0 !important',
            },
            '& .sv_p_root': {
              marginTop: '0 !important',
              paddingTop: '0 !important',
            },
            '& .sv_body': {
              marginTop: '0 !important',
              paddingTop: '0 !important',
            },
            '& .sv_q': {
              padding: '0.5rem 0',
            },
            '& .sv_q_title': {
              fontSize: '1.1rem',
              fontWeight: 500,
            },
            '& .sv_q_radiogroup': {
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
            },
            '& .sv_q_radiogroup label': {
              margin: '0.5rem 0',
            },
            '& .sv_q_rating': {
              display: 'flex',
              justifyContent: 'center',
              gap: '0.5rem',
            },
            '& .sv_q_rating_item': {
              padding: '0.5rem',
            },
            '& .sv_nav_btn': {
              backgroundColor: 'primary.main',
              color: 'white',
              '&:hover': {
                backgroundColor: 'primary.dark',
              },
            },
          }}>
            {survey && (
              <Survey
                model={survey}
                onComplete={handleComplete}
              />
            )}
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