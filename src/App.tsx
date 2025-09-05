// Main App component for the Spiral Handrail 3D Visualizer
// This component manages the global state and renders all sub-components
import { useState, useCallback, useEffect } from 'react';
import './App.css';
import { HandrailParameters } from './types/handrail';
import { ThreeJSVisualization } from './components/ThreeJSVisualization';
import { ParametersSection } from './components/ParametersSection';
import { RiseAdjustmentSection } from './components/RiseAdjustmentSection';

import { calculateRiseAtDistance, calculateInsideLineData, calculateInnerRadiusFromRunDistance } from './utils/calculations';

// Default parameters for a standard spiral handrail
// These values represent a typical 220° spiral with 17.5" arc distance
const defaultParameters: HandrailParameters = {
  totalDegrees: 220,        // Total rotation in degrees
  totalHelicalRise: 7.375,  // Total height gain in inches
  totalArcDistance: 17.5,   // Total arc length in inches
  totalSegments: 10,        // Number of segments to divide the spiral
  insideArcDistance: 10.5,  // Total arc length for inside line in inches
  insideRunDistance: 20.1,  // Total run distance for inside line in inches (calculated from 5.25" radius)
  pitchBlock: 1,            // Height of pitch block at bottom in inches
  bottomLength: 1.5,        // Length of bottom easement in segments
  topLength: 2,             // Length of top easement in segments
  bottomOffset: 1.5,        // Offset distance for bottom center in inches
  topOffset: 1.875,         // Offset distance for top center in inches
  // Custom parameters for dynamic adjustment
  customOuterRadius: 4.625, // Custom outer radius override in inches
  customInnerRadius: 10.5,  // Custom inner radius override in inches (diameter)
  customEasementAngle: -35.08 // Custom easement angle override in degrees
};

function App() {
  // Global state management for the entire application
  
  // Current handrail parameters (can be modified by user)
  const [parameters, setParameters] = useState<HandrailParameters>(defaultParameters);
  
  // Manual rise data entered by the user (overrides calculated values)
  // Initialize empty to use calculated values by default (same as "Reset to Calculated Values")
  const [manualRiseData, setManualRiseData] = useState<Record<number, number>>({});
  
  // Calculated rise data based on mathematical formulas
  const [calculatedRiseData, setCalculatedRiseData] = useState<Record<number, number>>({});
  
  // Inside line data based on 3D model parameters
  const [insideLineData, setInsideLineData] = useState<Record<number, { rise: number; run: number; angle: number }>>({});
  
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

  // Function to calculate inside line data based on 3D model parameters
  // This populates the insideLineData with rise, run, and angle values
  const calculateInsideLineDataCallback = useCallback(() => {
    const newInsideLineData = calculateInsideLineData(
      parameters.totalHelicalRise,
      parameters.insideArcDistance,
      parameters.insideRunDistance,
      parameters.totalDegrees,
      parameters.pitchBlock
    );
    
    setInsideLineData(newInsideLineData);
    
    // Calculate the inner radius from the user-provided run distance
    const calculatedInnerRadius = calculateInnerRadiusFromRunDistance(
      parameters.insideRunDistance,
      parameters.totalDegrees
    );
    
    // Update the custom inner radius parameter
    setParameters(prev => ({ ...prev, customInnerRadius: calculatedInnerRadius }));
  }, [parameters.totalHelicalRise, parameters.insideArcDistance, parameters.insideRunDistance, parameters.totalDegrees, parameters.pitchBlock]);

  // Calculate rise data whenever parameters change
  useEffect(() => {
    calculateRiseData();
  }, [calculateRiseData]);

  // Calculate inside line data whenever parameters change
  useEffect(() => {
    calculateInsideLineDataCallback();
  }, [calculateInsideLineDataCallback]);

  return (
    <div className="App">
      {/* Main header for the application */}
      <header className="App-header">
        <h1>Spiral Handrail 3D Visualizer</h1>
        <p>Professional tool for designing and visualizing spiral handrails</p>
      </header>

      {/* Main content area with all the application sections */}
      <main className="App-main">
        {/* Left section: Debug tools and parameters */}
        <div className="left-section">
          {/* Debug Controls */}
          <div className="bg-gray-800 text-white rounded-lg p-4 mb-4">
            <h3 className="text-lg font-bold mb-3 text-yellow-400">🐛 Debug Controls</h3>
            <div className="space-y-3">
              <button
                onClick={() => handleDebugModeChange(!debugMode)}
                className={`w-full px-4 py-2 rounded font-bold ${
                  debugMode ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                }`}
              >
                {debugMode ? 'DEBUG ON' : 'DEBUG OFF'}
              </button>
              <button
                onClick={() => handleShowOverlayChange(!showOverlay)}
                className={`w-full px-4 py-2 rounded font-bold ${
                  showOverlay ? 'bg-blue-600 text-white' : 'bg-gray-500 text-white'
                }`}
              >
                {showOverlay ? 'OVERLAY ON' : 'OVERLAY OFF'}
              </button>
            </div>
          </div>
          {/* Section for adjusting handrail parameters (dimensions, angles, etc.) */}
          <ParametersSection
            parameters={parameters}
            onParameterChange={handleParameterChange}
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
                    <p className="text-xs text-gray-500 mt-1">Default: 4.625" (standard handrail)</p>
                  </div>
                  
                  <div>
                                         <label className="block text-sm font-medium text-gray-700 mb-1">
                      Custom Inner Radius (inches)
                    </label>
                    <input
                      type="number"
                      step="0.001"
                      value={parameters.customInnerRadius || 10.5}
                      onChange={(e) => handleParameterChange('customInnerRadius', parseFloat(e.target.value) || 10.5)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Default: 10.5" diameter (5.25" radius from center)</p>
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
                <p className="text-xs text-gray-500 mt-1">Default: -35.08° (standard stair angle)</p>
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

        {/* Right section: Large 3D visualization with built-in debug info */}
        <div className="right-section">
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

        {/* Bottom section: Charts spread out below visualizer */}
        <div className="bottom-section">
          {/* Section for entering manual rise data points */}
          <RiseAdjustmentSection
            parameters={parameters}
            totalArcDistance={parameters.totalArcDistance}
            manualRiseData={manualRiseData}
            calculatedRiseData={calculatedRiseData}
            insideLineData={insideLineData}
            onRiseChange={handleRiseChange}
            onReset={handleResetRise}
            onRecalculate={calculateRiseData}
          />
        </div>
      </main>
    </div>
  );
}

export default App;