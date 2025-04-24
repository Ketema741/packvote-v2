import React from 'react';
import '../styles/WinnerPage.css';

const WinnerPage = () => {
  const tripDetails = {
    destination: 'Santorini Getaway',
    dates: 'June 15-22, 2025',
    travelers: '2 Travelers',
    price: '$2,499/person'
  };

  const handleShare = () => {
    // TODO: Implement social sharing functionality
    console.log('Share on socials clicked');
  };

  const handleDownload = () => {
    // TODO: Implement PDF download functionality
    console.log('Download PDF clicked');
  };

  const handleBuyCoffe = () => {
    // TODO: Implement buy coffee functionality
    console.log('Buy coffee clicked');
  };

  return (
    <div className="winner-page">
      {/* Confetti animation container */}
      <div className="confetti-container">
        {/* Confetti dots will be added via CSS */}
      </div>

      <div className="logo">
        <span>TravelMate</span>
      </div>

      <div className="status-badge">
        Trip Confirmed!
      </div>

      {/* Trip card */}
      <div className="trip-card">
        <div className="trip-image">
          <img 
            src="https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?w=800" 
            alt="Santorini sunset view with blue domed churches"
          />
          <div className="trip-details-overlay">
            <h1>{tripDetails.destination}</h1>
            <div className="trip-info">
              <span className="date">{tripDetails.dates}</span>
              <span className="travelers">{tripDetails.travelers}</span>
              <span className="price">{tripDetails.price}</span>
            </div>
          </div>
        </div>
      </div>

      {/* What's Next section */}
      <div className="next-steps">
        <h2>What's Next?</h2>
        <div className="action-buttons">
          <button className="action-button share" onClick={handleShare}>
            <div className="button-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M16 8L8 16M8 8L16 16M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            Share on Socials
          </button>
          
          <button className="action-button download" onClick={handleDownload}>
            <div className="button-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M4 17V19C4 19.5304 4.21071 20.0391 4.58579 20.4142C4.96086 20.7893 5.46957 21 6 21H18C18.5304 21 19.0391 20.7893 19.4142 20.4142C19.7893 20.0391 20 19.5304 20 19V17M7 11L12 16M12 16L17 11M12 16V4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            Download Trip PDF
          </button>
          
          <button className="action-button coffee" onClick={handleBuyCoffe}>
            <div className="button-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M18 8H19C20.0609 8 21.0783 8.42143 21.8284 9.17157C22.5786 9.92172 23 10.9391 23 12C23 13.0609 22.5786 14.0783 21.8284 14.8284C21.0783 15.5786 20.0609 16 19 16H18M18 8H2V17C2 18.0609 2.42143 19.0783 3.17157 19.8284C3.92172 20.5786 4.93913 21 6 21H14C15.0609 21 16.0783 20.5786 16.8284 19.8284C17.5786 19.0783 18 18.0609 18 17V8Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            Buy us a coffee
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="footer">
        <p>Made with ❤️ by Group Travel App</p>
        <p className="subtitle">Your dream vacation awaits!</p>
      </div>
    </div>
  );
};

export default WinnerPage; 