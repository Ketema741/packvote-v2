import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import App from './App.jsx';
import './styles/variables.css';
import './styles/index.css';
import './styles/App.css';
import reportWebVitals from './reportWebVitals';
import { initMonitoring } from './utils/monitoring';
import * as Sentry from '@sentry/react';

const theme = createTheme({
  typography: {
    fontFamily: '"Inter", "Helvetica", "Arial", sans-serif',
  },
  palette: {
    primary: {
      main: '#FF6B2C',
      light: '#FF8F5E',
      dark: '#E55A1F',
    },
    text: {
      primary: '#1A2238',
      secondary: '#666666',
    },
    background: {
      default: '#FFF8F3',
      paper: '#FFFFFF',
    },
  },
  shape: {
    borderRadius: 8,
  },
  shadows: [
    'none',
    '0 1px 2px rgba(0, 0, 0, 0.05)',
    '0 4px 6px rgba(0, 0, 0, 0.05)',
    '0 10px 15px rgba(0, 0, 0, 0.05)',
    // ... rest of the shadows array
  ],
});

// Initialize monitoring
initMonitoring();

// Initialize Sentry in production environment
if (process.env.NODE_ENV === 'production' && process.env.REACT_APP_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.REACT_APP_SENTRY_DSN,
    integrations: [
      new Sentry.BrowserTracing({
        // Set sampling rate for performance monitoring
        tracesSampleRate: 0.2,
      }),
      new Sentry.Replay({
        // Capture 10% of sessions for replay
        sessionSampleRate: 0.1,
      }),
    ],
    environment: process.env.REACT_APP_ENVIRONMENT || 'production',
    release: process.env.REACT_APP_VERSION || '0.1.0',
  });
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ThemeProvider>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// You can also send to your analytics service or custom endpoint
reportWebVitals((metrics) => {
  // In production, send to monitoring backend
  if (process.env.NODE_ENV === 'production') {
    // Placeholder for sending metrics to backend
    console.log('Web Vitals:', metrics);
  }
}); 