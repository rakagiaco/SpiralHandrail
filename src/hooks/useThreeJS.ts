import { useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { HandrailParameters } from '../types/handrail';
import { getCurrentRiseAtDistance } from '../utils/calculations';

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
    handrailMesh: THREE.Mesh | null;
    insideLineMesh: THREE.Mesh | null;
    centerDots: THREE.Mesh[];
    debugElements: THREE.Object3D[];
    bottomTargetMarker: THREE.Mesh | null;
    topTargetMarker: THREE.Mesh | null;
    isDraggingTarget: boolean;
    draggedTarget: 'bottom' | 'top' | null;
    dragPlane: THREE.Plane | null;
  } | null>(null);

<<<<<<< Updated upstream
  // Helper function to create text sprites for the staircase framework
=======
  // Helper function to create text sprites
>>>>>>> Stashed changes
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

  // Function to create debugging information overlay
  const createDebugInfoOverlay = (params: HandrailParameters, manualData: Record<number, number>, calculatedData: Record<number, number>) => {
    const group = new THREE.Group();
    
    const paramsText = [
      `Total Arc: ${params.totalArcDistance}"`,
      `Total Rise: ${params.totalHelicalRise}"`,
      `Pitch Block: ${params.pitchBlock}"`,
      `Bottom Offset: ${params.bottomOffset}"`,
      `Top Offset: ${params.topOffset}"`,
      `Manual Points: ${Object.keys(manualData).length}`,
      `Calculated Points: ${Object.keys(calculatedData).length}`
    ];
    
    paramsText.forEach((text, index) => {
      // Use smaller text and position relative to the group (which is positioned in top-right)
      const sprite = createTextSprite(text, new THREE.Vector3(0, 0 - index * 1.5, 0), 0x00ff00, 'small');
      group.add(sprite);
    });
    
    return group;
  };

  const updateVisualization = useCallback(() => {
    if (!sceneRef.current) return;

    const { scene, handrailMesh, insideLineMesh, centerDots, debugElements } = sceneRef.current;
    
    // Remove existing meshes and debug elements
    if (handrailMesh) scene.remove(handrailMesh);
    if (insideLineMesh) scene.remove(insideLineMesh);
    centerDots.forEach(dot => scene.remove(dot));
    debugElements.forEach(element => scene.remove(element));
    sceneRef.current.centerDots = [];
    sceneRef.current.debugElements = [];
    
<<<<<<< Updated upstream
         // Make radii adjustable for different stair jobs
     let outerRadius = 8;
     let innerRadius = 4.5;
     
     // Allow proportional scaling of both radii
     if (parameters.customOuterRadius) {
       outerRadius = parameters.customOuterRadius;
       innerRadius = (parameters.customOuterRadius / 8) * 4.5; // Maintain proportional relationship
     }
     if (parameters.customInnerRadius) {
       innerRadius = parameters.customInnerRadius;
       outerRadius = (parameters.customInnerRadius / 4.5) * 8; // Maintain proportional relationship
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
       bottomDot.position.set(0, 2, -parameters.bottomOffset); // Fixed offset: 1.5" from main center
       scene.add(bottomDot);
       sceneRef.current.centerDots.push(bottomDot);
       
       // Top center (red) - at original offset position (1.875" from main center)
       const topDot = new THREE.Mesh(dotGeometry, new THREE.MeshLambertMaterial({ color: 0xef4444 }));
       topDot.position.set(0, 6, -parameters.topOffset); // Fixed offset: 1.875" from main center
       scene.add(topDot);
       sceneRef.current.centerDots.push(topDot);
       
       // Add labels for center dots
       const mainLabel = createTextSprite('Main Center', new THREE.Vector3(0, 4.5, 0), 0x3b82f6);
       const bottomLabel = createTextSprite('Bottom Offset', new THREE.Vector3(0, 2.5, -parameters.bottomOffset), 0xf59e0b);
       const topLabel = createTextSprite('Top Offset', new THREE.Vector3(0, 6.5, -parameters.topOffset), 0xef4444);
       
                                                                       // Add pitch block height label
           const pitchBlockLabel = createTextSprite(`Pitch Block (${parameters.pitchBlock.toFixed(1)}")`, new THREE.Vector3(0, Math.max(0.5, parameters.pitchBlock + 0.5), 0), 0xff0000);
       
       scene.add(mainLabel);
       scene.add(bottomLabel);
       scene.add(topLabel);
       scene.add(pitchBlockLabel);
       sceneRef.current.debugElements.push(mainLabel);
       sceneRef.current.debugElements.push(bottomLabel);
       sceneRef.current.debugElements.push(topLabel);
       sceneRef.current.debugElements.push(pitchBlockLabel);
     }
=======
    // Make radii adjustable for different stair jobs
    let outerRadius = 8;
    let innerRadius = 4.5;
>>>>>>> Stashed changes
    
    // Allow proportional scaling of both radii
    if (parameters.customOuterRadius) {
      outerRadius = parameters.customOuterRadius;
      innerRadius = (parameters.customOuterRadius / 8) * 4.5;
    }
    if (parameters.customInnerRadius) {
      innerRadius = parameters.customInnerRadius;
      outerRadius = (parameters.customInnerRadius / 4.5) * 8;
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
      const pitchBlockLabel = createTextSprite(`Pitch Block (${parameters.pitchBlock.toFixed(1)}")`, new THREE.Vector3(0, Math.max(0.5, parameters.pitchBlock + 0.5), 0), 0xff0000);
      
      scene.add(mainLabel);
      scene.add(bottomLabel);
      scene.add(topLabel);
      scene.add(pitchBlockLabel);
      sceneRef.current.debugElements.push(mainLabel);
      sceneRef.current.debugElements.push(bottomLabel);
      sceneRef.current.debugElements.push(topLabel);
      sceneRef.current.debugElements.push(pitchBlockLabel);
    }
    
    // Create outside handrail points with proper easement geometry
    const outerPoints: THREE.Vector3[] = [];
    const steps = 200;
    
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const arcDistance = t * parameters.totalArcDistance;
      
      const segmentPosition = (arcDistance / parameters.totalArcDistance) * parameters.totalSegments;
      const angle = (arcDistance / parameters.totalArcDistance) * parameters.totalDegrees * Math.PI / 180;
      const rise = getCurrentRiseAtDistance(
        arcDistance, 
        manualRiseData, 
        calculatedRiseData, 
        parameters.totalArcDistance,
        parameters.totalHelicalRise,
        parameters.pitchBlock
      );
      
      let x: number, z: number, y: number = rise;
      
<<<<<<< Updated upstream
               let x: number, z: number, y: number = rise; // Initialize y with fallback
       
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               if (segmentPosition <= parameters.bottomLength) {
              // Bottom over-ease: direct interpolation to straight rail at custom angle
              const easeT = segmentPosition / parameters.bottomLength;
              
                                                                      // Start at 0° with pitch block height rise
         const startAngle = 0;
         const startX = outerRadius * Math.cos(startAngle);
         const startZ = outerRadius * Math.sin(startAngle);
         const startRise = parameters.pitchBlock; // Use actual pitch block height
       
        // End point: straight rail angling DOWN at customizable angle
        const easementLength = 2.0; // Length of the easement section
        const easementAngle = parameters.customEasementAngle || -35.08; // Allow custom angle, default to -35.08°
        const angleRad = easementAngle * Math.PI / 180; // Convert to radians
        
         // Calculate the straight rail end point - ensure it's always visible and follows pitch block
         // No horizontal movement - straight down from the pitch block height
         const easementEndX = startX; // No horizontal movement - straight down
         const easementEndZ = startZ; // No forward movement - straight down
         // Ensure the easement is always visible by making it angle down from pitch block height
         // Use Math.max to ensure it's at least 0.5" above floor for visibility
         const easementEndRise = Math.max(0.5, startRise - easementLength * Math.sin(Math.abs(angleRad)));
               
               // Direct linear interpolation - no complex blending, no 90° angle
               x = startX + (easementEndX - startX) * easeT;
               z = startZ + (easementEndZ - startZ) * easeT;
               y = startRise + (easementEndRise - startRise) * easeT;
          
                                                                                 // Add interactive target point marker for bottom easement (invisible to avoid 90° angle bug)
             if (i === 0 && debugMode) { // Only add one marker at the start when debug mode is on
                  const targetMarkerGeometry = new THREE.SphereGeometry(0.3, 16, 16);
                  const targetMarkerMaterial = new THREE.MeshBasicMaterial({ 
                    color: 0xff0000, 
                    transparent: true, 
                    opacity: 0.0 // Make invisible
                  });
                  const targetMarker = new THREE.Mesh(targetMarkerGeometry, targetMarkerMaterial);
                  // Connect to pitch block height (upper dot) instead of lower dot
                  targetMarker.position.set(startX, startRise, startZ);
                  targetMarker.userData = { type: 'bottomTarget' };
                  scene.add(targetMarker);
                  sceneRef.current.debugElements.push(targetMarker);
                  sceneRef.current.bottomTargetMarker = targetMarker;
                }
        
                                                                                                                               } else if (segmentPosition >= parameters.totalSegments - parameters.topLength) {
            // Top up-ease: direct interpolation from spiral end to final position
            const easeT = (segmentPosition - (parameters.totalSegments - parameters.topLength)) / parameters.topLength;
            
            // Start at 200° (where spiral ends and easement begins)
            const startAngle = 200 * Math.PI / 180;
            const startX = outerRadius * Math.cos(startAngle);
            const startZ = outerRadius * Math.sin(startAngle);
            
                          // Calculate the correct starting rise at 200° (end of spiral)
              const spiralEndRise = 1.0 + (200 / 220) * 7.375; // Proportional rise at 200°
            const startRise = spiralEndRise;
            
            // End at 220° with 8.375" rise
            const endAngle = 220 * Math.PI / 180;
            const endX = outerRadius * Math.cos(endAngle);
            const endZ = outerRadius * Math.sin(endAngle);
            const endRise = 8.375; // Final rise at 220°
            
            // Use custom easement angle if provided, otherwise default to +35.08°
            const topEasementAngle = parameters.customEasementAngle ? Math.abs(parameters.customEasementAngle) : 35.08;
            
            // Direct linear interpolation - no bump, no complex blending
            x = startX + (endX - startX) * easeT;
            z = startZ + (endZ - startZ) * easeT;
            y = startRise + (endRise - startRise) * easeT;
=======
      if (segmentPosition <= parameters.bottomLength) {
        // Bottom over-ease: direct interpolation to straight rail at custom angle
        const easeT = segmentPosition / parameters.bottomLength;
        
        // Start at 0° with pitch block height rise
        const startAngle = 0;
        const startX = outerRadius * Math.cos(startAngle);
        const startZ = outerRadius * Math.sin(startAngle);
        const startRise = parameters.pitchBlock; // Use actual pitch block height
      
        // End point: straight rail angling DOWN at customizable angle
        const easementLength = 2.0;
        const easementAngle = parameters.customEasementAngle || -35.08;
        const angleRad = easementAngle * Math.PI / 180;
>>>>>>> Stashed changes
        
        // Calculate the straight rail end point - ensure it's always visible and follows pitch block
        const easementEndX = startX;
        const easementEndZ = startZ;
        // Use Math.max to ensure it's at least 0.5" above floor for visibility
        const easementEndRise = Math.max(0.5, startRise - easementLength * Math.sin(Math.abs(angleRad)));
              
        // Direct linear interpolation - no complex blending, no 90° angle
        x = startX + (easementEndX - startX) * easeT;
        z = startZ + (easementEndZ - startZ) * easeT;
        y = startRise + (easementEndRise - startRise) * easeT;
        
        // Add interactive target point marker for bottom easement (invisible to avoid 90° angle bug)
        if (i === 0 && debugMode) {
          const targetMarkerGeometry = new THREE.SphereGeometry(0.3, 16, 16);
          const targetMarkerMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xff0000, 
            transparent: true, 
            opacity: 0.0 // Make invisible
          });
          const targetMarker = new THREE.Mesh(targetMarkerGeometry, targetMarkerMaterial);
          targetMarker.position.set(startX, startRise, startZ);
          targetMarker.userData = { type: 'bottomTarget' };
          scene.add(targetMarker);
          sceneRef.current.debugElements.push(targetMarker);
          sceneRef.current.bottomTargetMarker = targetMarker;
        }
        
      } else if (segmentPosition >= parameters.totalSegments - parameters.topLength) {
        // Top up-ease: direct interpolation from spiral end to final position
        const easeT = (segmentPosition - (parameters.totalSegments - parameters.topLength)) / parameters.topLength;
        
        // Start at 200° (where spiral ends and easement begins)
        const startAngle = 200 * Math.PI / 180;
        const startX = outerRadius * Math.cos(startAngle);
        const startZ = outerRadius * Math.sin(startAngle);
        
        // Calculate the correct starting rise at 200° (end of spiral)
        const spiralEndRise = 1.0 + (200 / 220) * 7.375;
        const startRise = spiralEndRise;
        
        // End at 220° with 8.375" rise
        const endAngle = 220 * Math.PI / 180;
        const endX = outerRadius * Math.cos(endAngle);
        const endZ = outerRadius * Math.sin(endAngle);
        const endRise = 8.375;
        
        // Use custom easement angle if provided, otherwise default to +35.08°
        const topEasementAngle = parameters.customEasementAngle ? Math.abs(parameters.customEasementAngle) : 35.08;
        
        // Direct linear interpolation - no bump, no complex blending
        x = startX + (endX - startX) * easeT;
        z = startZ + (endZ - startZ) * easeT;
        y = startRise + (endRise - startRise) * easeT;
        
        // Add interactive target point marker for top easement
        if (i === steps && debugMode) {
          const targetMarkerGeometry = new THREE.SphereGeometry(0.3, 16, 16);
          const targetMarkerMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
          const targetMarker = new THREE.Mesh(targetMarkerGeometry, targetMarkerMaterial);
          targetMarker.position.set(endX, endRise, endZ);
          targetMarker.userData = { type: 'topTarget' };
          scene.add(targetMarker);
          sceneRef.current.debugElements.push(targetMarker);
          sceneRef.current.topTargetMarker = targetMarker;
        }
        
      } else {
        // Main spiral: use main center
        x = outerRadius * Math.cos(angle);
        z = outerRadius * Math.sin(angle);
        y = rise;
      }
      
      outerPoints.push(new THREE.Vector3(x, y, z));
    }
    
