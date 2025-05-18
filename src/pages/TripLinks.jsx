import React, { useState } from 'react';
import {
  Box,
  Typography,
  Container,
  Paper,
  IconButton,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  AppBar,
  Toolbar,
  Link,
  Snackbar,
  Alert,
  CircularProgress
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import MessageIcon from '@mui/icons-material/Message';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import { useNavigate, useLocation } from 'react-router-dom';
import { sendSMS, sendAllSMS } from '../utils/api';
import '../styles/LandingPage.css';

const TripLinks = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const tripData = location.state?.tripData || {
    tripId: null,
    organizerLink: 'No link available',
    participants: []
  };

  // State for UI feedback
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [sendingState, setSendingState] = useState({});

  const handleCopyLink = async (link) => {
    try {
      await navigator.clipboard.writeText(link);
      setToast({
        open: true,
        message: 'Link copied to clipboard',
        severity: 'success'
      });
    } catch (err) {
      setToast({
        open: true,
        message: 'Failed to copy link',
        severity: 'error'
      });
    }
  };

  const handleSendSMS = async (participant) => {
    if (!participant.id) {
      setToast({
        open: true,
        message: 'Cannot send SMS: missing participant ID',
        severity: 'error'
      });
      return;
    }

    setSendingState(prev => ({ ...prev, [participant.id]: true }));
    
    try {
      const result = await sendSMS(participant.id);
      
      if (result.status === 'sent' || result.status === 'simulated') {
        setToast({
          open: true,
          message: `Survey link sent to ${participant.name}`,
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
      setSendingState(prev => ({ ...prev, [participant.id]: false }));
    }
  };

  const handleSendAllSMS = async () => {
    if (!tripData.tripId) {
      setToast({
        open: true,
        message: 'Cannot send SMS: missing trip ID',
        severity: 'error'
      });
      return;
    }

    setLoading(true);
    
    try {
      const result = await sendAllSMS(tripData.tripId);
      
      if (result.status === 'completed') {
        setToast({
          open: true,
          message: 'Survey links sent to all participants',
          severity: 'success'
        });
      } else {
        throw new Error('Failed to send SMS to all participants');
      }
    } catch (error) {
      setToast({
        open: true,
        message: `Failed to send SMS: ${error.message}`,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    navigate('/');
  };

  const handleCloseToast = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setToast(prev => ({ ...prev, open: false }));
  };

  // If no trip data was passed, show an error state
  if (!location.state?.tripData) {
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

        <Container maxWidth="sm" sx={{ pt: 12, pb: 8 }}>
          <Paper elevation={3} sx={{ p: 4, textAlign: 'center', borderRadius: 3 }}>
            <Typography variant="h6" color="error" gutterBottom>
              No trip information available
            </Typography>
            <Button 
              variant="contained" 
              onClick={() => navigate('/create-trip')}
              className="primary-button"
            >
              Create a New Trip
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
            PackVote
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 3 } }}>
            <Link href="/docs" color="text.secondary" underline="none" sx={{ '&:hover': { color: 'text.primary' }, display: { xs: 'none', sm: 'block' } }}>
              Docs
            </Link>
            <Link href="/donate" color="text.secondary" underline="none" sx={{ '&:hover': { color: 'text.primary' } }}>
              Donate
            </Link>
            <Button 
              variant="contained" 
              onClick={() => navigate('/create-trip')}
              className="primary-button"
              size="small"
            >
              Start a Trip
            </Button>
          </Box>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ pt: 10, pb: 4 }}>
        <Paper
          elevation={3}
          sx={{
            position: 'relative',
            p: 2,
            borderRadius: 2,
          }}
        >
          <IconButton
            onClick={handleClose}
            sx={{
              position: 'absolute',
              right: 4,
              top: 4,
            }}
            size="small"
          >
            <CloseIcon fontSize="small" />
          </IconButton>

          <Typography variant="h6" component="h1" gutterBottom>
            Share Trip Links
          </Typography>

          <Box sx={{ mt: 1, mb: 2 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Your personal questionnaire link
            </Typography>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                p: 1,
                bgcolor: 'grey.50',
                borderRadius: 1,
              }}
            >
              <Typography
                variant="body2"
                sx={{ flex: 1, fontFamily: 'monospace' }}
              >
                {tripData.organizer?.link || tripData.organizerLink}
              </Typography>
              <IconButton
                size="small"
                onClick={() => handleCopyLink(tripData.organizer?.link || tripData.organizerLink)}
              >
                <ContentCopyIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>

          {tripData.participants.length > 0 && (
            <TableContainer sx={{ maxHeight: '30vh' }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ py: 1 }}>Name</TableCell>
                    <TableCell sx={{ py: 1, display: { xs: 'none', sm: 'table-cell' } }}>Link</TableCell>
                    <TableCell align="right" sx={{ py: 1 }}>SMS</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {tripData.participants
                    // Filter out the organizer from participants list to prevent duplicate display
                    .filter(participant => participant.id !== tripData.organizer?.id)
                    .map((participant) => (
                    <TableRow key={participant.id || participant.name}>
                      <TableCell sx={{ py: 0.5 }}>{participant.name}</TableCell>
                      <TableCell sx={{ py: 0.5, display: { xs: 'none', sm: 'table-cell' } }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Typography
                            variant="body2"
                            sx={{
                              fontFamily: 'monospace',
                              color: 'text.secondary',
                              fontSize: '0.75rem',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              maxWidth: '150px'
                            }}
                          >
                            {participant.link}
                          </Typography>
                          <IconButton
                            size="small"
                            onClick={() => handleCopyLink(participant.link)}
                          >
                            <ContentCopyIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </TableCell>
                      <TableCell align="right" sx={{ py: 0.5 }}>
                        <IconButton
                          size="small"
                          onClick={() => handleSendSMS(participant)}
                          sx={{ color: 'primary.main' }}
                          disabled={sendingState[participant.id]}
                        >
                          {sendingState[participant.id] ? (
                            <CircularProgress size={14} color="inherit" />
                          ) : (
                            <MessageIcon fontSize="small" />
                          )}
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            mt: 2, 
            alignItems: 'center',
            flexDirection: { xs: 'column', sm: 'row' } 
          }}>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ 
                fontSize: '0.75rem', 
                flex: 1,
                mb: { xs: 1, sm: 0 }
              }}
            >
              Friends don't need an account—just tap and answer.
            </Typography>
            
            <Button
              variant="contained"
              startIcon={loading ? <CircularProgress size={14} color="inherit" /> : <MessageIcon />}
              onClick={handleSendAllSMS}
              className="primary-button"
              disabled={loading}
              size="small"
              sx={{ 
                ml: { xs: 0, sm: 1 },
                width: { xs: '100%', sm: 'auto' }
              }}
            >
              {loading ? 'Sending...' : 'Text all invites'}
            </Button>
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
                <LightbulbIcon fontSize="small" />
                <Typography variant="body2">Keep the API lights on</Typography>
              </div>
              <Button 
                variant="contained"
                onClick={() => navigate('/donate')}
                className="footer-donate-button"
                size="small"
              >
                Donate
              </Button>
            </div>
            <Typography variant="body2" align="center" className="footer-tagline">
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

export default TripLinks; 