import React, { useEffect } from 'react';
import { useThreeJS } from '../hooks/useThreeJS';
import { HandrailParameters } from '../types/handrail';

interface ThreeJSVisualizationProps {
  parameters: HandrailParameters;
  manualRiseData: Record<number, number>;
  calculatedRiseData: Record<number, number>;
}

export function ThreeJSVisualization({ parameters, manualRiseData, calculatedRiseData }: ThreeJSVisualizationProps) {
  const { mountRef, updateVisualization } = useThreeJS(parameters, manualRiseData, calculatedRiseData);

  useEffect(() => {
    updateVisualization();
  }, [parameters, manualRiseData, calculatedRiseData, updateVisualization]);

  return (
    <div className="bg-white rounded-2xl p-5 shadow-lg border-l-4 border-purple-500 h-fit">
      <h3 className="text-purple-800 text-xl font-semibold mb-4">3D Visualization</h3>
      <div ref={mountRef} className="w-full h-96 rounded-lg overflow-hidden bg-gray-800" />
      <div className="mt-4 text-xs text-gray-600 text-center leading-relaxed">
        Drag to rotate • Scroll/Pinch to zoom<br />
        <span className="inline-block w-3 h-3 bg-orange-500 rounded-full mr-1"></span>Bottom Center{' '}
        <span className="inline-block w-3 h-3 bg-blue-500 rounded-full mr-1"></span>Main Center{' '}
        <span className="inline-block w-3 h-3 bg-red-500 rounded-full mr-1"></span>Top Center<br />
        <span className="inline-block w-4 h-0.5 bg-green-500 mr-1"></span>Inside Reference (10.5" arc, 7⅜" rise)
      </div>
    </div>
  );
}