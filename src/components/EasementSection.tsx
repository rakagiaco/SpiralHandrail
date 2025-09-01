import React from 'react';
import { HandrailParameters } from '../types/handrail';

interface EasementSectionProps {
  parameters: HandrailParameters;
  onParameterChange: (key: keyof HandrailParameters, value: number) => void;
}

export function EasementSection({ parameters, onParameterChange }: EasementSectionProps) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg border-l-4 border-blue-500">
      <h3 className="text-blue-800 text-xl font-semibold mb-5">Easement Parameters</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col">
          <label className="font-semibold text-gray-700 mb-2 text-sm">Bottom Over-Ease Length</label>
          <input
            type="number"
            value={parameters.bottomLength}
            step="0.1"
            onChange={(e) => onParameterChange('bottomLength', parseFloat(e.target.value))}
            className="p-3 border-2 border-gray-200 rounded-lg text-base transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 bg-gray-50 focus:bg-white"
          />
        </div>
        <div className="flex flex-col">
          <label className="font-semibold text-gray-700 mb-2 text-sm">Top Up-Ease Length</label>
          <input
            type="number"
            value={parameters.topLength}
            step="0.1"
            onChange={(e) => onParameterChange('topLength', parseFloat(e.target.value))}
            className="p-3 border-2 border-gray-200 rounded-lg text-base transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 bg-gray-50 focus:bg-white"
          />
        </div>
        <div className="flex flex-col">
          <label className="font-semibold text-gray-700 mb-2 text-sm">Bottom Center Offset (toward staircase)</label>
          <input
            type="number"
            value={parameters.bottomOffset}
            step="0.125"
            onChange={(e) => onParameterChange('bottomOffset', parseFloat(e.target.value))}
            className="p-3 border-2 border-gray-200 rounded-lg text-base transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 bg-gray-50 focus:bg-white"
          />
        </div>
        <div className="flex flex-col">
          <label className="font-semibold text-gray-700 mb-2 text-sm">Top Center Offset (toward staircase)</label>
          <input
            type="number"
            value={parameters.topOffset}
            step="0.125"
            onChange={(e) => onParameterChange('topOffset', parseFloat(e.target.value))}
            className="p-3 border-2 border-gray-200 rounded-lg text-base transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 bg-gray-50 focus:bg-white"
          />
        </div>
      </div>
    </div>
  );
}