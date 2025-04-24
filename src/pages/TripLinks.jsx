import React from 'react';
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
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import MessageIcon from '@mui/icons-material/Message';
import { useNavigate, useLocation } from 'react-router-dom';

const TripLinks = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const tripData = location.state?.tripData || {
    organizerLink: 'No link available',
    participants: []
  };

  const handleCopyLink = async (link) => {
    try {
      await navigator.clipboard.writeText(link);
      // TODO: Show success toast
    } catch (err) {
      // TODO: Show error toast
    }
  };

  const handleSendSMS = (participant) => {
    // TODO: Implement SMS sending through backend
    console.log('Sending SMS to:', participant.name, 'at', participant.phone);
  };

  const handleSendAllSMS = () => {
    // TODO: Implement sending all SMS through backend
    const allParticipants = [...tripData.participants];
    if (tripData.organizer) {
      allParticipants.unshift(tripData.organizer);
    }
    console.log('Sending SMS to all:', allParticipants);
  };

  const handleClose = () => {
    navigate('/');
  };

  // If no trip data was passed, show an error state
  if (!location.state?.tripData) {
    return (
      <Container maxWidth="sm" sx={{ mt: 4 }}>
        <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="error" gutterBottom>
            No trip information available
          </Typography>
          <Button variant="contained" onClick={() => navigate('/create-trip')}>
            Create a New Trip
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ mt: 4 }}>
      <Paper
        elevation={3}
        sx={{
          position: 'relative',
          p: 4,
          borderRadius: 2,
        }}
      >
        <IconButton
          onClick={handleClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
          }}
        >
          <CloseIcon />
        </IconButton>

        <Typography variant="h5" component="h1" gutterBottom>
          Share Trip Links
        </Typography>

        <Box sx={{ mt: 3, mb: 4 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Your personal questionnaire link
          </Typography>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              p: 2,
              bgcolor: 'grey.50',
              borderRadius: 1,
            }}
          >
            <Typography
              variant="body2"
              sx={{ flex: 1, fontFamily: 'monospace' }}
            >
              {tripData.organizerLink}
            </Typography>
            <IconButton
              size="small"
              onClick={() => handleCopyLink(tripData.organizerLink)}
            >
              <ContentCopyIcon />
            </IconButton>
          </Box>
        </Box>

        {tripData.participants.length > 0 && (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Link</TableCell>
                  <TableCell align="right">SMS</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tripData.participants.map((participant) => (
                  <TableRow key={participant.name}>
                    <TableCell>{participant.name}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography
                          variant="body2"
                          sx={{
                            fontFamily: 'monospace',
                            color: 'text.secondary',
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
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={() => handleSendSMS(participant)}
                        sx={{ color: 'success.main' }}
                      >
                        <MessageIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        <Button
          variant="contained"
          startIcon={<MessageIcon />}
          fullWidth
          onClick={handleSendAllSMS}
          sx={{
            mt: 3,
            bgcolor: 'success.main',
            '&:hover': { bgcolor: 'success.dark' },
          }}
        >
          Text all invites
        </Button>

        <Typography
          variant="body2"
          color="text.secondary"
          align="center"
          sx={{ mt: 2 }}
        >
          Friends don't need an account—just tap and answer a few questions.
        </Typography>
      </Paper>
    </Container>
  );
};

export default TripLinks; 