# PackVote UI

This repository contains the frontend interface for the PackVote App. The application provides a user-friendly interface for creating group trips, collecting participant preferences through surveys, and managing the trip planning process.

## Features

- Create new trips with multiple participants
- Send and manage survey links for participants
- Collect travel preferences, budget ranges, and available dates
- View and manage trip details
- Real-time validation and error handling
- Responsive design for mobile and desktop

## Structure
- `src/components/` - Reusable UI components
  - `Navbar.jsx` - Navigation bar component
  - `TravelPlanForm.jsx` - Form for creating travel plans
- `src/pages/` - Page components
  - `CreateTrip.jsx` - Trip creation page
  - `TripSurvey.jsx` - Survey form for participants
  - `DashboardPage.jsx` - Trip management dashboard
  - `VotingPage.jsx` - Destination voting interface
  - `WinnerPage.jsx` - Trip results display
- `src/styles/` - CSS and styling files
- `src/utils/` - Frontend utility functions
  - `api.js` - API integration functions
  - `validation.js` - Form validation utilities
- `public/` - Static assets and HTML templates
- `tests/` - Test files for components and pages

## Setup

1. Clone the repository:
```bash
git clone https://github.com/your-org/packvote-ui.git
cd packvote-ui
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```
Edit `.env` with your configuration:
```
REACT_APP_API_URL=your_api_url
```

4. Start development server:
```bash
npm start
```

## Testing

The project uses Jest and React Testing Library for testing. Tests are located in `__tests__` directories next to the components they test.

1. Run all tests:
```bash
npm test
```

2. Run tests with coverage:
```bash
npm test -- --coverage
```

3. Run tests in watch mode:
```bash
npm test -- --watch
```

### Test Coverage

The test suite covers:
- Component rendering and interactions
- Form validation and submission
- API integration
- Error handling
- User interactions and navigation
- Responsive design behavior

## Development

This is a React-based application using:
- React Router for navigation
- React Testing Library for testing
- CSS Modules for styling
- Axios for API requests

### Key Components

- `CreateTrip`: Handles trip creation with participant management
- `TripSurvey`: Collects participant preferences and availability
- `Dashboard`: Displays trip status and management options
- `VotingPage`: Facilitates destination voting
- `WinnerPage`: Shows final trip details

### Best Practices

1. Write tests for new components
2. Follow component structure guidelines
3. Use TypeScript for type safety
4. Maintain responsive design
5. Handle loading and error states

## Contributing

1. Create a new branch for your feature
2. Write tests for new functionality
3. Ensure all tests pass
4. Submit a pull request

## License

Proprietary - All rights reserved