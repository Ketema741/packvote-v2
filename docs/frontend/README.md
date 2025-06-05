# PackVote Frontend Documentation

**Complete React frontend documentation for the PackVote platform**

The PackVote UI provides an intuitive, responsive interface for group trip planning, from initial setup through AI recommendations to collaborative voting.

## 🎯 Overview

### Application Structure
- **Framework**: React 18 with JavaScript
- **UI Library**: Material-UI (MUI) for consistent design
- **Routing**: React Router for navigation
- **State Management**: React hooks (local component state)
- **Build Tool**: Create React App
- **Testing**: Jest and React Testing Library
- **Survey System**: SurveyJS for multi-step surveys

### Core User Flows
1. **Trip Creation** - Organizers set up trips and add participants
2. **Survey Collection** - Participants complete preference surveys via SMS links
3. **AI Recommendations** - AI generates destination recommendations
4. **Collaborative Voting** - Participants rank and vote on options
5. **Results & Planning** - View results and next steps

## 📱 Application Pages & Components

### 🏠 Landing & Navigation

#### LandingPage (`src/pages/LandingPage.jsx`)
**Main entry point for new users**

**Features:**
- Hero section with value proposition
- "Create Trip" call-to-action
- Feature highlights and benefits
- Responsive design for mobile/desktop

**Key Components:**
```jsx
// Hero section with primary CTA
<Hero>
  <Typography variant="h2">Plan the Perfect Group Trip</Typography>
  <Typography variant="h6">AI-powered recommendations based on everyone's preferences</Typography>
  <Button href="/create-trip">Start Planning</Button>
</Hero>

// Feature showcase
<FeatureGrid>
  <Feature icon="🤖" title="AI Recommendations" />
  <Feature icon="📱" title="SMS Surveys" />
  <Feature icon="🗳️" title="Democratic Voting" />
</FeatureGrid>
```

#### Navbar (`src/components/Navbar.jsx`)
**Primary navigation component**

**Features:**
- Responsive navigation menu
- Logo and branding
- Primary action buttons
- Mobile hamburger menu

### 🛠️ Trip Management

#### CreateTrip (`src/pages/CreateTrip.jsx`)
**Trip creation and participant management**

**Features:**
- Trip name and details form
- Dynamic participant addition/removal
- Phone number validation
- Real-time form validation

**Form Structure:**
```jsx
const TripForm = () => {
  const [tripData, setTripData] = useState({
    tripName: '',
    organizerId: '',
    participants: [{ name: '', phone: '' }]
  });

  // Add participant functionality
  const addParticipant = () => {
    setTripData(prev => ({
      ...prev,
      participants: [...prev.participants, { name: '', phone: '' }]
    }));
  };

  // Remove participant functionality
  const removeParticipant = (index) => {
    setTripData(prev => ({
      ...prev,
      participants: prev.participants.filter((_, i) => i !== index)
    }));
  };
};
```

**Validation Rules:**
- Trip name: 1-200 characters
- Participant name: 1-100 characters
- Phone: Valid international format
- Minimum 1 participant required

#### TripLinks (`src/pages/TripLinks.jsx`)
**SMS distribution and participant management**

**Features:**
- Participant list with response status
- Individual and bulk SMS sending
- Real-time status updates
- Add new participants

**SMS Management:**
```jsx
const SMSManagement = ({ participants, tripId }) => {
  const [sendingStatus, setSendingStatus] = useState({});

  const sendSMS = async (participantId) => {
    setSendingStatus(prev => ({ ...prev, [participantId]: 'sending' }));
    try {
      await api.sendSMS(participantId);
      setSendingStatus(prev => ({ ...prev, [participantId]: 'sent' }));
    } catch (error) {
      setSendingStatus(prev => ({ ...prev, [participantId]: 'error' }));
    }
  };

  const sendAllSMS = async () => {
    try {
      await api.sendAllSMS(tripId);
      // Update all participant statuses
    } catch (error) {
      // Handle error
    }
  };
};
```

### 📝 Survey System

#### TripSurvey (`src/pages/TripSurvey.jsx`)
**Multi-step survey for collecting participant preferences**

**Survey Structure (7 Steps):**

1. **Personal Information**
   - Name confirmation
   - Current location

2. **Budget Preferences**
   - Budget tier selection (Budget/Moderate/Luxury)
   - Spending comfort level

3. **Date Preferences**
   - Preferred travel dates
   - Blackout dates
   - Trip duration (min/max days)

4. **Vibe & Style Preferences**
   - Trip style selection (Adventure, Culture, Relaxation, etc.)
   - Activity preferences

