import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/DashboardPage.css';

const DashboardPage = () => {
  const navigate = useNavigate();
  const trips = [
    {
      id: 1,
      name: 'Summer 2024 Adventure',
      destination: 'Bali, Indonesia',
      status: 'Voting Complete',
      date: 'June 15-22, 2024',
      groupSize: 5,
      image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4',
    },
    {
      id: 2,
      name: 'Fall Getaway',
      destination: 'Kyoto, Japan',
      status: 'In Progress',
      date: 'October 10-15, 2024',
      groupSize: 4,
      image: 'https://images.unsplash.com/photo-1492571350019-22de08371fd3',
    },
    {
      id: 3,
      name: 'Winter Escape',
      destination: 'Barcelona, Spain',
      status: 'Planning',
      date: 'December 20-27, 2024',
      groupSize: 6,
      image: 'https://images.unsplash.com/photo-1583422409516-289eea28cbc5',
    },
  ];

  const handleCreateTrip = () => {
    navigate('/create-trip');
  };

  const handleViewTrip = (tripId) => {
    navigate(`/trip/${tripId}`);
  };

  return (
    <div className="dashboard-page">
      <header className="header">
        <h1>My Trips</h1>
        <button className="create-trip-button" onClick={handleCreateTrip}>
          Create New Trip
        </button>
      </header>

      <main className="main-content">
        <div className="trips-grid">
          {trips.map((trip) => (
            <div
              key={trip.id}
              className="trip-card"
              onClick={() => handleViewTrip(trip.id)}
            >
              <div className="card-image">
                <img src={trip.image} alt={trip.destination} />
                <div className="status-badge">{trip.status}</div>
              </div>
              <div className="card-content">
                <h3>{trip.name}</h3>
                <p className="destination">{trip.destination}</p>
                <div className="trip-details">
                  <span className="date">{trip.date}</span>
                  <span className="group-size">{trip.groupSize} travelers</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default DashboardPage; 