import { useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { HandrailParameters } from '../types/handrail';
import { getCurrentRiseAtDistance } from '../utils/calculations';

export function useThreeJS(
  parameters: HandrailParameters,
  manualRiseData: Record<number, number>,
  calculatedRiseData: Record<number, number>
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
  } | null>(null);

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
    
    const outerRadius = 8;
    const innerRadius = 4.5;
    
    // Add center dots with enhanced debugging
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
    
    // ============================================================================
    // DEBUGGING VISUALS - Enhanced coordinate system and measurements
    // ============================================================================
    
    // Enhanced coordinate axes with labels
    const axesHelper = new THREE.AxesHelper(15);
    axesHelper.material.linewidth = 3;
    scene.add(axesHelper);
    sceneRef.current.debugElements.push(axesHelper);
    
    // Add coordinate grid for better spatial understanding
    const gridHelper = new THREE.GridHelper(30, 30, 0x444444, 0x222222);
    gridHelper.position.y = -1;
    scene.add(gridHelper);
    sceneRef.current.debugElements.push(gridHelper);
    
    // Add radius circles for debugging
    const outerCircleGeometry = new THREE.RingGeometry(outerRadius - 0.1, outerRadius + 0.1, 64);
    const outerCircleMaterial = new THREE.MeshBasicMaterial({ 
      color: 0x3b82f6, 
      transparent: true, 
      opacity: 0.3,
      side: THREE.DoubleSide 
    });
    const outerCircle = new THREE.Mesh(outerCircleGeometry, outerCircleMaterial);
    outerCircle.rotation.x = -Math.PI / 2;
    outerCircle.position.y = -0.5;
    scene.add(outerCircle);
    sceneRef.current.debugElements.push(outerCircle);
    
    const innerCircleGeometry = new THREE.RingGeometry(innerRadius - 0.1, innerRadius + 0.1, 64);
    const innerCircleMaterial = new THREE.MeshBasicMaterial({ 
      color: 0x10b981, 
      transparent: true, 
      opacity: 0.3,
      side: THREE.DoubleSide 
    });
    const innerCircle = new THREE.Mesh(innerCircleGeometry, innerCircleMaterial);
    innerCircle.rotation.x = -Math.PI / 2;
    innerCircle.position.y = -0.5;
    scene.add(innerCircle);
    sceneRef.current.debugElements.push(innerCircle);
    
    // Add angle markers every 45 degrees
    for (let angle = 0; angle <= 360; angle += 45) {
      const rad = (angle * Math.PI) / 180;
      const markerLength = 0.5;
      const startX = (outerRadius + 1) * Math.cos(rad);
      const startZ = (outerRadius + 1) * Math.sin(rad);
      const endX = (outerRadius + 1 + markerLength) * Math.cos(rad);
      const endZ = (outerRadius + 1 + markerLength) * Math.sin(rad);
      
      const markerGeometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(startX, -0.5, startZ),
        new THREE.Vector3(endX, -0.5, endZ)
      ]);
      const markerMaterial = new THREE.LineBasicMaterial({ color: 0x666666, linewidth: 2 });
      const marker = new THREE.Line(markerGeometry, markerMaterial);
      scene.add(marker);
      sceneRef.current.debugElements.push(marker);
      
      // Add angle labels
      const labelGeometry = new THREE.PlaneGeometry(1, 0.5);
      const labelMaterial = new THREE.MeshBasicMaterial({ 
        color: 0x666666, 
        transparent: true, 
        opacity: 0.8,
        side: THREE.DoubleSide 
      });
      const label = new THREE.Mesh(labelGeometry, labelMaterial);
      label.position.set(
        (outerRadius + 2.5) * Math.cos(rad),
        -0.2,
        (outerRadius + 2.5) * Math.sin(rad)
      );
      label.lookAt(0, -0.2, 0);
      scene.add(label);
      sceneRef.current.debugElements.push(label);
    }
    
    // Add measurement lines and rise profile visualization
    const riseProfilePoints: THREE.Vector3[] = [];
    const riseProfileGeometry = new THREE.BufferGeometry();
    
    // Create outside handrail points with proper easement geometry
    const outerPoints: THREE.Vector3[] = [];
    const steps = 200; // Increased steps for smoother curves
    
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const arcDistance = t * parameters.totalArcDistance;
      
      // Stop at exactly totalArc distance
      if (arcDistance > parameters.totalArcDistance) break;
      
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
      
      // Add to rise profile visualization
      riseProfilePoints.push(new THREE.Vector3(arcDistance, rise, 0));
      
      let x: number, z: number;
      let centerX = 0; // Initialize centerX
      let centerZ = 0; // Initialize centerZ
      let effectiveRadius = 0; // Initialize effectiveRadius
      
      if (segmentPosition <= parameters.bottomLength) {
        // Bottom over-ease: straight rail looking DOWN the staircase at -35.08°
        // At 0° transition point, rail should be completely straight
        const easeT = segmentPosition / parameters.bottomLength;
        
        // Calculate the spiral start position (where over-ease begins)
        const spiralStartAngle = (parameters.bottomLength / parameters.totalSegments) * parameters.totalDegrees * Math.PI / 180;
        const spiralStartX = outerRadius * Math.cos(spiralStartAngle);
        const spiralStartZ = outerRadius * Math.sin(spiralStartAngle);
        
        // Calculate the direction vector from main center to spiral start
        const directionX = spiralStartX - 0; // From main center (0,0) to spiral start
        const directionZ = spiralStartZ - 0;
        const directionLength = Math.sqrt(directionX * directionX + directionZ * directionZ);
        
        // Normalize the direction vector
        const unitDirectionX = directionX / directionLength;
        const unitDirectionZ = directionZ / directionLength;
        
        // For bottom easement: go straight DOWN the staircase direction
        // This means extending the arc in the same direction as the staircase flow
        const straightRailLength = 0.4; // Much shorter for minimal outward projection
        
        // Extend straight in the staircase direction (not outward)
        const straightEndX = spiralStartX + (unitDirectionX * straightRailLength);
        const straightEndZ = spiralStartZ + (unitDirectionZ * straightRailLength);
        
        // Linear interpolation from spiral start to straight end
        x = spiralStartX + (straightEndX - spiralStartX) * easeT;
        z = spiralStartZ + (straightEndZ - spiralStartZ) * easeT;
        
        // Add debugging line for bottom easement direction
        if (i % 20 === 0) { // Add debug line every 20th point
          const debugLineGeometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(spiralStartX, rise, spiralStartZ),
            new THREE.Vector3(straightEndX, rise, straightEndZ)
          ]);
          const debugLineMaterial = new THREE.LineBasicMaterial({ color: 0xff0000, linewidth: 2 });
          const debugLine = new THREE.Line(debugLineGeometry, debugLineMaterial);
          scene.add(debugLine);
          sceneRef.current.debugElements.push(debugLine);
        }
        
      } else if (segmentPosition >= parameters.totalSegments - parameters.topLength) {
        // Top up-ease: straight rail looking UP the staircase at +35.08°
        // At 180° transition point, rail should be completely straight
        const easeT = (segmentPosition - (parameters.totalSegments - parameters.topLength)) / parameters.topLength;
        
        // Calculate the spiral end position (where up-ease begins)
        const spiralEndAngle = ((parameters.totalSegments - parameters.topLength) / parameters.totalSegments) * parameters.totalDegrees * Math.PI / 180;
        const spiralEndX = outerRadius * Math.cos(spiralEndAngle);
        const spiralEndZ = outerRadius * Math.sin(spiralEndAngle);
        
        // Calculate the direction vector from main center to spiral end
        const directionX = spiralEndX - 0; // From main center (0,0) to spiral end
        const directionZ = spiralEndZ - 0;
        const directionLength = Math.sqrt(directionX * directionX + directionZ * directionZ);
        
        // Normalize the direction vector
        const unitDirectionX = directionX / directionLength;
        const unitDirectionZ = directionZ / directionLength;
        
        // For top easement: go straight UP the staircase direction
        // This means extending the arc in the same direction as the staircase flow
        const straightRailLength = 0.4; // Much shorter for minimal outward projection
        
        // Extend straight in the staircase direction (not outward)
        const straightEndX = spiralEndX + (unitDirectionX * straightRailLength);
        const straightEndZ = spiralEndZ + (unitDirectionZ * straightRailLength);
        
        // Linear interpolation from spiral end to straight end
        x = spiralEndX + (straightEndX - spiralEndX) * easeT;
        z = spiralEndZ + (straightEndZ - spiralEndZ) * easeT;
        
        // Add debugging line for top easement direction
        if (i % 20 === 0) { // Add debug line every 20th point
          const debugLineGeometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(spiralEndX, rise, spiralEndZ),
            new THREE.Vector3(straightEndX, rise, straightEndZ)
          ]);
          const debugLineMaterial = new THREE.LineBasicMaterial({ color: 0x00ff00, linewidth: 2 });
          const debugLine = new THREE.Line(debugLineGeometry, debugLineMaterial);
          scene.add(debugLine);
          sceneRef.current.debugElements.push(debugLine);
        }
        
      } else {
        // Main spiral: use main center
        centerX = 0;
        centerZ = 0;
        effectiveRadius = outerRadius;
        
        // Calculate position from main center
        x = centerX + effectiveRadius * Math.cos(angle);
        z = centerZ + effectiveRadius * Math.sin(angle);
        
        // Add debugging markers for main spiral every 45 degrees
        if (Math.abs(angle * 180 / Math.PI % 45) < 0.1) {
          const markerGeometry = new THREE.SphereGeometry(0.1, 8, 8);
          const markerMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
          const marker = new THREE.Mesh(markerGeometry, markerMaterial);
          marker.position.set(x, rise, z);
          scene.add(marker);
          sceneRef.current.debugElements.push(marker);
        }
      }
      
      const y = rise;
      outerPoints.push(new THREE.Vector3(x, y, z));
    }
    
    // Create rise profile visualization (2D graph in 3D space)
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
    
    // Create inside reference line: covers full 220° span but only 10.5" arc distance
    // Includes easements to flow smoothly into straight rails
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
      
      let x: number, z: number;
      let centerX = 0;
      let centerZ = 0;
      let effectiveRadius = insideRadius;
      
      if (segmentPosition <= parameters.bottomLength) {
        // Bottom over-ease: straight rail looking DOWN the staircase at -35.08°
        // At 0° transition point, rail should be completely straight
        const easeT = segmentPosition / parameters.bottomLength;
        
        // Calculate the spiral start position (where over-ease begins)
        const spiralStartAngle = (parameters.bottomLength / parameters.totalSegments) * parameters.totalDegrees * Math.PI / 180;
        const spiralStartX = insideRadius * Math.cos(spiralStartAngle);
        const spiralStartZ = insideRadius * Math.sin(spiralStartAngle);
        
        // For bottom easement: go straight DOWN the staircase direction
        // This means extending the arc in the same direction as the staircase flow
        const straightRailLength = 0.4; // Much shorter for minimal outward projection
        
        // Calculate the direction vector from main center to spiral start
        const directionX = spiralStartX - 0; // From main center (0,0) to spiral start
        const directionZ = spiralStartZ - 0;
        const directionLength = Math.sqrt(directionX * directionX + directionZ * directionZ);
        
        // Normalize the direction vector
        const unitDirectionX = directionX / directionLength;
        const unitDirectionZ = directionZ / directionLength;
        
        // Extend straight in the staircase direction (not outward)
        const straightEndX = spiralStartX + (unitDirectionX * straightRailLength);
        const straightEndZ = spiralStartZ + (unitDirectionZ * straightRailLength);
        
        // Linear interpolation from spiral start to straight end
        x = spiralStartX + (straightEndX - spiralStartX) * easeT;
        z = spiralStartZ + (straightEndZ - spiralStartZ) * easeT;
        
      } else if (segmentPosition >= parameters.totalSegments - parameters.topLength) {
        // Top up-ease: straight rail looking UP the staircase at +35.08°
        // At 180° transition point, rail should be completely straight
        const easeT = (segmentPosition - (parameters.totalSegments - parameters.topLength)) / parameters.topLength;
        
        // Calculate the spiral end position (where up-ease begins)
        const spiralEndAngle = ((parameters.totalSegments - parameters.topLength) / parameters.totalSegments) * parameters.totalDegrees * Math.PI / 180;
        const spiralEndX = insideRadius * Math.cos(spiralEndAngle);
        const spiralEndZ = insideRadius * Math.sin(spiralEndAngle);
        
        // For top easement: go straight UP the staircase direction
        // This means extending the arc in the same direction as the staircase flow
        const straightRailLength = 0.4; // Much shorter for minimal outward projection
        
        // Calculate the direction vector from main center to spiral end
        const directionX = spiralEndX - 0; // From main center (0,0) to spiral end
        const directionZ = spiralEndZ - 0;
        const directionLength = Math.sqrt(directionX * directionX + directionZ * directionZ);
        
        // Normalize the direction vector
        const unitDirectionX = directionX / directionLength;
        const unitDirectionZ = directionZ / directionLength;
        
        // Extend straight in the staircase direction (not outward)
        const straightEndX = spiralEndX + (unitDirectionX * straightRailLength);
        const straightEndZ = spiralEndZ + (unitDirectionZ * straightRailLength);
        
        // Linear interpolation from spiral end to straight end
        x = spiralEndX + (straightEndX - spiralEndX) * easeT;
        z = spiralEndZ + (straightEndZ - spiralEndZ) * easeT;
        
      } else {
        // Main spiral: use main center
        centerX = 0;
        centerZ = 0;
        
        // Calculate position from main center
        x = centerX + effectiveRadius * Math.cos(angle);
        z = centerZ + effectiveRadius * Math.sin(angle);
      }
      const y = rise;
      
      insidePoints.push(new THREE.Vector3(x, y, z));
    }
    
    // Create the curve with smooth interpolation for straight line rises
    const outerCurve = new THREE.CatmullRomCurve3(outerPoints);
    outerCurve.tension = 0.0; // No tension for exact point following
    const outerGeometry = new THREE.TubeGeometry(outerCurve, Math.min(steps, outerPoints.length - 1), 0.15, 8, false);
    const newHandrailMesh = new THREE.Mesh(outerGeometry, new THREE.MeshLambertMaterial({ color: 0x3b82f6 }));
    newHandrailMesh.castShadow = true;
    scene.add(newHandrailMesh);
    sceneRef.current.handrailMesh = newHandrailMesh;
    
    // Create inside reference line with smooth curve
    const insideCurve = new THREE.CatmullRomCurve3(insidePoints);
    insideCurve.tension = 0.0; // No tension for exact point following
    const insideGeometry = new THREE.TubeGeometry(insideCurve, steps, 0.1, 6, false);
    const newInsideLineMesh = new THREE.Mesh(insideGeometry, new THREE.MeshLambertMaterial({ color: 0x10b981 }));
    scene.add(newInsideLineMesh);
    sceneRef.current.insideLineMesh = newInsideLineMesh;
    
    // Add debugging information overlay
    const debugInfo = createDebugInfoOverlay(parameters, manualRiseData, calculatedRiseData);
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
      
      scene.add(bottomSprite);
      scene.add(topSprite);
      if (sceneRef.current) {
        sceneRef.current.debugElements.push(bottomSprite);
        sceneRef.current.debugElements.push(topSprite);
      }
    };
    
    addEasementDebugInfo();
    
    // Add staircase framework
    addStaircaseFramework(scene, parameters, debugElements);
    
  }, [parameters, manualRiseData, calculatedRiseData]);

  // Function to create debugging information overlay
  const createDebugInfoOverlay = (params: HandrailParameters, manualData: Record<number, number>, calculatedData: Record<number, number>) => {
    const group = new THREE.Group();
    
    // Create text sprites for debugging information
    const createTextSprite = (text: string, position: THREE.Vector3, color: number = 0xffffff) => {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      if (!context) return new THREE.Group();
      
      canvas.width = 512;
      canvas.height = 128;
      context.fillStyle = '#000000';
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.fillStyle = `#${color.toString(16).padStart(6, '0')}`;
      context.font = '24px Arial';
      context.textAlign = 'center';
      context.fillText(text, canvas.width / 2, canvas.height / 2);
      
      const texture = new THREE.CanvasTexture(canvas);
      const material = new THREE.SpriteMaterial({ map: texture });
      const sprite = new THREE.Sprite(material);
      sprite.position.copy(position);
      sprite.scale.set(5, 1.25, 1);
      
      return sprite;
    };
    
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
      const sprite = createTextSprite(text, new THREE.Vector3(-25, 15 - index * 2, -25), 0x00ff00);
      group.add(sprite);
    });
    
    return group;
  };

  // Helper function to create text sprites for the staircase framework
  const createTextSprite = (text: string, position: THREE.Vector3, color: number = 0xffffff) => {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) return new THREE.Group();
    
    canvas.width = 512;
    canvas.height = 128;
    context.fillStyle = '#000000';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = `#${color.toString(16).padStart(6, '0')}`;
    context.font = '24px Arial';
    context.textAlign = 'center';
    context.fillText(text, canvas.width / 2, canvas.height / 2);
    
    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(material);
    sprite.position.copy(position);
    sprite.scale.set(5, 1.25, 1);
    
    return sprite;
  };

  // ============================================================================
  // STAIRCASE FRAMEWORK - Reference points for easement connections
  // ============================================================================
  // This shows the full staircase geometry to understand where easements connect
  // Uses inner line's constant rise/run: 7⅜" rise over 10.5" run = 35.08° slope
  // SCISSOR STAIR: Both flights go UP at 35.08°, rotated 180° around main center
  const addStaircaseFramework = (scene: THREE.Scene, parameters: HandrailParameters, debugElements: THREE.Object3D[]) => {
    const stepRise = 7.375 / 7; // 7⅜" total rise divided by 7 steps
    const stepRun = 10.5 / 7;   // 10.5" total run divided by 7 steps
    const slopeAngle = Math.atan(stepRise / stepRun) * 180 / Math.PI; // Should be ~35.08°
    
    // Create staircase framework points
    const staircasePoints: THREE.Vector3[] = [];
    
    // FLIGHT 1: 7 steps UP from main center (going UP at 35.08°)
    for (let i = 1; i <= 7; i++) {
      const z = i * stepRun; // Positive Z = up the first flight
      const y = parameters.pitchBlock + (i * stepRise); // Rise from pitch block
      const x = 0; // Centered on main center
      
      staircasePoints.push(new THREE.Vector3(x, y, z));
      
      // Add step marker (green for first flight)
      const stepGeometry = new THREE.BoxGeometry(0.5, 0.1, 0.5);
      const stepMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00, transparent: true, opacity: 0.7 });
      const step = new THREE.Mesh(stepGeometry, stepMaterial);
      step.position.set(x, y - 0.05, z);
      scene.add(step);
      debugElements.push(step);
      
      // Add step label
      const stepLabel = createTextSprite(`Flight 1 Step ${i}`, new THREE.Vector3(x + 1, y, z), 0x00ff00);
      scene.add(stepLabel);
      debugElements.push(stepLabel);
    }
    
    // FLIGHT 2: 7 steps UP from main center (going UP at 35.08° but rotated 180°)
    // This is the scissor stair - same direction, opposite side
    for (let i = 1; i <= 7; i++) {
      const z = -i * stepRun; // Negative Z = up the second flight (opposite direction)
      const y = parameters.pitchBlock + (i * stepRise); // Same rise as first flight
      const x = 0; // Centered on main center
      
      staircasePoints.push(new THREE.Vector3(x, y, z));
      
      // Add step marker (blue for second flight)
      const stepGeometry = new THREE.BoxGeometry(0.5, 0.1, 0.5);
      const stepMaterial = new THREE.MeshBasicMaterial({ color: 0x0088ff, transparent: true, opacity: 0.7 });
      const step = new THREE.Mesh(stepGeometry, stepMaterial);
      step.position.set(x, y - 0.05, z);
      scene.add(step);
      debugElements.push(step);
      
      // Add step label
      const stepLabel = createTextSprite(`Flight 2 Step ${i}`, new THREE.Vector3(x - 1, y, z), 0x0088ff);
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
      `Scissor Stair Slope: ${slopeAngle.toFixed(2)}° (${stepRise.toFixed(3)}" rise / ${stepRun.toFixed(3)}" run)`, 
      new THREE.Vector3(0, parameters.pitchBlock + 8, 0), 
      0xffff00
    );
    scene.add(slopeLabel);
    debugElements.push(slopeLabel);
    
    // Add scissor stair explanation
    const explanationLabel = createTextSprite(
      `Scissor Stair: Both flights go UP at 35.08°\nRotated 180° around main center`, 
      new THREE.Vector3(0, parameters.pitchBlock + 10, 0), 
      0xffff00
    );
    scene.add(explanationLabel);
    debugElements.push(explanationLabel);
    
    // Add easement connection points - CORRECTED for scissor stair
    const addEasementConnectionPoints = () => {
      // Bottom easement connects to where Flight 2 meets the landing (step 7 of flight 2)
      const bottomConnectionZ = -7 * stepRun; // Flight 2, step 7
      const bottomConnectionY = parameters.pitchBlock + (7 * stepRise); // Same rise as step 7
      
      // Top easement connects to where Flight 1 meets the landing (step 7 of flight 1)  
      const topConnectionZ = 7 * stepRun; // Flight 1, step 7
      const topConnectionY = parameters.pitchBlock + (7 * stepRise); // Same rise as step 7
      
      // Create connection point markers
      const connectionGeometry = new THREE.SphereGeometry(0.3, 16, 16);
      
      // Bottom connection (blue - Flight 2)
      const bottomConnection = new THREE.Mesh(
        connectionGeometry, 
        new THREE.MeshBasicMaterial({ color: 0x0088ff })
      );
      bottomConnection.position.set(0, bottomConnectionY, bottomConnectionZ);
      scene.add(bottomConnection);
      debugElements.push(bottomConnection);
      
      // Top connection (green - Flight 1)
      const topConnection = new THREE.Mesh(
        connectionGeometry, 
        new THREE.MeshBasicMaterial({ color: 0x00ff00 })
      );
      topConnection.position.set(0, topConnectionY, topConnectionZ);
      scene.add(topConnection);
      debugElements.push(topConnection);
      
      // Add connection labels
      const bottomLabel = createTextSprite(
        `Bottom Easement\nConnects to Flight 2\n(Step 7)`, 
        new THREE.Vector3(2, bottomConnectionY, bottomConnectionZ), 
        0x0088ff
      );
      scene.add(bottomLabel);
      debugElements.push(bottomLabel);
      
      const topLabel = createTextSprite(
        `Top Easement\nConnects to Flight 1\n(Step 7)`, 
        new THREE.Vector3(2, topConnectionY, topConnectionZ), 
        0x00ff00
      );
      scene.add(topLabel);
      debugElements.push(topLabel);
      
      // Add target lines showing where easements should aim
      const addTargetLines = () => {
        // Bottom easement target line (from spiral end to Flight 2 connection)
        const bottomTargetGeometry = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(0, parameters.pitchBlock, 0), // Start at main center
          new THREE.Vector3(0, bottomConnectionY, bottomConnectionZ) // End at Flight 2, step 7
        ]);
        const bottomTargetMaterial = new THREE.LineBasicMaterial({ color: 0x0088ff, linewidth: 2 });
        const bottomTargetLine = new THREE.Line(bottomTargetGeometry, bottomTargetMaterial);
        scene.add(bottomTargetLine);
        debugElements.push(bottomTargetLine);
        
        // Top easement target line (from spiral end to Flight 1 connection)
        const topTargetGeometry = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(0, parameters.pitchBlock, 0), // Start at main center
          new THREE.Vector3(0, topConnectionY, topConnectionZ) // End at Flight 1, step 7
        ]);
        const topTargetMaterial = new THREE.LineBasicMaterial({ color: 0x00ff00, linewidth: 2 });
        const topTargetLine = new THREE.Line(topTargetGeometry, topTargetMaterial);
        scene.add(topTargetLine);
        debugElements.push(topTargetLine);
      };
      
      addTargetLines();
    };
    
    addEasementConnectionPoints();
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
      isDragging = true;
      previousPosition = { x: e.clientX, y: e.clientY };
      e.preventDefault();
    };
    
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      handleRotation(e.clientX, e.clientY);
      e.preventDefault();
    };
    
    const handleMouseUp = () => { isDragging = false; };
    
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

    // Add reference elements
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

    sceneRef.current = {
      scene,
      camera,
      renderer,
      handrailMesh: null,
      insideLineMesh: null,
      centerDots: [],
      debugElements: []
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