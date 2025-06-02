import React, { useState } from 'react';

const TravelPlanForm = () => {
  const [formData, setFormData] = useState({
    destination: '',
    dates: '',
    budget: '',
    preferences: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    // Placeholder for form submission
    console.log('Form submitted:', formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label htmlFor="destination">Destination:</label>
        <input
          type="text"
          id="destination"
          value={formData.destination}
          onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
        />
      </div>
      {/* Add more form fields as needed */}
      <button type="submit">Generate Travel Plan</button>
    </form>
  );
};

export default TravelPlanForm;