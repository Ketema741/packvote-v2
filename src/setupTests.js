// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Mock jsPDF globally to prevent canvas issues in tests
jest.mock('jspdf', () => {
  return jest.fn().mockImplementation(() => ({
    setFont: jest.fn(),
    setFillColor: jest.fn(),
    rect: jest.fn(),
    setTextColor: jest.fn(),
    setFontSize: jest.fn(),
    text: jest.fn(),
    roundedRect: jest.fn(),
    setDrawColor: jest.fn(),
    setLineWidth: jest.fn(),
    addImage: jest.fn(),
    splitTextToSize: jest.fn(() => ['line1', 'line2']),
    save: jest.fn()
  }));
});

// Suppress act() warnings
const originalError = console.error;
console.error = (...args) => {
  if (/Warning.*not wrapped in act/.test(args[0])) {
    return;
  }
  if (/Warning.*ReactDOMTestUtils.act.*deprecated/.test(args[0])) {
    return;
  }
  originalError.call(console, ...args);
};