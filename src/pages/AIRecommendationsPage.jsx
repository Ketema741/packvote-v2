import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/AIRecommendationsPage.css';

const AIRecommendationsPage = () => {
  const navigate = useNavigate();
  const destinations = [
    {
      id: 1,
      destination: 'Bali, Indonesia',
      image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4',
      fit: 92,
      pricePerPerson: 1200,
      temperature: '82°F',
      flag: '🇮🇩',
    },
    {
      id: 2,
      destination: 'Barcelona, Spain',
      image: 'https://images.unsplash.com/photo-1583422409516-289eea28cbc5',
      fit: 88,
      pricePerPerson: 1400,
      temperature: '75°F',
      flag: '🇪🇸',
    },
    {
      id: 3,
      destination: 'Phuket, Thailand',
      image: 'https://images.unsplash.com/photo-1589394815804-964ed0be2eb5',
      fit: 85,
      pricePerPerson: 1100,
      temperature: '86°F',
      flag: '🇹🇭',
    },
  ];

  const handleViewDetails = (destinationId) => {
    // TODO: Navigate to destination details page
    console.log('View details for destination:', destinationId);
  };

  const handleStartVote = () => {
    navigate('/voting');
  };

  return (
    <div className="ai-recommendations-page">
      <div className="content-container">
        <header className="header">
          <h1>AI Destination Picks</h1>
          <p>Tailored to group budgets, dates & vibes</p>
          
          <div className="filters">
            <div className="filter-tag">💰 Budget ≤$1,500</div>
            <div className="filter-tag">✈️ Flight ≤10h</div>
            <div className="filter-tag">👥 Group: 4-6</div>
            <div className="filter-tag">📅 May 2025</div>
          </div>
        </header>

        <main className="destinations-grid">
          {destinations.map((destination) => (
            <div key={destination.id} className="destination-card">
              <div className="card-image">
                <img src={destination.image} alt={destination.destination} />
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