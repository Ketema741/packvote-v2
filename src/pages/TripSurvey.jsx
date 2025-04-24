import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/TripSurvey.css';

const TripSurvey = () => {
  const navigate = useNavigate();

  const handleDone = () => {
    // TODO: Handle survey completion
    navigate('/next-step');
  };

  return (
    <div className="trip-survey">
      <div className="survey-container">
        {/* Progress indicator */}
        <div className="progress-section">
          <div className="progress-text">Step 1 of 2</div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: '50%' }}></div>
          </div>
        </div>

        {/* Survey content */}
        <div className="survey-content">
          <h1>Travel Preferences</h1>
          <p className="subtitle">Helps us match budgets, dates & vibes for everyone.</p>

          {/* Placeholder for future Typeform embed */}
          <div className="typeform-container">
            {/* Typeform will be embedded here */}
          </div>

          <div className="survey-actions">
            <button className="done-button" onClick={handleDone}>
              Done <span className="arrow">→</span>
            </button>
            <button className="open-new-tab">
              Open form in new tab
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TripSurvey; 