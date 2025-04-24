import React from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  Button, 
  Grid, 
  Card, 
  CardContent,
  AppBar,
  Toolbar,
  Link,
  Avatar
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import LinkIcon from '@mui/icons-material/Link';
import QuestionAnswerIcon from '@mui/icons-material/QuestionAnswer';
import ExploreIcon from '@mui/icons-material/Explore';
import HowToVoteIcon from '@mui/icons-material/HowToVote';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import PhoneIphoneIcon from '@mui/icons-material/PhoneIphone';
import LightbulbIcon from '@mui/icons-material/Lightbulb';

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <Box>
      {/* Navigation */}
      <AppBar position="fixed" color="transparent" elevation={0} sx={{ bgcolor: 'white' }}>
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Typography variant="h6" component="div" sx={{ color: '#6366F1', fontWeight: 600 }}>
            Group Travel AI
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Link href="/docs" color="inherit" underline="none">Docs</Link>
            <Link href="/donate" color="inherit" underline="none">Donate</Link>
            <Button 
              variant="contained" 
              onClick={() => navigate('/create-trip')}
              sx={{ 
                bgcolor: '#6366F1',
                '&:hover': { bgcolor: '#5558DD' }
              }}
            >
              Start a Trip
            </Button>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Hero Section */}
      <Container maxWidth="lg" sx={{ mt: 12, mb: 8, pt: 4, bgcolor: '#F8FAFC' }}>
        <Grid container spacing={6} alignItems="center">
          <Grid item xs={12} md={6}>
            <Typography variant="h2" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
              Where should we go?
            </Typography>
            <Typography variant="h6" color="text.secondary" paragraph sx={{ mb: 4 }}>
              AI-powered planning that picks the perfect destination for your crew in minutes.
            </Typography>
            <Button
              variant="contained"
              size="large"
              endIcon={<ArrowForwardIcon />}
              onClick={() => navigate('/create-trip')}
              sx={{ 
                bgcolor: '#6366F1',
                '&:hover': { bgcolor: '#5558DD' },
                px: 4,
                py: 1.5
              }}
            >
              Start a Trip
            </Button>
          </Grid>
          <Grid item xs={12} md={6}>
            <Box 
              component="img" 
              src="https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80" 
              alt="Group of friends planning travel together" 
              sx={{ 
                width: '100%',
                borderRadius: 2,
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
              }} 
            />
          </Grid>
        </Grid>
      </Container>

      {/* How it Works */}
      <Container maxWidth="lg" sx={{ py: 8, bgcolor: '#FFFFFF' }}>
        <Typography variant="h3" component="h2" align="center" gutterBottom sx={{ mb: 6, fontWeight: 600 }}>
          How it Works
        </Typography>
        <Grid container spacing={4}>
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Box sx={{ 
                bgcolor: '#EEF2FF', 
                width: 64, 
                height: 64, 
                borderRadius: '50%', 
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto',
                mb: 2
              }}>
                <LinkIcon sx={{ color: '#6366F1', fontSize: 32 }} />
              </Box>
              <Typography variant="h6" gutterBottom>1. Create a trip link</Typography>
              <Typography color="text.secondary">Start your adventure with one click</Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Box sx={{ 
                bgcolor: '#EEF2FF', 
                width: 64, 
                height: 64, 
                borderRadius: '50%', 
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto',
                mb: 2
              }}>
                <QuestionAnswerIcon sx={{ color: '#6366F1', fontSize: 32 }} />
              </Box>
              <Typography variant="h6" gutterBottom>2. Friends fill one quick questionnaire</Typography>
              <Typography color="text.secondary">Quick preferences from everyone</Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Box sx={{ 
                bgcolor: '#EEF2FF', 
                width: 64, 
                height: 64, 
                borderRadius: '50%', 
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto',
                mb: 2
              }}>
                <ExploreIcon sx={{ color: '#6366F1', fontSize: 32 }} />
              </Box>
              <Typography variant="h6" gutterBottom>3. AI suggests 3 perfect destinations</Typography>
              <Typography color="text.secondary">Matched to your group's needs</Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Box sx={{ 
                bgcolor: '#EEF2FF', 
                width: 64, 
                height: 64, 
                borderRadius: '50%', 
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto',
                mb: 2
              }}>
                <HowToVoteIcon sx={{ color: '#6366F1', fontSize: 32 }} />
              </Box>
              <Typography variant="h6" gutterBottom>4. Vote and book</Typography>
              <Typography color="text.secondary">Democracy wins!</Typography>
            </Box>
          </Grid>
        </Grid>
      </Container>

      {/* Features */}
      <Container maxWidth="lg" sx={{ py: 4, bgcolor: '#F8FAFC' }}>
        <Grid container spacing={4} justifyContent="center">
          <Grid item xs={12} sm={4}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <AccessTimeIcon sx={{ color: '#6366F1' }} />
              <Typography>Saves weeks of back-and-forth</Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <AccountBalanceWalletIcon sx={{ color: '#6366F1' }} />
              <Typography>Aligns budgets & vibes</Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <PhoneIphoneIcon sx={{ color: '#6366F1' }} />
              <Typography>No app download required</Typography>
            </Box>
          </Grid>
        </Grid>
      </Container>

      {/* Testimonials */}
      <Container maxWidth="lg" sx={{ py: 8, bgcolor: '#FFFFFF' }}>
        <Typography variant="h3" component="h2" align="center" gutterBottom sx={{ mb: 6, fontWeight: 600 }}>
          What Travelers Say
        </Typography>
        <Grid container spacing={4}>
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%', boxShadow: 'none', border: '1px solid #E0E0E0' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ mr: 2 }}>SK</Avatar>
                  <Typography variant="subtitle1">Sarah K.</Typography>
                </Box>
                <Typography variant="body1" color="text.secondary">
                  "Booked Bali in one night! Our group of 6 had different budgets but AI made it work."
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%', boxShadow: 'none', border: '1px solid #E0E0E0' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ mr: 2 }}>MR</Avatar>
                  <Typography variant="subtitle1">Mike R.</Typography>
                </Box>
                <Typography variant="body1" color="text.secondary">
                  "Perfect for our bachelor party planning. Saved us so much time and drama"
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%', boxShadow: 'none', border: '1px solid #E0E0E0' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ mr: 2 }}>ET</Avatar>
                  <Typography variant="subtitle1">Emma T.</Typography>
                </Box>
                <Typography variant="body1" color="text.secondary">
                  "Found an amazing hidden gem in Croatia that pleased everyone in our group."
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>

      {/* Footer */}
      <Box sx={{ bgcolor: '#6366F1', color: 'white', py: 3, mt: 8 }}>
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2, mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <LightbulbIcon />
              <Typography>Keep the API lights on</Typography>
            </Box>
            <Button 
              variant="contained" 
              sx={{ 
                bgcolor: 'white',
                color: '#6366F1',
                '&:hover': { bgcolor: '#f5f5f5' }
              }}
            >
              Donate
            </Button>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3 }}>
            <Link href="/privacy" color="inherit" underline="hover">Privacy</Link>
            <Link href="/contact" color="inherit" underline="hover">Contact</Link>
          </Box>
          <Typography align="center" sx={{ mt: 2, fontSize: '0.875rem' }}>
            Made for group travel lovers
          </Typography>
        </Container>
      </Box>
    </Box>
  );
};

export default LandingPage; 