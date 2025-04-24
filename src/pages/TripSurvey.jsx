import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  Paper,
  Grid,
} from '@mui/material';

const TripSurvey = () => {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    startDate: '',
    endDate: '',
    numberOfTravelers: 2,
    budget: 1000,
    preferredDestinations: '',
    travelStyle: '',
    interests: '',
    dietaryRestrictions: '',
    accessibilityNeeds: '',
  });

  const handleChange = (field) => (event) => {
    setFormData({
      ...formData,
      [field]: event.target.value,
    });
  };

  const handleSliderChange = (field) => (event, newValue) => {
    setFormData({
      ...formData,
      [field]: newValue,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // TODO: Save survey data to backend
    navigate(`/trip/${tripId}/recommendations`);
  };

  return (
    <Container maxWidth="md">
      <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Trip Preferences Survey
        </Typography>
        <Typography variant="subtitle1" gutterBottom>
          Help us understand your travel preferences to create the perfect itinerary
        </Typography>

        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            {/* Dates */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Start Date"
                type="date"
                value={formData.startDate}
                onChange={handleChange('startDate')}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="End Date"
                type="date"
                value={formData.endDate}
                onChange={handleChange('endDate')}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            {/* Number of Travelers */}
            <Grid item xs={12}>
              <Typography gutterBottom>Number of Travelers</Typography>
              <Slider
                value={formData.numberOfTravelers}
                onChange={handleSliderChange('numberOfTravelers')}
                min={2}
                max={20}
                step={1}
                marks
                valueLabelDisplay="auto"
              />
            </Grid>

            {/* Budget */}
            <Grid item xs={12}>
              <Typography gutterBottom>Budget per Person (USD)</Typography>
              <Slider
                value={formData.budget}
                onChange={handleSliderChange('budget')}
                min={500}
                max={5000}
                step={100}
                marks={[
                  { value: 500, label: '$500' },
                  { value: 2500, label: '$2500' },
                  { value: 5000, label: '$5000' },
                ]}
                valueLabelDisplay="auto"
              />
            </Grid>

            {/* Preferred Destinations */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Preferred Destinations (comma separated)"
                value={formData.preferredDestinations}
                onChange={handleChange('preferredDestinations')}
                helperText="List any specific places you'd like to visit"
              />
            </Grid>

            {/* Travel Style */}
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Travel Style</InputLabel>
                <Select
                  value={formData.travelStyle}
                  onChange={handleChange('travelStyle')}
                  label="Travel Style"
                >
                  <MenuItem value="relaxed">Relaxed</MenuItem>
                  <MenuItem value="balanced">Balanced</MenuItem>
                  <MenuItem value="adventurous">Adventurous</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Interests */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Interests"
                value={formData.interests}
                onChange={handleChange('interests')}
                helperText="What activities do you enjoy? (e.g., hiking, museums, beaches)"
              />
            </Grid>

            {/* Dietary Restrictions */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Dietary Restrictions"
                value={formData.dietaryRestrictions}
                onChange={handleChange('dietaryRestrictions')}
                helperText="Any food allergies or dietary preferences?"
              />
            </Grid>

            {/* Accessibility Needs */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Accessibility Needs"
                value={formData.accessibilityNeeds}
                onChange={handleChange('accessibilityNeeds')}
                helperText="Any special accessibility requirements?"
              />
            </Grid>

            {/* Submit Button */}
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  size="large"
                >
                  Submit Preferences
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Container>
  );
};

export default TripSurvey; 