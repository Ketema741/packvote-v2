import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  CardMedia,
  Grid,
  Button,
  Chip,
  Rating,
  Paper,
} from '@mui/material';

const TripRecommendations = () => {
  const { tripId } = useParams();
  const [selectedRecommendation, setSelectedRecommendation] = useState(null);

  // Mock data - replace with actual API call
  const recommendations = [
    {
      id: 1,
      destination: 'Bali, Indonesia',
      image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
      description: 'A perfect blend of culture, adventure, and relaxation. Explore ancient temples, surf world-class waves, and unwind in luxury resorts.',
      activities: ['Temple Visits', 'Surfing', 'Spa Retreats', 'Rice Terrace Tours'],
      price: 2500,
      rating: 4.8,
      matchScore: 95,
    },
    {
      id: 2,
      destination: 'Kyoto, Japan',
      image: 'https://images.unsplash.com/photo-1492571350019-22de08371fd3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
      description: 'Experience traditional Japanese culture with modern comforts. Visit ancient temples, enjoy authentic cuisine, and witness the beauty of cherry blossoms.',
      activities: ['Temple Tours', 'Tea Ceremonies', 'Garden Visits', 'Food Tours'],
      price: 3000,
      rating: 4.9,
      matchScore: 92,
    },
    {
      id: 3,
      destination: 'Santorini, Greece',
      image: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
      description: 'Stunning sunsets, crystal-clear waters, and charming white-washed buildings. Perfect for a romantic getaway or group adventure.',
      activities: ['Beach Hopping', 'Wine Tasting', 'Sunset Cruises', 'Archaeological Sites'],
      price: 2800,
      rating: 4.7,
      matchScore: 88,
    },
  ];

  const handleSelectRecommendation = (recommendation) => {
    setSelectedRecommendation(recommendation);
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Your Trip Recommendations
        </Typography>
        <Typography variant="subtitle1" gutterBottom>
          Based on your preferences, we've found these perfect destinations for your group
        </Typography>

        <Grid container spacing={4} sx={{ mt: 2 }}>
          {recommendations.map((recommendation) => (
            <Grid item xs={12} md={4} key={recommendation.id}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  cursor: 'pointer',
                  '&:hover': {
                    transform: 'scale(1.02)',
                    transition: 'transform 0.2s',
                  },
                }}
                onClick={() => handleSelectRecommendation(recommendation)}
              >
                <CardMedia
                  component="img"
                  height="200"
                  image={recommendation.image}
                  alt={recommendation.destination}
                />
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h5" component="h2" gutterBottom>
                    {recommendation.destination}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Rating value={recommendation.rating} precision={0.1} readOnly />
                    <Typography variant="body2" sx={{ ml: 1 }}>
                      {recommendation.rating}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {recommendation.description}
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    {recommendation.activities.map((activity) => (
                      <Chip
                        key={activity}
                        label={activity}
                        size="small"
                        sx={{ mr: 1, mb: 1 }}
                      />
                    ))}
                  </Box>
                  <Typography variant="h6" color="primary">
                    ${recommendation.price} per person
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Match Score: {recommendation.matchScore}%
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {selectedRecommendation && (
          <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
            <Typography variant="h5" gutterBottom>
              Selected Destination: {selectedRecommendation.destination}
            </Typography>
            <Button
              variant="contained"
              color="primary"
              size="large"
              fullWidth
              sx={{ mt: 2 }}
            >
              Confirm Selection
            </Button>
          </Paper>
        )}
      </Box>
    </Container>
  );
};

export default TripRecommendations; 