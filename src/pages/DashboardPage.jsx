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
  Grid,
  Avatar,
  LinearProgress,
  CircularProgress,
  Snackbar,
  Alert,
  Chip,
  Card
} from '@mui/material';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import MessageIcon from '@mui/icons-material/Message';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import WarningIcon from '@mui/icons-material/Warning';
import { getTripDetails, sendSMS, calculateSurveyStats } from '../utils/api';
import '../styles/DashboardPage.css';
import '../styles/LandingPage.css';

const DashboardPage = () => {
  const navigate = useNavigate();
  const { tripId } = useParams();
  
  const [tripData, setTripData] = useState({
    title: 'Loading...',
    progress: {
      completed: 0,
      total: 1
    },
    participants: [],
    respondedParticipants: [],
    organizer: null,
    budget: {
      amount: 0,
      currency: 'USD'
    },
    dateRange: {
      start: '',
      end: '',
      window: ''
    },
    vibes: [],
    totalResponses: 0,
    overlappingRanges: []
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sendingState, setSendingState] = useState({});
  const [toast, setToast] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  useEffect(() => {
    // Fetch trip data when component mounts
    const fetchTripData = async () => {
      if (!tripId) {
        setError('No trip ID provided');
        setLoading(false);
        return;
      }
      
      try {
        const data = await getTripDetails(tripId);
        
        // Check if we have survey responses
        if (!data.survey_responses || data.survey_responses.length === 0) {
          console.log('No survey responses found for trip:', tripId);
        } else {
          console.log(`Found ${data.survey_responses.length} survey responses for trip:`, tripId);
        }
        
        // Calculate statistics from survey responses
        const stats = calculateSurveyStats(data.survey_responses || []);
        
        // Process the data for display in the dashboard
        const processedData = {
          id: data.id,
          title: data.trip_name,
          progress: {
            completed: data.participants.filter(p => p.responded || p.has_responded).length,
            total: data.participants.length
          },
          participants: data.participants.filter(p => !(p.responded || p.has_responded)),
          respondedParticipants: data.participants.filter(p => p.responded || p.has_responded),
          organizer: data.participants.find(p => p.is_organizer),
          budget: {
            amount: stats.medianBudget,
            currency: 'USD'
          },
          dateRange: stats.dateRange.start ? {
            start: stats.dateRange.start.toLocaleDateString('en-US', { month: 'long', day: 'numeric' }),
            end: stats.dateRange.end.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
            window: `${stats.dateRange.window} days window`
          } : {
            start: 'Not available',
            end: 'Not available',
            window: 'Not available'
          },
          overlappingRanges: stats.overlappingRanges ? stats.overlappingRanges.map(range => ({
            start: range.start.toLocaleDateString('en-US', { month: 'long', day: 'numeric' }),
            end: range.end.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
            days: Math.ceil((range.end - range.start) / (1000 * 60 * 60 * 24))
          })) : [],
          vibes: stats.commonVibes,
          totalResponses: stats.totalResponses
        };
        
        setTripData(processedData);
      } catch (error) {
        setError('Failed to load trip data: ' + error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTripData();
  }, [tripId]);

  const handleResendSMS = async (participantId) => {
    setSendingState(prev => ({ ...prev, [participantId]: true }));
    
    try {
      const result = await sendSMS(participantId);
      
      if (result.status === 'sent' || result.status === 'simulated') {
        setToast({
          open: true,
          message: 'Reminder SMS sent successfully',
          severity: 'success'
        });
      } else {
        throw new Error(result.error || 'Failed to send SMS');
      }
    } catch (error) {
      setToast({
        open: true,
        message: `Failed to send SMS: ${error.message}`,
        severity: 'error'
      });
    } finally {
      setSendingState(prev => ({ ...prev, [participantId]: false }));
    }
  };

  const handleGetAIDestinations = () => {
    navigate('/recommendations');
  };

  const handleCloseToast = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setToast(prev => ({ ...prev, open: false }));
  };


  // Calculate progress percentage
  const progress = tripData.progress && tripData.progress.total > 0 ? 
    (tripData.progress.completed / tripData.progress.total) * 100 : 0;
  
  // Determine if enough participants have responded to enable AI recommendations
  const canGenerateRecommendations = progress >= 50;

  if (loading) {
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

        <Container sx={{ pt: 12, pb: 8, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          <CircularProgress />
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

      <Container sx={{ pt: 12, pb: 8 }} maxWidth="lg">
        {error && (
          <Alert severity="error" sx={{ mb: 4 }}>
            {error}
          </Alert>
        )}
        
        <Grid container spacing={4}>
          {/* Trip Title and Progress */}
          <Grid item xs={12}>
            <Paper elevation={0} sx={{ p: 3, bgcolor: 'background.paper' }}>
              <Typography variant="h4" gutterBottom>
                {tripData.title}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Typography variant="body1" color="text.secondary">
                  {tripData.progress.completed} of {tripData.progress.total} participants responded
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={progress} 
                  sx={{ flexGrow: 1, height: 8, borderRadius: 4 }}
                />
              </Box>
            </Paper>
          </Grid>

          {/* Statistics Section */}
          <Grid item xs={12} md={4}>
            <Paper elevation={0} sx={{ p: 3, bgcolor: 'background.paper' }}>
              <Typography variant="h6" gutterBottom>
                Budget
              </Typography>
              <Typography variant="h4" color="primary">
                ${tripData.budget.amount.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {tripData.totalResponses === 0 
                  ? "No budget data available yet"
                  : tripData.totalResponses === 1 
                    ? "Based on 1 response" 
                    : `Average from ${tripData.totalResponses} responses`}
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper elevation={0} sx={{ p: 3, bgcolor: 'background.paper' }}>
              <Typography variant="h6" gutterBottom>
                Trip Dates
              </Typography>
              {tripData.overlappingRanges && tripData.overlappingRanges.length > 0 ? (
                <>
                  <Typography variant="h4" color="primary">
                    {tripData.overlappingRanges[0].start}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    See all available dates in the Dates section below
                  </Typography>
                </>
              ) : (
                <Typography variant="body1" color="text.secondary">
                  {tripData.dateRange.start ? 
                    "No overlapping dates found. See details below." : 
                    "No date preferences yet"}
                </Typography>
              )}
            </Paper>
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper elevation={0} sx={{ p: 3, bgcolor: 'background.paper' }}>
              <Typography variant="h6" gutterBottom>
                Common Vibes
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {tripData.vibes.map((vibe, index) => (
                  <Chip 
                    key={index} 
                    label={vibe} 
                    color="primary" 
                    variant="outlined"
                  />
                ))}
              </Box>
            </Paper>
          </Grid>

          {/* Date Range Card */}
          <Card sx={{ p: 3, mb: 3 }}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="h6" gutterBottom>Dates</Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Available dates after accounting for everyone's preferences and blackout dates
              </Typography>
            </Box>
            {tripData.overlappingRanges && tripData.overlappingRanges.length > 0 ? (
              <Box>
                <Typography variant="body1" color="text.primary" sx={{ fontWeight: 'medium', mb: 1 }}>
                  Overlapping available date ranges:
                </Typography>
                {tripData.overlappingRanges.map((range, index) => (
                  <Box key={index} sx={{ mb: 1, pl: 2, borderLeft: '3px solid', borderColor: 'primary.main' }}>
                    <Typography variant="body1">
                      {range.start} to {range.end} ({range.days} days)
                    </Typography>
                  </Box>
                ))}
              </Box>
            ) : (
              <Box sx={{ color: 'text.secondary' }}>
                <WarningIcon color="warning" sx={{ verticalAlign: 'middle', mr: 1 }} />
                <Typography variant="body2" display="inline">
                  No overlapping dates found that work for everyone. Try adjusting preferences or blackout dates.
                </Typography>
              </Box>
            )}
          </Card>

          {tripData.participants.length > 0 ? (
            <Grid item xs={12}>
              <Paper elevation={2} sx={{ p: 3, borderRadius: 3, mb: 4 }}>
                <Typography variant="h6" component="h2" gutterBottom>
                  Waiting on responses from...
                </Typography>
                
                <Box sx={{ mt: 2 }}>
                  {tripData.participants.map(participant => (
                    <Box key={participant.id} sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      py: 1.5,
                      borderBottom: '1px solid',
                      borderColor: 'divider'
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar src={participant.image || `https://i.pravatar.cc/150?u=${participant.id}`} alt={participant.name} />
                        <Typography sx={{ ml: 2 }}>{participant.name}</Typography>
                      </Box>
                      <Button 
                        startIcon={sendingState[participant.id] ? 
                          <CircularProgress size={16} color="inherit" /> : 
                          <MessageIcon />
                        } 
                        variant="outlined"
                        size="small"
                        onClick={() => handleResendSMS(participant.id)}
                        disabled={sendingState[participant.id]}
                      >
                        {sendingState[participant.id] ? 'Sending...' : 'Resend SMS'}
                      </Button>
                    </Box>
                  ))}
                </Box>
              </Paper>
            </Grid>
          ) : (
            <Grid item xs={12}>
              <Paper elevation={2} sx={{ p: 3, borderRadius: 3, mb: 4, textAlign: 'center' }}>
                <Typography variant="h6" component="h2" gutterBottom>
                  All participants have responded!
                </Typography>
                <Typography color="text.secondary">
                  Everyone has completed their survey. You're ready to proceed with trip planning.
                </Typography>
              </Paper>
            </Grid>
          )}

          <Grid item xs={12} sx={{ textAlign: 'center' }}>
            <Button 
              variant="contained"
              startIcon={<AutoAwesomeIcon />}
              onClick={handleGetAIDestinations}
              className="primary-button"
              size="large"
              sx={{ mb: 1 }}
              disabled={!canGenerateRecommendations}
            >
              Get AI Destination Picks
            </Button>
            <Typography variant="body2" color="text.secondary">
              {canGenerateRecommendations ? 
                'Ready to generate recommendations!' : 
                'Enabled when 50% or more have responded'}
            </Typography>
          </Grid>
        </Grid>
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

export default DashboardPage; 