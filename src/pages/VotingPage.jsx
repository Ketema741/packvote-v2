import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { 
  Container, 
  Typography, 
  Box, 
  Button, 
  AppBar,
  Toolbar,
  Link,
  Paper,
  IconButton,
  Chip
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import HowToVoteIcon from '@mui/icons-material/HowToVote';
import '../styles/LandingPage.css';
import '../styles/VotingPage.css';

const VotingPage = () => {
  const navigate = useNavigate();
  const [destinations, setDestinations] = useState([
    {
      id: '1',
      name: 'Paris, France',
      image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34',
    },
    {
      id: '2',
      name: 'Tokyo, Japan',
      image: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26',
    },
    {
      id: '3',
      name: 'New York, USA',
      image: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9',
    },
  ]);

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const items = Array.from(destinations);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setDestinations(items);
  };

  const handleSubmitVote = () => {
    // TODO: Implement API call to submit rankings
    console.log('Rankings submitted:', destinations);
    navigate('/winner');
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

      <Container maxWidth="md" sx={{ pt: 12, pb: 8 }}>
        <Box sx={{ mb: 4, display: 'flex', alignItems: 'center' }}>
          <Button 
            startIcon={<ArrowBackIcon />} 
            onClick={() => navigate(-1)}
            sx={{ color: 'text.secondary' }}
          >
            Back
          </Button>
        </Box>
        
        <Paper elevation={3} sx={{ p: 4, borderRadius: 3, mb: 4 }}>
          <Typography variant="h3" component="h1" gutterBottom align="center">
            Rank Destinations
          </Typography>
          
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
            <Chip
              icon={<AccessTimeIcon />}
              label="Voting ends in 23h"
              color="primary"
              variant="outlined"
            />
          </Box>

          <Typography 
            variant="body1" 
            align="center" 
            color="text.secondary" 
            sx={{ mb: 4 }}
          >
            Drag and drop to rank your preferences
          </Typography>

          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="destinations">
              {(provided) => (
                <Box
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  sx={{ mb: 4 }}
                >
                  {destinations.map((destination, index) => (
                    <Draggable
                      key={destination.id}
                      draggableId={destination.id}
                      index={index}
                    >
                      {(provided, snapshot) => (
                        <Paper
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          elevation={snapshot.isDragging ? 6 : 1}
                          sx={{ 
                            mb: 2, 
                            display: 'flex', 
                            alignItems: 'center',
                            p: 2,
                            borderRadius: 2,
                            bgcolor: snapshot.isDragging ? 'rgba(0, 0, 0, 0.02)' : 'background.paper',
                            transition: 'all 0.2s'
                          }}
                        >
                          <Box 
                            {...provided.dragHandleProps} 
                            sx={{ 
                              mr: 2, 
                              color: 'text.secondary',
                              cursor: 'grab'
                            }}
                          >
                            <DragIndicatorIcon />
                          </Box>
                          <Box 
                            sx={{ 
                              width: '80px', 
                              height: '60px', 
                              borderRadius: 1, 
                              overflow: 'hidden',
                              mr: 2,
                              flexShrink: 0
                            }}
                          >
                            <img 
                              src={destination.image} 
                              alt={destination.name} 
                              style={{ 
                                width: '100%', 
                                height: '100%', 
                                objectFit: 'cover' 
                              }} 
                            />
                          </Box>
                          <Typography 
                            variant="h6" 
                            sx={{ 
                              flexGrow: 1,
                              fontWeight: 500
                            }}
                          >
                            {destination.name}
                          </Typography>
                          <Box>
                            <IconButton 
                              size="small" 
                              aria-label="Move up"
                              disabled={index === 0}
                              sx={{ color: index === 0 ? 'text.disabled' : 'text.secondary' }}
                            >
                              <ArrowUpwardIcon />
                            </IconButton>
                            <IconButton 
                              size="small" 
                              aria-label="Move down"
                              disabled={index === destinations.length - 1}
                              sx={{ color: index === destinations.length - 1 ? 'text.disabled' : 'text.secondary' }}
                            >
                              <ArrowDownwardIcon />
                            </IconButton>
                          </Box>
                        </Paper>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </Box>
              )}
            </Droppable>
          </DragDropContext>

          <Box sx={{ textAlign: 'center' }}>
            <Button 
              variant="contained" 
              startIcon={<HowToVoteIcon />}
              onClick={handleSubmitVote}
              className="primary-button"
              size="large"
              sx={{ mb: 1 }}
            >
              Submit my vote
            </Button>
            <Typography variant="body2" color="text.secondary">
              You can edit until the deadline
            </Typography>
          </Box>
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
};

export default VotingPage; 