5. **Past Travel Experience**
   - Favorite past destinations
   - Places to revisit
   - Experiences to avoid

6. **Wishlist & Activities**
   - Dream destinations
   - Must-do activities
   - Special interests

7. **Final Priorities**
   - Ranking of importance factors
   - Additional preferences

**Survey Implementation:**
```jsx
const TripSurvey = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [surveyData, setSurveyData] = useState({
    name: '',
    liveLocation: '',
    budget: '',
    preferredDates: [],
    blackoutDates: [],
    minTripDays: 3,
    maxTripDays: 14,
    vibeChoices: [],
    // ... other fields
  });

  const handleStepComplete = (stepData) => {
    setSurveyData(prev => ({ ...prev, ...stepData }));
    if (currentStep < 7) {
      setCurrentStep(prev => prev + 1);
    } else {
      submitSurvey();
    }
  };

  const submitSurvey = async () => {
    try {
      await api.submitSurveyResponse(surveyData);
      navigate('/next-step');
    } catch (error) {
      // Handle submission error
    }
  };
};
```

**Validation Per Step:**
- **Step 1**: Name and location required
- **Step 2**: Budget selection required
- **Step 3**: Date validation, min ≤ max days
- **Step 4**: At least one vibe selection
- **Steps 5-7**: Optional but encouraged

### 🤖 AI Recommendations

#### AIRecommendationsPage (`src/pages/AIRecommendationsPage.jsx`)
**AI recommendation generation and display**

**Features:**
- AI provider and model selection
- Real-time generation progress
- Recommendation display cards
- Regeneration with different providers
- Cost and usage tracking

**Generation Interface:**
```jsx
const AIRecommendationGenerator = ({ tripId }) => {
  const [generating, setGenerating] = useState(false);
  const [recommendations, setRecommendations] = useState([]);
  const [progress, setProgress] = useState(0);

  const generateRecommendations = async (options) => {
    setGenerating(true);
    setProgress(0);

    try {
      // Start generation
      const response = await api.generateRecommendations({
        tripId,
        provider: options.provider,
        model: options.model,
        numRecommendations: options.count
      });

      setRecommendations(response.recommendations);
    } catch (error) {
      // Handle generation error
    } finally {
      setGenerating(false);
    }
  };
};
```

**AI Loading States:**
```jsx
const AILoadingIndicator = ({ progress, estimatedTime }) => {
  return (
    <Box>
      <Typography variant="h6">AI is analyzing preferences...</Typography>
      <LinearProgress variant="determinate" value={progress} />
      <Typography variant="caption">
        Estimated time: {estimatedTime}s
      </Typography>
      
      <StepIndicator steps={[
        { label: "Analyzing preferences", completed: progress > 25 },
        { label: "Finding destinations", completed: progress > 50 },
        { label: "Optimizing for budget", completed: progress > 75 },
        { label: "Finalizing recommendations", completed: progress > 95 }
      ]} />
    </Box>
  );
};
```

**Recommendation Cards:**
```jsx
const RecommendationCard = ({ recommendation }) => {
  return (
    <Card>
      <CardContent>
        <Typography variant="h5">
          {recommendation.destination}, {recommendation.country}
        </Typography>
        
        <Chip label={recommendation.budgetTier} color="primary" />
        
        <Typography variant="body1">
          {recommendation.description}
        </Typography>
        
        <Box>
          <Typography variant="h6">Perfect for:</Typography>
          {recommendation.matchingVibes.map(vibe => (
            <Chip key={vibe} label={vibe} variant="outlined" />
          ))}
        </Box>
        
        <Box>
          <Typography variant="h6">Why we recommend this:</Typography>
          <Typography variant="body2">
            {recommendation.whyRecommended}
          </Typography>
        </Box>
        
        <ActivityList activities={recommendation.activities} />
        <CostBreakdown costs={recommendation.estimatedCosts} />
      </CardContent>
    </Card>
  );
};
```

### 🗳️ Voting System

#### VotingPage (`src/pages/VotingPage.jsx`)
**Collaborative voting interface**

**Features:**
- Drag-and-drop ranking interface
- Real-time vote submission
- Progress tracking
- Recommendation comparison

**Voting Interface:**
```jsx
const VotingInterface = ({ recommendations, onVoteSubmit }) => {
  const [rankings, setRankings] = useState([]);

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const items = Array.from(rankings);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setRankings(items);
  };

  const submitVotes = async () => {
    const votes = rankings.map((rec, index) => ({
      recommendationId: rec.id,
      rank: index + 1
    }));

    await onVoteSubmit(votes);
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId="recommendations">
        {(provided) => (
          <Box {...provided.droppableProps} ref={provided.innerRef}>
            {rankings.map((rec, index) => (
              <Draggable key={rec.id} draggableId={rec.id} index={index}>
                {(provided) => (
                  <Box
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                  >
                    <RankingCard
                      recommendation={rec}
                      rank={index + 1}
                    />
                  </Box>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </Box>
        )}
      </Droppable>
    </DragDropContext>
  );
};
```

