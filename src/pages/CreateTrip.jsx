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
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';

const CreateTrip = () => {
  const navigate = useNavigate();
  const [tripName, setTripName] = useState('');
  const [organizer, setOrganizer] = useState({ name: '', phone: '' });
  const [participants, setParticipants] = useState([]);
  const [phoneErrors, setPhoneErrors] = useState({});

  const validatePhoneNumber = (phone) => {
    // Remove any non-digit characters
    const cleanedPhone = phone.replace(/\D/g, '');
    // Check if it's a valid US phone number (10 digits)
    return cleanedPhone.length === 10;
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

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate organizer phone number
    if (!validatePhoneNumber(organizer.phone)) {
      const newErrors = { ...phoneErrors };
      newErrors.organizer = true;
      setPhoneErrors(newErrors);
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
      return;
    }

    handleGenerateLinks();
  };

  const handleGenerateLinks = () => {
    // Create the trip data to pass to the next page
    const tripData = {
      organizerLink: `https://tripplanner.com/q/org/${Math.random().toString(36).substr(2, 9)}`,
      organizer: {
        name: organizer.name,
        phone: organizer.phone,
      },
      participants: participants.map(participant => ({
        name: participant.name,
        phone: participant.phone,
        link: `tripplanner.com/q/t/${Math.random().toString(36).substr(2, 9)}`
      }))
    };

    navigate('/trip-links', { state: { tripData } });
  };

  return (
    <Container maxWidth="sm">
      <Paper elevation={0} sx={{ p: 4, mt: 8 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 2 }}>
          Set up your trip
        </Typography>
        
        <Alert severity="info" sx={{ mb: 4 }}>
          As the trip organizer, you'll set up the trip and invite others to participate in the planning.
        </Alert>

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
                sx={{ bgcolor: '#4F46E5', '&:hover': { bgcolor: '#4338CA' } }}
              >
                Create Trip
              </Button>
              <Button
                variant="text"
                fullWidth
                onClick={() => navigate('/')}
              >
                Cancel
              </Button>
            </Box>
          </Stack>
        </form>
      </Paper>
    </Container>
  );
};

export default CreateTrip; 