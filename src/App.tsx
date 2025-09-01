// Main App component for the Spiral Handrail 3D Visualizer
// This component manages the global state and renders all sub-components
import React, { useState, useCallback } from 'react';
import { HandrailParameters } from './types/handrail';
import { ThreeJSVisualization } from './components/ThreeJSVisualization';
import { ParametersSection } from './components/ParametersSection';
import { RiseAdjustmentSection } from './components/RiseAdjustmentSection';

// Default parameters for a standard spiral handrail
// These values represent a typical 220° spiral with 17.5" arc distance
const defaultParameters: HandrailParameters = {
  totalDegrees: 220,        // Total rotation in degrees
  totalHelicalRise: 7.375,  // Total height gain in inches
  totalArcDistance: 17.5,   // Total arc length in inches
  totalSegments: 10,        // Number of segments to divide the spiral
  pitchBlock: 1,            // Height of pitch block at bottom in inches
  bottomLength: 1.5,        // Length of bottom easement in segments
  topLength: 2,             // Length of top easement in segments
  bottomOffset: 1.5,        // Offset distance for bottom center in inches
  topOffset: 1.875,         // Offset distance for top center in inches
  // Custom parameters for dynamic adjustment
  customOuterRadius: 4.625, // Custom outer radius override in inches
  customInnerRadius: 4.625, // Custom inner radius override in inches
  customEasementAngle: -35.08 // Custom easement angle override in degrees
};

function App() {
  // Global state management for the entire application
  
  // Current handrail parameters (can be modified by user)
  const [parameters, setParameters] = useState<HandrailParameters>(defaultParameters);
  
  // Manual rise data entered by the user (overrides calculated values)
  const [manualRiseData, setManualRiseData] = useState<Record<number, number>>({});
  
  // Calculated rise data based on mathematical formulas
  const [calculatedRiseData] = useState<Record<number, number>>({});
  
  // Debug mode toggle - controls visibility of debugging information
  const [debugMode, setDebugMode] = useState<boolean>(false);
  
  // Overlay visibility toggle - controls the debug information overlay
  const [showOverlay, setShowOverlay] = useState<boolean>(false);

  // Callback function to update individual handrail parameters
  // This function is passed down to child components for parameter modification
  const handleParameterChange = useCallback((key: keyof HandrailParameters, value: number) => {
    setParameters(prev => ({ ...prev, [key]: value }));
  }, []);

  // Callback function to update manual rise data
  // This allows users to override calculated rise values with custom measurements
  const handleRiseChange = useCallback((arcDistance: number, value: number) => {
    setManualRiseData(prev => ({ ...prev, [arcDistance]: value }));
  }, []);

  // Callback function to reset manual rise data
  // This clears all manual overrides and returns to calculated values
  const handleResetRise = useCallback(() => {
    setManualRiseData({});
  }, []);

  // Callback function to toggle debug mode
  // This controls whether debugging information is visible in the 3D scene
  const handleDebugModeChange = useCallback((newDebugMode: boolean) => {
    setDebugMode(newDebugMode);
  }, []);

  // Callback function to toggle overlay visibility
  // This controls whether the debug information overlay is shown
  const handleShowOverlayChange = useCallback((newShowOverlay: boolean) => {
    setShowOverlay(newShowOverlay);
  }, []);

  return (
    <div className="App">
      {/* Main header for the application */}
      <header className="App-header">
        <h1>Spiral Handrail 3D Visualizer</h1>
        <p>Professional tool for designing and visualizing spiral handrails</p>
      </header>

      {/* Main content area with all the application sections */}
      <main className="App-main">
        {/* Left panel: Parameter controls and rise data input */}
        <div className="left-panel">
          {/* Section for adjusting handrail parameters (dimensions, angles, etc.) */}
          <ParametersSection
            parameters={parameters}
            onParameterChange={handleParameterChange}
          />
          
          {/* Section for entering manual rise data points */}
          <RiseAdjustmentSection
            totalArcDistance={parameters.totalArcDistance}
            manualRiseData={manualRiseData}
            calculatedRiseData={calculatedRiseData}
            onRiseChange={handleRiseChange}
            onReset={handleResetRise}
          />
        </div>

        {/* Right panel: 3D visualization and debug controls */}
        <div className="right-panel">
          {/* Main 3D visualization component using Three.js */}
          <ThreeJSVisualization
            parameters={parameters}
            manualRiseData={manualRiseData}
            calculatedRiseData={calculatedRiseData}
            debugMode={debugMode}
            showOverlay={showOverlay}
            onDebugModeChange={handleDebugModeChange}
            onShowOverlayChange={handleShowOverlayChange}
          />
        </div>
      </main>
    </div>
  );
}

export default App;