<<<<<<< Updated upstream
    // Create rise profile visualization (2D graph in 3D space) - only when debug mode is on
    if (debugMode) {
      riseProfileGeometry.setFromPoints(riseProfilePoints);
      const riseProfileMaterial = new THREE.LineBasicMaterial({ color: 0xff00ff, linewidth: 3 });
      const riseProfileLine = new THREE.Line(riseProfileGeometry, riseProfileMaterial);
      riseProfileLine.position.set(-20, 0, -20); // Position the rise profile graph
      scene.add(riseProfileLine);
      sceneRef.current.debugElements.push(riseProfileLine);
      
      // Add rise profile grid
      const riseGridHelper = new THREE.GridHelper(40, 20, 0x444444, 0x222222);
      riseGridHelper.position.set(-20, -1, -20);
      riseGridHelper.rotation.x = -Math.PI / 2;
      scene.add(riseGridHelper);
      sceneRef.current.debugElements.push(riseGridHelper);
      
      // Add rise profile axes
      const riseAxesHelper = new THREE.AxesHelper(20);
      riseAxesHelper.position.set(-20, 0, -20);
      scene.add(riseAxesHelper);
      sceneRef.current.debugElements.push(riseAxesHelper);
    }
    
     // Create inside reference line: covers full 220° span but only 10.5" arc distance
     // Includes easements to flow smoothly into straight rails
     // KEY CONCEPT: Inner line easements use the same manual positioning system as outer line
     // Both use the same target points for consistency and smooth transitions
     const insidePoints: THREE.Vector3[] = [];
     const insideRadius = 4.5; // Inner radius
     
     for (let i = 0; i <= steps; i++) {
       const t = i / steps;
       const arcDistance = t * parameters.totalArcDistance;
       const segmentPosition = (arcDistance / parameters.totalArcDistance) * parameters.totalSegments;
       const angle = (t * parameters.totalDegrees * Math.PI) / 180; // Full 220° span
       
               // Calculate rise based on the proportional arc distance (10.5" over 17.5")
        const proportionalArcDistance = (t * 10.5); // Only 10.5" arc distance
        const rise = 1.0 + (proportionalArcDistance / 10.5) * 7.375; // Straight line from 1.0" to 8.375"
       
       // Add to rise profile visualization for inner line (always populate, but only display when debug mode is on)
       riseProfilePoints.push(new THREE.Vector3(proportionalArcDistance, rise, 0));
       
               let x: number, z: number, y: number = rise; // Initialize y with fallback
      
                                                                                                               if (segmentPosition <= parameters.bottomLength) {
            // Bottom over-ease: direct interpolation to straight rail at custom angle
            const easeT = segmentPosition / parameters.bottomLength;
            
                                                                // Start at 0° with pitch block height rise
               const startAngle = 0;
               const startX = insideRadius * Math.cos(startAngle);
               const startZ = insideRadius * Math.sin(startAngle);
               const startRise = parameters.pitchBlock; // Use actual pitch block height
             
                          // Calculate the easement end point by angling DOWN at customizable angle
              const easementLength = 2.0; // Length of the easement section
              const innerBottomEasementAngle = parameters.customEasementAngle || -35.08; // Allow custom angle, default to -35.08°
              const angleRad = innerBottomEasementAngle * Math.PI / 180; // Convert to radians
              
                                                         // Project the easement direction directly DOWN at custom angle from the start point
                // Connect to the upper offset dot (pitch block height) - no lower dot at 0
                const easementEndX = startX; // No horizontal movement - straight down
                const easementEndZ = startZ; // No forward movement - straight down
                // Ensure the easement is always visible by making it angle down from pitch block height
                // Use Math.max to ensure it's at least 0.5" above floor for visibility
                const easementEndRise = Math.max(0.5, startRise - easementLength * Math.sin(Math.abs(angleRad)));
             
             // Direct linear interpolation - no complex blending, no 90° angle
             x = startX + (easementEndX - startX) * easeT;
             z = startZ + (easementEndZ - startZ) * easeT;
             y = startRise + (easementEndRise - startRise) * easeT;
        
                                                                                                                                                                                                                                                                                                                                               } else if (segmentPosition >= parameters.totalSegments - parameters.topLength) {
             // Top up-ease: direct interpolation from spiral end to final position
             const easeT = (segmentPosition - (parameters.totalSegments - parameters.topLength)) / parameters.topLength;
             
             // Start at 200° (where spiral ends and easement begins)
             const startAngle = 200 * Math.PI / 180;
             const startX = insideRadius * Math.cos(startAngle);
             const startZ = insideRadius * Math.sin(startAngle);
             
             // Calculate the correct starting rise at 200° (end of spiral)
             const spiralEndRise = 1.0 + (200 / 220) * 7.375; // Proportional rise at 200°
             const startRise = spiralEndRise;
             
             // End at 220° with 8.375" rise (total cumulative rise over 220°)
             const endAngle = 220 * Math.PI / 180;
             const endX = insideRadius * Math.cos(endAngle);
             const endZ = insideRadius * Math.sin(endAngle);
             const endRise = 8.375; // Final total rise at 220°
             
             // Use custom easement angle if provided, otherwise default to +35.08°
             const innerTopEasementAngle = parameters.customEasementAngle ? Math.abs(parameters.customEasementAngle) : 35.08;
             
             // Direct linear interpolation - no bump, no complex blending
             x = startX + (endX - startX) * easeT;
             z = startZ + (endZ - startZ) * easeT;
             y = startRise + (endRise - startRise) * easeT;
        
                           } else {
         // Main spiral: use main center
         // Calculate position from main center
         x = insideRadius * Math.cos(angle);
         z = insideRadius * Math.sin(angle);
         y = rise; // Use the calculated rise for main spiral
       }
      
      insidePoints.push(new THREE.Vector3(x, y, z));
    }
    