### 📊 Dashboard & Results

#### DashboardPage (`src/pages/DashboardPage.jsx`)
**Real-time trip progress and management**

**Features:**
- Trip overview and statistics
- Participant response tracking
- AI generation status
- Voting progress
- Administrative controls

**Dashboard Components:**
```jsx
const TripDashboard = ({ tripId }) => {
  const [tripData, setTripData] = useState(null);
  const [stats, setStats] = useState({});

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={4}>
        <StatsCard
          title="Survey Responses"
          value={`${stats.responsesReceived}/${stats.totalParticipants}`}
          percentage={stats.completionRate}
        />
      </Grid>
      
      <Grid item xs={12} md={4}>
        <StatsCard
          title="Voting Progress"
          value={`${stats.votesReceived}/${stats.totalParticipants}`}
          percentage={stats.votingCompletionRate}
        />
      </Grid>
      
      <Grid item xs={12} md={4}>
        <StatsCard
          title="AI Recommendations"
          value={stats.recommendationsGenerated}
          status={stats.aiStatus}
        />
      </Grid>
      
      <Grid item xs={12}>
        <ParticipantTable
          participants={tripData.participants}
          onResendSMS={handleResendSMS}
        />
      </Grid>
    </Grid>
  );
};
```

#### WinnerPage (`src/pages/WinnerPage.jsx`)
**Final results and next steps**

**Features:**
- Winning destination announcement
- Voting results breakdown
- Next steps and planning resources
- Social sharing options

**Results Display:**
```jsx
const WinnerAnnouncement = ({ winner, votingResults }) => {
  return (
    <Box>
      <Typography variant="h3" align="center">
        🎉 Your Group is Going to...
      </Typography>
      
      <Card elevation={3}>
        <CardContent>
          <Typography variant="h4">
            {winner.destination}, {winner.country}
          </Typography>
          
          <Typography variant="h6">
            Final Score: {winner.finalScore}/10
          </Typography>
          
          <VotingBreakdown results={votingResults} />
          
          <NextStepsActions
            destination={winner}
            onBookingClick={handleBookingClick}
            onShareClick={handleShare}
          />
        </CardContent>
      </Card>
    </Box>
  );
};
```

### 📱 Social & Communication

#### SocialSharePage (`src/pages/SocialSharePage.jsx`)
**Social sharing and communication tools**

**Features:**
- Winner announcement sharing
- Social media integration
- Group communication tools
- Planning resource links

#### NextStepPage (`src/pages/NextStepPage.jsx`)
**Post-survey guidance**

**Features:**
- Survey completion confirmation
- Next steps explanation
- Trip timeline
- Contact information

### 🔧 Development & Testing Components

#### DevSettings (`src/components/DevSettings.jsx`)
**Development configuration and testing tools**

**Features (Development Only):**
- API endpoint configuration
- Test data generation
- Component playground
- Debug tools

#### UnsplashApiTest (`src/components/UnsplashApiTest.jsx`)
**Image API testing component**

**Features:**
- Unsplash integration testing
- Image search and display
- API response debugging

## 🎨 Styling & Theme

### Material-UI Theme
```jsx
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
  typography: {
    fontFamily: 'Roboto, Arial, sans-serif',
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
  },
});
```

### Responsive Design
- **Mobile-first approach**
- **Breakpoints**: xs, sm, md, lg, xl
- **Grid system**: Material-UI Grid
- **Typography scales** for different screen sizes

## 🔄 State Management

### React Context Usage
```jsx
// Trip context for sharing trip data
const TripContext = createContext();

export const TripProvider = ({ children }) => {
  const [currentTrip, setCurrentTrip] = useState(null);
  const [participants, setParticipants] = useState([]);

  const value = {
    currentTrip,
    setCurrentTrip,
    participants,
    setParticipants,
  };

  return (
    <TripContext.Provider value={value}>
      {children}
    </TripContext.Provider>
  );
};

export const useTrip = () => {
  const context = useContext(TripContext);
  if (!context) {
    throw new Error('useTrip must be used within a TripProvider');
  }
  return context;
};
```

### Local Storage Integration
```jsx
// Persist trip data across sessions
const usePersistentTrip = () => {
  const [tripData, setTripData] = useState(() => {
    const saved = localStorage.getItem('currentTrip');
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    if (tripData) {
      localStorage.setItem('currentTrip', JSON.stringify(tripData));
    }
  }, [tripData]);

  return [tripData, setTripData];
};
```

