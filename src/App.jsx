import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import LandingPage from './pages/LandingPage';
import CreateTrip from './pages/CreateTrip';
import TripLinks from './pages/TripLinks';
import AIRecommendationsPage from './pages/AIRecommendationsPage';
import VotingPage from './pages/VotingPage';

const App = () => {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/create-trip" element={<CreateTrip />} />
        <Route path="/trip-links" element={<TripLinks />} />
        <Route path="/recommendations" element={<AIRecommendationsPage />} />
        <Route path="/voting" element={<VotingPage />} />
      </Routes>
    </>
  );
};

export default App; 