=======
>>>>>>> Stashed changes
    // Create the curve with smooth interpolation for straight line rises
    const outerCurve = new THREE.CatmullRomCurve3(outerPoints);
    outerCurve.tension = 0.0; // No tension for exact point following
    const outerGeometry = new THREE.TubeGeometry(outerCurve, Math.min(steps, outerPoints.length - 1), 0.15, 8, false);
    const newHandrailMesh = new THREE.Mesh(outerGeometry, new THREE.MeshLambertMaterial({ color: 0x3b82f6 }));
    newHandrailMesh.castShadow = true;
    scene.add(newHandrailMesh);
    sceneRef.current.handrailMesh = newHandrailMesh;
    
    // Create inside reference line: covers full 220° span but only 10.5" arc distance
    const insidePoints: THREE.Vector3[] = [];
    
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const arcDistance = t * parameters.totalArcDistance;
      const segmentPosition = (arcDistance / parameters.totalArcDistance) * parameters.totalSegments;
      const angle = (t * parameters.totalDegrees * Math.PI) / 180; // Full 220° span
      
      // Calculate rise based on the proportional arc distance (10.5" over 17.5")
      const proportionalArcDistance = (t * 10.5); // Only 10.5" arc distance
      const rise = 1.0 + (proportionalArcDistance / 10.5) * 7.375; // Straight line from 1.0" to 8.375"
      
      let x: number, z: number, y: number = rise;
      
      if (segmentPosition <= parameters.bottomLength) {
        // Bottom over-ease: direct interpolation to straight rail at custom angle
        const easeT = segmentPosition / parameters.bottomLength;
        
        // Start at 0° with pitch block height rise
        const startAngle = 0;
        const startX = innerRadius * Math.cos(startAngle);
        const startZ = innerRadius * Math.sin(startAngle);
        const startRise = parameters.pitchBlock; // Use actual pitch block height
        
        // Calculate the easement end point by angling DOWN at customizable angle
        const easementLength = 2.0;
        const innerBottomEasementAngle = parameters.customEasementAngle || -35.08;
        const angleRad = innerBottomEasementAngle * Math.PI / 180;
        
        // Project the easement direction directly DOWN at custom angle from the start point
        const easementEndX = startX;
        const easementEndZ = startZ;
        // Use Math.max to ensure it's at least 0.5" above floor for visibility
        const easementEndRise = Math.max(0.5, startRise - easementLength * Math.sin(Math.abs(angleRad)));
        
        // Direct linear interpolation - no complex blending, no 90° angle
        x = startX + (easementEndX - startX) * easeT;
        z = startZ + (easementEndZ - startZ) * easeT;
        y = startRise + (easementEndRise - startRise) * easeT;
        
      } else if (segmentPosition >= parameters.totalSegments - parameters.topLength) {
        // Top up-ease: direct interpolation from spiral end to final position
        const easeT = (segmentPosition - (parameters.totalSegments - parameters.topLength)) / parameters.topLength;
        
        // Start at 200° (where spiral ends and easement begins)
        const startAngle = 200 * Math.PI / 180;
        const startX = innerRadius * Math.cos(startAngle);
        const startZ = innerRadius * Math.sin(startAngle);
        
        // Calculate the correct starting rise at 200° (end of spiral)
        const spiralEndRise = 1.0 + (200 / 220) * 7.375;
        const startRise = spiralEndRise;
        
        // End at 220° with 8.375" rise (total cumulative rise over 220°)
        const endAngle = 220 * Math.PI / 180;
        const endX = innerRadius * Math.cos(endAngle);
        const endZ = innerRadius * Math.sin(endAngle);
        const endRise = 8.375;
        
        // Use custom easement angle if provided, otherwise default to +35.08°
        const innerTopEasementAngle = parameters.customEasementAngle ? Math.abs(parameters.customEasementAngle) : 35.08;
        
        // Direct linear interpolation - no bump, no complex blending
        x = startX + (endX - startX) * easeT;
        z = startZ + (endZ - startZ) * easeT;
        y = startRise + (endRise - startRise) * easeT;
        
      } else {
        // Main spiral: use main center
        x = innerRadius * Math.cos(angle);
        z = innerRadius * Math.sin(angle);
        y = rise;
      }
      
      insidePoints.push(new THREE.Vector3(x, y, z));
    }
    
    // Create inside reference line with smooth curve
    const insideCurve = new THREE.CatmullRomCurve3(insidePoints);
    insideCurve.tension = 0.0; // No tension for exact point following
    const insideGeometry = new THREE.TubeGeometry(insideCurve, steps, 0.1, 6, false);
    const newInsideLineMesh = new THREE.Mesh(insideGeometry, new THREE.MeshLambertMaterial({ color: 0x10b981 }));
    scene.add(newInsideLineMesh);
    sceneRef.current.insideLineMesh = newInsideLineMesh;
    
