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
  Grid,
  Avatar,
  LinearProgress
} from '@mui/material';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import ShareIcon from '@mui/icons-material/Share';
import MessageIcon from '@mui/icons-material/Message';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import '../styles/DashboardPage.css';
import '../styles/LandingPage.css';

const DashboardPage = () => {
  const navigate = useNavigate();
  
  const tripData = {
    title: 'Summer Group Trip 2025',
    progress: {
      completed: 3,
      total: 6
    },
    participants: [
      { id: 1, name: 'Mike Thompson', image: 'https://i.pravatar.cc/150?img=1', responded: false },
      { id: 2, name: 'Sarah Wilson', image: 'https://i.pravatar.cc/150?img=2', responded: false },
      { id: 3, name: 'Emma Davis', image: 'https://i.pravatar.cc/150?img=3', responded: true }
    ],
    budget: {
      amount: 1200,
      currency: 'USD'
    },
    dateRange: {
      start: 'July 15',
      end: '22, 2025',
      window: '7 days window'
    },
    vibes: ['Beach & chill', 'Foodie', 'Culture/sightseeing']
  };

  const handleResendSMS = (participantId) => {
    console.log('Resending SMS to participant:', participantId);
    // TODO: Implement SMS resend functionality
  };

  const handleGetAIDestinations = () => {
    navigate('/recommendations');
  };

  const progress = (tripData.progress.completed / tripData.progress.total) * 100;

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
        <Box className="dashboard-content">
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h4" component="h1">{tripData.title}</Typography>
            <Button startIcon={<ShareIcon />} variant="outlined">
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
                    <Avatar src={participant.image} alt={participant.name} />
                    <Typography sx={{ ml: 2 }}>{participant.name}</Typography>
                  </Box>
                  <Button 
                    startIcon={<MessageIcon />} 
                    variant="outlined"
                    size="small"
                    onClick={() => handleResendSMS(participant.id)}
                  >
                    Resend SMS
                  </Button>
                </Box>
              ))}
            </Box>
          </Paper>

          <Box sx={{ textAlign: 'center' }}>
            <Button 
              variant="contained"
              startIcon={<AutoAwesomeIcon />}
              onClick={handleGetAIDestinations}
              className="primary-button"
              size="large"
              sx={{ mb: 1 }}
            >
              Get AI Destination Picks
            </Button>
            <Typography variant="body2" color="text.secondary">
              Enabled when 50% or more have responded
            </Typography>
          </Box>
        </Box>
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

export default DashboardPage; 