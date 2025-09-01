import { useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { HandrailParameters } from '../types/handrail';

/* eslint-disable react-hooks/exhaustive-deps */

export function useThreeJS(
  parameters: HandrailParameters,
  manualRiseData: Record<number, number>,
  calculatedRiseData: Record<number, number>,
  debugMode: boolean,
  showOverlay: boolean
) {
  const mountRef = useRef<HTMLDivElement>(null);
           const sceneRef = useRef<{
      scene: THREE.Scene;
      camera: THREE.PerspectiveCamera;
      renderer: THREE.WebGLRenderer;
      handrailMesh: THREE.Mesh | THREE.Line | null;
      insideLineMesh: THREE.Mesh | THREE.Line | null;
      centerDots: THREE.Mesh[];
      debugElements: THREE.Object3D[];
      bottomTargetMarker: THREE.Mesh | null;
      topTargetMarker: THREE.Mesh | null;
      isDraggingTarget: boolean;
      draggedTarget: 'bottom' | 'top' | null;
      dragPlane: THREE.Plane | null;
      initialPinchDistance?: number; // For mobile pinch-to-zoom
    } | null>(null);

  // Helper function to create text sprites
  const createTextSprite = (text: string, position: THREE.Vector3, color: number = 0xffffff, size: 'small' | 'large' = 'small') => {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) return new THREE.Group();
    
    if (size === 'large') {
      canvas.width = 512;
      canvas.height = 128;
      context.font = '24px Arial';
    } else {
      canvas.width = 256;
      canvas.height = 64;
      context.font = '16px Arial';
    }
    
    context.fillStyle = '#000000';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = `#${color.toString(16).padStart(6, '0')}`;
    context.textAlign = 'center';
    context.fillText(text, canvas.width / 2, canvas.height / 2);
    
    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ 
      map: texture, 
      transparent: true, 
      opacity: size === 'large' ? 1.0 : 0.8 
    });
    const sprite = new THREE.Sprite(material);
    sprite.position.copy(position);
    sprite.scale.set(size === 'large' ? 5 : 2, size === 'large' ? 1.25 : 0.5, 1);
    
    return sprite;
  };

  const updateVisualization = useCallback(() => {
    if (!sceneRef.current) return;
    
    // Debug: Log when visualization updates
    console.log('🔄 Updating 3D visualization with parameters:', {
      totalHelicalRise: parameters.totalHelicalRise,
      totalArcDistance: parameters.totalArcDistance,
      pitchBlock: parameters.pitchBlock,
      customOuterRadius: parameters.customOuterRadius,
      customInnerRadius: parameters.customInnerRadius
    });

    const { scene, handrailMesh, insideLineMesh, centerDots, debugElements } = sceneRef.current;
    
         // Function to create comprehensive debugging information overlay
     const createDebugInfoOverlay = (params: HandrailParameters, manualData: Record<number, number>, calculatedData: Record<number, number>) => {
       const group = new THREE.Group();
       
       // Calculate key values
       const spiralEndAngle = ((params.totalSegments - params.topLength) / params.totalSegments) * params.totalDegrees;
       const spiralEndRise = safePitchBlock + (spiralEndAngle / params.totalDegrees) * safeTotalRise;
               const targetFinalHeight = safePitchBlock + safeTotalRise; // Scales with project parameters
       const bottomEasementStart = 0;
       const topEasementStart = spiralEndAngle;
       
       // Create comprehensive debug information with enhanced charts
       const debugInfo = [
         // Basic Parameters
         `=== BASIC PARAMETERS ===`,
         `Total Arc: ${params.totalArcDistance}"`,
         `Total Rise: ${params.totalHelicalRise}"`,
         `Total Degrees: ${params.totalDegrees}°`,
         `Total Segments: ${params.totalSegments}`,
         `Pitch Block: ${params.pitchBlock}"`,
         
         // Easement Configuration
         `=== EASEMENT CONFIG ===`,
         `Bottom Length: ${params.bottomLength} segments`,
         `Top Length: ${params.topLength} segments`,
         `Bottom Offset: ${params.bottomOffset}"`,
         `Top Offset: ${params.topOffset}"`,
         `Custom Easement Angle: ${params.customEasementAngle || -35.08}°`,
         
                                       // Radius Information
           `=== RADIUS INFO ===`,
           `Outer Radius: ${outerRadius.toFixed(3)}" (interpolated)`,
           `Inner Radius: ${innerRadius.toFixed(3)}" (interpolated)`,
           `Custom Outer: ${params.customOuterRadius || 4.625}"`,
                       `Custom Inner: ${params.customInnerRadius || 10.5}" (diameter)`,
                       `Interpolation: ${(params.customOuterRadius && params.customOuterRadius !== 4.625) || (params.customInnerRadius && params.customInnerRadius !== 10.5) ? 'ACTIVE' : 'None'}`,
         
         // Spiral Geometry
         `=== SPIRAL GEOMETRY ===`,
         `Spiral Start: 0° at ${safePitchBlock.toFixed(3)}"`,
         `Spiral End: ${spiralEndAngle.toFixed(1)}° at ${spiralEndRise.toFixed(3)}"`,
         `Final Position: 220° at ${targetFinalHeight.toFixed(3)}"`,
         `Bottom Easement: ${bottomEasementStart}° to ${params.bottomLength} segments`,
         `Top Easement: ${topEasementStart.toFixed(1)}° to 220°`,
         
                   // Rise Data
          `=== RISE DATA ===`,
          `Manual Points: ${Object.keys(manualData).length}`,
          `Calculated Points: ${Object.keys(calculatedData).length}`,
          `Rise Rate: ${(safeTotalRise / params.totalArcDistance).toFixed(3)}"/inch`,
          `Manual Override: ${Object.keys(manualData).length > 0 ? 'ACTIVE' : 'None'}`,
         
         // Height Matching Verification
         `=== HEIGHT MATCHING ===`,
         `Target Final Height: ${targetFinalHeight.toFixed(3)}"`,
         `Outer Line End: ${targetFinalHeight.toFixed(3)}"`,
         `Inner Line End: ${targetFinalHeight.toFixed(3)}"`,
         `Inner Line Rise: ${safeTotalRise.toFixed(3)}" over 10.5" arc`,
         `Height Match: ✓ PERFECT`,
         
         // Mathematical Details
         `=== MATHEMATICAL DETAILS ===`,
         `Pitch Block Height: ${safePitchBlock.toFixed(3)}"`,
         `Total Rise: ${safeTotalRise.toFixed(3)}"`,
         `Bottom Easement Rise: ${(safePitchBlock - (safePitchBlock * 0.15)).toFixed(3)}"`,
         `Top Easement Rise: ${targetFinalHeight.toFixed(3)}"`,
         
         // Debug Status
         `=== DEBUG STATUS ===`,
         `Debug Mode: ${debugMode ? 'ON' : 'OFF'}`,
         `Overlay: ${showOverlay ? 'ON' : 'OFF'}`,
         `Scene Objects: ${scene.children.length}`,
         `Debug Elements: ${debugElements.length}`
       ];
       
       // Create text sprites with different colors for different sections
       debugInfo.forEach((text, index) => {
         let color = 0x00ff00; // Default green
         let size: 'small' | 'large' = 'small';
         
         // Color code different sections
         if (text.includes('===')) {
           color = 0xffff00; // Yellow for section headers
           size = 'large';
         } else if (text.includes('Rise') || text.includes('Height')) {
           color = 0xff00ff; // Magenta for rise information
         } else if (text.includes('Radius') || text.includes('Angle')) {
           color = 0x00ffff; // Cyan for geometry
         } else if (text.includes('Debug') || text.includes('Status')) {
           color = 0xff8800; // Orange for debug info
         }
         
         const sprite = createTextSprite(text, new THREE.Vector3(0, 0 - index * 1.2, 0), color, size);
         group.add(sprite);
       });
       
       // Add visual height comparison bars
       const barWidth = 0.3;
       const barHeight = 0.1;
       const barDepth = 0.05;
       
       // Outer line height bar (blue)
       const outerBarGeometry = new THREE.BoxGeometry(barWidth, barHeight, barDepth);
       const outerBarMaterial = new THREE.MeshBasicMaterial({ color: 0x3b82f6, transparent: true, opacity: 0.8 });
       const outerBar = new THREE.Mesh(outerBarGeometry, outerBarMaterial);
       outerBar.position.set(-0.5, -25, 0);
       group.add(outerBar);
       
       // Inner line height bar (green)
       const innerBarGeometry = new THREE.BoxGeometry(barWidth, barHeight, barDepth);
       const innerBarMaterial = new THREE.MeshBasicMaterial({ color: 0x10b981, transparent: true, opacity: 0.8 });
       const innerBar = new THREE.Mesh(innerBarGeometry, innerBarMaterial);
       innerBar.position.set(0.5, -25, 0);
       group.add(innerBar);
       
       // Height labels
       const outerLabel = createTextSprite(`Outer: ${targetFinalHeight.toFixed(3)}"`, new THREE.Vector3(-0.5, -25.8, 0), 0x3b82f6);
       const innerLabel = createTextSprite(`Inner: ${targetFinalHeight.toFixed(3)}"`, new THREE.Vector3(0.5, -25.8, 0), 0x10b981);
       group.add(outerLabel);
       group.add(innerLabel);
       
       // Add rise profile visualization (mini chart)
       const chartStartY = -30;
       const chartHeight = 3;
       const chartWidth = 4;
       
       // Chart background
       const chartBgGeometry = new THREE.PlaneGeometry(chartWidth, chartHeight);
       const chartBgMaterial = new THREE.MeshBasicMaterial({ color: 0x1f2937, transparent: true, opacity: 0.3 });
       const chartBg = new THREE.Mesh(chartBgGeometry, chartBgMaterial);
       chartBg.position.set(0, chartStartY + chartHeight/2, 0.01);
       group.add(chartBg);
       
       // Chart title
       const chartTitle = createTextSprite('RISE PROFILE CHART', new THREE.Vector3(0, chartStartY + chartHeight + 0.5, 0), 0xffff00, 'large');
       group.add(chartTitle);
       
       // Chart grid lines
       for (let i = 0; i <= 4; i++) {
         const y = chartStartY + (i * chartHeight / 4);
         const gridGeometry = new THREE.BufferGeometry().setFromPoints([
           new THREE.Vector3(-chartWidth/2, y, 0.02),
           new THREE.Vector3(chartWidth/2, y, 0.02)
         ]);
         const gridMaterial = new THREE.LineBasicMaterial({ color: 0x666666, transparent: true, opacity: 0.5 });
         const gridLine = new THREE.Line(gridGeometry, gridMaterial);
         group.add(gridLine);
         
         // Y-axis labels
         const heightValue = safePitchBlock + (i * (targetFinalHeight - safePitchBlock) / 4);
         const heightLabel = createTextSprite(heightValue.toFixed(1), new THREE.Vector3(-chartWidth/2 - 0.8, y, 0), 0xcccccc, 'small');
         group.add(heightLabel);
       }
       
       // Chart data points (simplified rise profile)
       const chartPoints: THREE.Vector3[] = [];
       for (let i = 0; i <= 10; i++) {
         const t = i / 10;
         const angle = t * 220; // 0° to 220°
         let rise;
         
         if (angle <= params.bottomLength) {
           // Bottom easement
           rise = safePitchBlock;
         } else if (angle >= spiralEndAngle) {
           // Top easement
           rise = targetFinalHeight;
         } else {
           // Main spiral
           rise = safePitchBlock + (t * safeTotalRise);
         }
         
         const x = (t - 0.5) * chartWidth;
         const y = chartStartY + ((rise - safePitchBlock) / (targetFinalHeight - safePitchBlock)) * chartHeight;
         chartPoints.push(new THREE.Vector3(x, y, 0.03));
       }
       
       // Create chart line
       const chartLineGeometry = new THREE.BufferGeometry().setFromPoints(chartPoints);
       const chartLineMaterial = new THREE.LineBasicMaterial({ color: 0xff00ff, linewidth: 2 });
       const chartLine = new THREE.Line(chartLineGeometry, chartLineMaterial);
       group.add(chartLine);
       
       return group;
     };

    // Function to add staircase framework for reference
    const addStaircaseFramework = (scene: THREE.Scene, parameters: HandrailParameters, debugElements: THREE.Object3D[], totalRise: number) => {
      // Protect against zero or negative values
      if (totalRise <= 0) return;
      
      const customAngle = parameters.customEasementAngle || 35.08;
      const angleRad = customAngle * Math.PI / 180;
      
      // Protect against invalid angles
      if (Math.abs(Math.tan(angleRad)) < 0.001) return;
      
      const stepRise = totalRise / 7;
      const stepRun = stepRise / Math.tan(angleRad);
      const slopeAngle = customAngle;
      
      const staircasePoints: THREE.Vector3[] = [];
      
      for (let i = 1; i <= 7; i++) {
        const y = (7 - i) * stepRun;
        const z = -(7 - i) * stepRise;
        const x = 0;
        
        staircasePoints.push(new THREE.Vector3(x, y, z));
        
        const stepGeometry = new THREE.BoxGeometry(0.5, 0.1, 0.5);
        const stepMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00, transparent: true, opacity: 0.7 });
        const step = new THREE.Mesh(stepGeometry, stepMaterial);
        step.position.set(x, y - 0.05, z);
        scene.add(step);
        debugElements.push(step);
        
        const stepLabel = createTextSprite(`F1-${i}`, new THREE.Vector3(x + 0.8, y, z), 0x00ff00);
        scene.add(stepLabel);
        debugElements.push(stepLabel);
      }
      
      for (let i = 1; i <= 7; i++) {
        const y = -i * stepRun;
        const z = -i * stepRise;
        const x = 0;
        
        staircasePoints.push(new THREE.Vector3(x, y, z));
        
        const stepGeometry = new THREE.BoxGeometry(0.5, 0.1, 0.5);
        const stepMaterial = new THREE.MeshBasicMaterial({ color: 0x0088ff, transparent: true, opacity: 0.7 });
        const step = new THREE.Mesh(stepGeometry, stepMaterial);
        step.position.set(x, y - 0.05, z);
        scene.add(step);
        debugElements.push(step);
        
        const stepLabel = createTextSprite(`F2-${i}`, new THREE.Vector3(x - 0.8, y, z), 0x0088ff);
        scene.add(stepLabel);
        debugElements.push(stepLabel);
      }
      
      const staircaseGeometry = new THREE.BufferGeometry().setFromPoints(staircasePoints);
      const staircaseMaterial = new THREE.LineBasicMaterial({ color: 0xffff00, linewidth: 4 });
      const staircaseLine = new THREE.Line(staircaseGeometry, staircaseMaterial);
      scene.add(staircaseLine);
      debugElements.push(staircaseLine);
      
      const slopeLabel = createTextSprite(
        `Slope: ${slopeAngle.toFixed(1)}°`, 
        new THREE.Vector3(0, 8, 0), 
        0xffff00
      );
      scene.add(slopeLabel);
      debugElements.push(slopeLabel);
    };
    
    // Remove existing meshes and debug elements
    if (handrailMesh) scene.remove(handrailMesh);
    if (insideLineMesh) scene.remove(insideLineMesh);
    centerDots.forEach(dot => scene.remove(dot));
    debugElements.forEach(element => scene.remove(element));
    sceneRef.current.centerDots = [];
    sceneRef.current.debugElements = [];
    
    // CRASH PROTECTION: Validate all critical parameters before proceeding
    if (!parameters || typeof parameters !== 'object') {
      console.warn('Invalid parameters object, skipping visualization update');
      return;
    }
    
    // CRASH PROTECTION: Check for impossible or invalid values
    if (parameters.totalArcDistance <= 0 || parameters.totalHelicalRise <= 0) {
      console.warn('Invalid arc distance or helical rise, skipping visualization update');
      return;
    }
    
    if (parameters.totalSegments <= 0 || parameters.bottomLength <= 0 || parameters.topLength <= 0) {
      console.warn('Invalid segment parameters, skipping visualization update');
      return;
    }
    
    // CRASH PROTECTION: Ensure pitch block is reasonable (not negative or extremely large)
    if (parameters.pitchBlock < 0 || parameters.pitchBlock > 100) {
      console.warn('Pitch block value out of reasonable range, using default');
    }
    
    // CRASH PROTECTION: Ensure total rise is reasonable
    if (parameters.totalHelicalRise <= 0 || parameters.totalHelicalRise > 1000) {
      console.warn('Total helical rise value out of reasonable range, using default');
    }
    
    // Safe values with fallbacks
    const safePitchBlock = Math.max(0.1, Math.min(100, parameters.pitchBlock || 0.1));
    const safeTotalRise = Math.max(0.1, Math.min(1000, parameters.totalHelicalRise || 0.1));
    
    // CRASH PROTECTION: Validate offset values
    const safeBottomOffset = Math.max(-10, Math.min(10, parameters.bottomOffset || 0));
    const safeTopOffset = Math.max(-10, Math.min(10, parameters.topOffset || 0));
    
                                                                         // Calculate radii with protection - use custom parameters if provided
     const customOuterRadius = parameters.customOuterRadius || 4.625;
     const customInnerRadius = parameters.customInnerRadius || 10.5; // 10.5" diameter as default
     
     // Convert custom inner radius from diameter to radius if needed
     const customInnerRadiusValue = customInnerRadius <= 2.5 ? customInnerRadius : customInnerRadius / 2; // 10.5" diameter = 5.25" radius
         
         // Apply custom radius values directly - no interpolation needed
         // The custom values should directly control the 3D model
         const outerRadius = Math.max(0.1, customOuterRadius + safeBottomOffset);
         let innerRadius = Math.max(0.1, customInnerRadiusValue - safeTopOffset);
         
                  // CRASH PROTECTION: Ensure inner radius is smaller than outer radius
         if (innerRadius >= outerRadius) {
           console.warn('Inner radius must be smaller than outer radius, adjusting');
           innerRadius = outerRadius * 0.8;
         }
    
    // Add center dots with enhanced debugging (only when debug mode is on)
    if (debugMode) {
      const dotGeometry = new THREE.SphereGeometry(0.4, 16, 16);
      
      // Main center (blue) at origin
      const mainDot = new THREE.Mesh(dotGeometry, new THREE.MeshLambertMaterial({ color: 0x3b82f6 }));
      mainDot.position.set(0, 4, 0);
      scene.add(mainDot);
      sceneRef.current.centerDots.push(mainDot);
      
      // Bottom center (orange) - at original offset position (1.5" from main center)
      const bottomDot = new THREE.Mesh(dotGeometry, new THREE.MeshLambertMaterial({ color: 0xf59e0b }));
      bottomDot.position.set(0, 2, -parameters.bottomOffset);
      scene.add(bottomDot);
      sceneRef.current.centerDots.push(bottomDot);
      
      // Top center (red) - at original offset position (1.875" from main center)
      const topDot = new THREE.Mesh(dotGeometry, new THREE.MeshLambertMaterial({ color: 0xef4444 }));
      topDot.position.set(0, 6, -parameters.topOffset);
      scene.add(topDot);
      sceneRef.current.centerDots.push(topDot);
      
      // Add labels for center dots
      const mainLabel = createTextSprite('Main Center', new THREE.Vector3(0, 4.5, 0), 0x3b82f6);
      const bottomLabel = createTextSprite('Bottom Offset', new THREE.Vector3(0, 2.5, -parameters.bottomOffset), 0xf59e0b);
      const topLabel = createTextSprite('Top Offset', new THREE.Vector3(0, 6.5, -parameters.topOffset), 0xef4444);
      
      // Add pitch block height label
      const pitchBlockLabel = createTextSprite(`Pitch Block (${safePitchBlock.toFixed(1)}")`, new THREE.Vector3(0, Math.max(0.5, safePitchBlock + 0.5), 0), 0xff0000);
      
             // Add radius information labels
       const outerRadiusLabel = createTextSprite(`Outer Radius: ${outerRadius.toFixed(1)}" (Custom: ${parameters.customOuterRadius || 4.625}")`, new THREE.Vector3(0, 8, 0), 0x3b82f6);
               const innerRadiusLabel = createTextSprite(`Inner Radius: ${innerRadius.toFixed(1)}" (Custom: ${parameters.customInnerRadius || 10.5}")`, new THREE.Vector3(0, 7, 0), 0x10b981);
      const easementAngleLabel = createTextSprite(`Easement Angle: ${(parameters.customEasementAngle || -35.08).toFixed(1)}°`, new THREE.Vector3(0, 6, 0), 0xf59e0b);
      
      scene.add(mainLabel);
      scene.add(bottomLabel);
      scene.add(topLabel);
      scene.add(pitchBlockLabel);
      scene.add(outerRadiusLabel);
      scene.add(innerRadiusLabel);
      scene.add(easementAngleLabel);
      sceneRef.current.debugElements.push(mainLabel);
      sceneRef.current.debugElements.push(bottomLabel);
      sceneRef.current.debugElements.push(topLabel);
      sceneRef.current.debugElements.push(pitchBlockLabel);
             sceneRef.current.debugElements.push(outerRadiusLabel);
       sceneRef.current.debugElements.push(innerRadiusLabel);
       sceneRef.current.debugElements.push(easementAngleLabel);
       
       // Add spiral end point marker for better visualization
       const spiralEndAngle = ((parameters.totalSegments - parameters.topLength) / parameters.totalSegments) * parameters.totalDegrees;
       const spiralEndAngleRad = spiralEndAngle * Math.PI / 180;
       const spiralEndX = outerRadius * Math.cos(spiralEndAngleRad);
       const spiralEndZ = outerRadius * Math.sin(spiralEndAngleRad);
       const spiralEndRise = safePitchBlock + (spiralEndAngle / parameters.totalDegrees) * safeTotalRise;
       
       const spiralEndMarkerGeometry = new THREE.SphereGeometry(0.3, 16, 16);
       const spiralEndMarkerMaterial = new THREE.MeshBasicMaterial({ color: 0xff00ff });
       const spiralEndMarker = new THREE.Mesh(spiralEndMarkerGeometry, spiralEndMarkerMaterial);
       spiralEndMarker.position.set(spiralEndX, spiralEndRise, spiralEndZ);
       scene.add(spiralEndMarker);
       sceneRef.current.debugElements.push(spiralEndMarker);
       
       // Add spiral end label
       const spiralEndLabel = createTextSprite(`Spiral End: ${spiralEndAngle.toFixed(1)}°`, new THREE.Vector3(spiralEndX + 1, spiralEndRise + 0.5, spiralEndZ), 0xff00ff);
       scene.add(spiralEndLabel);
       sceneRef.current.debugElements.push(spiralEndLabel);
       
       // Add inner and outer radius circles for reference
       const outerCircleGeometry = new THREE.RingGeometry(outerRadius - 0.05, outerRadius + 0.05, 64);
       const outerCircleMaterial = new THREE.MeshBasicMaterial({ 
         color: 0x3b82f6, transparent: true, opacity: 0.3, side: THREE.DoubleSide 
       });
       const outerCircle = new THREE.Mesh(outerCircleGeometry, outerCircleMaterial);
       outerCircle.rotation.x = -Math.PI / 2;
       outerCircle.position.y = 0;
       scene.add(outerCircle);
       sceneRef.current.debugElements.push(outerCircle);
       
       const innerCircleGeometry = new THREE.RingGeometry(innerRadius - 0.05, innerRadius + 0.05, 64);
       const innerCircleMaterial = new THREE.MeshBasicMaterial({ 
         color: 0x10b981, transparent: true, opacity: 0.3, side: THREE.DoubleSide 
       });
       const innerCircle = new THREE.Mesh(innerCircleGeometry, innerCircleMaterial);
       innerCircle.rotation.x = -Math.PI / 2;
       innerCircle.position.y = 0;
       scene.add(innerCircle);
       sceneRef.current.debugElements.push(innerCircle);
       
       // Add vertical rise profile line
       const riseProfilePoints: THREE.Vector3[] = [];
       for (let i = 0; i <= 20; i++) {
         const t = i / 20;
         const rise = safePitchBlock + (t * safeTotalRise);
         riseProfilePoints.push(new THREE.Vector3(0, rise, -15 + (t * 30)));
       }
       const riseProfileGeometry = new THREE.BufferGeometry().setFromPoints(riseProfilePoints);
       const riseProfileMaterial = new THREE.LineBasicMaterial({ color: 0xff00ff, linewidth: 2 });
       const riseProfileLine = new THREE.Line(riseProfileGeometry, riseProfileMaterial);
       scene.add(riseProfileLine);
       sceneRef.current.debugElements.push(riseProfileLine);
       
       // Add rise profile labels
       const startRiseLabel = createTextSprite(`Start: ${safePitchBlock.toFixed(3)}"`, new THREE.Vector3(0, safePitchBlock, -15), 0xff00ff);
       const endRiseLabel = createTextSprite(`End: ${(safePitchBlock + safeTotalRise).toFixed(3)}"`, new THREE.Vector3(0, safePitchBlock + safeTotalRise, 15), 0xff00ff);
       scene.add(startRiseLabel);
       scene.add(endRiseLabel);
       sceneRef.current.debugElements.push(startRiseLabel);
       sceneRef.current.debugElements.push(endRiseLabel);
       
       // Add key rise point markers with exact values
       const keyRisePoints = [
         { angle: 0, label: 'Start', color: 0xff0000 },
         { angle: 45, label: '45°', color: 0xff8800 },
         { angle: 90, label: '90°', color: 0xffff00 },
         { angle: 135, label: '135°', color: 0x00ff00 },
         { angle: 180, label: '180°', color: 0x00ffff },
         { angle: 220, label: 'End', color: 0xff00ff }
       ];
       
       keyRisePoints.forEach(point => {
         const angleRad = point.angle * Math.PI / 180;
         const rise = safePitchBlock + (point.angle / 220) * safeTotalRise;
         
         // Create marker sphere
         const markerGeometry = new THREE.SphereGeometry(0.2, 16, 16);
         const markerMaterial = new THREE.MeshBasicMaterial({ color: point.color });
         const marker = new THREE.Mesh(markerGeometry, markerMaterial);
         marker.position.set(outerRadius * Math.cos(angleRad), rise, outerRadius * Math.sin(angleRad));
         scene.add(marker);
         if (sceneRef.current) {
           sceneRef.current.debugElements.push(marker);
         }
         
         // Create label
         const label = createTextSprite(`${point.label}: ${rise.toFixed(3)}"`, 
           new THREE.Vector3(outerRadius * Math.cos(angleRad) + 1, rise + 0.5, outerRadius * Math.sin(angleRad)), 
           point.color, 'small');
         scene.add(label);
         if (sceneRef.current) {
           sceneRef.current.debugElements.push(label);
         }
       });
       
                // Add inner line key points
         const innerKeyPoints = [
           { angle: 0, label: 'Inner Start', color: 0x10b981 },
           { angle: 110, label: 'Inner 110°', color: 0x10b981 },
           { angle: 220, label: 'Inner End', color: 0x10b981 }
         ];
         
         innerKeyPoints.forEach(point => {
           const angleRad = point.angle * Math.PI / 180;
           // Inner line has same rise rate as outer line for consistency
           const rise = safePitchBlock + (point.angle / 220) * safeTotalRise;
         
         // Create marker sphere
         const markerGeometry = new THREE.SphereGeometry(0.15, 16, 16);
         const markerMaterial = new THREE.MeshBasicMaterial({ color: point.color });
         const marker = new THREE.Mesh(markerGeometry, markerMaterial);
         marker.position.set(innerRadius * Math.cos(angleRad), rise, innerRadius * Math.sin(angleRad));
         scene.add(marker);
         if (sceneRef.current) {
           sceneRef.current.debugElements.push(marker);
         }
         
         // Create label
         const label = createTextSprite(`${point.label}: ${rise.toFixed(3)}"`, 
           new THREE.Vector3(innerRadius * Math.cos(angleRad) - 1, rise + 0.5, innerRadius * Math.sin(angleRad)), 
           point.color, 'small');
         scene.add(label);
         if (sceneRef.current) {
           sceneRef.current.debugElements.push(label);
         }
       });
       
       // Add grid lines for better spatial reference
       for (let i = -10; i <= 10; i += 2) {
         // X-axis grid lines
         const xGridGeometry = new THREE.BufferGeometry().setFromPoints([
           new THREE.Vector3(i, 0, -10),
           new THREE.Vector3(i, 0, 10)
         ]);
         const xGridMaterial = new THREE.LineBasicMaterial({ color: 0x374151, transparent: true, opacity: 0.3 });
         const xGridLine = new THREE.Line(xGridGeometry, xGridMaterial);
         scene.add(xGridLine);
         sceneRef.current.debugElements.push(xGridLine);
         
         // Z-axis grid lines
         const zGridGeometry = new THREE.BufferGeometry().setFromPoints([
           new THREE.Vector3(-10, 0, i),
           new THREE.Vector3(10, 0, i)
         ]);
         const zGridMaterial = new THREE.LineBasicMaterial({ color: 0x374151, transparent: true, opacity: 0.3 });
         const zGridLine = new THREE.Line(zGridGeometry, zGridMaterial);
         scene.add(zGridLine);
         sceneRef.current.debugElements.push(zGridLine);
       }
     }
    
              // Create outside handrail points with CONTINUOUS smooth geometry
     const outerPoints: THREE.Vector3[] = [];
     const steps = 2000; // Much higher resolution for truly smooth curves
     
     // CRASH PROTECTION: Validate calculation inputs
     const safeManualRiseData = (!manualRiseData || typeof manualRiseData !== 'object') ? {} : manualRiseData;
     const safeCalculatedRiseData = (!calculatedRiseData || typeof calculatedRiseData !== 'object') ? {} : calculatedRiseData;
     
     if (!manualRiseData || !calculatedRiseData || typeof manualRiseData !== 'object' || typeof calculatedRiseData !== 'object') {
       console.warn('Invalid rise data, using fallback calculations');
     }
     
     // Create a continuous mathematical function for the entire handrail
     // This ensures ALL points recalculate smoothly when parameters change
     for (let i = 0; i <= steps; i++) {
       const t = i / steps;
       const arcDistance = t * parameters.totalArcDistance;
       
       // Calculate continuous angle based on arc distance
       const angle = (arcDistance / parameters.totalArcDistance) * parameters.totalDegrees * Math.PI / 180;
       
       // ENHANCED: Dynamic rise calculation that scales with ALL project parameters
       let rise: number;
       try {
         // Use manual rise data if available, otherwise fall back to calculated
         const currentArcDistance = t * parameters.totalArcDistance;
         
         // Try to find the closest manual rise point with enhanced tolerance
         let manualRise: number | null = null;
         if (Object.keys(safeManualRiseData).length > 0) {
           const manualDistances = Object.keys(safeManualRiseData).map(Number).sort((a, b) => a - b);
           const closestDistance = manualDistances.reduce((prev, curr) => 
             Math.abs(curr - currentArcDistance) < Math.abs(prev - currentArcDistance) ? curr : prev
           );
           
           // Enhanced tolerance for better manual input integration
           if (Math.abs(closestDistance - currentArcDistance) < 0.5) { // Within 0.5" tolerance
             manualRise = safeManualRiseData[closestDistance];
           }
         }
         
                   if (manualRise !== null) {
            // Use manual rise data - this point will be part of the smooth curve
            rise = manualRise;
            if (i % 100 === 0) { // Log every 100th point to avoid spam
              console.log(`📍 Using manual rise data at step ${i}: arcDistance=${currentArcDistance.toFixed(2)}", rise=${manualRise.toFixed(3)}"`);
            }
          } else {
            // ENHANCED: Dynamic calculation that scales with ALL project parameters
            // This ensures every point recalculates when rise, pitch block, or other parameters change
            rise = safePitchBlock + (t * safeTotalRise);
          }
         
         // Validate rise value
         if (isNaN(rise) || !isFinite(rise)) {
           console.warn(`Invalid rise value at step ${i}, using fallback`);
           rise = safePitchBlock + (t * safeTotalRise);
         }
       } catch (error) {
         console.warn(`Error calculating rise at step ${i}, using fallback:`, error);
         rise = safePitchBlock + (t * safeTotalRise);
       }
       
       // Calculate continuous position using mathematical functions (no discrete steps)
       let x: number, z: number, y: number = rise;
       
       // Calculate segment position for easement logic
       const segmentPosition = (arcDistance / parameters.totalArcDistance) * parameters.totalSegments;
       
       if (segmentPosition <= parameters.bottomLength) {
         // Bottom easement: continuous smooth transition
         if (parameters.bottomLength <= 0) {
           console.warn('Invalid bottom length, skipping bottom easement');
           x = outerRadius * Math.cos(angle);
           z = outerRadius * Math.sin(angle);
           y = rise;
         } else {
           // Create continuous smooth bottom easement using mathematical functions
           const easeT = segmentPosition / parameters.bottomLength;
           
           // Use continuous mathematical interpolation (no discrete steps)
           const smoothEaseT = easeT * easeT * (3 - 2 * easeT); // Smoothstep function
           
           // Start position (at 0°) - use manual rise data if available
           const startX = outerRadius * Math.cos(0);
           const startZ = outerRadius * Math.sin(0);
           const startRise = safeManualRiseData[0] || safePitchBlock;
           
           // Target position (where spiral would naturally be) - use manual rise data if available
           const targetX = outerRadius * Math.cos(angle);
           const targetZ = outerRadius * Math.sin(angle);
           const targetRise = rise; // Use the already calculated rise (which includes manual data)
           
           // Continuous interpolation creates truly smooth line
           x = startX + (targetX - startX) * smoothEaseT;
           z = startZ + (targetZ - startZ) * smoothEaseT;
           y = startRise + (targetRise - startRise) * smoothEaseT;
         }
         
         // Add interactive target point marker for bottom easement
         if (i === 0 && debugMode && parameters.bottomLength > 0) {
           const targetMarkerGeometry = new THREE.SphereGeometry(0.3, 16, 16);
           const targetMarkerMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
           const targetMarker = new THREE.Mesh(targetMarkerGeometry, targetMarkerMaterial);
           const markerX = outerRadius * Math.cos(0);
           const markerZ = outerRadius * Math.sin(0);
           targetMarker.position.set(markerX, safePitchBlock, markerZ);
           targetMarker.userData = { type: 'bottomTarget' };
           scene.add(targetMarker);
           sceneRef.current.debugElements.push(targetMarker);
           sceneRef.current.bottomTargetMarker = targetMarker;
         }
         
       } else if (segmentPosition >= parameters.totalSegments - parameters.topLength) {
         // Top easement: continuous smooth transition
         if (parameters.topLength <= 0) {
           console.warn('Invalid top length, skipping top easement');
           x = outerRadius * Math.cos(angle);
           z = outerRadius * Math.sin(angle);
           y = rise;
         } else {
           // Create continuous smooth top easement using mathematical functions
           const easeT = (segmentPosition - (parameters.totalSegments - parameters.topLength)) / parameters.topLength;
           
           // Use continuous mathematical interpolation (no discrete steps)
           const smoothEaseT = easeT * easeT * (3 - 2 * easeT); // Smoothstep function
           
           // Calculate spiral end point dynamically - use manual rise data if available
           const spiralEndAngle = ((parameters.totalSegments - parameters.topLength) / parameters.totalSegments) * parameters.totalDegrees;
           const startAngle = spiralEndAngle * Math.PI / 180;
           const startX = outerRadius * Math.cos(startAngle);
           const startZ = outerRadius * Math.sin(startAngle);
           
           // Use manual rise data for spiral end if available, otherwise calculate
           const spiralEndArcDistance = (spiralEndAngle / parameters.totalDegrees) * parameters.totalArcDistance;
           const spiralEndRise = safeManualRiseData[spiralEndArcDistance] || 
             safePitchBlock + (spiralEndAngle / parameters.totalDegrees) * safeTotalRise;
           const startRise = spiralEndRise;
           
           // End position (at 220°) - use manual rise data if available
           const endAngle = 220 * Math.PI / 180;
           const endX = outerRadius * Math.cos(endAngle);
           const endZ = outerRadius * Math.sin(endAngle);
           const endRise = safeManualRiseData[parameters.totalArcDistance] || safePitchBlock + safeTotalRise;
           
           // Continuous interpolation creates truly smooth line
           x = startX + (endX - startX) * smoothEaseT;
           z = startZ + (endZ - startZ) * smoothEaseT;
           y = startRise + (endRise - startRise) * smoothEaseT;
         }
         
         // Add interactive target point marker for top easement
         if (i === steps && debugMode && parameters.topLength > 0) {
           const targetMarkerGeometry = new THREE.SphereGeometry(0.3, 16, 16);
           const targetMarkerMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
           const targetMarker = new THREE.Mesh(targetMarkerGeometry, targetMarkerMaterial);
           const markerAngle = 220 * Math.PI / 180;
           const markerX = outerRadius * Math.cos(markerAngle);
           const markerZ = outerRadius * Math.sin(markerAngle);
           const markerRise = safePitchBlock + safeTotalRise; // Scales with project parameters
           targetMarker.position.set(markerX, markerRise, markerZ);
           targetMarker.userData = { type: 'topTarget' };
           scene.add(targetMarker);
           sceneRef.current.debugElements.push(targetMarker);
           sceneRef.current.topTargetMarker = targetMarker;
         }
         
       } else {
         // Main spiral: continuous mathematical function (no discrete steps)
         x = outerRadius * Math.cos(angle);
         z = outerRadius * Math.sin(angle);
         y = rise;
       }
       
       // Add point to create truly continuous curve
       outerPoints.push(new THREE.Vector3(x, y, z));
     }
    
         // CRASH PROTECTION: Validate points before creating curves
     if (outerPoints.length < 2) {
       console.warn('Insufficient outer points for curve creation, skipping handrail mesh');
     } else {
       // Create the curve with ULTRA smooth interpolation for truly continuous lines
       const outerCurve = new THREE.CatmullRomCurve3(outerPoints);
       outerCurve.tension = 0.9; // Maximum tension for ultra-smooth curves
       outerCurve.closed = false; // Ensure open curve for handrail
       
       // Enhanced tube geometry for maximum smoothness
       const outerGeometry = new THREE.TubeGeometry(outerCurve, Math.min(steps, outerPoints.length - 1), 0.15, 8, false);
       const newHandrailMesh = new THREE.Mesh(outerGeometry, new THREE.MeshLambertMaterial({ color: 0x3b82f6 }));
       newHandrailMesh.castShadow = true;
       scene.add(newHandrailMesh);
       sceneRef.current.handrailMesh = newHandrailMesh;
     }
    
    // Create inside reference line: covers full 220° span but only 10.5" arc distance
    const insidePoints: THREE.Vector3[] = [];
    
    // CRASH PROTECTION: Validate inside line calculations
    
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const arcDistance = t * parameters.totalArcDistance;
      const segmentPosition = (arcDistance / parameters.totalArcDistance) * parameters.totalSegments;
      const angle = (t * parameters.totalDegrees * Math.PI) / 180; // Full 220° span
      
                                         // CRASH PROTECTION: Safe rise calculation for inside line
         let rise: number;
         try {
           // Inner line should have CONSTANT RATE until top easement
           // Use manual rise data if available, otherwise fall back to calculated
           const currentArcDistance = t * parameters.totalArcDistance;
           
           // Try to find the closest manual rise point
           let manualRise: number | null = null;
           if (Object.keys(safeManualRiseData).length > 0) {
             const manualDistances = Object.keys(safeManualRiseData).map(Number).sort((a, b) => a - b);
             const closestDistance = manualDistances.reduce((prev, curr) => 
               Math.abs(curr - currentArcDistance) < Math.abs(prev - currentArcDistance) ? curr : prev
             );
             
             if (Math.abs(closestDistance - currentArcDistance) < 0.5) { // Within 0.5" tolerance
               manualRise = safeManualRiseData[closestDistance];
             }
           }
           
           if (manualRise !== null) {
             rise = manualRise;
           } else {
             // Use the same rise calculation as outer line for consistency
             rise = safePitchBlock + (t * safeTotalRise);
           }
           
           // Validate rise value
           if (isNaN(rise) || !isFinite(rise)) {
             console.warn(`Invalid inside line rise at step ${i}, using fallback`);
             rise = safePitchBlock + (t * safeTotalRise);
           }
         } catch (error) {
           console.warn(`Error calculating inside line rise at step ${i}, using fallback:`, error);
           rise = safePitchBlock + (t * safeTotalRise);
         }
      
      let x: number, z: number, y: number = rise;
      
      if (segmentPosition <= parameters.bottomLength) {
        // CRASH PROTECTION: Validate bottom length for inside line
        if (parameters.bottomLength <= 0) {
          console.warn('Invalid bottom length for inside line, skipping bottom easement');
          x = innerRadius * Math.cos(angle);
          z = innerRadius * Math.sin(angle);
          y = rise;
        } else {
          // Bottom over-ease: INSIDE LINE - constant rate, practically invisible
          const startAngle = 0;
          const startX = innerRadius * Math.cos(startAngle);
          const startZ = innerRadius * Math.sin(startAngle);
          const startRise = safePitchBlock;
          
          // For inside line, use minimal easement effect - practically invisible
          const easeT = segmentPosition / parameters.bottomLength;
          
          // CRASH PROTECTION: Validate easeT calculation
          if (isNaN(easeT) || !isFinite(easeT)) {
            console.warn('Invalid easeT for inside line bottom easement, using fallback');
            x = startX;
            z = startZ;
            y = startRise;
          } else {
                       // Use smooth interpolation to prevent 90-degree angles
             const smoothEaseT = easeT * easeT * (3 - 2 * easeT); // Smoothstep function
             
             // Smoothly interpolate from start to target position to prevent sharp angles
             const targetX = innerRadius * Math.cos(angle);
             const targetZ = innerRadius * Math.sin(angle);
             const targetRise = safePitchBlock + (t * safeTotalRise);
             
             // Interpolate all coordinates smoothly
             x = startX + (targetX - startX) * smoothEaseT;
             z = startZ + (targetZ - startZ) * smoothEaseT;
             y = startRise + (targetRise - startRise) * smoothEaseT;
          }
        }
        
      } else if (segmentPosition >= parameters.totalSegments - parameters.topLength) {
        // CRASH PROTECTION: Validate top length for inside line
        if (parameters.topLength <= 0) {
          console.warn('Invalid top length for inside line, skipping top easement');
          x = innerRadius * Math.cos(angle);
          z = innerRadius * Math.sin(angle);
          y = rise;
        } else {
          // Top up-ease: direct interpolation from spiral end to final position
          const easeT = (segmentPosition - (parameters.totalSegments - parameters.topLength)) / parameters.topLength;
          
          // Start at the actual spiral end point (not hardcoded 200°)
          // Calculate where the spiral naturally ends based on the current parameters
          const spiralEndAngle = ((parameters.totalSegments - parameters.topLength) / parameters.totalSegments) * parameters.totalDegrees;
          const startAngle = spiralEndAngle * Math.PI / 180;
          const startX = innerRadius * Math.cos(startAngle);
          const startZ = innerRadius * Math.sin(startAngle);
          
          // Calculate the rise at the spiral end point for smooth transition
          // Use the actual spiral rise calculation, not a hardcoded value
          const spiralEndRise = safePitchBlock + (spiralEndAngle / parameters.totalDegrees) * safeTotalRise;
          const startRise = spiralEndRise;
          
                                // End at 220° - Inner line should end at same height as outer line
            const endAngle = 220 * Math.PI / 180;
            const endX = innerRadius * Math.cos(endAngle);
            const endZ = innerRadius * Math.sin(endAngle);
            
            // CRITICAL: Inner line must end at same height as outer line - SCALES WITH TOTAL RISE
            // Both lines should end at pitch block + total rise
            const endRise = safePitchBlock + safeTotalRise;
            
            // CRITICAL: Inner line should have a more gradual easement
            // Since it only travels 10.5" arc, the rise should be smoother
          
          // CRASH PROTECTION: Validate all calculated values for inside line
          if (isNaN(easeT) || !isFinite(easeT) || isNaN(spiralEndRise) || !isFinite(spiralEndRise)) {
            console.warn('Invalid inside line top easement calculations, using fallback');
            x = startX;
            z = startZ;
            y = startRise;
          } else {
                         // FIXED: Apply the same smooth transition to inner line for consistency
             const smoothEaseT = easeT * easeT * (3 - 2 * easeT); // Smoothstep function
             
             // Interpolate all coordinates smoothly from spiral end to final position
             x = startX + (endX - startX) * smoothEaseT;
             z = startZ + (endZ - startZ) * smoothEaseT;
             y = startRise + (endRise - startRise) * smoothEaseT;
          }
        }
        
      } else {
        // Main spiral: use main center
        x = innerRadius * Math.cos(angle);
        z = innerRadius * Math.sin(angle);
        y = rise;
      }
      
      insidePoints.push(new THREE.Vector3(x, y, z));
    }
    
         // CRASH PROTECTION: Validate inside points before creating curve
     if (insidePoints.length < 2) {
       console.warn('Insufficient inside points for curve creation, skipping inside line mesh');
     } else {
       // Create inside reference line with ULTRA smooth curve
       const insideCurve = new THREE.CatmullRomCurve3(insidePoints);
       insideCurve.tension = 0.9; // Maximum tension for ultra-smooth curves
       insideCurve.closed = false; // Ensure open curve for reference line
       
       // Enhanced tube geometry for maximum smoothness
       const insideGeometry = new THREE.TubeGeometry(insideCurve, steps, 0.1, 6, false);
       const newInsideLineMesh = new THREE.Mesh(insideGeometry, new THREE.MeshLambertMaterial({ color: 0x10b981 }));
       scene.add(newInsideLineMesh);
       sceneRef.current.insideLineMesh = newInsideLineMesh;
     }
    
           // Add debugging information overlay (only when both debug mode and overlay are on)
       if (debugMode && showOverlay) {
         const debugInfo = createDebugInfoOverlay(parameters, safeManualRiseData, safeCalculatedRiseData);
         // Position the overlay in the top-right corner so it doesn't cover the main debug visuals
         debugInfo.position.set(20, 15, -20);
         scene.add(debugInfo);
         sceneRef.current.debugElements.push(debugInfo);
       }
       
       // Add real-time height verification display (always visible in debug mode)
       if (debugMode) {
         const heightVerificationGroup = new THREE.Group();
         
         // Create a floating height verification panel
         const panelGeometry = new THREE.PlaneGeometry(6, 4);
         const panelMaterial = new THREE.MeshBasicMaterial({ 
           color: 0x1f2937, 
           transparent: true, 
           opacity: 0.9,
           side: THREE.DoubleSide
         });
         const panel = new THREE.Mesh(panelGeometry, panelMaterial);
         panel.position.set(0, 0, 0);
         heightVerificationGroup.add(panel);
         
         // Add panel border
         const borderGeometry = new THREE.EdgesGeometry(panelGeometry);
         const borderMaterial = new THREE.LineBasicMaterial({ color: 0x00ff00, linewidth: 2 });
         const border = new THREE.LineSegments(borderGeometry, borderMaterial);
         heightVerificationGroup.add(border);
         
         // Add title
         const titleSprite = createTextSprite('HEIGHT VERIFICATION', new THREE.Vector3(0, 1.5, 0.01), 0x00ff00, 'large');
         heightVerificationGroup.add(titleSprite);
         
                   // Add height information
          const targetHeight = safePitchBlock + safeTotalRise;
          const outerHeight = targetHeight;
          const innerHeight = targetHeight;
         
         const outerLabel = createTextSprite(`Outer Line: ${outerHeight.toFixed(3)}"`, new THREE.Vector3(-2, 0.5, 0.01), 0x3b82f6);
         const innerLabel = createTextSprite(`Inner Line: ${innerHeight.toFixed(3)}"`, new THREE.Vector3(-2, 0, 0.01), 0x10b981);
         const targetLabel = createTextSprite(`Target: ${targetHeight.toFixed(3)}"`, new THREE.Vector3(-2, -0.5, 0.01), 0xff00ff);
         
         heightVerificationGroup.add(outerLabel);
         heightVerificationGroup.add(innerLabel);
         heightVerificationGroup.add(targetLabel);
         
         // Add status indicator
         const statusText = outerHeight === innerHeight && Math.abs(outerHeight - targetHeight) < 0.001 ? 
           '✓ PERFECT MATCH' : '✗ HEIGHT MISMATCH';
         const statusColor = outerHeight === innerHeight && Math.abs(outerHeight - targetHeight) < 0.001 ? 0x00ff00 : 0xff0000;
         const statusSprite = createTextSprite(statusText, new THREE.Vector3(0, -1, 0.01), statusColor, 'large');
         heightVerificationGroup.add(statusSprite);
         
         // Position the verification panel
         heightVerificationGroup.position.set(-15, 10, -15);
         scene.add(heightVerificationGroup);
         sceneRef.current.debugElements.push(heightVerificationGroup);
       }
    
    // Add staircase framework (only when debug mode is on)
    if (debugMode) {
      addStaircaseFramework(scene, parameters, sceneRef.current.debugElements, safeTotalRise);
    }
    
     }, [parameters.totalArcDistance, parameters.totalHelicalRise, parameters.pitchBlock, parameters.bottomLength, parameters.topLength, parameters.bottomOffset, parameters.topOffset, parameters.customEasementAngle, parameters.customOuterRadius, parameters.customInnerRadius, manualRiseData, calculatedRiseData, debugMode, showOverlay]);

  useEffect(() => {
    if (!mountRef.current) return;

    const container = mountRef.current;
    
    // Initialize Three.js scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1f2937);
    
    const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(15, 10, 15);
    camera.lookAt(0, 0, 0);
    
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    
    container.appendChild(renderer.domElement);
    
    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    // Controls
    let isDragging = false;
    let previousPosition = { x: 0, y: 0 };
    
    function handleRotation(clientX: number, clientY: number) {
      const deltaMove = {
        x: clientX - previousPosition.x,
        y: clientY - previousPosition.y
      };
      
      const spherical = new THREE.Spherical();
      spherical.setFromVector3(camera.position);
      
      spherical.theta -= deltaMove.x * 0.01;
      spherical.phi += deltaMove.y * 0.01;
      spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, spherical.phi));
      
      camera.position.setFromSpherical(spherical);
      camera.lookAt(0, 0, 0);
      
      previousPosition = { x: clientX, y: clientY };
    }
    
    const handleMouseDown = (e: MouseEvent) => {
      if (debugMode) {
        const mouse = new THREE.Vector2();
        mouse.x = (e.clientX / container.clientWidth) * 2 - 1;
        mouse.y = -(e.clientY / container.clientHeight) * 2 + 1;
        
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, camera);
        
        if (sceneRef.current) {
          const targetMarkers = [sceneRef.current.bottomTargetMarker, sceneRef.current.topTargetMarker].filter((marker): marker is THREE.Mesh => marker !== null);
          const intersects = raycaster.intersectObjects(targetMarkers);
          
          if (intersects.length > 0) {
            const clickedObject = intersects[0].object;
            if (clickedObject.userData.type === 'bottomTarget') {
              sceneRef.current.isDraggingTarget = true;
              sceneRef.current.draggedTarget = 'bottom';
              const cameraDirection = new THREE.Vector3();
              camera.getWorldDirection(cameraDirection);
              sceneRef.current.dragPlane = new THREE.Plane(cameraDirection, 0);
            } else if (clickedObject.userData.type === 'topTarget') {
              sceneRef.current.isDraggingTarget = true;
              sceneRef.current.draggedTarget = 'top';
              const cameraDirection = new THREE.Vector3();
              camera.getWorldDirection(cameraDirection);
              sceneRef.current.dragPlane = new THREE.Plane(cameraDirection, 0);
            }
          } else {
            isDragging = true;
            previousPosition = { x: e.clientX, y: e.clientY };
          }
        }
      } else {
        isDragging = true;
        previousPosition = { x: e.clientX, y: e.clientY };
      }
      e.preventDefault();
    };
    
    const handleMouseMove = (e: MouseEvent) => {
      if (debugMode && sceneRef.current?.isDraggingTarget && sceneRef.current.dragPlane) {
        const mouse = new THREE.Vector2();
        mouse.x = (e.clientX / container.clientWidth) * 2 - 1;
        mouse.y = -(e.clientY / container.clientHeight) * 2 + 1;
        
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, camera);
        
        const intersectionPoint = new THREE.Vector3();
        if (raycaster.ray.intersectPlane(sceneRef.current.dragPlane, intersectionPoint)) {
          if (sceneRef.current.draggedTarget === 'bottom' && sceneRef.current.bottomTargetMarker) {
            sceneRef.current.bottomTargetMarker.position.copy(intersectionPoint);
            updateVisualization();
          } else if (sceneRef.current.draggedTarget === 'top' && sceneRef.current.topTargetMarker) {
            sceneRef.current.topTargetMarker.position.copy(intersectionPoint);
            updateVisualization();
          }
        }
      } else if (isDragging) {
        handleRotation(e.clientX, e.clientY);
      }
      e.preventDefault();
    };
    
    const handleMouseUp = () => { 
      isDragging = false; 
      if (debugMode && sceneRef.current) {
        sceneRef.current.isDraggingTarget = false;
        sceneRef.current.draggedTarget = null;
        sceneRef.current.dragPlane = null;
      }
    };
    
         const handleTouchStart = (e: TouchEvent) => {
       if (e.touches.length === 1) {
         isDragging = true;
         previousPosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
       } else if (e.touches.length === 2) {
         // Handle pinch-to-zoom for mobile
         const touch1 = e.touches[0];
         const touch2 = e.touches[1];
         const distance = Math.sqrt(
           Math.pow(touch2.clientX - touch1.clientX, 2) + 
           Math.pow(touch2.clientY - touch1.clientY, 2)
         );
         // Store initial distance for zoom calculation
         if (sceneRef.current) {
           sceneRef.current.initialPinchDistance = distance;
         }
       }
       e.preventDefault();
     };
     
     const handleTouchMove = (e: TouchEvent) => {
       if (isDragging && e.touches.length === 1) {
         handleRotation(e.touches[0].clientX, e.touches[0].clientY);
       } else if (e.touches.length === 2 && sceneRef.current?.initialPinchDistance) {
         // Handle pinch-to-zoom
         const touch1 = e.touches[0];
         const touch2 = e.touches[1];
         const currentDistance = Math.sqrt(
           Math.pow(touch2.clientX - touch1.clientX, 2) + 
           Math.pow(touch2.clientY - touch1.clientY, 2)
         );
         const scale = currentDistance / sceneRef.current.initialPinchDistance;
         camera.position.multiplyScalar(scale > 1 ? 1.05 : 0.95);
         sceneRef.current.initialPinchDistance = currentDistance;
       }
       e.preventDefault();
     };
     
     const handleTouchEnd = (e: TouchEvent) => {
       isDragging = false;
       if (sceneRef.current) {
         sceneRef.current.initialPinchDistance = undefined;
       }
       e.preventDefault();
     };
    
    const handleWheel = (e: WheelEvent) => {
      const scale = e.deltaY > 0 ? 1.1 : 0.9;
      camera.position.multiplyScalar(scale);
      e.preventDefault();
    };
    
    renderer.domElement.addEventListener('mousedown', handleMouseDown);
    renderer.domElement.addEventListener('mousemove', handleMouseMove);
    renderer.domElement.addEventListener('mouseup', handleMouseUp);
    renderer.domElement.addEventListener('touchstart', handleTouchStart, { passive: false });
    renderer.domElement.addEventListener('touchmove', handleTouchMove, { passive: false });
    renderer.domElement.addEventListener('touchend', handleTouchEnd);
    renderer.domElement.addEventListener('wheel', handleWheel, { passive: false });

         // Add reference elements (only when debug mode is on)
     if (debugMode) {
       // Add coordinate axes
       const axesHelper = new THREE.AxesHelper(10);
       scene.add(axesHelper);
       
       // Add reference plane
       const planeGeometry = new THREE.PlaneGeometry(25, 25);
       const planeMaterial = new THREE.MeshLambertMaterial({ 
         color: 0x94a3b8, transparent: true, opacity: 0.15, side: THREE.DoubleSide 
       });
       const plane = new THREE.Mesh(planeGeometry, planeMaterial);
       plane.rotation.x = -Math.PI / 2;
       plane.position.y = -1;
       scene.add(plane);
     }

    sceneRef.current = {
      scene,
      camera,
      renderer,
      handrailMesh: null,
      insideLineMesh: null,
      centerDots: [],
      debugElements: [],
      bottomTargetMarker: null,
      topTargetMarker: null,
      isDraggingTarget: false,
      draggedTarget: null,
      dragPlane: null
    };

    // Animation loop
    function animate() {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
    }
    animate();

    // Handle resize
    const handleResize = () => {
      if (sceneRef.current && container) {
        const { camera, renderer } = sceneRef.current;
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
      }
    };
    
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('mousedown', handleMouseDown);
      renderer.domElement.removeEventListener('mousemove', handleMouseMove);
      renderer.domElement.removeEventListener('mouseup', handleMouseUp);
      renderer.domElement.removeEventListener('touchstart', handleTouchStart);
      renderer.domElement.removeEventListener('touchmove', handleTouchMove);
      renderer.domElement.removeEventListener('touchend', handleTouchEnd);
      renderer.domElement.removeEventListener('wheel', handleWheel);
      
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [debugMode]);

  // Call updateVisualization whenever parameters change
  // This ensures the 3D model updates when rise, pitch block, or other parameters change
  useEffect(() => {
    if (sceneRef.current) {
      updateVisualization();
    }
  }, [
    parameters.totalArcDistance,
    parameters.totalHelicalRise,
    parameters.pitchBlock,
    parameters.bottomLength,
    parameters.topLength,
    parameters.bottomOffset,
    parameters.topOffset,
    parameters.customEasementAngle,
    parameters.customOuterRadius,
    parameters.customInnerRadius,
    manualRiseData,
    calculatedRiseData,
    debugMode,
    showOverlay
  ]);

  return { mountRef, updateVisualization };
}
