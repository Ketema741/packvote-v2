import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  AppBar,
  Toolbar,
  Typography,
  Box,
  Link,
  Button,
} from '@mui/material';
import '../styles/AIRecommendationsPage.css';

const AIRecommendationsPage = () => {
  const navigate = useNavigate();
  const [imgErrors, setImgErrors] = useState({});
  const [imagesLoaded, setImagesLoaded] = useState({});
  
  const destinations = useMemo(() => [
    {
      id: 1,
      destination: 'Bali, Indonesia',
      image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=800&q=80',
      fallbackImage: 'https://source.unsplash.com/random/1200x800/?bali,indonesia,beach',
      fit: 92,
      pricePerPerson: 1200,
      temperature: '82°F',
      flag: '🇮🇩',
    },
    {
      id: 2,
      destination: 'Barcelona, Spain',
      image: 'https://images.pexels.com/photos/1388030/pexels-photo-1388030.jpeg?auto=compress&cs=tinysrgb&w=1200&h=800&dpr=1',
      fallbackImage: 'https://source.unsplash.com/featured/1200x800/?barcelona,spain',
      fit: 88,
      pricePerPerson: 1400,
      temperature: '75°F',
      flag: '🇪🇸',
    },
    {
      id: 3,
      destination: 'Phuket, Thailand',
      image: 'https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=800&q=80',
      fallbackImage: 'https://source.unsplash.com/random/1200x800/?phuket,thailand',
      fit: 85,
      pricePerPerson: 1100,
      temperature: '86°F',
      flag: '🇹🇭',
    },
  ], []);

  const handleImageError = useCallback((id) => {
    setImgErrors(prev => ({ ...prev, [id]: true }));
  }, []);

  const handleImageLoaded = useCallback((id) => {
    setImagesLoaded(prev => ({ ...prev, [id]: true }));
  }, []);

  useEffect(() => {
    // Preload images
    destinations.forEach(destination => {
      const img = new Image();
      img.src = destination.image;
      img.onload = () => handleImageLoaded(destination.id);
      img.onerror = () => handleImageError(destination.id);
    });
  }, [destinations, handleImageError, handleImageLoaded]);

  const handleViewDetails = (destinationId) => {
    // TODO: Navigate to destination details page
    console.log('View details for destination:', destinationId);
  };

  const handleStartVote = () => {
    navigate('/voting');
  };

  return (
    <div className="ai-recommendations-page">
      {/* Navigation */}
      <AppBar position="fixed" elevation={0} sx={{ bgcolor: 'background.paper' }}>
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Typography variant="h6" component="div" sx={{ color: 'primary.main', fontWeight: 600 }}>
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
    
      <div className="content-container">
        <h1 className="page-title">Destination Recommendations</h1>
        <p className="page-subtitle">Tailored to group budgets, dates & vibes</p>
        
        <div className="filters-container">
          <div className="filter-tag">💰 Budget ≤$1,500</div>
          <div className="filter-tag">✈️ Flight ≤10h</div>
          <div className="filter-tag">👥 Group: 4-6</div>
          <div className="filter-tag">📅 May 2025</div>
        </div>
        
        <main className="destinations-grid">
          {destinations.map((destination) => (
            <div key={destination.id} className="destination-card">
              <div className={`card-image ${!imagesLoaded[destination.id] && !imgErrors[destination.id] ? 'loading' : ''}`}>
                <img 
                  src={imgErrors[destination.id] ? destination.fallbackImage : destination.image} 
                  alt={destination.destination}
                  onError={() => handleImageError(destination.id)}
                  onLoad={() => handleImageLoaded(destination.id)}
                />
                <div className="fit-score">{destination.fit}% fit</div>
              </div>
              <div className="card-content">
                <div className="destination-header">
                  <h3>{destination.destination}</h3>
                  <span className="flag">{destination.flag}</span>
                </div>
                <div className="destination-details">
                  <div className="detail">
                    <span>💰 ${destination.pricePerPerson}/person</span>
                  </div>
                  <div className="detail">
                    <span>🌡️ {destination.temperature}</span>
                  </div>
                </div>
                <button
                  className="view-details-button"
                  onClick={() => handleViewDetails(destination.id)}
                >
                  View Details →
                </button>
              </div>
            </div>
          ))}
        </main>

        <div className="vote-section">
          <button className="start-vote-button" onClick={handleStartVote}>
            Start the Vote
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIRecommendationsPage; 