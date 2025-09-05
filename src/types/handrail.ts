// TypeScript type definitions for the Spiral Handrail application
// These interfaces define the structure of data used throughout the application

// Represents a single point in the rise profile with its distance and height
export interface RisePoint {
  distance: number;  // Arc distance in inches from the start point
  rise: number;      // Height in inches above the reference plane
}

// Result of calculating rise for a specific segment of the handrail
export interface SegmentResult {
  segment: number;           // Segment number (0-based index)
  startDistance: number;     // Starting arc distance in inches
  endDistance: number;       // Ending arc distance in inches
  startRise: number;         // Starting height in inches
  endRise: number;           // Ending height in inches
  totalRise: number;         // Total rise for this segment
}

// Reference calculation result for different sections of the handrail
export interface ReferenceResult {
  sectionName: 'Over-Ease' | 'Main Spiral' | 'Up-Ease';  // Which section this reference applies to
  startDistance: number;     // Starting arc distance in inches
  endDistance: number;       // Ending arc distance in inches
  startRise: number;         // Starting height in inches
  endRise: number;           // Ending height in inches
  totalRise: number;         // Total rise for this section
}

// Complete set of parameters that define a spiral handrail
export interface HandrailParameters {
  // Core spiral dimensions
  totalDegrees: number;      // Total rotation in degrees (typically 220°)
  totalHelicalRise: number;  // Total height gain over the spiral in inches
  totalArcDistance: number;  // Total arc length in inches (typically 17.5")
  totalSegments: number;     // Number of segments to divide the spiral into
  
  // Inside line specific parameters
  insideArcDistance: number; // Total arc length for inside line in inches (typically 10.5")
  insideRunDistance: number; // Total run distance for inside line in inches (calculated from inner radius)
  
  // Height and offset parameters
  pitchBlock: number;        // Height of the pitch block at the bottom in inches
  bottomLength: number;      // Length of the bottom easement in segments
  topLength: number;         // Length of the top easement in segments
  bottomOffset: number;      // Offset distance for bottom center in inches
  topOffset: number;         // Offset distance for top center in inches
  
  // Custom parameters for dynamic adjustment (optional)
  customOuterRadius?: number;    // Custom outer radius override in inches
  customInnerRadius?: number;    // Custom inner radius override in inches
  customEasementAngle?: number;  // Custom easement angle override in degrees
}