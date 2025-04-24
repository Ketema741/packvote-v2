import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/WinnerPage.css';

const WinnerPage = () => {
  const navigate = useNavigate();
  const winner = {
    destination: 'Bali, Indonesia',
    image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4',
    description: 'Perfect for adventure and relaxation with beautiful beaches and cultural experiences.',
    votes: 3,
    totalVotes: 5,
    price: '$1200',
    duration: '7 days',
  };

  const handleShare = () => {
    navigate('/social-share');
  };

  const handleDonate = () => {
    // TODO: Implement donation flow
    window.open('https://paypal.me/yourusername', '_blank');
  };

  return (
    <div className="winner-page">
      <header className="header">
        <h1>We Have a Winner!</h1>
        <p>Your group has chosen the perfect destination</p>
      </header>

      <main className="main-content">
        <div className="winner-card">
          <div className="winner-image">
            <img src={winner.image} alt={winner.destination} />
            <div className="winner-badge">
              <span>Winner</span>
            </div>
          </div>
          <div className="winner-details">
            <h2>{winner.destination}</h2>
            <p className="description">{winner.description}</p>
            <div className="stats">
              <div className="stat">
                <span className="label">Votes</span>
                <span className="value">{winner.votes}/{winner.totalVotes}</span>
              </div>
              <div className="stat">
                <span className="label">Price</span>
                <span className="value">{winner.price}</span>
              </div>
              <div className="stat">
                <span className="label">Duration</span>
                <span className="value">{winner.duration}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="actions">
          <button className="share-button" onClick={handleShare}>
            Share the News
          </button>
          <button className="donate-button" onClick={handleDonate}>
            Support Our AI
          </button>
        </div>

        <div className="next-steps">
          <h3>Next Steps</h3>
          <ul>
            <li>Check your email for booking recommendations</li>
            <li>Share the results with your group</li>
            <li>Start planning your itinerary</li>
          </ul>
        </div>
      </main>
    </div>
  );
};

export default WinnerPage; 