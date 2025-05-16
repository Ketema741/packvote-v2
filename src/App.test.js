import '@testing-library/jest-dom';
import { render, screen } from './test-utils/test-utils';
import { BrowserRouter } from 'react-router-dom';
import Navbar from './components/Navbar';
import App from './App';
import * as monitoring from './utils/monitoring';

// Mock the useNavigate hook
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
}));

// Mock the monitoring setup function
jest.mock('./utils/monitoring', () => ({
  setupMonitoring: jest.fn(),
}));

test('renders Navbar with correct title', async () => {
  await render(
    <BrowserRouter>
      <Navbar />
    </BrowserRouter>
  );
  const titleElement = screen.getByText(/PackVote/i);
  expect(titleElement).toBeInTheDocument();
});

test('initializes monitoring on app mount', async () => {
  await render(
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
  expect(monitoring.setupMonitoring).toHaveBeenCalled();
}); 