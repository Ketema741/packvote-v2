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
} from '@mui/material';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import MessageIcon from '@mui/icons-material/Message';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import WarningIcon from '@mui/icons-material/Warning';
import { getTripDetails, sendSMS, calculateSurveyStats, generateTravelRecommendations } from '../utils/api';
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
  const [generatingRecommendations, setGeneratingRecommendations] = useState(false);

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
          console.log('Raw survey responses:', data.survey_responses);
        }
        
        // Calculate statistics from survey responses
        const stats = calculateSurveyStats(data.survey_responses || []);
        console.log('Calculated stats:', stats);
        
        // Process the data for display in the dashboard
        const processedData = {
          id: data.id,
          title: data.trip_name,
          progress: {
            completed: data.participants.filter(p => p.responded || p.has_responded).length,
            total: data.participants.length
          },
          participants: data.participants.filter(p => !(p.responded || p.has_responded)),
          respondedParticipants: data.participants
            .filter(p => p.responded || p.has_responded)
            .map(p => {
              // Find this participant's survey response
              const response = data.survey_responses?.find(r => r.user_id === p.id);
              console.log(`Processing participant ${p.name}, found response:`, response);
              
              // Add preferred dates to participant data if available
              if (response) {
                let preferredDates = [];
                
                if (Array.isArray(response.preferred_dates)) {
                  preferredDates = response.preferred_dates;
                } else if (typeof response.preferred_dates === 'string') {
                  preferredDates = response.preferred_dates.split(';');
                }
                
                // Process vibe choices
                let vibeChoices = [];
                if (Array.isArray(response.vibe_choices)) {
                  vibeChoices = response.vibe_choices;
                } else if (typeof response.vibe_choices === 'string' && response.vibe_choices) {
                  vibeChoices = response.vibe_choices.split(';');
                }
                
                console.log(`Participant ${p.name} has vibes:`, vibeChoices);
                
                return {
                  ...p,
                  preferredDates,
                  blackoutDates: Array.isArray(response.blackout_dates) 
                    ? response.blackout_dates 
                    : (response.blackout_dates?.split(';') || []),
                  vibeChoices
                };
              }
              
              return p;
            }),
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
            days: Math.max(1, Math.ceil((range.end - range.start) / (1000 * 60 * 60 * 24)) + 1)
          })) : [],
          vibes: stats.commonVibes || [],
          totalResponses: stats.totalResponses
        };
        
        // Debug overlapping ranges
        console.log('Stats overlapping ranges:', stats.overlappingRanges);
        console.log('Processed overlapping ranges:', processedData.overlappingRanges);
        
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

  const handleGetAIDestinations = async () => {
    try {
      setGeneratingRecommendations(true);
      setToast({
        open: true,
        message: 'Loading destination recommendations...',
        severity: 'info'
      });
      
      // Navigate to AI recommendations page where existing recommendations will be shown if available
      navigate(`/recommendations/${tripId}`, { 
        state: { tripId }
      });
    } catch (error) {
      setToast({
        open: true,
        message: `Failed to load recommendations: ${error.message}`,
        severity: 'error'
      });
    } finally {
      setGeneratingRecommendations(false);
    }
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
  const canGenerateRecommendations = progress >= 66.67;

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
          <Grid item xs={12}>
            <Paper elevation={0} sx={{ p: 4, bgcolor: 'background.paper', borderRadius: 3, mb: 4 }}>
              <Grid container spacing={4}>
                {/* Budget Section */}
                <Grid item xs={12} md={4}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                    <Typography sx={{ fontSize: '1.5rem', fontWeight: 'bold', mb: 1, display: 'flex', alignItems: 'center' }}>
                      <span role="img" aria-label="money" style={{ marginRight: '8px', fontSize: '1.8rem' }}>💰</span>
                      Budget
                    </Typography>
                    <Typography variant="h4" color="primary" sx={{ fontWeight: 'bold', mb: 1 }}>
                      ${tripData.budget.amount.toLocaleString()}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {tripData.totalResponses === 0 
                        ? "No budget data yet"
                        : tripData.totalResponses === 1 
                          ? "From 1 response" 
                          : `Average from ${tripData.totalResponses} responses`}
                    </Typography>
                  </Box>
                </Grid>

                {/* Trip Dates Section */}
                <Grid item xs={12} md={4}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                    <Typography sx={{ fontSize: '1.5rem', fontWeight: 'bold', mb: 1, display: 'flex', alignItems: 'center' }}>
                      <span role="img" aria-label="calendar" style={{ marginRight: '8px', fontSize: '1.8rem' }}>📅</span>
                      Trip Dates
                    </Typography>
                    {Array.isArray(tripData.overlappingRanges) && tripData.overlappingRanges.length > 0 ? (
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        {tripData.overlappingRanges.map((range, index) => (
                          <Box key={index} sx={{ 
                            mb: 1, 
                            px: 2, 
                            py: 1, 
                            borderRadius: 2,
                            bgcolor: 'transparent',
                            border: 'none'
                          }}>
                            <Typography variant="body1" sx={{ fontWeight: 'regular' }}>
                              {range.start} to {range.end.split(',')?.[0]}
                              <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                                ({range.days} {range.days === 1 ? 'day' : 'days'})
                              </Typography>
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                    ) : (
                      <Box sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary' }}>
                        <WarningIcon color="warning" sx={{ mr: 1 }} />
                        <Typography variant="body2">
                          No overlapping dates found
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Grid>

                {/* Trip Vibes Section */}
                <Grid item xs={12} md={4}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                    <Typography sx={{ fontSize: '1.5rem', fontWeight: 'bold', mb: 1, display: 'flex', alignItems: 'center' }}>
                      <span role="img" aria-label="vibes" style={{ marginRight: '8px', fontSize: '1.8rem' }}>✨</span>
                      Trip Vibes
                    </Typography>
                    {tripData.vibes && tripData.vibes.length > 0 ? (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 1 }}>
                        {tripData.vibes.map((vibe, index) => {
                          // Match emojis to common vibe types
                          let emoji = "🌟";
                          if (vibe.toLowerCase().includes("beach")) emoji = "🏖️";
                          else if (vibe.toLowerCase().includes("adventure") || vibe.toLowerCase().includes("outdoor")) emoji = "🏔️";
                          else if (vibe.toLowerCase().includes("culture") || vibe.toLowerCase().includes("sight")) emoji = "🏛️";
                          else if (vibe.toLowerCase().includes("party") || vibe.toLowerCase().includes("night")) emoji = "🎉";
                          else if (vibe.toLowerCase().includes("nature") || vibe.toLowerCase().includes("remote")) emoji = "🌲";
                          else if (vibe.toLowerCase().includes("family")) emoji = "👨‍👩‍👧‍👦";
                          else if (vibe.toLowerCase().includes("wellness") || vibe.toLowerCase().includes("retreat")) emoji = "🧘";
                          else if (vibe.toLowerCase().includes("expedition")) emoji = "🧭";
                          else if (vibe.toLowerCase().includes("food")) emoji = "🍽️";
                          
                          return (
                            <Chip 
                              key={index} 
                              label={<>
                                <span style={{ marginRight: '4px' }}>{emoji}</span> {vibe}
                              </>} 
                              color="primary" 
                              variant="outlined"
                              sx={{ 
                                borderRadius: '16px', 
                                fontWeight: 'medium',
                                px: 1
                              }}
                            />
                          );
                        })}
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No common vibes selected yet
                      </Typography>
                    )}
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          </Grid>

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
                        <Avatar 
                          sx={{ 
                            bgcolor: `hsl(${(participant.id.charCodeAt(0) * 10) % 360}, 70%, 80%)`,
                            color: `hsl(${(participant.id.charCodeAt(0) * 10) % 360}, 80%, 30%)`
                          }}
                        >
                          {(() => {
                            // Use the participant ID to consistently select an icon
                            const travelIcons = ["✈️", "🚗", "🚂", "🚢", "🚁", "🏝️", "🗺️", "🧳", "🚘", "🚠", "🛩️", "🏔️", "🚲"];
                            const iconIndex = Math.abs(participant.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % travelIcons.length;
                            return travelIcons[iconIndex];
                          })()}
                        </Avatar>
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
              disabled={!canGenerateRecommendations || generatingRecommendations}
            >
              {generatingRecommendations ? 'Loading...' : 'View AI Destination Picks'}
            </Button>
            <Typography variant="body2" color="text.secondary">
              {canGenerateRecommendations ? 
                'Ready to view AI destination recommendations!' : 
                'Enabled when at least 2/3 of participants have responded'}
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