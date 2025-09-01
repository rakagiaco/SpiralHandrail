export interface RisePoint {
  arc: number;
  rise: number;
}

export interface SegmentResult {
  segment: string;
  section: 'Bottom Over-Ease' | 'Main Spiral' | 'Top Up-Ease';
  angle: string;
  arcDistance: string;
  rise: string;
}

export interface ReferenceResult {
  arcDistance: string;
  section: 'Over-Ease' | 'Main Spiral' | 'Up-Ease';
  angle: string;
  rise: string;
}

export interface HandrailParameters {
  totalDegrees: number;
  totalHelicalRise: number;
  totalArcDistance: number;
  totalSegments: number;
  pitchBlock: number;
  bottomLength: number;
  topLength: number;
  bottomOffset: number;
  topOffset: number;
}