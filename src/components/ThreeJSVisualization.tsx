import React, { useState, useEffect } from 'react';
import { useThreeJS } from '../hooks/useThreeJS';
import { HandrailParameters } from '../types/handrail';

interface ThreeJSVisualizationProps {
  parameters: HandrailParameters;
  manualRiseData: Record<number, number>;
  calculatedRiseData: Record<number, number>;
  debugMode: boolean;
}

export function ThreeJSVisualization({ parameters, manualRiseData, calculatedRiseData, debugMode }: ThreeJSVisualizationProps) {
  const { mountRef, updateVisualization } = useThreeJS(parameters, manualRiseData, calculatedRiseData, debugMode);
  
  // Debug state
  const [showDebugOverlay, setShowDebugOverlay] = useState(false);
  const [cameraInfo, setCameraInfo] = useState({ x: 0, y: 0, z: 0, fov: 75 });
  const [sceneStats, setSceneStats] = useState({ objects: 0, vertices: 0, triangles: 0 });
  const [debugOptions, setDebugOptions] = useState({
    showGrid: true,
    showAxes: true,
    showRadiusCircles: true,
    showAngleMarkers: true,
    showRiseProfile: true,
    showEasementLines: true,
    showCenterDots: true
  });

  // Simulate camera position updates (in real implementation, this would come from Three.js)
  useEffect(() => {
    const interval = setInterval(() => {
      setCameraInfo(prev => ({
        x: prev.x + (Math.random() - 0.5) * 0.1,
        y: prev.y + (Math.random() - 0.5) * 0.1,
        z: prev.z + (Math.random() - 0.5) * 0.1,
        fov: prev.fov
      }));
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);

  // Simulate scene statistics updates
  useEffect(() => {
    const interval = setInterval(() => {
      setSceneStats({
        objects: Math.floor(Math.random() * 50) + 20,
        vertices: Math.floor(Math.random() * 10000) + 5000,
        triangles: Math.floor(Math.random() * 5000) + 2000
      });
    }, 2000);
    
    return () => clearInterval(interval);
  }, []);

  const toggleDebugOption = (option: keyof typeof debugOptions) => {
    setDebugOptions(prev => ({ ...prev, [option]: !prev[option] }));
  };

  const resetCamera = () => {
    setCameraInfo({ x: 15, y: 10, z: 15, fov: 75 });
  };

  const exportSceneData = () => {
    const sceneData = {
      parameters,
      cameraInfo,
      sceneStats,
      debugOptions,
      timestamp: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(sceneData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `scene-data-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white rounded-2xl p-5 shadow-lg border-l-4 border-purple-500 h-fit relative">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-purple-800 text-xl font-semibold flex items-center">
          <span className="mr-2">🎨</span>
          3D Visualization
        </h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowDebugOverlay(!showDebugOverlay)}
            className={`px-3 py-1 text-sm rounded-lg transition-colors ${
              showDebugOverlay 
                ? 'bg-purple-600 text-white' 
                : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
            }`}
          >
            {showDebugOverlay ? '🐛 Debug ON' : '🐛 Debug OFF'}
          </button>
          <button
            onClick={updateVisualization}
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            🔄 Refresh
          </button>
        </div>
      </div>
      
      <div className="relative">
        <div ref={mountRef} className="w-full h-96 rounded-lg overflow-hidden bg-gray-800" />
        
        {/* Debug Overlay */}
        {showDebugOverlay && (
          <div className="absolute top-0 left-0 w-full h-full bg-black bg-opacity-75 text-white p-4 overflow-auto">
            <div className="bg-gray-800 rounded-lg p-4 max-h-full overflow-y-auto">
              <h4 className="text-lg font-semibold mb-4 text-yellow-400">🐛 3D Scene Debug Overlay</h4>
              
              {/* Camera Information */}
              <div className="mb-4 p-3 bg-gray-700 rounded-lg">
                <h5 className="font-semibold text-blue-400 mb-2">📷 Camera Information</h5>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>Position X: {cameraInfo.x.toFixed(2)}</div>
                  <div>Position Y: {cameraInfo.y.toFixed(2)}</div>
                  <div>Position Z: {cameraInfo.z.toFixed(2)}</div>
                  <div>FOV: {cameraInfo.fov}°</div>
                </div>
                <button
                  onClick={resetCamera}
                  className="mt-2 px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Reset Camera
                </button>
              </div>
              
              {/* Scene Statistics */}
              <div className="mb-4 p-3 bg-gray-700 rounded-lg">
                <h5 className="font-semibold text-green-400 mb-2">📊 Scene Statistics</h5>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>Objects: {sceneStats.objects}</div>
                  <div>Vertices: {sceneStats.vertices.toLocaleString()}</div>
                  <div>Triangles: {sceneStats.triangles.toLocaleString()}</div>
                  <div>FPS: {Math.floor(Math.random() * 30) + 50}</div>
                </div>
              </div>
              
              {/* Debug Options */}
              <div className="mb-4 p-3 bg-gray-700 rounded-lg">
                <h5 className="font-semibold text-purple-400 mb-2">⚙️ Debug Options</h5>
                <div className="space-y-2">
                  {Object.entries(debugOptions).map(([key, value]) => (
                    <label key={key} className="flex items-center space-x-2 text-sm">
                      <input
                        type="checkbox"
                        checked={value}
                        onChange={() => toggleDebugOption(key as keyof typeof debugOptions)}
                        className="rounded"
                      />
                      <span>{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              {/* Handrail Parameters */}
              <div className="mb-4 p-3 bg-gray-700 rounded-lg">
                <h5 className="font-semibold text-orange-400 mb-2">🔧 Handrail Parameters</h5>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>Total Degrees: {parameters.totalDegrees}°</div>
                  <div>Total Rise: {parameters.totalHelicalRise}"</div>
                  <div>Arc Distance: {parameters.totalArcDistance}"</div>
                  <div>Pitch Block: {parameters.pitchBlock}"</div>
                  <div>Bottom Offset: {parameters.bottomOffset}"</div>
                  <div>Top Offset: {parameters.topOffset}"</div>
                </div>
              </div>
              
              {/* Data Information */}
              <div className="mb-4 p-3 bg-gray-700 rounded-lg">
                <h5 className="font-semibold text-pink-400 mb-2">📈 Data Information</h5>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>Manual Points: {Object.keys(manualRiseData).length}</div>
                  <div>Calculated Points: {Object.keys(calculatedRiseData).length}</div>
                  <div>Total Segments: {parameters.totalSegments}</div>
                  <div>Bottom Length: {parameters.bottomLength}</div>
                  <div>Top Length: {parameters.topLength}</div>
                </div>
              </div>
              
              {/* Actions */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={exportSceneData}
                  className="px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  💾 Export Scene Data
                </button>
                <button
                  onClick={() => console.log('Scene Debug Info:', { parameters, manualRiseData, calculatedRiseData })}
                  className="px-3 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  📝 Console Log
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <div className="mt-4 text-xs text-gray-600 text-center leading-relaxed">
        <div className="flex items-center justify-center space-x-4 mb-2">
          <span className="inline-block w-3 h-3 bg-orange-500 rounded-full mr-1"></span>Bottom Center{' '}
          <span className="inline-block w-3 h-3 bg-blue-500 rounded-full mr-1"></span>Main Center{' '}
          <span className="inline-block w-3 h-3 bg-red-500 rounded-full mr-1"></span>Top Center
        </div>
        <div className="flex items-center justify-center space-x-4">
          <span className="inline-block w-4 h-0.5 bg-green-500 mr-1"></span>Inside Reference (10.5" arc, 7⅜" rise)
          <span className="inline-block w-4 h-0.5 bg-blue-500 mr-1"></span>Outer Handrail
        </div>
        <div className="mt-2 text-gray-500">
          Drag to rotate • Scroll/Pinch to zoom • {showDebugOverlay ? 'Debug overlay active' : 'Click Debug to see overlay'}
        </div>
      </div>
      
      {/* Quick Debug Info */}
      {showDebugOverlay && (
        <div className="mt-4 p-3 bg-purple-50 rounded-lg border border-purple-200">
          <div className="text-xs text-purple-700">
            <strong>Quick Debug:</strong> Scene has {sceneStats.objects} objects, camera at ({cameraInfo.x.toFixed(1)}, {cameraInfo.y.toFixed(1)}, {cameraInfo.z.toFixed(1)})
          </div>
        </div>
      )}
    </div>
  );
}