## 🌐 API Integration

### API Service Layer
```jsx
// src/services/api.js
class APIService {
  constructor() {
    this.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
  }

  async createTrip(tripData) {
    const response = await fetch(`${this.baseURL}/api/trips`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tripData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  }

  async generateRecommendations(options) {
    const response = await fetch(`${this.baseURL}/api/recommendations/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  }

  // ... other API methods
}

export const api = new APIService();
```

### Error Handling
```jsx
const useAPIError = () => {
  const [error, setError] = useState(null);

  const handleAPICall = async (apiCall) => {
    try {
      setError(null);
      return await apiCall();
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  return { error, handleAPICall };
};
```

## 📱 Responsive Design Patterns

### Mobile Navigation
```jsx
const ResponsiveNavbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <AppBar>
      <Toolbar>
        {isMobile && (
          <IconButton onClick={() => setMobileOpen(!mobileOpen)}>
            <MenuIcon />
          </IconButton>
        )}
        
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          PackVote
        </Typography>
        
        {!isMobile && <DesktopMenu />}
      </Toolbar>
      
      {isMobile && (
        <Drawer
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
        >
          <MobileMenu />
        </Drawer>
      )}
    </AppBar>
  );
};
```

### Responsive Cards
```jsx
const ResponsiveCard = ({ children }) => {
  return (
    <Card
      sx={{
        maxWidth: { xs: '100%', sm: 400, md: 500 },
        margin: { xs: 1, sm: 2 },
        padding: { xs: 1, sm: 2, md: 3 },
      }}
    >
      {children}
    </Card>
  );
};
```

## 🧪 Testing Strategy

### Component Testing
```jsx
// Example test for CreateTrip component
import { render, screen, fireEvent } from '@testing-library/react';
import CreateTrip from '../pages/CreateTrip';

describe('CreateTrip Component', () => {
  test('renders trip creation form', () => {
    render(<CreateTrip />);
    
    expect(screen.getByLabelText('Trip Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Participant Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Phone Number')).toBeInTheDocument();
  });

  test('adds new participant when button clicked', () => {
    render(<CreateTrip />);
    
    const addButton = screen.getByText('Add Participant');
    fireEvent.click(addButton);
    
    const nameInputs = screen.getAllByLabelText('Participant Name');
    expect(nameInputs).toHaveLength(2);
  });

  test('validates phone number format', async () => {
    render(<CreateTrip />);
    
    const phoneInput = screen.getByLabelText('Phone Number');
    fireEvent.change(phoneInput, { target: { value: 'invalid' } });
    
    const submitButton = screen.getByText('Create Trip');
    fireEvent.click(submitButton);
    
    expect(await screen.findByText('Invalid phone number format')).toBeInTheDocument();
  });
});
```

### Integration Testing
```jsx
// Test complete user flow
describe('Trip Creation Flow', () => {
  test('complete trip creation and SMS sending', async () => {
    // Mock API responses
    jest.spyOn(api, 'createTrip').mockResolvedValue({ tripId: '123' });
    jest.spyOn(api, 'sendAllSMS').mockResolvedValue({ status: 'success' });

    render(<App />);

    // Navigate to create trip
    fireEvent.click(screen.getByText('Create Trip'));

    // Fill out form
    fireEvent.change(screen.getByLabelText('Trip Name'), {
      target: { value: 'Test Trip' }
    });

    // Add participant
    fireEvent.change(screen.getByLabelText('Participant Name'), {
      target: { value: 'John Doe' }
    });

    fireEvent.change(screen.getByLabelText('Phone Number'), {
      target: { value: '+1234567890' }
    });

    // Submit form
    fireEvent.click(screen.getByText('Create Trip'));

    // Verify navigation to trip links page
    expect(await screen.findByText('Send Survey Links')).toBeInTheDocument();
  });
});
```

## 🚀 Build & Deployment

### Build Configuration
```json
{
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject"
  }
}
```

### Environment Variables
```env
# .env.development
REACT_APP_API_URL=http://localhost:8000
REACT_APP_ENVIRONMENT=development

# .env.production
REACT_APP_API_URL=https://api.packvote.com
REACT_APP_ENVIRONMENT=production
```

### Performance Optimization
- **Code splitting** with React.lazy()
- **Image optimization** with responsive images
- **Bundle analysis** with webpack-bundle-analyzer
- **Caching strategies** for API responses

---

*For development setup and contribution guidelines, see the [Development Guide](../development/) section.* 