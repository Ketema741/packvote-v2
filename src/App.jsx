import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import LandingPage from './pages/LandingPage';
import CreateTrip from './pages/CreateTrip';

const App = () => {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/create-trip" element={<CreateTrip />} />
      </Routes>
    </>
  );
};

export default App; 