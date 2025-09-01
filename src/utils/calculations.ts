// ============================================================================
// SPIRAL HANDRAIL CALCULATIONS - COMPLETE FILE BREAKDOWN
// ============================================================================
// This file contains the core mathematical logic for calculating handrail rise
// at any given arc distance along the spiral staircase.
// ============================================================================

// Import the RisePoint interface from the types file
// RisePoint defines the structure: {arc: number, rise: number}
// where 'arc' is the distance along the spiral and 'rise' is the vertical height
import { RisePoint } from '../types/handrail';

// ============================================================================
// FUNCTION 1: interpolateRise - Linear interpolation between known points
// ============================================================================
// Purpose: Given a target arc distance, find the rise by interpolating between
// two known reference points. This creates smooth transitions between measurements.
export function interpolateRise(targetArc: number, knownPoints: RisePoint[]): number {
  // Safety check: if no points provided, return 0
  if (knownPoints.length === 0) return 0;
  
  // If target is before first point, use first point's rise value
  if (targetArc <= knownPoints[0].arc) return knownPoints[0].rise;
  
  // If target is beyond last point, extrapolate using the rate of change
  if (targetArc >= knownPoints[knownPoints.length - 1].arc) {
    // Continue at the same rate beyond the last known point
    const lastPoint = knownPoints[knownPoints.length - 1];        // Get the final reference point
    const secondLastPoint = knownPoints[knownPoints.length - 2];  // Get the second-to-last point
    
    if (secondLastPoint) {
      // Calculate rate of rise: (rise difference) / (arc difference)
      const rate = (lastPoint.rise - secondLastPoint.rise) / (lastPoint.arc - secondLastPoint.arc);
      // Calculate how far beyond the last point we are
      const extraDistance = targetArc - lastPoint.arc;
      // Extrapolate: last rise + (rate × extra distance)
      return lastPoint.rise + (rate * extraDistance);
    }
    // Fallback: if no second-to-last point, just return the last known rise
    return lastPoint.rise;
  }
  
  // Main interpolation logic: find the two points that bracket our target
  for (let i = 0; i < knownPoints.length - 1; i++) {
    // Check if target falls between current point and next point
    if (targetArc >= knownPoints[i].arc && targetArc <= knownPoints[i + 1].arc) {
      const lower = knownPoints[i];      // Lower arc distance point
      const upper = knownPoints[i + 1];  // Higher arc distance point
      
      // Calculate interpolation ratio: how far between the two points
      const ratio = (targetArc - lower.arc) / (upper.arc - lower.arc);
      
      // Linear interpolation: lower rise + ratio × (rise difference)
      return lower.rise + ratio * (upper.rise - lower.rise);
    }
  }
  
  // Fallback: if somehow we didn't find a bracket, return the last known rise
  return knownPoints[knownPoints.length - 1].rise;
}

// ============================================================================
// FUNCTION 2: calculateRiseAtDistance - Main rise calculation engine
// ============================================================================
// Purpose: Calculate the rise at any arc distance using reference measurements
// and scaling them to match the current handrail parameters.
export function calculateRiseAtDistance(
  arcDistance: number,        // Current arc distance we want rise for
  totalHelicalRise: number,   // Total vertical rise of the helical section
  totalArcDistance: number,   // Total arc distance of the entire handrail
  pitchBlock: number          // Starting height (usually 1.0 inch)
): number {
  // Your exact reference measurements from the HTML file
  // These are the "gold standard" measurements that define the rise profile
  const basePoints: RisePoint[] = [
    {arc: 0, rise: 1.0}, {arc: 1, rise: 1.5}, {arc: 2, rise: 2.0}, {arc: 3, rise: 2.5},
    {arc: 4, rise: 2.875}, {arc: 5, rise: 3.3125}, {arc: 6, rise: 3.625}, {arc: 7, rise: 4.0},
    {arc: 8, rise: 4.375}, {arc: 9, rise: 4.626}, {arc: 10, rise: 4.9}, {arc: 11, rise: 5.25},
    {arc: 12, rise: 5.5625}, {arc: 13, rise: 5.875}, {arc: 14, rise: 6.25}, {arc: 15, rise: 6.625},
    {arc: 16, rise: 7.125}, {arc: 17, rise: 7.5625}, {arc: 17.5, rise: 8.375}
  ];
  
  // Calculate the rate of rise for continuation beyond 17.5" arc
  // At 17.5" arc, rise is 8.375", so rate = (8.375 - 1.0) / 17.5 = 0.4214 inches per inch of arc
  // This rate is used when the handrail extends beyond the reference measurements
  const baseRate = (8.375 - 1.0) / 17.5; // 0.4214 inches per inch
  
  // Scale the base rate to match your total parameters
  // arcScale: how much to stretch/compress the arc distance
  const arcScale = totalArcDistance / 17.5;
  // riseScale: how much to stretch/compress the rise values
  const riseScale = totalHelicalRise / 7.375;
  // pitchBlockDiff: how much to adjust for different starting heights
  const pitchBlockDiff = pitchBlock - 1.0;
  
  // Scale the reference points to match current parameters
  // This transforms the "gold standard" measurements to fit the current handrail
  const scaledPoints = basePoints.map(point => ({
    arc: point.arc * arcScale,                                    // Scale arc distance
    rise: 1.0 + (point.rise - 1.0) * riseScale + pitchBlockDiff  // Scale rise + adjust pitch block
  }));
  
  // If we're beyond the scaled reference points, continue at the calculated rate
  // This handles cases where the handrail is longer than the reference measurements
  if (arcDistance > scaledPoints[scaledPoints.length - 1].arc) {
    const lastPoint = scaledPoints[scaledPoints.length - 1];  // Get the last scaled reference point
    const scaledRate = baseRate * riseScale;                  // Scale the rate to match parameters
    const extraDistance = arcDistance - lastPoint.arc;        // How far beyond the last point
    return lastPoint.rise + (scaledRate * extraDistance);     // Extrapolate using scaled rate
  }
  
  // Normal case: interpolate between the scaled reference points
  return interpolateRise(arcDistance, scaledPoints);
}

