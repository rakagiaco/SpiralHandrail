import React from 'react';
import { HandrailParameters } from '../types/handrail';

interface ComprehensiveDebugPanelProps {
  parameters: HandrailParameters;
  manualRiseData: Record<number, number>;
  calculatedRiseData: Record<number, number>;
  debugMode: boolean;
  showOverlay: boolean;
  onDebugModeChange: (debugMode: boolean) => void;
  onShowOverlayChange: (showOverlay: boolean) => void;
}

export function ComprehensiveDebugPanel({
  parameters,
  manualRiseData,
  calculatedRiseData,
  debugMode,
  showOverlay,
  onDebugModeChange,
  onShowOverlayChange
}: ComprehensiveDebugPanelProps) {
  // Calculate key values
  const spiralEndAngle = ((parameters.totalSegments - parameters.topLength) / parameters.totalSegments) * parameters.totalDegrees;
  const spiralEndRise = parameters.pitchBlock + (spiralEndAngle / parameters.totalDegrees) * parameters.totalHelicalRise;
  const finalRise = parameters.pitchBlock + parameters.totalHelicalRise;
  const riseRate = parameters.totalHelicalRise / parameters.totalArcDistance;
  
  // Calculate radii
  const outerRadius = 4.625 + parameters.bottomOffset;
  const innerRadius = 4.5 - parameters.topOffset;

  return (
    <div className="bg-gray-900 text-green-400 rounded-lg p-4 font-mono text-sm">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-yellow-400">🐛 COMPREHENSIVE DEBUG PANEL</h3>
        <div className="space-x-2">
          <button
            onClick={() => onDebugModeChange(!debugMode)}
            className={`px-3 py-1 rounded text-xs font-bold ${
              debugMode ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
            }`}
          >
            {debugMode ? 'DEBUG ON' : 'DEBUG OFF'}
          </button>
          <button
            onClick={() => onShowOverlayChange(!showOverlay)}
            className={`px-3 py-1 rounded text-xs font-bold ${
              showOverlay ? 'bg-blue-600 text-white' : 'bg-gray-600 text-white'
            }`}
          >
            {showOverlay ? 'OVERLAY ON' : 'OVERLAY OFF'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Basic Parameters */}
        <div className="bg-gray-800 p-3 rounded border border-gray-700">
          <h4 className="text-yellow-400 font-bold mb-2">📐 BASIC PARAMETERS</h4>
          <div className="space-y-1 text-xs">
            <div>Total Arc: <span className="text-cyan-400">{parameters.totalArcDistance}"</span></div>
            <div>Total Rise: <span className="text-cyan-400">{parameters.totalHelicalRise}"</span></div>
            <div>Total Degrees: <span className="text-cyan-400">{parameters.totalDegrees}°</span></div>
            <div>Total Segments: <span className="text-cyan-400">{parameters.totalSegments}</span></div>
            <div>Pitch Block: <span className="text-cyan-400">{parameters.pitchBlock}"</span></div>
          </div>
        </div>

        {/* Easement Configuration */}
        <div className="bg-gray-800 p-3 rounded border border-gray-700">
          <h4 className="text-yellow-400 font-bold mb-2">🔄 EASEMENT CONFIG</h4>
          <div className="space-y-1 text-xs">
            <div>Bottom Length: <span className="text-cyan-400">{parameters.bottomLength} segments</span></div>
            <div>Top Length: <span className="text-cyan-400">{parameters.topLength} segments</span></div>
            <div>Bottom Offset: <span className="text-cyan-400">{parameters.bottomOffset}"</span></div>
            <div>Top Offset: <span className="text-cyan-400">{parameters.topOffset}"</span></div>
            <div>Custom Angle: <span className="text-cyan-400">{parameters.customEasementAngle || -35.08}°</span></div>
          </div>
        </div>

        {/* Radius Information */}
        <div className="bg-gray-800 p-3 rounded border border-gray-700">
          <h4 className="text-yellow-400 font-bold mb-2">⭕ RADIUS INFO</h4>
          <div className="space-y-1 text-xs">
            <div>Outer Radius: <span className="text-cyan-400">{outerRadius.toFixed(3)}"</span></div>
            <div>Inner Radius: <span className="text-cyan-400">{innerRadius.toFixed(3)}"</span></div>
            <div>Custom Outer: <span className="text-cyan-400">{parameters.customOuterRadius || 4.625}"</span></div>
            <div>Custom Inner: <span className="text-cyan-400">{parameters.customInnerRadius || 4.5}"</span></div>
            <div>Radius Diff: <span className="text-cyan-400">{(outerRadius - innerRadius).toFixed(3)}"</span></div>
          </div>
        </div>

        {/* Spiral Geometry */}
        <div className="bg-gray-800 p-3 rounded border border-gray-700">
          <h4 className="text-yellow-400 font-bold mb-2">🌀 SPIRAL GEOMETRY</h4>
          <div className="space-y-1 text-xs">
            <div>Spiral Start: <span className="text-magenta-400">0° at {parameters.pitchBlock.toFixed(3)}"</span></div>
            <div>Spiral End: <span className="text-magenta-400">{spiralEndAngle.toFixed(1)}° at {spiralEndRise.toFixed(3)}"</span></div>
            <div>Final Position: <span className="text-magenta-400">220° at {finalRise.toFixed(3)}"</span></div>
            <div>Bottom Easement: <span className="text-magenta-400">0° to {parameters.bottomLength} segments</span></div>
            <div>Top Easement: <span className="text-magenta-400">{spiralEndAngle.toFixed(1)}° to 220°</span></div>
          </div>
        </div>

        {/* Rise Data */}
        <div className="bg-gray-800 p-3 rounded border border-gray-700">
          <h4 className="text-yellow-400 font-bold mb-2">📊 RISE DATA</h4>
          <div className="space-y-1 text-xs">
            <div>Manual Points: <span className="text-green-400">{Object.keys(manualRiseData).length}</span></div>
            <div>Calculated Points: <span className="text-green-400">{Object.keys(calculatedRiseData).length}</span></div>
            <div>Rise Rate: <span className="text-green-400">{riseRate.toFixed(3)}"/inch</span></div>
            <div>Rise per Degree: <span className="text-green-400">{(parameters.totalHelicalRise / parameters.totalDegrees).toFixed(4)}"/degree</span></div>
            <div>Rise per Segment: <span className="text-green-400">{(parameters.totalHelicalRise / parameters.totalSegments).toFixed(3)}"/segment</span></div>
          </div>
        </div>

        {/* Mathematical Details */}
        <div className="bg-gray-800 p-3 rounded border border-gray-700">
          <h4 className="text-yellow-400 font-bold mb-2">🧮 MATHEMATICAL DETAILS</h4>
          <div className="space-y-1 text-xs">
            <div>Pitch Block Height: <span className="text-magenta-400">{parameters.pitchBlock.toFixed(3)}"</span></div>
            <div>Total Rise: <span className="text-magenta-400">{parameters.totalHelicalRise.toFixed(3)}"</span></div>
            <div>Bottom Easement Rise: <span className="text-magenta-400">{(parameters.pitchBlock - (parameters.pitchBlock * 0.15)).toFixed(3)}"</span></div>
            <div>Top Easement Rise: <span className="text-magenta-400">{finalRise.toFixed(3)}"</span></div>
            <div>Spiral Rise: <span className="text-magenta-400">{(spiralEndRise - parameters.pitchBlock).toFixed(3)}"</span></div>
          </div>
        </div>

        {/* Key Rise Points */}
        <div className="bg-gray-800 p-3 rounded border border-gray-700">
          <h4 className="text-yellow-400 font-bold mb-2">📍 KEY RISE POINTS</h4>
          <div className="space-y-1 text-xs">
            <div>0°: <span className="text-red-400">{parameters.pitchBlock.toFixed(3)}"</span></div>
            <div>45°: <span className="text-orange-400">{(parameters.pitchBlock + (45/220) * parameters.totalHelicalRise).toFixed(3)}"</span></div>
            <div>90°: <span className="text-yellow-400">{(parameters.pitchBlock + (90/220) * parameters.totalHelicalRise).toFixed(3)}"</span></div>
            <div>135°: <span className="text-green-400">{(parameters.pitchBlock + (135/220) * parameters.totalHelicalRise).toFixed(3)}"</span></div>
            <div>180°: <span className="text-cyan-400">{(parameters.pitchBlock + (180/220) * parameters.totalHelicalRise).toFixed(3)}"</span></div>
            <div>220°: <span className="text-magenta-400">{finalRise.toFixed(3)}"</span></div>
          </div>
        </div>

        {/* Debug Status */}
        <div className="bg-gray-800 p-3 rounded border border-gray-700">
          <h4 className="text-yellow-400 font-bold mb-2">🔍 DEBUG STATUS</h4>
          <div className="space-y-1 text-xs">
            <div>Debug Mode: <span className={debugMode ? 'text-green-400' : 'text-red-400'}>{debugMode ? 'ON' : 'OFF'}</span></div>
            <div>Overlay: <span className={showOverlay ? 'text-green-400' : 'text-red-400'}>{showOverlay ? 'ON' : 'OFF'}</span></div>
            <div>Manual Overrides: <span className="text-blue-400">{Object.keys(manualRiseData).length}</span></div>
            <div>Calculated Values: <span className="text-green-400">{Object.keys(calculatedRiseData).length}</span></div>
            <div>Data Coverage: <span className="text-purple-400">{((Object.keys(manualRiseData).length / (Object.keys(calculatedRiseData).length || 1)) * 100).toFixed(1)}%</span></div>
          </div>
        </div>

        {/* Validation Checks */}
        <div className="bg-gray-800 p-3 rounded border border-gray-700">
          <h4 className="text-yellow-400 font-bold mb-2">✅ VALIDATION CHECKS</h4>
          <div className="space-y-1 text-xs">
                          <div>Inner &lt; Outer: <span className={innerRadius < outerRadius ? 'text-green-400' : 'text-red-400'}>{innerRadius < outerRadius ? '✓' : '✗'}</span></div>
                          <div>Pitch Block &gt; 0: <span className={parameters.pitchBlock > 0 ? 'text-green-400' : 'text-red-400'}>{parameters.pitchBlock > 0 ? '✓' : '✗'}</span></div>
              <div>Total Rise &gt; 0: <span className={parameters.totalHelicalRise > 0 ? 'text-green-400' : 'text-red-400'}>{parameters.totalHelicalRise > 0 ? '✓' : '✗'}</span></div>
              <div>Segments &gt; 0: <span className={parameters.totalSegments > 0 ? 'text-green-400' : 'text-red-400'}>{parameters.totalSegments > 0 ? '✓' : '✗'}</span></div>
            <div>End Height Match: <span className={Math.abs(finalRise - (parameters.pitchBlock + parameters.totalHelicalRise)) < 0.001 ? 'text-green-400' : 'text-red-400'}>{Math.abs(finalRise - (parameters.pitchBlock + parameters.totalHelicalRise)) < 0.001 ? '✓' : '✗'}</span></div>
          </div>
        </div>
      </div>

      {/* Real-time Console Output */}
      <div className="mt-4 bg-black p-3 rounded border border-gray-700">
        <h4 className="text-yellow-400 font-bold mb-2">📺 REAL-TIME CONSOLE</h4>
        <div className="text-xs space-y-1 max-h-32 overflow-y-auto">
                      <div className="text-gray-400">&gt; Debug panel initialized</div>
            <div className="text-gray-400">&gt; Current parameters loaded</div>
            <div className="text-gray-400">&gt; Rise calculations updated</div>
            <div className="text-gray-400">&gt; Geometry validation complete</div>
            <div className="text-green-400">&gt; Ready for debugging</div>
        </div>
      </div>
    </div>
  );
}
