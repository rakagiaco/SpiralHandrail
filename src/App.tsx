// Main App component for the Spiral Handrail 3D Visualizer
// This component manages the global state and renders all sub-components
import React, { useState, useCallback, useEffect } from 'react';
import './App.css';
import { HandrailParameters } from './types/handrail';
import { ThreeJSVisualization } from './components/ThreeJSVisualization';
import { ParametersSection } from './components/ParametersSection';
import { RiseAdjustmentSection } from './components/RiseAdjustmentSection';
import { calculateRiseAtDistance } from './utils/calculations';

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
  // Initialize with your exact reference measurements
  const [manualRiseData, setManualRiseData] = useState<Record<number, number>>({
    // Your exact reference measurements at each inch mark
    0: 1.0,      // Start at pitch block height
    1: 1.5,      // 1" arc distance
    2: 2.0,      // 2" arc distance
    3: 2.5,      // 3" arc distance
    4: 2.875,    // 4" arc distance
    5: 3.3125,   // 5" arc distance
    6: 3.625,    // 6" arc distance
    7: 4.0,      // 7" arc distance
    8: 4.375,    // 8" arc distance
    9: 4.626,    // 9" arc distance
    10: 4.9,     // 10" arc distance
    11: 5.25,    // 11" arc distance
    12: 5.5625,  // 12" arc distance
    13: 5.875,   // 13" arc distance
    14: 6.25,    // 14" arc distance
    15: 6.625,   // 15" arc distance
    16: 7.125,   // 16" arc distance
    17: 7.5625,  // 17" arc distance
    17.5: 8.375  // 17.5" arc distance (end of spiral)
  });
  
  // Calculated rise data based on mathematical formulas
  const [calculatedRiseData, setCalculatedRiseData] = useState<Record<number, number>>({});
  
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

  // Function to calculate rise data based on current parameters
  // This populates the calculatedRiseData with mathematical rise values
  const calculateRiseData = useCallback(() => {
    const newCalculatedData: Record<number, number> = {};
    
    // Calculate rise at every 0.5" increment from 0 to totalArcDistance
    for (let arcDist = 0; arcDist <= parameters.totalArcDistance; arcDist += 0.5) {
      const rise = calculateRiseAtDistance(
        arcDist,
        parameters.totalHelicalRise,
        parameters.totalArcDistance,
        parameters.pitchBlock
      );
      newCalculatedData[arcDist] = rise;
    }
    
    // Also calculate at exact inch marks for the reference chart
    for (let inch = 0; inch <= Math.ceil(parameters.totalArcDistance); inch++) {
      const rise = calculateRiseAtDistance(
        inch,
        parameters.totalHelicalRise,
        parameters.totalArcDistance,
        parameters.pitchBlock
      );
      newCalculatedData[inch] = rise;
    }
    
    setCalculatedRiseData(newCalculatedData);
  }, [parameters.totalHelicalRise, parameters.totalArcDistance, parameters.pitchBlock]);

  // Calculate rise data whenever parameters change
  useEffect(() => {
    calculateRiseData();
  }, [calculateRiseData]);

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
          
          {/* Custom Job Parameters Section */}
          <div className="bg-white rounded-lg p-6 shadow-lg">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">Custom Job Parameters</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Custom Outer Radius (inches)
                </label>
                <input
                  type="number"
                  step="0.001"
                  value={parameters.customOuterRadius || 4.625}
                  onChange={(e) => handleParameterChange('customOuterRadius', parseFloat(e.target.value) || 4.625)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Custom Inner Radius (inches)
                </label>
                <input
                  type="number"
                  step="0.001"
                  value={parameters.customInnerRadius || 4.625}
                  onChange={(e) => handleParameterChange('customInnerRadius', parseFloat(e.target.value) || 4.625)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Custom Easement Angle (degrees)
                </label>
                <input
                  type="number"
                  step="0.001"
                  value={parameters.customEasementAngle || -35.08}
                  onChange={(e) => handleParameterChange('customEasementAngle', parseFloat(e.target.value) || -35.08)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <button
                onClick={() => setParameters(defaultParameters)}
                className="w-full bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600 transition-colors"
              >
                Reset to Defaults
              </button>
            </div>
          </div>
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