import React from 'react';
import { HandrailParameters } from '../types/handrail';

interface ParametersSectionProps {
  parameters: HandrailParameters;
  onParameterChange: (key: keyof HandrailParameters, value: number) => void;
}

export function ParametersSection({ parameters, onParameterChange }: ParametersSectionProps) {
  const totalRise = parameters.totalHelicalRise + parameters.pitchBlock;

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg border-l-4 border-blue-500">
      <h3 className="text-blue-800 text-xl font-semibold mb-5">Adjustable Project Parameters</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="flex flex-col">
          <label className="font-semibold text-gray-700 mb-2 text-sm">Total Angular Span (degrees)</label>
          <input
            type="number"
            value={parameters.totalDegrees}
            step="1"
            onChange={(e) => onParameterChange('totalDegrees', parseFloat(e.target.value))}
            className="p-3 border-2 border-gray-200 rounded-lg text-base transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 bg-gray-50 focus:bg-white"
          />
        </div>
        <div className="flex flex-col">
          <label className="font-semibold text-gray-700 mb-2 text-sm">Total Helical Rise (inches)</label>
          <input
            type="number"
            value={parameters.totalHelicalRise}
            step="0.125"
            onChange={(e) => onParameterChange('totalHelicalRise', parseFloat(e.target.value))}
            className="p-3 border-2 border-gray-200 rounded-lg text-base transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 bg-gray-50 focus:bg-white"
          />
        </div>
        <div className="flex flex-col">
          <label className="font-semibold text-gray-700 mb-2 text-sm">Total Arc Distance (inches)</label>
          <input
            type="number"
            value={parameters.totalArcDistance}
            step="0.125"
            onChange={(e) => onParameterChange('totalArcDistance', parseFloat(e.target.value))}
            className="p-3 border-2 border-gray-200 rounded-lg text-base transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 bg-gray-50 focus:bg-white"
          />
        </div>
        <div className="flex flex-col">
          <label className="font-semibold text-gray-700 mb-2 text-sm">Total Segments</label>
          <input
            type="number"
            value={parameters.totalSegments}
            step="1"
            onChange={(e) => onParameterChange('totalSegments', parseInt(e.target.value))}
            className="p-3 border-2 border-gray-200 rounded-lg text-base transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 bg-gray-50 focus:bg-white"
          />
        </div>
        <div className="flex flex-col">
          <label className="font-semibold text-gray-700 mb-2 text-sm">Pitch Block Height</label>
          <input
            type="number"
            value={parameters.pitchBlock}
            step="0.125"
            onChange={(e) => onParameterChange('pitchBlock', parseFloat(e.target.value))}
            className="p-3 border-2 border-gray-200 rounded-lg text-base transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 bg-gray-50 focus:bg-white"
          />
        </div>
      </div>
      
      <div className="bg-blue-50 p-4 rounded-xl border-l-4 border-blue-400">
        <h4 className="text-blue-900 font-semibold mb-2">Calculated Totals:</h4>
        <div className="text-blue-900 text-lg font-bold">
          Total Rise (Helical + Pitch Block): {totalRise.toFixed(3)}"
        </div>
        <div className="mt-2 text-sm text-gray-600">
          Based on actual measured piece: 17.5" arc, 220°, 8⅜" total rise
        </div>
      </div>
    </div>
  );
}