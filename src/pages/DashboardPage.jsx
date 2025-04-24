import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/DashboardPage.css';

const DashboardPage = () => {
  const navigate = useNavigate();
  
  const tripData = {
    title: 'Summer Group Trip 2025',
    progress: {
      completed: 3,
      total: 6
    },
    participants: [
      { id: 1, name: 'Mike Thompson', image: 'https://i.pravatar.cc/150?img=1', responded: false },
      { id: 2, name: 'Sarah Wilson', image: 'https://i.pravatar.cc/150?img=2', responded: false },
      { id: 3, name: 'Emma Davis', image: 'https://i.pravatar.cc/150?img=3', responded: true }
    ],
    budget: {
      amount: 1200,
      currency: 'USD'
    },
    dateRange: {
      start: 'July 15',
      end: '22, 2025',
      window: '7 days window'
    },
    activities: ['Beach', 'Hiking', 'Food Tours']
  };

  const handleResendSMS = (participantId) => {
    console.log('Resending SMS to participant:', participantId);
    // TODO: Implement SMS resend functionality
  };

  const handleGetAIDestinations = () => {
    navigate('/recommendations');
  };

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <h1>{tripData.title}</h1>
        <button className="share-button">
          <span className="share-icon">↗</span>
          Share
        </button>
      </div>

      <div className="progress-bar">
        <div 
          className="progress-fill" 
          style={{ width: `${(tripData.progress.completed / tripData.progress.total) * 100}%` }}
        />
        <span className="progress-text">{tripData.progress.completed}/{tripData.progress.total} completed</span>
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-card">
          <div className="card-header">
            <span className="card-icon">💰</span>
            <h2>Median Budget</h2>
          </div>
          <div className="card-content">
            <div className="budget-amount">${tripData.budget.amount}</div>
            <div className="budget-label">per person</div>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="card-header">
            <span className="card-icon">📅</span>
            <h2>Date Overlap</h2>
          </div>
          <div className="card-content">
            <div className="date-range">{tripData.dateRange.start}-{tripData.dateRange.end}</div>
            <div className="date-window">{tripData.dateRange.window}</div>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="card-header">
            <span className="card-icon">⭐</span>
            <h2>Top Activities</h2>
          </div>
          <div className="card-content">
            <div className="activities-list">
              {tripData.activities.map((activity, index) => (
                <span key={index} className="activity-tag">{activity}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="waiting-section">
        <h2>Waiting on responses from...</h2>
        <div className="participants-list">
          {tripData.participants.map(participant => (
            <div key={participant.id} className="participant-item">
              <div className="participant-info">
                <img 
                  src={participant.image} 
                  alt={participant.name} 
                  className="participant-avatar"
                />
                <span className="participant-name">{participant.name}</span>
              </div>
              <button 
                className="resend-button"
                onClick={() => handleResendSMS(participant.id)}
              >
                <span className="resend-icon">↗</span>
                Resend SMS
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="ai-destinations-section">
        <button 
          className="ai-destinations-button"
          onClick={handleGetAIDestinations}
        >
          <span className="ai-icon">✨</span>
          Get AI Destination Picks
        </button>
        <p className="ai-note">Enabled when 50% or more have responded</p>
      </div>
    </div>
  );
};

export default DashboardPage; 