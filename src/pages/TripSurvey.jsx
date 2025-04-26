import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Container, 
  Typography, 
  Box, 
  Button, 
  AppBar,
  Toolbar,
  Link,
  Paper,
  LinearProgress,
  Alert,
  Snackbar
} from '@mui/material';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import { Survey, StylesManager, Model } from 'survey-react';
import { saveSurveyResponse } from '../utils/api';
import 'survey-react/survey.css';
import '../styles/LandingPage.css';
import '../styles/TripSurvey.css';

// Apply custom styling
StylesManager.applyTheme("defaultV2");

// Override default styles globally
StylesManager.ThemeColors["default"] = {
  "$main-color": "#4263eb",
  "$text-color": "#111827",
  "$header-color": "#111827",
  "$header-background-color": "#ffffff",
  "$body-container-background-color": "#ffffff",
  "$error-color": "#ef4444",
  "$border-color": "#e5e7eb",
  "$main-hover-color": "#364fc7",
  "$selection-border-color": "#4263eb",
  "$clean-button-color": "#6b7280",
  "$disabled-text-color": "#9ca3af",
  "$disabled-label-color": "#6b7280",
  "$slider-color": "#4263eb",
  "$progress-text-color": "#6b7280",
  "$disable-color": "#e5e7eb",
  "$progress-buttons-color": "#ffffff",
  "$progress-buttons-background-color": "#4263eb"
};

