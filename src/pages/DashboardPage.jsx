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
  Alert
} from '@mui/material';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import ShareIcon from '@mui/icons-material/Share';
import MessageIcon from '@mui/icons-material/Message';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { getTripDetails, sendSMS } from '../utils/api';
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
    budget: {
      amount: 0,
      currency: 'USD'
    },
    dateRange: {
      start: '',
      end: '',
      window: ''
    },
    vibes: []
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
        
        // Process the data for display in the dashboard
        const processedData = {
          id: data.id,
          title: data.name,
          progress: data.progress,
          participants: data.participants.filter(p => !p.responded),
          respondedParticipants: data.participants.filter(p => p.responded),
          organizer: data.organizer,
          // Use actual survey data if available
          budget: data.budget || {
            amount: 1200,
            currency: 'USD'
          },
          dateRange: data.dateRange || {
            start: 'July 15',
            end: '22, 2025',
            window: '7 days window'
          },
          vibes: data.vibes || ['Beach & chill', 'Foodie', 'Culture/sightseeing']
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

  const handleShareTrip = () => {
    // Redirect to TripLinks page with the current trip data
    navigate('/trip-links', { 
      state: { 
        tripData: {
          tripId: tripData.id,
          organizer: tripData.organizer,
          participants: [...tripData.participants, ...tripData.respondedParticipants]
        } 
      } 
    });
  };

  // Calculate progress percentage
  const progress = tripData.progress ? 
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
        
        <Box className="dashboard-content">
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h4" component="h1">{tripData.title}</Typography>
            <Button 
              startIcon={<ShareIcon />} 
              variant="outlined"
              onClick={handleShareTrip}
            >
              Share
            </Button>
          </Box>

          <Box sx={{ mb: 4 }}>
            <LinearProgress 
              variant="determinate" 
              value={progress} 
              sx={{ 
                height: 10, 
                borderRadius: 5,
                mb: 1
              }} 
            />
            <Typography variant="body2" color="text.secondary">
              {tripData.progress.completed}/{tripData.progress.total} completed
            </Typography>
          </Box>

          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={4}>
              <Paper elevation={2} sx={{ p: 3, borderRadius: 3, height: '100%' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" component="h2" sx={{ ml: 1 }}>
                    <span role="img" aria-label="money">💰</span> Median Budget
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'center', mt: 2 }}>
                  <Typography variant="h3" component="div" color="primary.main">
                    ${tripData.budget.amount}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    per person
                  </Typography>
                </Box>
              </Paper>
            </Grid>

            <Grid item xs={12} md={4}>
              <Paper elevation={2} sx={{ p: 3, borderRadius: 3, height: '100%' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" component="h2" sx={{ ml: 1 }}>
                    <span role="img" aria-label="calendar">📅</span> Date Overlap
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'center', mt: 2 }}>
                  <Typography variant="h5" component="div">
                    {tripData.dateRange.start}-{tripData.dateRange.end}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {tripData.dateRange.window}
                  </Typography>
                </Box>
              </Paper>
            </Grid>

            <Grid item xs={12} md={4}>
              <Paper elevation={2} sx={{ p: 3, borderRadius: 3, height: '100%' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" component="h2" sx={{ ml: 1 }}>
                    <span role="img" aria-label="sparkles">✨</span> Top Vibe Picks
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center', mt: 2 }}>
                  {tripData.vibes.map((vibe, index) => (
                    <Box key={index} sx={{ 
                      bgcolor: 'background.paper', 
                      borderRadius: 2, 
                      px: 2, 
                      py: 0.5, 
                      border: '1px solid',
                      borderColor: 'primary.light'
                    }}>
                      {vibe}
                    </Box>
                  ))}
                </Box>
              </Paper>
            </Grid>
          </Grid>

          {tripData.participants.length > 0 ? (
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
          ) : (
            <Paper elevation={2} sx={{ p: 3, borderRadius: 3, mb: 4, textAlign: 'center' }}>
              <Typography variant="h6" component="h2" gutterBottom>
                All participants have responded!
              </Typography>
              <Typography color="text.secondary">
                Everyone has completed their survey. You're ready to proceed with trip planning.
              </Typography>
            </Paper>
          )}

          <Box sx={{ textAlign: 'center' }}>
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
          </Box>
        </Box>
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