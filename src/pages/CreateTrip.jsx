import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  TextField,
  Button,
  Typography,
  Container,
  Paper,
  Checkbox,
  FormControlLabel,
  IconButton,
  Stack,
  Divider,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';

const CreateTrip = () => {
  const navigate = useNavigate();
  const [tripName, setTripName] = useState('');
  const [participants, setParticipants] = useState([{ name: '', phone: '' }]);
  const [willFillQuestionnaire, setWillFillQuestionnaire] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleAddParticipant = () => {
    setParticipants([...participants, { name: '', phone: '' }]);
  };

  const handleRemoveParticipant = (index) => {
    const newParticipants = participants.filter((_, i) => i !== index);
    setParticipants(newParticipants);
  };

  const handleParticipantChange = (index, field, value) => {
    const newParticipants = [...participants];
    newParticipants[index][field] = value;
    setParticipants(newParticipants);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (willFillQuestionnaire) {
      setShowConfirmation(true);
    } else {
      handleGenerateLinks();
    }
  };

  const handleGenerateLinks = () => {
    // TODO: Implement API call to create trip and generate links
    navigate('/trip-links');
  };

  return (
    <Container maxWidth="sm">
      <Paper elevation={0} sx={{ p: 4, mt: 8 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 4 }}>
          Set up your trip
        </Typography>
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

            {participants.map((participant, index) => (
              <Box key={index}>
                <Stack
                  direction="row"
                  spacing={2}
                  alignItems="center"
                >
                  <TextField
                    label="Name"
                    value={participant.name}
                    onChange={(e) => handleParticipantChange(index, 'name', e.target.value)}
                    required
                    fullWidth
                  />
                  <TextField
                    label="Phone"
                    value={participant.phone}
                    onChange={(e) => handleParticipantChange(index, 'phone', e.target.value)}
                    required
                    fullWidth
                  />
                  {index > 0 && (
                    <IconButton
                      onClick={() => handleRemoveParticipant(index)}
                      color="error"
                      size="small"
                    >
                      <DeleteIcon />
                    </IconButton>
                  )}
                </Stack>
              </Box>
            ))}

            <Button
              startIcon={<AddIcon />}
              onClick={handleAddParticipant}
              sx={{ alignSelf: 'flex-start' }}
            >
              Add another
            </Button>

            <FormControlLabel
              control={
                <Checkbox
                  checked={willFillQuestionnaire}
                  onChange={(e) => setWillFillQuestionnaire(e.target.checked)}
                />
              }
              label="I'll fill my questionnaire now"
            />

            {showConfirmation && willFillQuestionnaire && (
              <Box sx={{ mt: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <KeyboardArrowDownIcon />
                  <Typography>
                    Great! Your answers will be counted with everyone else.
                  </Typography>
                </Stack>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  You can come back to this page anytime.
                </Typography>
                <Button
                  variant="contained"
                  color="success"
                  fullWidth
                  sx={{ mt: 2 }}
                  onClick={() => navigate('/questionnaire')}
                >
                  Open My Questionnaire
                </Button>
              </Box>
            )}

            <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
              <Button
                type="submit"
                variant="contained"
                fullWidth
                sx={{ bgcolor: '#4F46E5', '&:hover': { bgcolor: '#4338CA' } }}
              >
                Generate Invite Links
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