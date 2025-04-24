import React from 'react';
import '../styles/SocialSharePage.css';

const SocialSharePage = () => {
  const tripDetails = {
    destination: 'Bali, Indonesia',
    image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4',
    date: 'June 15-22, 2024',
    groupSize: 5,
  };

  const handleShare = (platform) => {
    // TODO: Implement sharing functionality for each platform
    console.log(`Sharing to ${platform}`);
  };

  const handleCopyLink = () => {
    // TODO: Implement copy link functionality
    navigator.clipboard.writeText(window.location.href);
  };

  return (
    <div className="social-share-page">
      <header className="header">
        <h1>Share Your Trip</h1>
        <p>Let your friends know about your upcoming adventure</p>
      </header>

      <main className="main-content">
        <div className="share-card">
          <div className="card-image">
            <img src={tripDetails.image} alt={tripDetails.destination} />
            <div className="overlay">
              <h2>{tripDetails.destination}</h2>
              <p>{tripDetails.date}</p>
              <p>{tripDetails.groupSize} travelers</p>
            </div>
          </div>

          <div className="share-options">
            <button
              className="share-button facebook"
              onClick={() => handleShare('facebook')}
            >
              Share on Facebook
            </button>
            <button
              className="share-button twitter"
              onClick={() => handleShare('twitter')}
            >
              Share on Twitter
            </button>
            <button
              className="share-button instagram"
              onClick={() => handleShare('instagram')}
            >
              Share on Instagram
            </button>
            <button
              className="share-button whatsapp"
              onClick={() => handleShare('whatsapp')}
            >
              Share on WhatsApp
            </button>
          </div>

          <div className="copy-link">
            <input
              type="text"
              value={window.location.href}
              readOnly
              className="link-input"
            />
            <button className="copy-button" onClick={handleCopyLink}>
              Copy Link
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SocialSharePage; 