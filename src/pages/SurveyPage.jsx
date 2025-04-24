import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/SurveyPage.css';

const SurveyPage = () => {
  const navigate = useNavigate();
  const [surveyData, setSurveyData] = useState({
    pastTravel: '',
    wishList: '',
    budget: '',
    availability: '',
    vibe: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSurveyData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: Implement API call to submit survey
    // For now, just navigate to the next step
    navigate('/ai-recommendations');
  };

  return (
    <div className="survey-page">
      <header className="header">
        <h1>Help Plan the Perfect Trip</h1>
        <p>Share your preferences to help us find the best destination</p>
      </header>

      <main className="main-content">
        <form onSubmit={handleSubmit} className="survey-form">
          <div className="form-group">
            <label htmlFor="pastTravel">Past Travel Experiences</label>
            <textarea
              id="pastTravel"
              name="pastTravel"
              value={surveyData.pastTravel}
              onChange={handleChange}
              required
              placeholder="Tell us about your favorite travel experiences..."
              rows="4"
            />
          </div>

          <div className="form-group">
            <label htmlFor="wishList">Dream Destinations</label>
            <textarea
              id="wishList"
              name="wishList"
              value={surveyData.wishList}
              onChange={handleChange}
              required
              placeholder="Where have you always wanted to go?"
              rows="4"
            />
          </div>

          <div className="form-group">
            <label htmlFor="budget">Budget Range</label>
            <select
              id="budget"
              name="budget"
              value={surveyData.budget}
              onChange={handleChange}
              required
            >
              <option value="">Select your budget range</option>
              <option value="budget">Budget ($500-$1000)</option>
              <option value="moderate">Moderate ($1000-$2000)</option>
              <option value="luxury">Luxury ($2000+)</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="availability">Preferred Travel Dates</label>
            <input
              type="text"
              id="availability"
              name="availability"
              value={surveyData.availability}
              onChange={handleChange}
              required
              placeholder="e.g., June 2024, flexible"
            />
          </div>

          <div className="form-group">
            <label htmlFor="vibe">Trip Vibe</label>
            <select
              id="vibe"
              name="vibe"
              value={surveyData.vibe}
              onChange={handleChange}
              required
            >
              <option value="">Select your preferred trip vibe</option>
              <option value="adventure">Adventure & Exploration</option>
              <option value="relaxation">Relaxation & Wellness</option>
              <option value="culture">Cultural Experience</option>
              <option value="party">Party & Nightlife</option>
              <option value="mixed">Mixed (A bit of everything)</option>
            </select>
          </div>

          <div className="form-actions">
            <button type="submit" className="submit-button">
              Submit Preferences
            </button>
            <button
              type="button"
              className="create-account-button"
              onClick={() => navigate('/signup')}
            >
              Create Account to Save Preferences
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default SurveyPage; 