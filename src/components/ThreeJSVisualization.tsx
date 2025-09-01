// ThreeJS Visualization Component for Spiral Handrail
// This component renders the 3D visualization using Three.js and provides debug controls
import React, { useEffect } from 'react';
import { useThreeJS } from '../hooks/useThreeJS';
import { HandrailParameters } from '../types/handrail';

// Props interface for the ThreeJS Visualization component
interface ThreeJSVisualizationProps {
  parameters: HandrailParameters;                    // Current handrail parameters
  manualRiseData: Record<number, number>;           // User-provided rise data points
  calculatedRiseData: Record<number, number>;       // Calculated rise data points
  debugMode: boolean;                               // Whether debug mode is enabled
  showOverlay: boolean;                             // Whether debug overlay is visible
  onDebugModeChange: (debugMode: boolean) => void;  // Callback to toggle debug mode
  onShowOverlayChange: (showOverlay: boolean) => void; // Callback to toggle overlay
}

export function ThreeJSVisualization({
  parameters,
  manualRiseData,
  calculatedRiseData,
  debugMode,
  showOverlay,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onDebugModeChange,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onShowOverlayChange
}: ThreeJSVisualizationProps) {
  // Use the custom Three.js hook for 3D scene management
  const { mountRef, updateVisualization } = useThreeJS(
    parameters,
    manualRiseData,
    calculatedRiseData,
    debugMode,
    showOverlay
  );

  // Update the 3D visualization whenever parameters or data changes
  useEffect(() => {
    updateVisualization();
  }, [updateVisualization, parameters, manualRiseData, calculatedRiseData, debugMode, showOverlay]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg border-l-4 border-blue-500">
      {/* Component header with title and description */}
      <div className="mb-4">
        <h3 className="text-blue-800 text-xl font-semibold mb-2">3D Visualization</h3>
        <p className="text-gray-600 text-sm">
          Interactive 3D view of the spiral handrail with real-time parameter updates
        </p>
      </div>

      {/* Debug status indicator - only visible when debug mode is enabled */}
      {debugMode && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="text-blue-900 font-semibold mb-2">🐛 Debug Mode Active</h4>
          <div className="text-sm text-blue-700">
            Overlay: {showOverlay ? 'ON' : 'OFF'} | 
            3D Debug Elements: Visible | 
            Real-time Updates: Active
          </div>
        </div>
      )}

      {/* Main 3D visualization container */}
      <div className="relative w-full h-96 md:h-[500px] lg:h-[600px]">
        {/* Debug status indicator in 3D space */}
        {debugMode && (
          <div className="absolute top-2 right-2 z-10 bg-black bg-opacity-75 text-white px-3 py-2 text-sm rounded-lg">
            <div className="text-green-400 font-bold">🐛 DEBUG</div>
            <div className="text-xs text-gray-300">Overlay: {showOverlay ? 'ON' : 'OFF'}</div>
          </div>
        )}
        
        {/* Three.js canvas container */}
        <div 
          ref={mountRef} 
          className="w-full h-96 bg-gray-900 rounded-lg overflow-hidden"
          style={{ minHeight: '400px' }}
        />
      </div>

      {/* Debug information display - only visible when debug mode and overlay are enabled */}
      {debugMode && showOverlay && (
        <div className="mt-4 p-3 bg-gray-100 rounded-lg border border-gray-300">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">🐛 Debug Information</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            {/* Manual rise data statistics */}
            <div>
              <div className="font-semibold">Manual Overrides:</div>
              <div>{Object.keys(manualRiseData).length} points</div>
              <div>Range: {Object.values(manualRiseData).length > 0 ? 
                `${Math.min(...Object.values(manualRiseData)).toFixed(3)}" - ${Math.max(...Object.values(manualRiseData)).toFixed(3)}"` : 
                'None'
              }</div>
            </div>
            
            {/* Calculated rise data statistics */}
            <div>
              <div className="font-semibold">Calculated Points:</div>
              <div>{Object.keys(calculatedRiseData).length} points</div>
              <div>Range: {Object.values(calculatedRiseData).length > 0 ? 
                `${Math.min(...Object.values(calculatedRiseData)).toFixed(3)}" - ${Math.max(...Object.values(calculatedRiseData)).toFixed(3)}"` : 
                'None'
              }</div>
            </div>
            
            {/* Current parameters summary */}
            <div>
              <div className="font-semibold">Current Parameters:</div>
              <div>{parameters.totalDegrees}° / {parameters.totalHelicalRise}"</div>
              <div>{parameters.totalArcDistance}" arc</div>
            </div>
            
            {/* Debug mode status */}
            <div>
              <div className="font-semibold">Debug Status:</div>
              <div className={debugMode ? 'text-green-600' : 'text-red-600'}>
                {debugMode ? 'ON' : 'OFF'}
              </div>
              <div className={showOverlay ? 'text-green-600' : 'text-gray-600'}>
                Overlay: {showOverlay ? 'ON' : 'OFF'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}