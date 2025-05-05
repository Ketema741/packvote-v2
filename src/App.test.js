import '@testing-library/jest-dom';
import { render, screen } from '../src/test-utils/test-utils';
import { BrowserRouter } from 'react-router-dom';
import Navbar from './components/Navbar';

// Mock the useNavigate hook
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
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