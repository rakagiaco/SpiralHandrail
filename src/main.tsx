// Main entry point for the Spiral Handrail 3D Visualizer application
// This file sets up React with StrictMode for better development debugging
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

// Get the root DOM element where the React app will be mounted
const rootElement = document.getElementById('root');

// Safety check: ensure the root element exists before creating React root
if (!rootElement) {
  throw new Error('Root element not found - cannot mount React application');
}

// Create the React root and render the main App component
// StrictMode helps catch potential problems during development
const root = createRoot(rootElement);
root.render(
  <StrictMode>
    <App />
  </StrictMode>
);