import React, { useState, useEffect, useCallback } from 'react';
import { ParametersSection } from './components/ParametersSection';
import { EasementSection } from './components/EasementSection';
import { RiseAdjustmentSection } from './components/RiseAdjustmentSection';
import { ThreeJSVisualization } from './components/ThreeJSVisualization';
import { ResultsTable } from './components/ResultsTable';
import { HandrailParameters, SegmentResult, ReferenceResult } from './types/handrail';
import { calculateRiseAtDistance, getCurrentRiseAtDistance } from './utils/calculations';

function App() {
  const [parameters, setParameters] = useState<HandrailParameters>({
    totalDegrees: 220,
    totalHelicalRise: 7.375,
    totalArcDistance: 17.5,
    totalSegments: 10,
    pitchBlock: 1.0,
    bottomLength: 1.5,
    topLength: 2,
    bottomOffset: 1.5,
    topOffset: 1.875
  });

  const [manualRiseData, setManualRiseData] = useState<Record<number, number>>({});
  const [calculatedRiseData, setCalculatedRiseData] = useState<Record<number, number>>({});
  const [segmentResults, setSegmentResults] = useState<SegmentResult[]>([]);
  const [referenceResults, setReferenceResults] = useState<ReferenceResult[]>([]);

  // Debug state
  const [debugMode, setDebugMode] = useState(false);
  const [lastCalculationTime, setLastCalculationTime] = useState<number>(0);
  const [calculationErrors, setCalculationErrors] = useState<string[]>([]);

  const generateCalculatedRiseData = useCallback(() => {
    const startTime = performance.now();
    const newCalculatedData: Record<number, number> = {};
    const errors: string[] = [];
    
    try {
      for (let arcDist = 0; arcDist <= Math.ceil(parameters.totalArcDistance); arcDist++) {
        if (arcDist <= parameters.totalArcDistance) {
          const calculatedRise = calculateRiseAtDistance(
            arcDist, 
            parameters.totalHelicalRise, 
            parameters.totalArcDistance, 
            parameters.pitchBlock
          );
          
          // Validate calculated rise
          if (calculatedRise < 0 || calculatedRise > 20) {
            errors.push(`Invalid rise at ${arcDist}": ${calculatedRise}"`);
          }
          
          newCalculatedData[arcDist] = calculatedRise;
        }
      }
      
      setCalculatedRiseData(newCalculatedData);
      setCalculationErrors(errors);
      setLastCalculationTime(performance.now() - startTime);
    } catch (error) {
      errors.push(`Calculation error: ${error}`);
      setCalculationErrors(errors);
    }
  }, [parameters.totalHelicalRise, parameters.totalArcDistance, parameters.pitchBlock]);

  useEffect(() => {
    generateCalculatedRiseData();
  }, [generateCalculatedRiseData]);

  const handleParameterChange = (key: keyof HandrailParameters, value: number) => {
    setParameters(prev => ({ ...prev, [key]: value }));
  };

  const handleRiseChange = (arcDistance: number, value: number) => {
    setManualRiseData(prev => ({ ...prev, [arcDistance]: value }));
  };

  const handleResetRise = () => {
    setManualRiseData({});
  };

  const calculateSegments = () => {
    const startTime = performance.now();
    const anglePerSeg = parameters.totalDegrees / parameters.totalSegments;
    const results: SegmentResult[] = [];
    const errors: string[] = [];
    
    try {
      for (let i = 0; i <= parameters.totalSegments; i++) {
        const angle = i * anglePerSeg;
        const arcDistance = (i / parameters.totalSegments) * parameters.totalArcDistance;
        const rise = getCurrentRiseAtDistance(
          arcDistance, 
          manualRiseData, 
          calculatedRiseData, 
          parameters.totalArcDistance,
          parameters.totalHelicalRise,
          parameters.pitchBlock
        );
        
        // Validate rise value
        if (rise < 0 || rise > 20) {
          errors.push(`Invalid rise at segment ${i}: ${rise}"`);
        }
        
        let sectionName: string, sectionType: 'Bottom Over-Ease' | 'Main Spiral' | 'Top Up-Ease';
        if (i <= parameters.bottomLength) {
          sectionName = `Over-Ease-${i}`;
          sectionType = 'Bottom Over-Ease';
        } else if (i >= parameters.totalSegments - parameters.topLength) {
          const topIndex = i - (parameters.totalSegments - parameters.topLength);
          sectionName = `Up-Ease-${topIndex}`;
          sectionType = 'Top Up-Ease';
        } else {
          const spiralIndex = i - Math.ceil(parameters.bottomLength);
          sectionName = `Spiral-${spiralIndex}`;
          sectionType = 'Main Spiral';
        }
        
        results.push({
          segment: sectionName,
          section: sectionType,
          angle: angle.toFixed(1),
          arcDistance: arcDistance.toFixed(2),
          rise: rise.toFixed(3)
        });
      }
      
      setSegmentResults(results);
      setCalculationErrors(errors);
      setLastCalculationTime(performance.now() - startTime);
    } catch (error) {
      errors.push(`Segment calculation error: ${error}`);
      setCalculationErrors(errors);
    }
  };

  const calculateReference = () => {
    const startTime = performance.now();
    const results: ReferenceResult[] = [];
    const errors: string[] = [];
    
    try {
      // Calculate reference points every 0.5" for detailed analysis
      for (let arcDist = 0; arcDist <= parameters.totalArcDistance; arcDist += 0.5) {
        const rise = getCurrentRiseAtDistance(
          arcDist, 
          manualRiseData, 
          calculatedRiseData, 
          parameters.totalArcDistance,
          parameters.totalHelicalRise,
          parameters.pitchBlock
        );
        
        // Validate rise value
        if (rise < 0 || rise > 20) {
          errors.push(`Invalid reference rise at ${arcDist}": ${rise}"`);
        }
        
        let sectionName: string;
        if (arcDist <= parameters.bottomLength) {
          sectionName = 'Bottom Over-Ease';
        } else if (arcDist >= parameters.totalArcDistance - parameters.topLength) {
          sectionName = 'Top Up-Ease';
        } else {
          sectionName = 'Main Spiral';
        }
        
        const angle = (arcDist / parameters.totalArcDistance) * parameters.totalDegrees;
        
        results.push({
          arcDistance: arcDist.toFixed(1),
          section: sectionName,
          angle: angle.toFixed(1),
          rise: rise.toFixed(3)
        });
      }
      
      setReferenceResults(results);
      setCalculationErrors(errors);
      setLastCalculationTime(performance.now() - startTime);
    } catch (error) {
      errors.push(`Reference calculation error: ${error}`);
      setCalculationErrors(errors);
    }
  };

  const exportData = () => {
    const data = {
      parameters,
      manualRiseData,
      calculatedRiseData,
      segmentResults,
      referenceResults,
      timestamp: new Date().toISOString(),
      debugInfo: {
        lastCalculationTime,
        calculationErrors,
        debugMode
      }
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `handrail-data-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // System health monitoring
  const systemHealth = {
    parametersValid: parameters.totalDegrees > 0 && parameters.totalHelicalRise > 0 && parameters.totalArcDistance > 0,
    dataConsistency: Object.keys(manualRiseData).length === 0 || Object.keys(calculatedRiseData).length > 0,
    calculationSuccess: calculationErrors.length === 0,
    performance: lastCalculationTime < 100, // Less than 100ms is good
    coverage: parameters.totalSegments > 0 && parameters.bottomLength + parameters.topLength <= parameters.totalSegments
  };

  const getHealthStatus = () => {
    const issues = Object.values(systemHealth).filter(valid => !valid).length;
    if (issues === 0) return { status: '🟢 Healthy', color: 'text-green-600', bg: 'bg-green-50' };
    if (issues <= 2) return { status: '🟡 Warning', color: 'text-yellow-600', bg: 'bg-yellow-50' };
    return { status: '🔴 Critical', color: 'text-red-600', bg: 'bg-red-50' };
  };

  const healthStatus = getHealthStatus();

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Debug Status Panel */}
        <div className={`${healthStatus.bg} border-2 border-gray-200 rounded-2xl p-4`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center">
              <span className="mr-2">🔧</span>
              Spiral Handrail Calculator
              <span className={`ml-4 text-lg font-normal ${healthStatus.color}`}>
                {healthStatus.status}
              </span>
            </h2>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setDebugMode(!debugMode)}
                className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                  debugMode 
                    ? 'bg-purple-600 text-white' 
                    : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                }`}
              >
                {debugMode ? '🐛 Debug ON' : '🐛 Debug OFF'}
              </button>
              {debugMode && (
                <button
                  className="px-3 py-1 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  title="Settings"
                >
                  ⚙️ Settings
                </button>
              )}
              <button
                onClick={exportData}
                className="px-3 py-1 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                💾 Export Data
              </button>
            </div>
          </div>
          
          {/* System Health Dashboard */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
            <div className="text-center">
              <div className="font-semibold text-gray-700">Parameters</div>
              <div className={`text-lg ${systemHealth.parametersValid ? 'text-green-600' : 'text-red-600'}`}>
                {systemHealth.parametersValid ? '✅ Valid' : '❌ Invalid'}
              </div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-gray-700">Data Consistency</div>
              <div className={`text-lg ${systemHealth.dataConsistency ? 'text-green-600' : 'text-red-600'}`}>
                {systemHealth.dataConsistency ? '✅ Consistent' : '❌ Inconsistent'}
              </div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-gray-700">Calculations</div>
              <div className={`text-lg ${systemHealth.calculationSuccess ? 'text-green-600' : 'text-red-600'}`}>
                {systemHealth.calculationSuccess ? '✅ Success' : '❌ Errors'}
              </div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-gray-700">Performance</div>
              <div className={`text-lg ${systemHealth.performance ? 'text-green-600' : 'text-yellow-600'}`}>
                {lastCalculationTime.toFixed(1)}ms
              </div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-gray-700">Coverage</div>
              <div className={`text-lg ${systemHealth.coverage ? 'text-green-600' : 'text-red-600'}`}>
                {systemHealth.coverage ? '✅ Valid' : '❌ Invalid'}
              </div>
            </div>
          </div>
          
          {/* Debug Information */}
          {debugMode && (
            <div className="mt-4 p-3 bg-gray-100 rounded-lg border border-gray-300">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">🐛 Debug Information</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                <div>
                  <div className="font-semibold">Manual Overrides:</div>
                  <div>{Object.keys(manualRiseData).length} points</div>
                  <div>Range: {Object.values(manualRiseData).length > 0 ? 
                    `${Math.min(...Object.values(manualRiseData)).toFixed(3)}" - ${Math.max(...Object.values(manualRiseData)).toFixed(3)}"` : 
                    'None'
                  }</div>
                </div>
                <div>
                  <div className="font-semibold">Calculated Points:</div>
                  <div>{Object.keys(calculatedRiseData).length} points</div>
                  <div>Range: {Object.values(calculatedRiseData).length > 0 ? 
                    `${Math.min(...Object.values(calculatedRiseData)).toFixed(3)}" - ${Math.max(...Object.values(calculatedRiseData)).toFixed(3)}"` : 
                    'None'
                  }</div>
                </div>
                <div>
                  <div className="font-semibold">Segments:</div>
                  <div>{segmentResults.length} calculated</div>
                  <div>Last calc: {lastCalculationTime.toFixed(1)}ms</div>
                </div>
                <div>
                  <div className="font-semibold">Errors:</div>
                  <div className={calculationErrors.length > 0 ? 'text-red-600' : 'text-green-600'}>
                    {calculationErrors.length} issues
                  </div>
                  {calculationErrors.length > 0 && (
                    <div className="text-red-500 text-xs">
                      {calculationErrors.slice(0, 2).join(', ')}
                      {calculationErrors.length > 2 && ` +${calculationErrors.length - 2} more`}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Header */}
        <div className="bg-gradient-to-r from-blue-800 to-indigo-800 text-white p-8 text-center">
          <h1 className="text-4xl font-bold mb-2">Spiral Handrail Calculator</h1>
          <p className="text-blue-100">Professional compound easement geometry with 3D visualization</p>
        </div>
        
        <div className="p-8">
          {/* Measurement Note */}
          <div className="bg-gray-100 p-4 rounded-xl mb-8 border-l-4 border-gray-500 text-gray-700">
            <strong>Geometry:</strong> Easement centers offset toward staircase (180° opposite of landing). Inside reference: 10.5" arc, 7⅜" rise.
          </div>
          
          {/* Main Layout */}
          <div className="grid grid-cols-1 xl:grid-cols-[1fr_400px] gap-8 mb-8">
            <div className="flex flex-col gap-6">
              <ParametersSection 
                parameters={parameters} 
                onParameterChange={handleParameterChange} 
              />
              <EasementSection 
                parameters={parameters} 
                onParameterChange={handleParameterChange} 
              />
              
              {/* Custom Job Parameters Section */}
              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                  <span className="w-2 h-2 bg-purple-500 rounded-full mr-3"></span>
                  Custom Job Parameters
                </h3>
                <p className="text-gray-600 mb-4 text-sm">
                  Adjust these parameters for different staircase configurations. Changes are applied proportionally.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Outer Radius Control */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Outer Radius (inches)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="4"
                      max="20"
                      value={parameters.customOuterRadius || 8}
                      onChange={(e) => handleParameterChange('customOuterRadius', parseFloat(e.target.value) || 8)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="8.0"
                    />
                    <p className="text-xs text-gray-500 mt-1">Default: 8.0"</p>
                  </div>
                  
                  {/* Inner Radius Control */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Inner Radius (inches)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="2"
                      max="15"
                      value={parameters.customInnerRadius || 4.5}
                      onChange={(e) => handleParameterChange('customInnerRadius', parseFloat(e.target.value) || 4.5)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="4.5"
                    />
                    <p className="text-xs text-gray-500 mt-1">Default: 4.5"</p>
                  </div>
                  
                  {/* Easement Angle Control */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Easement Angle (degrees)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="20"
                      max="50"
                      value={parameters.customEasementAngle || 35.08}
                      onChange={(e) => handleParameterChange('customEasementAngle', parseFloat(e.target.value) || 35.08)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="35.08"
                    />
                    <p className="text-xs text-gray-500 mt-1">Default: 35.08°</p>
                  </div>
                </div>
                
                {/* Reset Button */}
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={() => {
                      handleParameterChange('customOuterRadius', 8);
                      handleParameterChange('customInnerRadius', 4.5);
                      handleParameterChange('customEasementAngle', 35.08);
                    }}
                    className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    Reset to Defaults
                  </button>
                </div>
              </div>
              
              <RiseAdjustmentSection
                totalArcDistance={parameters.totalArcDistance}
                manualRiseData={manualRiseData}
                calculatedRiseData={calculatedRiseData}
                onRiseChange={handleRiseChange}
                onReset={handleResetRise}
              />
            </div>
            
            <div className="xl:order-none order-first">
              <ThreeJSVisualization
                parameters={parameters}
                manualRiseData={manualRiseData}
                calculatedRiseData={calculatedRiseData}
                debugMode={debugMode}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center gap-4 mb-8 flex-wrap">
            <button
              onClick={calculateSegments}
              className="bg-gradient-to-r from-blue-500 to-blue-700 text-white px-8 py-4 rounded-xl font-semibold text-base transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-blue-500/30"
            >
              Calculate Segment Boundaries
            </button>
            <button
              onClick={calculateReference}
              className="bg-gradient-to-r from-blue-500 to-blue-700 text-white px-8 py-4 rounded-xl font-semibold text-base transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-blue-500/30"
            >
              Calculate Reference Points
            </button>
            <button
              onClick={exportData}
              className="bg-gradient-to-r from-blue-500 to-blue-700 text-white px-8 py-4 rounded-xl font-semibold text-base transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-blue-500/30"
            >
              Export Data
            </button>
          </div>

          {/* Results */}
          {segmentResults.length > 0 && (
            <div className="mb-6">
              <ResultsTable 
                title="Segment Boundary Points" 
                data={segmentResults} 
                type="segments" 
              />
            </div>
          )}
          
          {referenceResults.length > 0 && (
            <div>
              <ResultsTable 
                title={"Reference Points (1\" Intervals)"} 
                data={referenceResults} 
                type="reference" 
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;