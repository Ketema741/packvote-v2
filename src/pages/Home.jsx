import React from 'react';
import TravelPlanForm from '../components/TravelPlanForm';

const Home = () => {
  return (
    <div className="home-container">
      <header>
        <h1>Group Travel App</h1>
        <p>Plan your perfect group trip with AI assistance</p>
      </header>
      <main>
        <TravelPlanForm />
      </main>
    </div>
  );
};

export default Home; 