const TripSurvey = () => {
  const navigate = useNavigate();
  const { tripId, participantId } = useParams();
  const [survey, setSurvey] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  useEffect(() => {
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
      
      // Customize the survey appearance
      surveyModel.applyTheme({
        header: {
          height: "0px",
          background: "transparent"
        },
        isPanelless: false
      });

      // Improve spacing between questions
      surveyModel.questionTitleLocation = "top";
      surveyModel.questionDescriptionLocation = "underTitle";
      surveyModel.questionErrorLocation = "bottom";
      surveyModel.showQuestionNumbers = false;
      surveyModel.questionStartIndex = "";
      surveyModel.maxTextLength = 0;
      surveyModel.maxOthersLength = 0;

      // Configure dropdown appearance
      surveyModel.showClearButton = false; // Hide the X button altogether
      
      // Set spacing for all questions in the survey
      surveyModel.setDesignMode(true);
      surveyModel.getAllQuestions().forEach(question => {
        question.titleLocation = "top";
        question.indent = 0;
        question.marginBottom = 30;
        
        // Handle dropdown properties
        if (question.getType() === "dropdown") {
          question.renderAs = "select";
          question.searchEnabled = false;
        }
      });
      surveyModel.setDesignMode(false);

      // Custom CSS classes
      surveyModel.css = {
        root: "sv_main sv_custom_root",
        container: "sv_container sv_custom_container",
        navigation: {
          complete: "sv_complete_btn sv_custom_btn",
          prev: "sv_prev_btn sv_custom_btn",
          next: "sv_next_btn sv_custom_btn",
          start: "sv_start_btn sv_custom_btn"
        },
        navigationBar: "sv_nav",
        body: "sv_body sv_custom_body",
        page: {
          root: "sv_page sv_custom_page",
          title: "sv_page_title sv_custom_page_title"
        },
        pageTitle: "sv_page_title sv_custom_page_title",
        pageDescription: "sv_page_description sv_custom_page_description",
        row: "sv_row sv_custom_row",
        question: {
          root: "sv_q sv_custom_question",
          title: "sv_q_title sv_custom_question_title",
          description: "sv_q_description sv_custom_question_description"
        },
        error: {
          root: "sv_q_erbox sv_custom_error"
        },
        checkbox: {
          root: "sv_qcbc sv_custom_checkbox",
          item: "sv_q_checkbox sv_custom_checkbox_item",
          itemChecked: "sv_q_checkbox_checked sv_custom_checkbox_item_checked",
          itemHover: "sv_q_checkbox_hover sv_custom_checkbox_item_hover",
          label: "sv_q_checkbox_label sv_custom_checkbox_label"
        },
        radiogroup: {
          root: "sv_qcbx sv_custom_radiogroup",
          item: "sv_q_radiogroup sv_custom_radiogroup_item",
          itemChecked: "sv_q_radiogroup_checked sv_custom_radiogroup_item_checked",
          itemHover: "sv_q_radiogroup_hover sv_custom_radiogroup_item_hover",
          label: "sv_q_radiogroup_label sv_custom_radiogroup_label"
        },
        dropdown: {
          root: "sv_q_dropdown sv_custom_dropdown",
          control: "sv_q_dropdown_control sv_custom_dropdown_control",
          selectWrapper: "",
          other: "sv_q_dd_other sv_custom_dropdown_other",
          cleanButton: "sv_q_dropdown_clean-button sv_custom_dropdown_clean_button"
        },
        text: "sv_q_text sv_custom_input",
        panel: {
          title: "sv_p_title sv_custom_panel_title",
          description: "sv_p_description sv_custom_panel_description",
          container: "sv_p_container sv_custom_panel_container"
        }
      };
      
      setSurvey(surveyModel);
    });
  }, []);

  const handleComplete = async (sender) => {
    if (!tripId || !participantId) {
      setError('Invalid survey link. Missing trip or participant identification.');
      return;
    }

    setLoading(true);
    
    try {
      // Send survey results to the API
      const result = await saveSurveyResponse(participantId, sender.data);
      
      if (result.status === 'success') {
        setToast({
          open: true,
          message: 'Your responses have been saved. Thank you!',
          severity: 'success'
        });
        
        // After a short delay, navigate to the next step page
        setTimeout(() => {
          navigate('/next-step', { state: { tripId } });
        }, 3000);
      } else {
        throw new Error('Failed to save survey responses');
      }
    } catch (error) {
      setError(`Failed to save your responses: ${error.message}`);
      setToast({
        open: true,
        message: `Failed to save responses: ${error.message}`,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCloseToast = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setToast(prev => ({ ...prev, open: false }));
  };

  // Calculate progress percentage
  const progressPercentage = totalPages > 0 ? (currentPage / totalPages) * 100 : 0;

  // If there's no tripId or participantId in the URL, show an error
  if (!tripId || !participantId) {
    return (
      <div className="landing-page">
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
          <Paper elevation={3} sx={{ p: 4, textAlign: 'center', borderRadius: 3 }}>
            <Typography variant="h6" color="error" gutterBottom>
              Invalid survey link. Please check your link and try again.
            </Typography>
            <Button 
              variant="contained" 
              onClick={() => navigate('/')}
              className="primary-button"
              sx={{ mt: 2 }}
            >
              Go to Homepage
            </Button>
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
  }

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
          {error && (
            <Alert severity="error" sx={{ mb: 4 }}>
              {error}
            </Alert>
          )}

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
            <LinearProgress 
              variant="determinate" 
              value={progressPercentage} 
              sx={{ 
                height: 8, 
                borderRadius: 4,
                backgroundColor: 'rgba(0, 0, 0, 0.1)',
                '& .MuiLinearProgress-bar': {
                  backgroundColor: 'var(--color-primary, #4263eb)'
                }
              }} 
            />
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
          <Box className="survey-wrapper">
            {survey && (
              <Survey
                model={survey}
                onComplete={handleComplete}
                css={{ root: "survey-custom" }}
              />
            )}
            {loading && (
              <Box sx={{ width: '100%', mt: 4 }}>
                <LinearProgress />
              </Box>
            )}
          </Box>
        </Paper>
      </Container>

      {/* Toast notification */}
      <Snackbar
        open={toast.open}
        autoHideDuration={6000}
        onClose={handleCloseToast}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseToast}
          severity={toast.severity}
          sx={{ width: '100%' }}
        >
          {toast.message}
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

export default TripSurvey; 