<<<<<<< Updated upstream
                        // Add debugging information overlay (only when both debug mode and overlay are on)
       if (debugMode && showOverlay) {
         const debugInfo = createDebugInfoOverlay(parameters, manualRiseData, calculatedRiseData);
         // Position the overlay in the top-right corner so it doesn't cover the main debug visuals
         debugInfo.position.set(20, 15, -20);
         scene.add(debugInfo);
         sceneRef.current.debugElements.push(debugInfo);
       
       // Add easement angle debugging
       const addEasementDebugInfo = () => {
         // Bottom easement debug
         const bottomEasementAngle = (parameters.bottomLength / parameters.totalSegments) * parameters.totalDegrees;
         const bottomDebugText = `Bottom Easement: 0° to ${bottomEasementAngle.toFixed(1)}° (Over-Ease)`;
         
         // Top easement debug  
         const topEasementStart = ((parameters.totalSegments - parameters.topLength) / parameters.totalSegments) * parameters.totalDegrees;
         const topEasementEnd = parameters.totalDegrees;
         const topDebugText = `Top Easement: ${topEasementStart.toFixed(1)}° to ${topEasementEnd.toFixed(1)}° (Up-Ease)`;
         
         // Add current custom parameters
         const currentAngle = parameters.customEasementAngle || 35.08;
         const currentOuterRadius = parameters.customOuterRadius || 8;
         const currentInnerRadius = parameters.customInnerRadius || 4.5;
         
         // Add instructions with current values
         const instructionsText = `Easements: ${currentAngle.toFixed(1)}° | Outer: ${currentOuterRadius}" | Inner: ${currentInnerRadius}"`;
       
         // Create text sprites for easement debugging
         const createEasementTextSprite = (text: string, position: THREE.Vector3) => {
           const canvas = document.createElement('canvas');
           const context = canvas.getContext('2d');
           if (!context) return new THREE.Group();
           
           canvas.width = 512;
           canvas.height = 128;
           context.fillStyle = '#000000';
           context.fillRect(0, 0, canvas.width, canvas.height);
           context.fillStyle = '#ffff00';
           context.font = '20px Arial';
           context.textAlign = 'center';
           context.fillText(text, canvas.width / 2, canvas.height / 2);
           
           const texture = new THREE.CanvasTexture(canvas);
           const material = new THREE.SpriteMaterial({ map: texture });
           const sprite = new THREE.Sprite(material);
           sprite.position.copy(position);
           sprite.scale.set(4, 1, 1);
           
           return sprite;
         };
         
         const bottomSprite = createEasementTextSprite(bottomDebugText, new THREE.Vector3(0, 12, 0));
         const topSprite = createEasementTextSprite(topDebugText, new THREE.Vector3(0, 14, 0));
         const instructionsSprite = createEasementTextSprite(instructionsText, new THREE.Vector3(0, 16, 0));
         
         scene.add(bottomSprite);
         scene.add(topSprite);
         scene.add(instructionsSprite);
         if (sceneRef.current) {
           sceneRef.current.debugElements.push(bottomSprite);
           sceneRef.current.debugElements.push(topSprite);
           sceneRef.current.debugElements.push(instructionsSprite);
         }
       };
       
       addEasementDebugInfo();
    } // Close debugMode if statement
