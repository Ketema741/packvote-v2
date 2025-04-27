import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  TextField,
  Button,
  Typography,
  Container,
  Paper,
  IconButton,
  Stack,
  Divider,
  Alert,
  Grid,
  AppBar,
  Toolbar,
  Link,
  CircularProgress,
  Snackbar
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import { createTrip } from '../utils/api';
import '../styles/LandingPage.css';

const CreateTrip = () => {
  const navigate = useNavigate();
  const [tripName, setTripName] = useState('');
  const [organizer, setOrganizer] = useState({ name: '', phone: '' });
  const [participants, setParticipants] = useState([]);
  const [phoneErrors, setPhoneErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState({
    open: false,
    message: '',
    severity: 'error'
  });

  const validatePhoneNumber = (phone) => {
    // Remove any non-digit characters
    const cleanedPhone = phone.replace(/\D/g, '');
    // Check if it's a valid US phone number (10 digits)
    return cleanedPhone.length === 10;
  };

  const formatPhoneNumber = (phone) => {
    // Format for API: +1 followed by the 10 digits
    const cleanedPhone = phone.replace(/\D/g, '');
    return `+1${cleanedPhone}`;
  };

  const handleOrganizerChange = (field, value) => {
    setOrganizer({ ...organizer, [field]: value });
    if (field === 'phone') {
      const newErrors = { ...phoneErrors };
      if (!validatePhoneNumber(value)) {
        newErrors.organizer = true;
      } else {
        delete newErrors.organizer;
      }
      setPhoneErrors(newErrors);
    }
  };

  const handleAddParticipant = () => {
    setParticipants([...participants, { name: '', phone: '' }]);
  };

  const handleRemoveParticipant = (index) => {
    const newParticipants = participants.filter((_, i) => i !== index);
    setParticipants(newParticipants);
    const newErrors = { ...phoneErrors };
    delete newErrors[index];
    setPhoneErrors(newErrors);
  };

  const handleParticipantChange = (index, field, value) => {
    const newParticipants = [...participants];
    newParticipants[index][field] = value;
    setParticipants(newParticipants);

    if (field === 'phone') {
      const newErrors = { ...phoneErrors };
      if (!validatePhoneNumber(value)) {
        newErrors[index] = true;
      } else {
        delete newErrors[index];
      }
      setPhoneErrors(newErrors);
    }
  };

  const handleCloseToast = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setToast(prev => ({ ...prev, open: false }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Form validation
    if (!tripName.trim()) {
      setToast({
        open: true,
        message: 'Trip name is required',
        severity: 'error'
      });
      return;
    }

    if (!organizer.name.trim() || !organizer.phone.trim()) {
      setToast({
        open: true,
        message: 'Organizer name and phone are required',
        severity: 'error'
      });
      return;
    }

    // Validate organizer phone number
    if (!validatePhoneNumber(organizer.phone)) {
      const newErrors = { ...phoneErrors };
      newErrors.organizer = true;
      setPhoneErrors(newErrors);
      setToast({
        open: true,
        message: 'Please enter a valid 10-digit phone number for the organizer',
        severity: 'error'
      });
      return;
    }

    // Validate participant fields are not empty
    const emptyParticipant = participants.find(
      p => (!p.name.trim() || !p.phone.trim())
    );
    if (emptyParticipant) {
      setToast({
        open: true,
        message: 'All participant fields are required',
        severity: 'error'
      });
      return;
    }

    // Validate all participant phone numbers
    const hasErrors = participants.some((participant, index) => {
      if (!validatePhoneNumber(participant.phone)) {
        const newErrors = { ...phoneErrors };
        newErrors[index] = true;
        setPhoneErrors(newErrors);
        return true;
      }
      return false;
    });

    if (hasErrors) {
      setToast({
        open: true,
        message: 'Please enter valid 10-digit phone numbers for all participants',
        severity: 'error'
      });
      return;
    }

    // Create the trip through the API
    setLoading(true);
    setError(null);

    try {
      // Format phone numbers for API (+1 format)
      const formattedOrganizer = {
        name: organizer.name,
        phone: formatPhoneNumber(organizer.phone)
      };

      const formattedParticipants = participants.map(p => ({
        name: p.name,
        phone: formatPhoneNumber(p.phone)
      }));

      // Call the API to create the trip
      const result = await createTrip({
        organizer_name: formattedOrganizer.name,
        organizer_phone: formattedOrganizer.phone,
        trip_name: tripName,
        participants: formattedParticipants
      });

      // Navigate to the trip links page with the result data
      navigate('/trip-links', { 
        state: { 
          tripData: {
            tripId: result.trip_id,
            organizer: result.organizer,
            participants: result.participants
          } 
        } 
      });
    } catch (err) {
      console.error('Failed to create trip:', err);
      
      // Display a user-friendly error message
      let errorMessage = err.message || 'Something went wrong. Please try again.';
      
      // Check if this is a duplicate trip error
      if (errorMessage.includes('A trip with this name and participants already exists')) {
        // This is a duplicate trip error
        setError(errorMessage);
        setToast({
          open: true,
          message: errorMessage,
          severity: 'warning' // Use warning instead of error for duplicate trip
        });
      } else {
        // For other errors, show general error message
        setError('Failed to create trip: ' + errorMessage);
        setToast({
          open: true,
          message: 'Failed to create trip: ' + errorMessage,
          severity: 'error'
        });
      }
    } finally {
      setLoading(false);
    }
  };

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

      <Container maxWidth="sm" sx={{ pt: 12, pb: 8 }}>
        <Paper elevation={3} sx={{ p: 4, borderRadius: 3 }}>
          <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 2 }}>
            Set up your trip
          </Typography>
          
          <Alert severity="info" sx={{ mb: 4 }}>
            As the trip organizer, you'll set up the trip and invite others to participate in the planning.
          </Alert>

          {error && (
            <Alert severity="error" sx={{ mb: 4 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <Stack spacing={3}>
              <TextField
                label="Trip Name"
                value={tripName}
                onChange={(e) => setTripName(e.target.value)}
                required
                fullWidth
                placeholder="Summer Escape 2025"
              />

              <Box>
                <Typography variant="subtitle1" gutterBottom>
                  Your Information
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Phone numbers should be 10 digits (e.g., 1234567890)
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <TextField
                      label="Your Name"
                      value={organizer.name}
                      onChange={(e) => handleOrganizerChange('name', e.target.value)}
                      required
                      fullWidth
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      label="Your Phone"
                      value={organizer.phone}
                      onChange={(e) => handleOrganizerChange('phone', e.target.value)}
                      required
                      fullWidth
                      error={phoneErrors.organizer}
                      placeholder="1234567890"
                      size="small"
                    />
                  </Grid>
                </Grid>
              </Box>

              <Divider />

              <Box>
                <Typography variant="subtitle1" gutterBottom>
                  Add Participants
                </Typography>
                <Grid container spacing={2}>
                  {participants.map((participant, index) => (
                    <Grid item xs={12} key={index}>
                      <Grid container spacing={2} alignItems="center">
                        <Grid item xs={5.75}>
                          <TextField
                            label="Name"
                            value={participant.name}
                            onChange={(e) => handleParticipantChange(index, 'name', e.target.value)}
                            required
                            fullWidth
                            size="small"
                          />
                        </Grid>
                        <Grid item xs={5.75}>
                          <TextField
                            label="Phone"
                            value={participant.phone}
                            onChange={(e) => handleParticipantChange(index, 'phone', e.target.value)}
                            required
                            fullWidth
                            error={phoneErrors[index]}
                            placeholder="1234567890"
                            size="small"
                          />
                        </Grid>
                        <Grid item xs={0.5}>
                          <IconButton
                            onClick={() => handleRemoveParticipant(index)}
                            color="error"
                            size="small"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Grid>
                      </Grid>
                    </Grid>
                  ))}
                </Grid>

                <Button
                  startIcon={<AddIcon />}
                  onClick={handleAddParticipant}
                  sx={{ mt: 2 }}
                >
                  Add participant
                </Button>
              </Box>

              <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  className="primary-button"
                  disabled={loading}
                >
                  {loading ? <CircularProgress size={24} /> : 'Create Trip'}
                </Button>
                <Button
                  variant="text"
                  fullWidth
                  onClick={() => navigate('/')}
                  disabled={loading}
                >
                  Cancel
                </Button>
              </Box>
            </Stack>
          </form>
        </Paper>
      </Container>

      <Snackbar
        open={toast.open}
        autoHideDuration={6000}
        onClose={handleCloseToast}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseToast} severity={toast.severity} sx={{ width: '100%' }}>
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

export default CreateTrip; 