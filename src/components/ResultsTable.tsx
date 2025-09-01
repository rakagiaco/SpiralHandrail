import React from 'react';
import { SegmentResult, ReferenceResult } from '../types/handrail';

interface ResultsTableProps {
  title: string;
  data: SegmentResult[] | ReferenceResult[];
  type: 'segments' | 'reference';
}

export function ResultsTable({ title, data, type }: ResultsTableProps) {
  if (data.length === 0) return null;

  const getRowClass = (section: string) => {
    if (section.includes('Over-Ease')) return 'bg-yellow-100 text-yellow-900 font-semibold border-l-4 border-yellow-500';
    if (section.includes('Up-Ease')) return 'bg-red-100 text-red-900 font-semibold border-l-4 border-red-500';
    return 'bg-blue-100 text-blue-900 font-semibold border-l-4 border-blue-500';
  };

  const getDataQualityIndicator = (row: SegmentResult | ReferenceResult) => {
    // Add visual indicators for data quality
    const isManual = 'segment' in row ? false : true; // Reference results are always calculated
    const hasValidRise = row.rise > 0 && row.rise < 20; // Reasonable rise range
    const hasValidArc = row.arcDistance >= 0 && row.arcDistance < 50; // Reasonable arc range
    
    if (!hasValidRise || !hasValidArc) {
      return <span className="inline-block w-3 h-3 bg-red-500 rounded-full mr-2" title="Data validation warning"></span>;
    }
    
    return <span className="inline-block w-3 h-3 bg-green-500 rounded-full mr-2" title="Data validated"></span>;
  };

  const getSectionIcon = (section: string) => {
    if (section.includes('Over-Ease')) return '⬇️';
    if (section.includes('Up-Ease')) return '⬆️';
    if (section.includes('Main Spiral')) return '🌀';
    return '📏';
  };

  const getAngleIndicator = (angle: number) => {
    // Visual angle indicator
    const normalizedAngle = ((angle % 360) + 360) % 360;
    const rotation = `rotate(${normalizedAngle}deg)`;
    
    return (
      <div className="inline-flex items-center">
        <div 
          className="w-4 h-4 border-2 border-current rounded-full mr-2 relative"
          style={{ transform: rotation }}
        >
          <div className="absolute top-1/2 left-1/2 w-1 h-1 bg-current rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
        </div>
        <span>{angle}°</span>
      </div>
    );
  };

  const getRiseBar = (rise: number, maxRise: number = 10) => {
    // Visual rise bar indicator
    const percentage = Math.min((rise / maxRise) * 100, 100);
    const barColor = percentage > 80 ? 'bg-red-500' : percentage > 60 ? 'bg-yellow-500' : 'bg-green-500';
    
    return (
      <div className="flex items-center space-x-2">
        <div className="w-16 bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full ${barColor} transition-all duration-300`}
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
        <span className="text-xs font-mono">{rise.toFixed(3)}"</span>
      </div>
    );
  };

  // Calculate summary statistics for debugging
  const totalRise = data.reduce((sum, row) => sum + row.rise, 0);
  const avgRise = totalRise / data.length;
  const minRise = Math.min(...data.map(row => row.rise));
  const maxRise = Math.max(...data.map(row => row.rise));
  const totalArc = data.reduce((sum, row) => sum + row.arcDistance, 0);
  const avgArc = totalArc / data.length;

  return (
    <div className="bg-white rounded-2xl p-5 shadow-lg border-l-4 border-green-500 overflow-x-auto">
      <h3 className="text-green-800 text-xl font-semibold mb-4 flex items-center">
        <span className="mr-2">🔍</span>
        {title}
        <span className="ml-auto text-sm text-gray-500 font-normal">
          {data.length} {type === 'segments' ? 'segments' : 'reference points'}
        </span>
      </h3>
      
      {/* Debug Summary Panel */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
        <h4 className="text-sm font-semibold text-gray-700 mb-2">📊 Data Summary & Validation</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div className="text-center">
            <div className="font-semibold text-blue-600">Rise Stats</div>
            <div>Min: {minRise.toFixed(3)}"</div>
            <div>Max: {maxRise.toFixed(3)}"</div>
            <div>Avg: {avgRise.toFixed(3)}"</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-green-600">Arc Stats</div>
            <div>Total: {totalArc.toFixed(1)}"</div>
            <div>Avg: {avgArc.toFixed(1)}"</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-purple-600">Data Quality</div>
            <div className="flex justify-center space-x-1">
              <span className="inline-block w-2 h-2 bg-green-500 rounded-full" title="Valid"></span>
              <span className="inline-block w-2 h-2 bg-yellow-500 rounded-full" title="Warning"></span>
              <span className="inline-block w-2 h-2 bg-red-500 rounded-full" title="Error"></span>
            </div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-orange-600">Sections</div>
            <div className="text-xs">
              {Array.from(new Set(data.map(row => row.section))).map(section => (
                <div key={section} className="flex items-center justify-center">
                  {getSectionIcon(section)} {section}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px] border-collapse text-xs">
          <thead>
            <tr className="bg-gray-800 text-white">
              {type === 'segments' ? (
                <>
                  <th className="p-2 text-center font-semibold text-xs">🔢 Segment</th>
                  <th className="p-2 text-center font-semibold text-xs">📍 Section</th>
                  <th className="p-2 text-center font-semibold text-xs">📐 Angle (°)</th>
                  <th className="p-2 text-center font-semibold text-xs">📏 Arc Distance (in)</th>
                  <th className="p-2 text-center font-semibold text-xs">📈 Rise (in)</th>
                  <th className="p-2 text-center font-semibold text-xs">✅ Status</th>
                </>
              ) : (
                <>
                  <th className="p-2 text-center font-semibold text-xs">📏 Arc Distance (in)</th>
                  <th className="p-2 text-center font-semibold text-xs">📍 Section</th>
                  <th className="p-2 text-center font-semibold text-xs">📐 Angle (°)</th>
                  <th className="p-2 text-center font-semibold text-xs">📈 Rise (in)</th>
                  <th className="p-2 text-center font-semibold text-xs">✅ Status</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => (
              <tr key={index} className={`${getRowClass(row.section)} border-b border-gray-200 hover:bg-gray-50 transition-colors`}>
                {type === 'segments' ? (
                  <>
                    <td className="p-2 text-center text-xs">
                      <strong className="bg-blue-100 px-2 py-1 rounded-full">{(row as SegmentResult).segment}</strong>
                    </td>
                    <td className="p-2 text-center text-xs">
                      <div className="flex items-center justify-center">
                        <span className="mr-1">{getSectionIcon(row.section)}</span>
                        <strong>{row.section}</strong>
                      </div>
                    </td>
                    <td className="p-2 text-center text-xs">
                      {getAngleIndicator(row.angle)}
                    </td>
                    <td className="p-2 text-center text-xs font-mono">
                      {(row as SegmentResult).arcDistance}"
                    </td>
                    <td className="p-2 text-center text-xs">
                      {getRiseBar(row.rise)}
                    </td>
                    <td className="p-2 text-center text-xs">
                      {getDataQualityIndicator(row)}
                    </td>
                  </>
                ) : (
                  <>
                    <td className="p-2 text-center text-xs font-mono">
                      {(row as ReferenceResult).arcDistance}"
                    </td>
                    <td className="p-2 text-center text-xs">
                      <div className="flex items-center justify-center">
                        <span className="mr-1">{getSectionIcon(row.section)}</span>
                        <strong>{row.section}</strong>
                      </div>
                    </td>
                    <td className="p-2 text-center text-xs">
                      {getAngleIndicator(row.angle)}
                    </td>
                    <td className="p-2 text-center text-xs">
                      {getRiseBar(row.rise)}
                    </td>
                    <td className="p-2 text-center text-xs">
                      {getDataQualityIndicator(row)}
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Debug Footer */}
      <div className="mt-4 p-2 bg-gray-100 rounded text-xs text-gray-600 text-center">
        <span className="font-semibold">🔍 Debug Info:</span> 
        Table shows {data.length} {type === 'segments' ? 'segments' : 'reference points'} with 
        rise range {minRise.toFixed(3)}" to {maxRise.toFixed(3)}" over {totalArc.toFixed(1)}" total arc distance
      </div>
    </div>
  );
}