=======
    // Add debugging information overlay (only when both debug mode and overlay are on)
    if (debugMode && showOverlay) {
      const debugInfo = createDebugInfoOverlay(parameters, manualRiseData, calculatedRiseData);
      // Position the overlay in the top-right corner so it doesn't cover the main debug visuals
      debugInfo.position.set(20, 15, -20);
      scene.add(debugInfo);
      sceneRef.current.debugElements.push(debugInfo);
    }
>>>>>>> Stashed changes
    
    // Add staircase framework (only when debug mode is on)
    if (debugMode) {
      addStaircaseFramework(scene, parameters, sceneRef.current.debugElements);
    }
    
<<<<<<< Updated upstream
     }, [parameters, manualRiseData, calculatedRiseData, debugMode, showOverlay]);

       // Function to create debugging information overlay
   const createDebugInfoOverlay = (params: HandrailParameters, manualData: Record<number, number>, calculatedData: Record<number, number>) => {
     const group = new THREE.Group();
     
     // Add key parameter information
     const paramsText = [
       `Total Arc: ${params.totalArcDistance}"`,
       `Total Rise: ${params.totalHelicalRise}"`,
       `Pitch Block: ${params.pitchBlock}"`,
       `Bottom Offset: ${params.bottomOffset}"`,
       `Top Offset: ${params.topOffset}"`,
       `Manual Points: ${Object.keys(manualData).length}`,
       `Calculated Points: ${Object.keys(calculatedData).length}`
     ];
     
     paramsText.forEach((text, index) => {
       // Use smaller text and position relative to the group (which is positioned in top-right)
       const sprite = createTextSprite(text, new THREE.Vector3(0, 0 - index * 1.5, 0), 0x00ff00, 'small');
       group.add(sprite);
     });
     
     return group;
   };

  // ============================================================================
  // STAIRCASE FRAMEWORK - Reference points for easement connections
  // ============================================================================
  // This shows the full staircase geometry to understand where easements connect
  // Uses inner line's constant rise/run: 7⅜" rise over 10.5" run = custom angle slope
  // SCISSOR STAIR: Both flights go UP at custom angle, rotated 180° around main center
  // NOTE: This is just a handrail reference - no actual pitch block constraints
  const addStaircaseFramework = (scene: THREE.Scene, parameters: HandrailParameters, debugElements: THREE.Object3D[]) => {
     // Use custom easement angle if provided, otherwise default to 35.08°
     const customAngle = parameters.customEasementAngle || 35.08;
     const angleRad = customAngle * Math.PI / 180;
     
     // Calculate step dimensions based on custom angle
     // For 7 steps, maintain the same total rise (7.375") but adjust run to match custom angle
     const stepRise = 7.375 / 7; // 7⅜" total rise divided by 7 steps
     const stepRun = stepRise / Math.tan(angleRad); // Calculate run to match custom angle
     const slopeAngle = customAngle; // Use the custom angle directly
=======
  }, [parameters, manualRiseData, calculatedRiseData, debugMode, showOverlay]);

  // Function to add staircase framework for reference
  const addStaircaseFramework = (scene: THREE.Scene, parameters: HandrailParameters, debugElements: THREE.Object3D[]) => {
    // Use custom easement angle if provided, otherwise default to 35.08°
    const customAngle = parameters.customEasementAngle || 35.08;
    const angleRad = customAngle * Math.PI / 180;
    
    // Calculate step dimensions based on custom angle
    const stepRise = 7.375 / 7; // 7⅜" total rise divided by 7 steps
    const stepRun = stepRise / Math.tan(angleRad); // Calculate run to match custom angle
    const slopeAngle = customAngle;
>>>>>>> Stashed changes
    
    // Create staircase framework points
    const staircasePoints: THREE.Vector3[] = [];
    
    // FLIGHT 1: 7 steps UP from main center
    for (let i = 1; i <= 7; i++) {
      const y = (7 - i) * stepRun;
      const z = -(7 - i) * stepRise;
      const x = 0;
      
      staircasePoints.push(new THREE.Vector3(x, y, z));
      
      // Add step marker (green for first flight)
      const stepGeometry = new THREE.BoxGeometry(0.5, 0.1, 0.5);
      const stepMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00, transparent: true, opacity: 0.7 });
      const step = new THREE.Mesh(stepGeometry, stepMaterial);
      step.position.set(x, y - 0.05, z);
      scene.add(step);
      debugElements.push(step);
      
      // Add step label
      const stepLabel = createTextSprite(`F1-${i}`, new THREE.Vector3(x + 0.8, y, z), 0x00ff00);
      scene.add(stepLabel);
      debugElements.push(stepLabel);
    }
    
    // FLIGHT 2: 7 steps UP from main center (scissor stair)
    for (let i = 1; i <= 7; i++) {
      const y = -i * stepRun;
      const z = -i * stepRise;
      const x = 0;
      
      staircasePoints.push(new THREE.Vector3(x, y, z));
      
      // Add step marker (blue for second flight)
      const stepGeometry = new THREE.BoxGeometry(0.5, 0.1, 0.5);
      const stepMaterial = new THREE.MeshBasicMaterial({ color: 0x0088ff, transparent: true, opacity: 0.7 });
      const step = new THREE.Mesh(stepGeometry, stepMaterial);
      step.position.set(x, y - 0.05, z);
      scene.add(step);
      debugElements.push(step);
      
      // Add step label
      const stepLabel = createTextSprite(`F2-${i}`, new THREE.Vector3(x - 0.8, y, z), 0x0088ff);
      scene.add(stepLabel);
      debugElements.push(stepLabel);
    }
    
    // Create staircase framework line
    const staircaseGeometry = new THREE.BufferGeometry().setFromPoints(staircasePoints);
    const staircaseMaterial = new THREE.LineBasicMaterial({ color: 0xffff00, linewidth: 4 });
    const staircaseLine = new THREE.Line(staircaseGeometry, staircaseMaterial);
    scene.add(staircaseLine);
    debugElements.push(staircaseLine);
    
    // Add slope angle indicator
    const slopeLabel = createTextSprite(
      `Slope: ${slopeAngle.toFixed(1)}°`, 
      new THREE.Vector3(0, 8, 0), 
      0xffff00
    );
    scene.add(slopeLabel);
    debugElements.push(slopeLabel);
  };

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
      }
      e.preventDefault();
    };
    
    const handleTouchMove = (e: TouchEvent) => {
      if (isDragging && e.touches.length === 1) {
        handleRotation(e.touches[0].clientX, e.touches[0].clientY);
      }
      e.preventDefault();
    };
    
    const handleTouchEnd = (e: TouchEvent) => {
      isDragging = false;
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
      const axesHelper = new THREE.AxesHelper(10);
      scene.add(axesHelper);
      
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
  }, []);

  useEffect(() => {
    updateVisualization();
  }, [updateVisualization]);

  return { mountRef, updateVisualization };
}
