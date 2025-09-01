import { RisePoint } from '../types/handrail';

export function interpolateRise(targetArc: number, knownPoints: RisePoint[]): number {
  if (targetArc <= knownPoints[0].arc) return knownPoints[0].rise;
  if (targetArc >= knownPoints[knownPoints.length - 1].arc) {
    return knownPoints[knownPoints.length - 1].rise;
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
  
  const arcScale = totalArcDistance / 17.5;
  const riseScale = totalHelicalRise / 7.375;
  const pitchBlockDiff = pitchBlock - 1.0;
  
  const scaledPoints = basePoints.map(point => ({
    arc: point.arc * arcScale,
    rise: 1.0 + (point.rise - 1.0) * riseScale + pitchBlockDiff
  }));
  
  return interpolateRise(arcDistance, scaledPoints);
}

export function getCurrentRiseAtDistance(
  arcDistance: number,
  manualRiseData: Record<number, number>,
  calculatedRiseData: Record<number, number>,
  totalArcDistance: number
): number {
  if (Object.keys(manualRiseData).length === 0) {
    return calculatedRiseData[Math.round(arcDistance)] || 0;
  }
  
  const interpolationPoints: RisePoint[] = [];
  
  for (let i = 0; i <= Math.ceil(totalArcDistance); i++) {
    if (i <= totalArcDistance) {
      const rise = manualRiseData[i] !== undefined ? manualRiseData[i] : calculatedRiseData[i];
      if (rise !== undefined) {
        interpolationPoints.push({arc: i, rise: rise});
      }
    }
  }
  
  return interpolateRise(arcDistance, interpolationPoints);
}