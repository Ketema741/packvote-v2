import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/AIRecommendationsPage.css';

const AIRecommendationsPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [recommendations, setRecommendations] = useState([
    {
      id: 1,
      destination: 'Bali, Indonesia',
      image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4',
      description: 'Perfect for adventure and relaxation with beautiful beaches and cultural experiences.',
      matchScore: 95,
      price: '$1200',
      duration: '7 days',
    },
    {
      id: 2,
      destination: 'Kyoto, Japan',
      image: 'https://images.unsplash.com/photo-1492571350019-22de08371fd3',
      description: 'Rich cultural heritage, amazing food, and beautiful temples.',
      matchScore: 88,
      price: '$1500',
      duration: '5 days',
    },
    {
      id: 3,
      destination: 'Barcelona, Spain',
      image: 'https://images.unsplash.com/photo-1583422409516-289eea28cbc5',
      description: 'Vibrant city life, amazing architecture, and Mediterranean beaches.',
      matchScore: 85,
      price: '$1000',
      duration: '4 days',
    },
  ]);

  const handleVote = (destinationId) => {
    // TODO: Implement API call to submit vote
    navigate('/voting');
  };

  return (
    <div className="ai-recommendations-page">
      <header className="header">
        <h1>AI-Powered Recommendations</h1>
        <p>Based on your group's preferences, here are our top picks</p>
      </header>

      <main className="main-content">
        {loading ? (
          <div className="loading">
            <div className="spinner"></div>
            <p>Analyzing preferences and generating recommendations...</p>
          </div>
        ) : (
          <div className="recommendations-grid">
            {recommendations.map((rec) => (
              <div key={rec.id} className="recommendation-card">
                <div className="card-image">
                  <img src={rec.image} alt={rec.destination} />
                  <div className="match-score">
                    {rec.matchScore}% Match
                  </div>
                </div>
                <div className="card-content">
                  <h3>{rec.destination}</h3>
                  <p className="description">{rec.description}</p>
                  <div className="details">
                    <span className="price">${rec.price}</span>
                    <span className="duration">{rec.duration}</span>
                  </div>
                  <button
                    className="vote-button"
                    onClick={() => handleVote(rec.id)}
                  >
                    Vote for this destination
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default AIRecommendationsPage; 