// ============================================================================
// FUNCTION 3: getCurrentRiseAtDistance - Master function that decides rise source
// ============================================================================
// Purpose: This is the main function called by the 3D visualization. It decides
// whether to use manual overrides, calculated values, or a combination of both.
export function getCurrentRiseAtDistance(
  arcDistance: number,        // Current arc distance we want rise for
  manualRiseData: Record<number, number>,    // User's manual rise overrides
  calculatedRiseData: Record<number, number>, // Previously calculated rises
  totalArcDistance: number,   // Total arc distance of the handrail
  totalHelicalRise: number = 7.375,  // Default helical rise (7.375 inches)
  pitchBlock: number = 1.0           // Default pitch block (1.0 inch)
): number {
  // If no manual data exists, calculate the rise directly using current parameters
  if (Object.keys(manualRiseData).length === 0) {
    return calculateRiseAtDistance(arcDistance, totalHelicalRise, totalArcDistance, pitchBlock);
  }
  
  // Create interpolation points from manual data, sorted by arc distance
  // This array will contain both manual overrides and calculated fills
  const interpolationPoints: RisePoint[] = [];
  
  // Add all manual rise points (user's overrides take priority)
  Object.keys(manualRiseData).forEach(arcStr => {
    const arc = parseFloat(arcStr);  // Convert string key to number
    if (arc <= totalArcDistance) {   // Only include points within the handrail length
      interpolationPoints.push({arc, rise: manualRiseData[arc]});
    }
  });
  
  // Add calculated points for any gaps in the manual data
  // This ensures we have a complete set of points for interpolation
  for (let i = 0; i <= Math.ceil(totalArcDistance); i++) {
    if (i <= totalArcDistance && !manualRiseData[i]) {  // If no manual data at this arc
      const calculatedRise = calculateRiseAtDistance(i, totalHelicalRise, totalArcDistance, pitchBlock);
      interpolationPoints.push({arc: i, rise: calculatedRise});
    }
  }
  
  // Sort by arc distance to ensure proper interpolation order
  // Interpolation requires points to be in ascending arc order
  interpolationPoints.sort((a, b) => a.arc - b.arc);
  
  // If we have points, interpolate between them; otherwise fall back to calculated
  if (interpolationPoints.length > 0) {
    return interpolateRise(arcDistance, interpolationPoints);
  }
  
  // Fallback to direct calculation if something went wrong
  return calculateRiseAtDistance(arcDistance, totalHelicalRise, totalArcDistance, pitchBlock);
}

// ============================================================================
// FUNCTION 4: testCalculations - Debug/testing function
// ============================================================================
// Purpose: This function tests the calculations to ensure they're working correctly.
// It's useful for debugging and verifying the math produces expected results.
export function testCalculations() {
  console.log('=== Testing Rise Calculations ===');
  
  // Test the standard case: 17.5" arc, 7.375" helical rise, 1.0" pitch block
  // This should produce exactly 8.375" rise at 17.5" arc
  const testArc = 17.5;              // Test arc distance
  const testHelicalRise = 7.375;     // Test helical rise
  const testArcDistance = 17.5;      // Test total arc distance
  const testPitchBlock = 1.0;        // Test pitch block height
  
  // Calculate the rise for the test case
  const result = calculateRiseAtDistance(testArc, testHelicalRise, testArcDistance, testPitchBlock);
  
  // Log the test parameters and results
  console.log(`Arc: ${testArc}", Helical Rise: ${testHelicalRise}", Arc Distance: ${testArcDistance}", Pitch Block: ${testPitchBlock}"`);
  console.log(`Expected Rise: 8.375", Actual Rise: ${result}"`);
  console.log(`Difference: ${Math.abs(8.375 - result)}"`);
  
  // Test a few other points to show the straight line progression
  // This demonstrates how the rise increases linearly from 1.0" to 8.375"
  for (let arc = 0; arc <= 17.5; arc += 2) {
    const rise = calculateRiseAtDistance(arc, testHelicalRise, testArcDistance, testPitchBlock);
    console.log(`Arc: ${arc}", Rise: ${rise}"`);
  }
  
  // Test the inner reference line: 10.5" arc, 7.375" rise
  // The inner line covers the full 220° span but only 10.5" arc distance
  const innerArc = 10.5;
  const innerResult = calculateRiseAtDistance(innerArc, testHelicalRise, testArcDistance, testPitchBlock);
  console.log(`Inner Reference - Arc: ${innerArc}", Expected Rise: 5.425", Actual Rise: ${innerResult}"`);
  
  console.log('=== End Test ===');
}

// ============================================================================
// SUMMARY OF WHAT THIS FILE DOES:
// ============================================================================
// 1. interpolateRise: Linear interpolation between known rise points
// 2. calculateRiseAtDistance: Main engine that scales reference measurements
// 3. getCurrentRiseAtDistance: Master function that handles manual overrides
// 4. testCalculations: Debug function to verify calculations work correctly
//
// The core concept: This file takes "gold standard" reference measurements
// (like 17.5" arc = 8.375" rise) and scales them to fit any handrail size
// while maintaining the same proportional rise profile.
// ============================================================================