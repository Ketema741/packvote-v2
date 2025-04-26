import React from 'react';
import { render as rtlRender } from '@testing-library/react';
import { act } from 'react';

/**
 * Custom render function that wraps the provided UI in an act() call
 * to avoid the React act() warnings
 * @param {React.ReactElement} ui The component to render
 * @param {object} options Optional render options
 * @returns The rendered component with utilities from RTL
 */
async function render(ui, options = {}) {
  let result;
  await act(async () => {
    result = rtlRender(ui, options);
  });
  return result;
}

// Re-export everything from RTL
export * from '@testing-library/react';

// Export the custom render function
export { render }; 