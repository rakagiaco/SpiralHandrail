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
    
    for (let arcDist = 0; arcDist <= Math.ceil(totalArcDistance * 2) / 2; arcDist += 0.5) {
      if (arcDist <= totalArcDistance) {
        const currentValue = manualRiseData[arcDist] !== undefined ? 
          manualRiseData[arcDist] : calculatedRiseData[Math.round(arcDist * 2) / 2];
        
        const isManual = manualRiseData[arcDist] !== undefined;
        const calculatedValue = calculatedRiseData[Math.round(arcDist * 2) / 2];
        const difference = isManual && calculatedValue ? Math.abs(currentValue - calculatedValue) : 0;
        const hasWarning = difference > 0.5;
        
                 inputs.push(
           <div key={arcDist} className="flex flex-col items-center p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
             <label className="text-base font-semibold text-gray-700 mb-3 flex items-center justify-center">
               <span className="mr-2">{arcDist.toFixed(1)}" arc</span>
               {isManual && (
                 <span className="text-blue-500 text-lg" title="Manual override">✏️</span>
               )}
             </label>
             <input
               type="number"
               value={currentValue?.toFixed(3) || '0.000'}
               step="0.125"
               onChange={(e) => onRiseChange(arcDist, parseFloat(e.target.value))}
               className={`w-32 p-4 text-center text-base border-2 rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-blue-200 ${
                 isManual 
                   ? hasWarning 
                     ? 'border-orange-500 bg-orange-50 focus:border-orange-500 focus:ring-orange-200' 
                     : 'border-blue-500 bg-blue-50 focus:border-blue-500 focus:ring-blue-200'
                   : 'border-gray-300 bg-white focus:border-blue-500 focus:ring-blue-200'
               }`}
             />
            {isManual && calculatedValue && (
              <div className={`text-xs mt-2 text-center space-y-1 ${hasWarning ? 'text-orange-600' : 'text-blue-600'}`}>
                <div className="font-medium">Calc: {calculatedValue.toFixed(3)}"</div>
                <div>Diff: {difference.toFixed(3)}"</div>
                {hasWarning && (
                  <div className="text-orange-500 font-semibold">⚠️ Large diff</div>
                )}
              </div>
            )}
          </div>
        );
      }
    }
    
    return inputs;
  };

  const manualPoints = Object.keys(manualRiseData).length;
  const calculatedPoints = Object.keys(calculatedRiseData).length;
  const totalInputs = Math.ceil(totalArcDistance * 2) + 1;
  
  const manualValues = Object.values(manualRiseData);
  const avgManualRise = manualValues.length > 0 ? manualValues.reduce((a, b) => a + b, 0) / manualValues.length : 0;
  const minManualRise = manualValues.length > 0 ? Math.min(...manualValues) : 0;
  const maxManualRise = manualValues.length > 0 ? Math.max(...manualValues) : 0;
  
  const calculatedValues = Object.values(calculatedRiseData);
  const avgCalculatedRise = calculatedValues.length > 0 ? calculatedValues.reduce((a, b) => a + b, 0) / calculatedValues.length : 0;
  const minCalculatedRise = calculatedValues.length > 0 ? Math.min(...calculatedValues) : 0;
  const maxCalculatedRise = calculatedValues.length > 0 ? Math.max(...calculatedValues) : 0;

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg border-l-4 border-blue-500">
      <h3 className="text-blue-800 text-xl font-semibold mb-4 flex items-center">
        <span className="mr-2">✏️</span>
        Manual Rise Adjustment Points
        <span className="ml-auto text-sm text-gray-500 font-normal">
          {manualPoints} manual / {calculatedPoints} calculated
        </span>
      </h3>
      
      <p className="mb-4 text-gray-600 text-sm">
        Auto-populated from your exact measurements. Adjust manually for custom interpolation. 
        <br />
        <strong>Note:</strong> The rise continues beyond {totalArcDistance}" at the same rate for the next flight of stairs.
      </p>
      
      {/* Statistics Panel */}
      <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
        <h4 className="text-sm font-semibold text-blue-700 mb-2">📊 Adjustment Statistics & Validation</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div className="text-center">
            <div className="font-semibold text-blue-600">Manual Overrides</div>
            <div>Count: {manualPoints}</div>
            <div>Avg: {avgManualRise.toFixed(3)}"</div>
            <div>Range: {minManualRise.toFixed(3)}" - {maxManualRise.toFixed(3)}"</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-green-600">Calculated Values</div>
            <div>Count: {calculatedPoints}</div>
            <div>Avg: {avgCalculatedRise.toFixed(3)}"</div>
            <div>Range: {minCalculatedRise.toFixed(3)}" - {maxCalculatedRise.toFixed(3)}"</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-purple-600">Coverage</div>
            <div>Total Inputs: {totalInputs}</div>
            <div>Manual %: {((manualPoints / totalInputs) * 100).toFixed(1)}%</div>
            <div>Auto %: {(((totalInputs - manualPoints) / totalInputs) * 100).toFixed(1)}%</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-orange-600">Validation</div>
            <div className="flex justify-center space-x-1 mb-1">
              <span className="inline-block w-2 h-2 bg-green-500 rounded-full" title="Calculated"></span>
              <span className="inline-block w-2 h-2 bg-blue-500 rounded-full" title="Manual"></span>
              <span className="inline-block w-2 h-2 bg-orange-500 rounded-full" title="Warning"></span>
            </div>
            <div className="text-xs">
              <div>Green: Auto-calculated</div>
              <div>Blue: Manual override</div>
              <div>Orange: Large difference</div>
            </div>
          </div>
        </div>
      </div>
      
             <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 mb-6 max-h-96 overflow-y-auto p-4">
         {generateInputs()}
       </div>
      
      <div className="flex flex-wrap gap-2 items-center">
        <button
          onClick={onReset}
          className="px-4 py-2 text-sm bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center"
        >
          <span className="mr-1">🔄</span>
          Reset to Calculated Values
        </button>
        
        <button
          onClick={() => {
            // Force recalculation by triggering a parameter change
            const event = new CustomEvent('recalculateRise');
            window.dispatchEvent(event);
          }}
          className="px-4 py-2 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center"
        >
          <span className="mr-1">🧮</span>
          Recalculate Rise Data
        </button>
        
        <button
          onClick={() => {
            console.log('Manual Rise Data:', manualRiseData);
            console.log('Calculated Rise Data:', calculatedRiseData);
            console.log('Parameters:', { totalArcDistance, manualPoints, calculatedPoints });
          }}
          className="px-3 py-2 text-xs bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors flex items-center"
        >
          <span className="mr-1">🐛</span>
          Debug Console
        </button>
        
        <span className="text-xs text-gray-500 ml-2">
          💡 Tip: Manual overrides are highlighted in blue, warnings in orange
        </span>
      </div>
      
             {/* Original Reference Data */}
       <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
         <h4 className="text-sm font-semibold text-blue-700 mb-3 flex items-center">
           <span className="mr-2">📋</span>
           Original Reference Data (Your Manual Inputs)
         </h4>
         <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
           {Object.entries(manualRiseData).map(([arcDist, rise]) => (
             <div key={arcDist} className="text-center p-3 rounded-lg border-2 bg-blue-100 border-blue-300 text-blue-800">
               <div className="text-sm font-semibold">{parseFloat(arcDist).toFixed(1)}" arc</div>
               <div className="text-lg font-bold">{rise.toFixed(3)}"</div>
               <div className="text-sm text-blue-600">Reference</div>
             </div>
           ))}
         </div>
         {Object.keys(manualRiseData).length === 0 && (
           <div className="text-center text-blue-600 text-sm py-4">
             No manual reference data entered yet. Use the input fields above to add your measurements.
           </div>
         )}
       </div>
       
       {/* Inch Reference Chart */}
       <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
        <h4 className="text-sm font-semibold text-green-700 mb-3 flex items-center">
          <span className="mr-2">📏</span>
          Inch Reference Chart (0" to {totalArcDistance}")
        </h4>
                 <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
           {Array.from({ length: Math.ceil(totalArcDistance) + 1 }, (_, i) => {
             const inch = i;
             const calculatedRise = calculatedRiseData[inch] || 0;
             const manualRise = manualRiseData[inch];
             const isManual = manualRise !== undefined;
             const displayRise = isManual ? manualRise : calculatedRise;
             
             return (
               <div key={inch} className={`text-center p-3 rounded-lg border-2 ${
                 isManual 
                   ? 'bg-blue-100 border-blue-300 text-blue-800' 
                   : 'bg-green-100 border-green-300 text-green-800'
               }`}>
                 <div className="text-sm font-semibold">{inch}" arc</div>
                 <div className="text-lg font-bold">{displayRise.toFixed(3)}"</div>
                 {isManual && (
                   <div className="text-sm text-blue-600">Manual</div>
                 )}
               </div>
             );
           })}
                  </div>
       </div>
       
       {/* Mathematical Calculations */}
       <div className="mt-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
         <h4 className="text-sm font-semibold text-purple-700 mb-3 flex items-center">
           <span className="mr-2">🧮</span>
           Mathematical Calculations & Comparison
         </h4>
         <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
           {Object.entries(calculatedRiseData).filter(([arcDist]) => {
             const arc = parseFloat(arcDist);
             return arc <= totalArcDistance && arc % 1 === 0; // Only show whole inch marks
           }).map(([arcDist, rise]) => {
             const arc = parseFloat(arcDist);
             const manualRise = manualRiseData[arc];
             const isManual = manualRise !== undefined;
             const difference = isManual ? Math.abs(manualRise - rise) : 0;
             const hasWarning = difference > 0.5;
             
             return (
               <div key={arcDist} className={`text-center p-3 rounded-lg border-2 ${
                 isManual 
                   ? hasWarning 
                     ? 'bg-orange-100 border-orange-300 text-orange-800' 
                     : 'bg-blue-100 border-blue-300 text-blue-800'
                   : 'bg-purple-100 border-purple-300 text-purple-800'
               }`}>
                 <div className="text-sm font-semibold">{arc}" arc</div>
                 <div className="text-lg font-bold">{rise.toFixed(3)}"</div>
                 {isManual && (
                   <div className="text-sm">
                     <div>Manual: {manualRise.toFixed(3)}"</div>
                     <div className={hasWarning ? 'text-orange-600 font-semibold' : 'text-blue-600'}>
                       Diff: {difference.toFixed(3)}"
                     </div>
                   </div>
                 )}
               </div>
             );
           })}
         </div>
       </div>
       
       {/* Footer Info */}
      <div className="mt-4 p-2 bg-blue-100 rounded text-xs text-blue-700 text-center">
        <span className="font-semibold">🔍 Info:</span> 
        {manualPoints > 0 ? (
          <>
            {manualPoints} manual overrides active. 
            {Object.keys(manualRiseData).filter(key => {
              const manualVal = manualRiseData[parseFloat(key)];
              const calcVal = calculatedRiseData[Math.round(parseFloat(key) * 2) / 2];
              return calcVal && Math.abs(manualVal - calcVal) > 0.5;
            }).length} have large differences from calculated values.
          </>
        ) : (
          'No manual overrides. All values are auto-calculated.'
        )}
      </div>
    </div>
  );
}