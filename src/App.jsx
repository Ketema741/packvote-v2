import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import LandingPage from './pages/LandingPage';
import CreateTrip from './pages/CreateTrip';
import TripLinks from './pages/TripLinks';

const App = () => {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/create-trip" element={<CreateTrip />} />
        <Route path="/trip-links" element={<TripLinks />} />
      </Routes>
    </>
  );
};

export default App; 