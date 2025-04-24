import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import LandingPage from './pages/LandingPage';
import CreateTrip from './pages/CreateTrip';
import TripLinks from './pages/TripLinks';
import AIRecommendationsPage from './pages/AIRecommendationsPage';
import VotingPage from './pages/VotingPage';
import DashboardPage from './pages/DashboardPage';
import SocialSharePage from './pages/SocialSharePage';
import TripSurvey from './pages/TripSurvey';
import WinnerPage from './pages/WinnerPage';
import DonationPage from './pages/DonationPage';
import PrivacyPolicy from './pages/PrivacyPolicy';
import ContactPage from './pages/ContactPage';

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
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/share" element={<SocialSharePage />} />
        <Route path="/survey" element={<TripSurvey />} />
        <Route path="/winner" element={<WinnerPage />} />
        <Route path="/donate" element={<DonationPage />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/contact" element={<ContactPage />} />
      </Routes>
    </>
  );
};

export default App; 