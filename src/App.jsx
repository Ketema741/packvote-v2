import React, { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { setupMonitoring } from './utils/monitoring';
import { Box, Button } from '@mui/material';
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
import DocsPage from './pages/DocsPage';
import NextStepPage from './pages/NextStepPage';
import UnsplashApiTest from './components/UnsplashApiTest';
import DevSettings from './components/DevSettings';

const App = () => {
  // Initialize monitoring on app start
  useEffect(() => {
    setupMonitoring();
  }, []);

  // Determine if we're in development environment
  const isDevelopment = process.env.NODE_ENV === 'development';

  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/create-trip" element={<CreateTrip />} />
        <Route path="/trip-links" element={<TripLinks />} />
        <Route path="/recommendations" element={<AIRecommendationsPage />} />
        <Route path="/recommendations/:tripId" element={<AIRecommendationsPage />} />
        <Route path="/voting" element={<VotingPage />} />
        <Route path="/voting/:tripId" element={<VotingPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/dashboard/:tripId" element={<DashboardPage />} />
        <Route path="/share" element={<SocialSharePage />} />
        <Route path="/survey" element={<TripSurvey />} />
        <Route path="/survey/:tripId/:participantId" element={<TripSurvey />} />
        <Route path="/winner" element={<WinnerPage />} />
        <Route path="/winner/:tripId" element={<WinnerPage />} />
        <Route path="/donate" element={<DonationPage />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/docs" element={<DocsPage />} />
        <Route path="/next-step" element={<NextStepPage />} />

        {/* Development-only routes */}
        {isDevelopment && (
          <>
            <Route path="/dev/image-test" element={<UnsplashApiTest />} />
            <Route path="/dev/settings" element={<DevSettings />} />
          </>
        )}
      </Routes>

      {/* Show a small dev settings button in development mode */}
      {isDevelopment && (
        <Box
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            zIndex: 9999
          }}
        >
          <Button
            variant="contained"
            size="small"
            color="warning"
            onClick={() => window.location.href = '/dev/settings'}
            sx={{ borderRadius: 8, px: 1, py: 0.5, fontSize: '0.7rem' }}
          >
            Dev Settings
          </Button>
        </Box>
      )}
    </>
  );
};

export default App;