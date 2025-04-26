import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { act } from 'react';
import Navbar from './components/Navbar';

// Mock the useNavigate hook
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
}));

test('renders Navbar with correct title', () => {
  act(() => {
    render(
      <BrowserRouter>
        <Navbar />
      </BrowserRouter>
    );
  });
  const titleElement = screen.getByText(/Group Travel AI/i);
  expect(titleElement).toBeInTheDocument();
}); 