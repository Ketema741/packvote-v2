import React, { useState, useEffect, useCallback } from 'react';
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
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
  Tooltip,
} from '@mui/material';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import MessageIcon from '@mui/icons-material/Message';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import WarningIcon from '@mui/icons-material/Warning';
import HowToVoteIcon from '@mui/icons-material/HowToVote';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CelebrationIcon from '@mui/icons-material/Celebration';
import { getTripDetails, sendSMS, calculateSurveyStats, generateTravelRecommendations, getVotes, getTravelRecommendations } from '../utils/api';
import { safeLog } from '../utils/loggingSanitizer';
import '../styles/DashboardPage.css';
import '../styles/LandingPage.css';

/*
 * TODO: Break this large component (999 lines) into smaller, manageable components:
 * - TripProgressCard: Display trip progress and participant status
 * - ParticipantsList: Handle participant list with SMS functionality
 * - TripStatsCard: Display budget, dates, and vibes statistics
 * - VotingStatusCard: Handle voting status and countdown timer
 * - RecommendationsCard: Handle AI recommendations generation
 * - TripActionsBar: Handle navigation and main actions
 * 
 * TODO: Implement state management (Context/Redux) for trip data
 * TODO: Add proper error boundaries for component isolation
 * TODO: Implement lazy loading for better performance
 * TODO: Add skeleton loading states for better UX
 */

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
  
  // Added state for vote tracking
  const [votingStarted, setVotingStarted] = useState(false);
  const [votedParticipants, setVotedParticipants] = useState([]);
  const [pendingVoters, setPendingVoters] = useState([]);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [votingDeadline, setVotingDeadline] = useState(null);

  // Check for votes if not found in the initial response
  const checkForVotes = useCallback(async (tripId) => {
    try {
      const votesData = await getVotes(tripId);
      
      // Check if we have votes
      const hasVotes = votesData && votesData.votes && votesData.votes.length > 0;
      
      if (hasVotes) {
        setVotingStarted(true);
        
        // Process who has voted and who hasn't
        const votedUserIds = new Set(votesData.votes.map(vote => vote.user_id));
        
        // Only access the current tripData through the currentTripData parameter
        return { hasVotes, votedUserIds };
      }
      
      return { hasVotes: false, votedUserIds: new Set() };
    } catch (error) {
      safeLog.error('Error checking for votes:', error);
      return { hasVotes: false, votedUserIds: new Set() };
    }
  }, []); // No dependencies needed now

  useEffect(() => {
    // Define a single function that fetches everything
    const loadTripDataAndVotes = async () => {
      if (!tripId) {
        setError('No trip ID provided');
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        
        // Get trip details
        const data = await getTripDetails(tripId);
        
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
          respondedParticipants: data.participants
            .filter(p => p.responded || p.has_responded)
            .map(p => {
              // Find this participant's survey response
              const response = data.survey_responses?.find(r => r.user_id === p.id);
              
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
        
        setTripData(processedData);
        
        // Get and process voting data 
        let hasVotes = data.votes && data.votes.length > 0;
        let votedUserIds = new Set();
        
        if (hasVotes) {
          votedUserIds = new Set(data.votes.map(vote => vote.user_id));
        } else {
          // If no votes in trip details, try separate API call
          const voteResult = await checkForVotes(tripId);
          hasVotes = voteResult.hasVotes;
          votedUserIds = voteResult.votedUserIds;
        }
        
        // Set voting status based on results
        setVotingStarted(hasVotes);
        
        if (hasVotes) {
          // Record voting deadline if present
          if (data.voting_deadline) {
            const deadline = new Date(data.voting_deadline);
            setVotingDeadline(deadline);
            
            // Calculate time remaining for voting
            const now = new Date();
            const remaining = deadline - now;
            if (remaining > 0) {
              setTimeRemaining(remaining);
              
              // Set up timer to update remaining time
              const timer = setInterval(() => {
                setTimeRemaining(prev => {
                  if (prev <= 1000) {
                    clearInterval(timer);
                    return 0;
                  }
                  return prev - 1000;
                });
              }, 1000);
              
              // Clean up timer on unmount
              return () => clearInterval(timer);
            } else {
              setTimeRemaining(0);
            }
          }
          
          // Get participants who have completed the survey and are eligible to vote
          const eligibleVoters = processedData.respondedParticipants || [];
          
          if (eligibleVoters.length > 0) {
            // Filter out who has voted and who hasn't
            const voted = eligibleVoters.filter(p => votedUserIds.has(p.id));
            const pending = eligibleVoters.filter(p => !votedUserIds.has(p.id));
            
            setVotedParticipants(voted);
            setPendingVoters(pending);
          } else {
            setVotedParticipants([]);
            setPendingVoters([]);
          }
        }
      } catch (error) {
        safeLog.error('Error loading trip data:', error);
        setError('Failed to load trip data: ' + error.message);
      } finally {
        setLoading(false);
      }
    };

    // Execute once when component mounts
    loadTripDataAndVotes();
    
    // Clean up function to handle any timers
    return () => {
      // Any cleanup needed
    };
  }, [tripId, checkForVotes]); // Only depend on tripId and the stable checkForVotes function

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
      
      // Get trip data to check if it needs regeneration
      const tripDetails = await getTripDetails(tripId);
      
      const hasRecentRecommendations = tripDetails.has_recommendations === true;
      
      // Get regenerations count directly from the API response
      // This ensures we're always using the most up-to-date value
      const regenerationsRemaining = tripDetails.regenerations_remaining !== undefined 
        ? parseInt(tripDetails.regenerations_remaining, 10) 
        : 3; // Default to 3 if not specified
      
      if (!hasRecentRecommendations) {
        // Only generate if needed
        setToast({
          open: true,
          message: 'Generating new destination recommendations (this could take a few minutes)...',
          severity: 'info'
        });
        
        // Generate recommendations
        const generatedRecs = await generateTravelRecommendations(tripId);
        
        // Verify we got valid recommendations back
        if (!generatedRecs || !generatedRecs.recommendations) {
          setToast({
            open: true,
            message: 'Failed to generate recommendations. Please try again.',
            severity: 'error'
          });
          setGeneratingRecommendations(false);
          return;
        }
        
        // Navigate to AI recommendations page where existing recommendations will be shown if available
        navigate(`/recommendations/${tripId}`, { 
          state: { 
            tripId,
            fromDashboard: true,
            regenerationsRemaining,
            timestamp: Date.now() // Add a timestamp to force refresh
          }
        });
      } else {
        setToast({
          open: true,
          message: 'Loading destination recommendations...',
          severity: 'info'
        });
        
        // Navigate to AI recommendations page where existing recommendations will be shown
        navigate(`/recommendations/${tripId}`, { 
          state: { 
            tripId,
            fromDashboard: true,
            regenerationsRemaining,
            timestamp: Date.now() // Add a timestamp to force refresh
          }
        });
      }
    } catch (error) {
      safeLog.error('Error in handleGetAIDestinations:', error);
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

  // Format time remaining as readable string
  const formatTimeRemaining = (milliseconds) => {
    if (!milliseconds || milliseconds <= 0) return 'Voting ended';
    
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) {
      return `${days}d ${hours % 24}h remaining`;
    } else if (hours > 0) {
      return `${hours}h ${minutes % 60}m remaining`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s remaining`;
    } else {
      return `${seconds}s remaining`;
    }
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

          {/* Voting Status Section - Only shown if voting has started */}
          {votingStarted && (
            <Grid item xs={12}>
              <Paper elevation={2} sx={{ p: 3, borderRadius: 3, mb: 4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" component="h2" gutterBottom sx={{ mb: 0 }}>
                    <HowToVoteIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Voting Status
                  </Typography>
                  
                  {votingDeadline && (
                    <Tooltip title={`Voting deadline: ${votingDeadline.toLocaleString()}`}>
                      <Chip
                        icon={<AccessTimeIcon />}
                        label={timeRemaining !== null ? formatTimeRemaining(timeRemaining) : "Voting in progress"}
                        color={timeRemaining && timeRemaining <= 3600000 ? "warning" : "primary"}  // Show warning color if less than 1 hour
                        sx={{ fontWeight: 'medium' }}
                      />
                    </Tooltip>
                  )}
                  
                  {!votingDeadline && timeRemaining !== null && (
                    <Chip
                      icon={<AccessTimeIcon />}
                      label={formatTimeRemaining(timeRemaining)}
                      color={timeRemaining <= 3600000 ? "warning" : "primary"}  // Show warning color if less than 1 hour
                      sx={{ fontWeight: 'medium' }}
                    />
                  )}
                </Box>
                
                <Divider sx={{ mb: 2 }} />
                
                <Grid container spacing={3}>
                  {/* Voted Participants */}
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'medium', color: 'success.main', display: 'flex', alignItems: 'center' }}>
                      <CheckCircleIcon sx={{ mr: 0.5 }} fontSize="small" />
                      Votes Submitted ({votedParticipants ? votedParticipants.length : 0})
                    </Typography>
                    
                    <List dense sx={{ bgcolor: 'background.paper' }}>
                      {votedParticipants && votedParticipants.length > 0 ? (
                        votedParticipants.map((participant) => (
                          <ListItem key={participant.id}>
                            <ListItemAvatar>
                              <Avatar 
                                sx={{ 
                                  bgcolor: `hsl(${(participant.id.charCodeAt(0) * 10) % 360}, 70%, 80%)`,
                                  color: `hsl(${(participant.id.charCodeAt(0) * 10) % 360}, 80%, 30%)`
                                }}
                              >
                                {(() => {
                                  const travelIcons = ["✈️", "🚗", "🚂", "🚢", "🚁", "🏝️", "🗺️", "🧳", "🚘", "🚠", "🛩️", "🏔️", "🚲"];
                                  const iconIndex = Math.abs(participant.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % travelIcons.length;
                                  return travelIcons[iconIndex];
                                })()}
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText 
                              primary={participant.name} 
                              secondary="Vote submitted"
                            />
                          </ListItem>
                        ))
                      ) : (
                        <Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
                          No votes submitted yet
                        </Typography>
                      )}
                    </List>
                  </Grid>
                  
                  {/* Pending Voters */}
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'medium', color: 'warning.main', display: 'flex', alignItems: 'center' }}>
                      <AccessTimeIcon sx={{ mr: 0.5 }} fontSize="small" />
                      Waiting on Votes ({pendingVoters ? pendingVoters.length : 0})
                    </Typography>
                    
                    <List dense sx={{ bgcolor: 'background.paper' }}>
                      {pendingVoters && pendingVoters.length > 0 ? (
                        pendingVoters.map((participant) => (
                          <ListItem key={participant.id}>
                            <ListItemAvatar>
                              <Avatar 
                                sx={{ 
                                  bgcolor: `hsl(${(participant.id.charCodeAt(0) * 10) % 360}, 70%, 80%)`,
                                  color: `hsl(${(participant.id.charCodeAt(0) * 10) % 360}, 80%, 30%)`
                                }}
                              >
                                {(() => {
                                  const travelIcons = ["✈️", "🚗", "🚂", "🚢", "🚁", "🏝️", "🗺️", "🧳", "🚘", "🚠", "🛩️", "🏔️", "🚲"];
                                  const iconIndex = Math.abs(participant.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % travelIcons.length;
                                  return travelIcons[iconIndex];
                                })()}
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText 
                              primary={participant.name} 
                              secondary="Vote pending"
                            />
                          </ListItem>
                        ))
                      ) : (
                        <Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
                          Everyone has voted!
                        </Typography>
                      )}
                    </List>
                  </Grid>
                </Grid>
                
                {pendingVoters.length === 0 ? (
                  <Box sx={{ textAlign: 'center', mt: 2 }}>
                    <Button 
                      variant="contained" 
                      color="primary"
                      onClick={() => navigate(`/winner/${tripId}`)}
                      startIcon={<CelebrationIcon />}
                    >
                      View Final Results
                    </Button>
                  </Box>
                ) : (
                  <Box sx={{ textAlign: 'center', mt: 2 }}>
                    <Button 
                      variant="contained" 
                      color="primary"
                      onClick={async () => {
                        try {
                          setToast({
                            open: true,
                            message: 'Loading voting page...',
                            severity: 'info'
                          });
                          
                          // Fetch recommendations
                          const result = await getTravelRecommendations(tripId);
                          console.log('Recommendations for voting:', result);
                          
                          if (result && result.recommendations && result.recommendations.length > 0) {
                            // Sort recommendations by timestamp (newest first)
                            const sortedRecommendations = [...result.recommendations];
                            
                            if (sortedRecommendations[0] && sortedRecommendations[0].created_at) {
                              sortedRecommendations.sort((a, b) => {
                                const dateA = new Date(a.created_at || 0);
                                const dateB = new Date(b.created_at || 0);
                                return dateB - dateA;
                              });
                              console.log('Sorted recommendations by timestamp, newest first');
                            }
                            
                            // Take the 3 most recent recommendations - exactly like AIRecommendationsPage does
                            const mostRecentRecs = sortedRecommendations.slice(0, 3);
                            console.log(`Using the ${mostRecentRecs.length} most recent recommendations`);
                            
                            // Filter out recommendations without IDs
                            const validRecs = mostRecentRecs.filter(rec => rec && rec.id);
                            
                            if (validRecs.length < mostRecentRecs.length) {
                              console.warn(`Filtered out ${mostRecentRecs.length - validRecs.length} recommendations with missing IDs`);
                            }
                            
                            // Log what we're sending
                            console.log(`Selected ${validRecs.length} recommendations for voting`);
                            validRecs.forEach((rec, index) => {
                              console.log(`Recommendation ${index + 1}: ${rec.city || rec.destination || 'Unknown'} (ID: ${rec.id})`);
                            });
                            
                            // Make sure we have at least 2 recommendations (minimum required for voting)
                            if (validRecs.length < 2) {
                              setToast({
                                open: true,
                                message: `Not enough valid recommendations found. Only ${validRecs.length} available.`,
                                severity: 'error'
                              });
                              return;
                            }
                            
                            // Navigate with our valid recommendations
                            navigate(`/voting/${tripId}`, {
                              state: {
                                tripId: tripId,
                                recommendations: validRecs
                              }
                            });
                          } else {
                            // No recommendations found, navigate without state
                            navigate(`/voting/${tripId}`);
                          }
                        } catch (error) {
                          console.error('Error preparing for voting:', error);
                          // Navigate anyway as fallback
                          navigate(`/voting/${tripId}`);
                        }
                      }}
                      startIcon={<HowToVoteIcon />}
                    >
                      Go to Voting Page
                    </Button>
                  </Box>
                )}
              </Paper>
            </Grid>
          )}

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
            // Only show "All participants have responded!" if voting hasn't started yet
            !votingStarted && (
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
            )
          )}

          <Grid item xs={12} sx={{ textAlign: 'center' }}>
            {!votingStarted && (
              <>
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
              </>
            )}
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