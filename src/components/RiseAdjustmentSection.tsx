import React from 'react';

interface RiseAdjustmentSectionProps {
  totalArcDistance: number;
  manualRiseData: Record<number, number>;
  calculatedRiseData: Record<number, number>;
  onRiseChange: (arcDistance: number, value: number) => void;
  onReset: () => void;
}

export function RiseAdjustmentSection({ 
  totalArcDistance, 
  manualRiseData, 
  calculatedRiseData, 
  onRiseChange, 
  onReset 
}: RiseAdjustmentSectionProps) {
  const generateInputs = () => {
    const inputs = [];
    
    for (let arcDist = 0; arcDist <= Math.ceil(totalArcDistance); arcDist++) {
      if (arcDist <= totalArcDistance) {
        const currentValue = manualRiseData[arcDist] !== undefined ? 
          manualRiseData[arcDist] : calculatedRiseData[arcDist];
        
        inputs.push(
          <div key={arcDist} className="flex flex-col items-center">
            <label className="text-xs text-gray-600 mb-1">{arcDist}" arc</label>
            <input
              type="number"
              value={currentValue?.toFixed(3) || '0.000'}
              step="0.125"
              onChange={(e) => onRiseChange(arcDist, parseFloat(e.target.value))}
              className="w-20 p-2 text-center text-sm border-2 border-gray-200 rounded-lg transition-all focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-100 bg-gray-50 focus:bg-white"
            />
          </div>
        );
      }
    }
    
    return inputs;
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg border-l-4 border-blue-500">
      <h3 className="text-blue-800 text-xl font-semibold mb-4">Manual Rise Adjustment Points</h3>
      <p className="mb-4 text-gray-600 text-sm">
        Auto-populated from your exact measurements. Adjust manually for custom interpolation.
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2 mb-4">
        {generateInputs()}
      </div>
      <div>
        <button
          onClick={onReset}
          className="px-4 py-2 text-sm bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
        >
          Reset to Calculated Values
        </button>
      </div>
    </div>
  );
}