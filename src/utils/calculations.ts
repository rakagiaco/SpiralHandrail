import { RisePoint } from '../types/handrail';

// Mathematical utility functions for spiral handrail calculations
// These functions handle interpolation and rise calculations based on manual input data

// Interpolates rise values between known points to create smooth curves
// Uses linear interpolation between the two closest known points
export function interpolateRise(
  distance: number,                    // Current arc distance to interpolate at
  manualRiseData: Record<number, number>,  // User-provided rise data points
  calculatedRiseData: Record<number, number>  // Calculated rise data points
): number {
  // Combine both data sources for comprehensive coverage
  const allData = { ...calculatedRiseData, ...manualRiseData };
  
  // Get sorted distances for efficient searching
  const distances = Object.keys(allData).map(Number).sort((a, b) => a - b);
  
  // Handle edge cases: if no data or distance is outside range
  if (distances.length === 0) return 0;
  if (distance <= distances[0]) return allData[distances[0]];
  if (distance >= distances[distances.length - 1]) return allData[distances[distances.length - 1]];
  
  // Find the two closest points for interpolation
  let lowerIndex = 0;
  for (let i = 0; i < distances.length - 1; i++) {
    if (distance >= distances[i] && distance <= distances[i + 1]) {
      lowerIndex = i;
      break;
    }
  }
  
  // Extract the two points for linear interpolation
  const lowerDistance = distances[lowerIndex];
  const upperDistance = distances[lowerIndex + 1];
  const lowerRise = allData[lowerDistance];
  const upperRise = allData[upperDistance];
  
  // Calculate interpolation factor (0 to 1)
  const factor = (distance - lowerDistance) / (upperDistance - lowerDistance);
  
  // Linear interpolation: rise = lowerRise + factor * (upperRise - lowerRise)
  return lowerRise + factor * (upperRise - lowerRise);
}

// Calculates rise at a specific arc distance using pre-defined base points
// This function provides the foundation rise data that gets scaled and adjusted
export function calculateRiseAtDistance(
  arcDistance: number,                 // Current arc distance in inches
  totalHelicalRise: number,            // Total height gain over the spiral
  totalArcDistance: number,            // Total arc length of the spiral
  pitchBlock: number                   // Height of the pitch block at bottom
): number {
  // Base rise points for a standard 17.5" arc with 7.375" rise
  // These points define the fundamental rise profile that gets scaled
  const basePoints: RisePoint[] = [
    {distance: 0, rise: 1.0}, {distance: 1, rise: 1.5}, {distance: 2, rise: 2.0}, {distance: 3, rise: 2.5},
    {distance: 4, rise: 2.875}, {distance: 5, rise: 3.3125}, {distance: 6, rise: 3.625}, {distance: 7, rise: 4.0},
    {distance: 8, rise: 4.375}, {distance: 9, rise: 4.626}, {distance: 10, rise: 4.9}, {distance: 11, rise: 5.25},
    {distance: 12, rise: 5.5625}, {distance: 13, rise: 5.875}, {distance: 14, rise: 6.25}, {distance: 15, rise: 6.625},
    {distance: 16, rise: 7.125}, {distance: 17, rise: 7.5625}, {distance: 17.5, rise: 8.375}
  ];
  
  // Calculate scaling factors to adjust for different dimensions
  const baseRate = (8.375 - 1.0) / 17.5;        // Base rise rate per inch
  const arcScale = totalArcDistance / 17.5;      // Scale factor for arc distance
  const riseScale = totalHelicalRise / 7.375;    // Scale factor for total rise
  const pitchBlockDiff = pitchBlock - 1.0;       // Adjustment for different pitch block heights
  
  // Scale the base points to match the current parameters
  const scaledPoints = basePoints.map(point => ({
    distance: point.distance * arcScale,
    rise: 1.0 + (point.rise - 1.0) * riseScale + pitchBlockDiff
  }));
  
  // Handle cases where the requested distance exceeds the scaled range
  if (arcDistance > scaledPoints[scaledPoints.length - 1].distance) {
    const lastPoint = scaledPoints[scaledPoints.length - 1];
    const scaledRate = baseRate * riseScale;
    const extraDistance = arcDistance - lastPoint.distance;
    return lastPoint.rise + (scaledRate * extraDistance);
  }
  
  // Use interpolation to find the rise at the requested distance
  // Convert scaledPoints array to the expected Record<number, number> format
  const scaledPointsRecord: Record<number, number> = {};
  scaledPoints.forEach(point => {
    scaledPointsRecord[point.distance] = point.rise;
  });
  
  return interpolateRise(arcDistance, scaledPointsRecord, {});
}

// Calculates the current rise at a specific arc distance
// This is the main function used by the 3D visualizer to determine handrail height
export function getCurrentRiseAtDistance(
  arcDistance: number,                 // Current arc distance in inches
  manualRiseData: Record<number, number>,  // User-provided rise data
  calculatedRiseData: Record<number, number>  // Calculated rise data
): number {
  // Use interpolation to get the rise value at this specific distance
  const interpolatedRise = interpolateRise(arcDistance, manualRiseData, calculatedRiseData);
  
  // Ensure the rise value is within reasonable bounds
  // Rise should start at pitch block height and not go below 0
  const clampedRise = Math.max(0, interpolatedRise);
  
  return clampedRise;
}

// Test function to verify rise calculations are working correctly
// This function outputs test results to the console for debugging
export function testCalculations() {
  console.log('=== Testing Rise Calculations ===');
  
  // Test parameters for a standard handrail
  const testArc = 17.5;           // Test arc distance in inches
  const testHelicalRise = 7.375;  // Test total helical rise in inches
  const testArcDistance = 17.5;   // Test total arc distance in inches
  const testPitchBlock = 1.0;     // Test pitch block height in inches
  
  // Calculate rise at the maximum arc distance
  const result = calculateRiseAtDistance(testArc, testHelicalRise, testArcDistance, testPitchBlock);
  
  // Output test results
  console.log(`Arc: ${testArc}", Helical Rise: ${testHelicalRise}", Arc Distance: ${testArcDistance}", Pitch Block: ${testPitchBlock}"`);
  console.log(`Expected Rise: 8.375", Actual Rise: ${result}"`);
  console.log(`Difference: ${Math.abs(8.375 - result)}"`);
  
  // Test rise values at various arc distances
  for (let arc = 0; arc <= 17.5; arc += 2) {
    const rise = calculateRiseAtDistance(arc, testHelicalRise, testArcDistance, testPitchBlock);
    console.log(`Arc: ${arc}", Rise: ${rise}"`);
  }
  
  // Test inner reference point (10.5" arc distance)
  const innerArc = 10.5;
  const innerResult = calculateRiseAtDistance(innerArc, testHelicalRise, testArcDistance, testPitchBlock);
  console.log(`Inner Reference - Arc: ${innerArc}", Expected Rise: 5.425", Actual Rise: ${innerResult}"`);
  
  console.log('=== End Test ===');
}