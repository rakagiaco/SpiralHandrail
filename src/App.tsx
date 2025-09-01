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

  const generateCalculatedRiseData = useCallback(() => {
    const newCalculatedData: Record<number, number> = {};
    
    for (let arcDist = 0; arcDist <= Math.ceil(parameters.totalArcDistance); arcDist++) {
      if (arcDist <= parameters.totalArcDistance) {
        const calculatedRise = calculateRiseAtDistance(
          arcDist, 
          parameters.totalHelicalRise, 
          parameters.totalArcDistance, 
          parameters.pitchBlock
        );
        newCalculatedData[arcDist] = calculatedRise;
      }
    }
    
    setCalculatedRiseData(newCalculatedData);
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
    const anglePerSeg = parameters.totalDegrees / parameters.totalSegments;
    const results: SegmentResult[] = [];
    
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
  };

  const calculateReference = () => {
    const results: ReferenceResult[] = [];
    
    for (let arcDist = 0; arcDist <= parameters.totalArcDistance; arcDist += 1.0) {
      const angle = (arcDist / parameters.totalArcDistance) * parameters.totalDegrees;
      const rise = getCurrentRiseAtDistance(
        arcDist, 
        manualRiseData, 
        calculatedRiseData, 
        parameters.totalArcDistance,
        parameters.totalHelicalRise,
        parameters.pitchBlock
      );
      const segmentPosition = (arcDist / parameters.totalArcDistance) * parameters.totalSegments;
      
      let sectionType: 'Over-Ease' | 'Main Spiral' | 'Up-Ease';
      if (segmentPosition <= parameters.bottomLength) {
        sectionType = 'Over-Ease';
      } else if (segmentPosition >= parameters.totalSegments - parameters.topLength) {
        sectionType = 'Up-Ease';
      } else {
        sectionType = 'Main Spiral';
      }
      
      results.push({
        arcDistance: arcDist.toFixed(1),
        section: sectionType,
        angle: angle.toFixed(1),
        rise: rise.toFixed(3)
      });
    }
    
    setReferenceResults(results);
  };

  const exportData = () => {
    let text = 'SPIRAL HANDRAIL CALCULATOR\n';
    text += '=========================\n\n';
    text += 'Parameters:\n';
    text += `Total Degrees: ${parameters.totalDegrees}°\n`;
    text += `Total Helical Rise: ${parameters.totalHelicalRise}"\n`;
    text += `Total Arc Distance: ${parameters.totalArcDistance}"\n`;
    text += `Pitch Block Height: ${parameters.pitchBlock}"\n`;
    text += `Total Segments: ${parameters.totalSegments}\n`;
    text += `Bottom Offset: ${parameters.bottomOffset}" (toward staircase)\n`;
    text += `Top Offset: ${parameters.topOffset}" (toward staircase)\n\n`;
    
    if (Object.keys(manualRiseData).length > 0) {
      text += 'MANUAL RISE ADJUSTMENTS:\n';
      Object.keys(manualRiseData)
        .sort((a, b) => parseFloat(a) - parseFloat(b))
        .forEach(arcDist => {
          text += `${arcDist}" arc: ${manualRiseData[parseInt(arcDist)].toFixed(3)}"\n`;
        });
      text += '\n';
    }
    
    if (segmentResults.length > 0) {
      text += 'SEGMENT BOUNDARIES:\n';
      text += 'Segment\tSection\tAngle\tArc Distance\tRise\n';
      segmentResults.forEach(row => {
        text += `${row.segment}\t${row.section}\t${row.angle}°\t${row.arcDistance}"\t${row.rise}"\n`;
      });
      text += '\n';
    }
    
    if (referenceResults.length > 0) {
      text += 'REFERENCE POINTS:\n';
      text += 'Arc Distance\tSection\tAngle\tRise\n';
      referenceResults.forEach(row => {
        text += `${row.arcDistance}"\t${row.section}\t${row.angle}°\t${row.rise}"\n`;
      });
    }
    
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'spiral_handrail_data.txt';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-purple-700 p-5">
      <div className="max-w-7xl mx-auto bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl overflow-hidden">
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