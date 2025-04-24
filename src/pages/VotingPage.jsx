import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/VotingPage.css';

const VotingPage = () => {
  const navigate = useNavigate();
  const [selectedDestination, setSelectedDestination] = useState(null);
  const [votingStatus, setVotingStatus] = useState({
    totalVotes: 5,
    currentVotes: 3,
    timeRemaining: '2 days',
  });

  const destinations = [
    {
      id: 1,
      name: 'Bali, Indonesia',
      image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4',
      votes: 2,
    },
    {
      id: 2,
      name: 'Kyoto, Japan',
      image: 'https://images.unsplash.com/photo-1492571350019-22de08371fd3',
      votes: 1,
    },
    {
      id: 3,
      name: 'Barcelona, Spain',
      image: 'https://images.unsplash.com/photo-1583422409516-289eea28cbc5',
      votes: 0,
    },
  ];

  const handleVote = (destinationId) => {
    setSelectedDestination(destinationId);
    // TODO: Implement API call to submit vote
  };

  const handleSubmitVote = () => {
    if (selectedDestination) {
      // TODO: Implement API call to finalize vote
      navigate('/winner');
    }
  };

  return (
    <div className="voting-page">
      <header className="header">
        <h1>Vote for Your Favorite Destination</h1>
        <div className="voting-status">
          <span>{votingStatus.currentVotes} of {votingStatus.totalVotes} votes in</span>
          <span>Time remaining: {votingStatus.timeRemaining}</span>
        </div>
      </header>

      <main className="main-content">
        <div className="destinations-grid">
          {destinations.map((destination) => (
            <div
              key={destination.id}
              className={`destination-card ${selectedDestination === destination.id ? 'selected' : ''}`}
              onClick={() => handleVote(destination.id)}
            >
              <div className="card-image">
                <img src={destination.image} alt={destination.name} />
                <div className="vote-count">
                  {destination.votes} {destination.votes === 1 ? 'vote' : 'votes'}
                </div>
              </div>
              <div className="card-content">
                <h3>{destination.name}</h3>
                {selectedDestination === destination.id && (
                  <div className="selected-indicator">Your Vote</div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="voting-actions">
          <button
            className="submit-vote-button"
            onClick={handleSubmitVote}
            disabled={!selectedDestination}
          >
            Submit Vote
          </button>
          <button
            className="share-button"
            onClick={() => navigate('/share')}
          >
            Share with Friends
          </button>
        </div>
      </main>
    </div>
  );
};

export default VotingPage; 