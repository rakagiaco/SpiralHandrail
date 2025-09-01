import { RisePoint } from '../types/handrail';

export function interpolateRise(targetArc: number, knownPoints: RisePoint[]): number {
  if (knownPoints.length === 0) return 0;
  
  if (targetArc <= knownPoints[0].arc) return knownPoints[0].rise;
  
  if (targetArc >= knownPoints[knownPoints.length - 1].arc) {
    const lastPoint = knownPoints[knownPoints.length - 1];
    const secondLastPoint = knownPoints[knownPoints.length - 2];
    
    if (secondLastPoint) {
      const rate = (lastPoint.rise - secondLastPoint.rise) / (lastPoint.arc - secondLastPoint.arc);
      const extraDistance = targetArc - lastPoint.arc;
      return lastPoint.rise + (rate * extraDistance);
    }
    return lastPoint.rise;
  }
  
  for (let i = 0; i < knownPoints.length - 1; i++) {
    if (targetArc >= knownPoints[i].arc && targetArc <= knownPoints[i + 1].arc) {
      const lower = knownPoints[i];
      const upper = knownPoints[i + 1];
      const ratio = (targetArc - lower.arc) / (upper.arc - lower.arc);
      return lower.rise + ratio * (upper.rise - lower.rise);
    }
  }
  
  return knownPoints[knownPoints.length - 1].rise;
}

export function calculateRiseAtDistance(
  arcDistance: number,
  totalHelicalRise: number,
  totalArcDistance: number,
  pitchBlock: number
): number {
  const basePoints: RisePoint[] = [
    {arc: 0, rise: 1.0}, {arc: 1, rise: 1.5}, {arc: 2, rise: 2.0}, {arc: 3, rise: 2.5},
    {arc: 4, rise: 2.875}, {arc: 5, rise: 3.3125}, {arc: 6, rise: 3.625}, {arc: 7, rise: 4.0},
    {arc: 8, rise: 4.375}, {arc: 9, rise: 4.626}, {arc: 10, rise: 4.9}, {arc: 11, rise: 5.25},
    {arc: 12, rise: 5.5625}, {arc: 13, rise: 5.875}, {arc: 14, rise: 6.25}, {arc: 15, rise: 6.625},
    {arc: 16, rise: 7.125}, {arc: 17, rise: 7.5625}, {arc: 17.5, rise: 8.375}
  ];
  
  const baseRate = (8.375 - 1.0) / 17.5;
  const arcScale = totalArcDistance / 17.5;
  const riseScale = totalHelicalRise / 7.375;
  const pitchBlockDiff = pitchBlock - 1.0;
  
  const scaledPoints = basePoints.map(point => ({
    arc: point.arc * arcScale,
    rise: 1.0 + (point.rise - 1.0) * riseScale + pitchBlockDiff
  }));
  
  if (arcDistance > scaledPoints[scaledPoints.length - 1].arc) {
    const lastPoint = scaledPoints[scaledPoints.length - 1];
    const scaledRate = baseRate * riseScale;
    const extraDistance = arcDistance - lastPoint.arc;
    return lastPoint.rise + (scaledRate * extraDistance);
  }
  
  return interpolateRise(arcDistance, scaledPoints);
}

export function getCurrentRiseAtDistance(
  arcDistance: number,
  manualRiseData: Record<number, number>,
  calculatedRiseData: Record<number, number>,
  totalArcDistance: number,
  totalHelicalRise: number = 7.375,
  pitchBlock: number = 1.0
): number {
  if (Object.keys(manualRiseData).length === 0) {
    return calculateRiseAtDistance(arcDistance, totalHelicalRise, totalArcDistance, pitchBlock);
  }
  
  const interpolationPoints: RisePoint[] = [];
  
  Object.keys(manualRiseData).forEach(arcStr => {
    const arc = parseFloat(arcStr);
    if (arc <= totalArcDistance) {
      interpolationPoints.push({arc, rise: manualRiseData[arc]});
    }
  });
  
  for (let i = 0; i <= Math.ceil(totalArcDistance); i++) {
    if (i <= totalArcDistance && !manualRiseData[i]) {
      const calculatedRise = calculateRiseAtDistance(i, totalHelicalRise, totalArcDistance, pitchBlock);
      interpolationPoints.push({arc: i, rise: calculatedRise});
    }
  }
  
  interpolationPoints.sort((a, b) => a.arc - b.arc);
  
  if (interpolationPoints.length > 0) {
    return interpolateRise(arcDistance, interpolationPoints);
  }
  
  return calculateRiseAtDistance(arcDistance, totalHelicalRise, totalArcDistance, pitchBlock);
}

export function testCalculations() {
  console.log('=== Testing Rise Calculations ===');
  
  const testArc = 17.5;
  const testHelicalRise = 7.375;
  const testArcDistance = 17.5;
  const testPitchBlock = 1.0;
  
  const result = calculateRiseAtDistance(testArc, testHelicalRise, testArcDistance, testPitchBlock);
  
  console.log(`Arc: ${testArc}", Helical Rise: ${testHelicalRise}", Arc Distance: ${testArcDistance}", Pitch Block: ${testPitchBlock}"`);
  console.log(`Expected Rise: 8.375", Actual Rise: ${result}"`);
  console.log(`Difference: ${Math.abs(8.375 - result)}"`);
  
  for (let arc = 0; arc <= 17.5; arc += 2) {
    const rise = calculateRiseAtDistance(arc, testHelicalRise, testArcDistance, testPitchBlock);
    console.log(`Arc: ${arc}", Rise: ${rise}"`);
  }
  
  const innerArc = 10.5;
  const innerResult = calculateRiseAtDistance(innerArc, testHelicalRise, testArcDistance, testPitchBlock);
  console.log(`Inner Reference - Arc: ${innerArc}", Expected Rise: 5.425", Actual Rise: ${innerResult}"`);
  
  console.log('=== End Test ===');
}