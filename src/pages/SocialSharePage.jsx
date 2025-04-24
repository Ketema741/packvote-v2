import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/SocialSharePage.css';

const SocialSharePage = () => {
  const navigate = useNavigate();
  const [caption, setCaption] = useState('');
  
  const handleDownload = () => {
    // TODO: Implement image download functionality
    console.log('Downloading PNG...');
  };

  const handleCopyLink = () => {
    // TODO: Implement copy link functionality
    console.log('Copying share link...');
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <button className="close-button" onClick={() => navigate(-1)}>×</button>
        
        <div className="share-preview">
          <div className="preview-illustration">
            {/* TODO update this to match the chosen location */}
            <div className="illustration-elements">
              <div className="balloons">
                {/* Decorative balloons */}
              </div>
              <div className="scene">
                <div className="palm-trees"></div>
                <div className="beach-chair"></div>
                <div className="building"></div>
                <div className="sun"></div>
              </div>
            </div>
          </div>
          <div className="preview-text">
            <div className="text-container">
              <p className="heading">We're going to</p>
              <p className="destination">Paris!</p>
            </div>
          </div>
        </div>

        <div className="share-form">
          <div className="form-group">
            <label>Caption</label>
            <textarea
              placeholder="Add your message here..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="caption-input"
            />
          </div>

          <div className="share-actions">
            <button className="download-button" onClick={handleDownload}>
              <svg className="download-icon" width="16" height="16" viewBox="0 0 16 16">
                <path d="M8 12l-4-4h8l-4 4z"/>
                <path d="M8 2v8"/>
                <path d="M3 14h10"/>
              </svg>
              Download PNG
            </button>
            <button className="share-button" onClick={handleCopyLink}>
              <svg className="link-icon" width="16" height="16" viewBox="0 0 16 16">
                <path d="M7.5 11l-3 3c-1.4 1.4-3.6 1.4-5 0s-1.4-3.6 0-5l3-3"/>
                <path d="M8.5 5l3-3c1.4-1.4 3.6-1.4 5 0s1.4 3.6 0 5l-3 3"/>
                <path d="M5.5 10.5l5-5"/>
              </svg>
              Copy Share Link
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SocialSharePage; 