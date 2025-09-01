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
  } | null>(null);

  const updateVisualization = useCallback(() => {
    if (!sceneRef.current) return;

    const { scene, handrailMesh, insideLineMesh, centerDots } = sceneRef.current;
    
    // Remove existing meshes
    if (handrailMesh) scene.remove(handrailMesh);
    if (insideLineMesh) scene.remove(insideLineMesh);
    centerDots.forEach(dot => scene.remove(dot));
    sceneRef.current.centerDots = [];
    
    const outerRadius = 8;
    const innerRadius = 4.5;
    
    // Add center dots
    const dotGeometry = new THREE.SphereGeometry(0.4, 16, 16);
    
    // Main center (blue) at origin
    const mainDot = new THREE.Mesh(dotGeometry, new THREE.MeshLambertMaterial({ color: 0x3b82f6 }));
    mainDot.position.set(0, 4, 0);
    scene.add(mainDot);
    sceneRef.current.centerDots.push(mainDot);
    
    // Bottom center (orange) - at the start of the spiral where over-ease begins
    const bottomStartAngle = (parameters.bottomLength / parameters.totalSegments) * parameters.totalDegrees * Math.PI / 180;
    const bottomDot = new THREE.Mesh(dotGeometry, new THREE.MeshLambertMaterial({ color: 0xf59e0b }));
    bottomDot.position.set(
      outerRadius * Math.cos(bottomStartAngle), 
      2, 
      outerRadius * Math.sin(bottomStartAngle) - parameters.bottomOffset
    );
    scene.add(bottomDot);
    sceneRef.current.centerDots.push(bottomDot);
    
    // Top center (red) - at the end of the spiral where up-ease begins
    const topEndAngle = ((parameters.totalSegments - parameters.topLength) / parameters.totalSegments) * parameters.totalDegrees * Math.PI / 180;
    const topDot = new THREE.Mesh(dotGeometry, new THREE.MeshLambertMaterial({ color: 0xef4444 }));
    topDot.position.set(
      outerRadius * Math.cos(topEndAngle), 
      6, 
      outerRadius * Math.sin(topEndAngle) + parameters.topOffset
    );
    scene.add(topDot);
    sceneRef.current.centerDots.push(topDot);
    
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
      
      let x: number, z: number;
      let centerX = 0; // Initialize centerX
      let centerZ = 0; // Initialize centerZ
      let effectiveRadius = 0; // Initialize effectiveRadius
      
      if (segmentPosition <= parameters.bottomLength) {
        // Bottom over-ease: straight rail going down stairs at 35.08° angle
        // Start at spiral position and transition to straight vertical rail
        const easeT = segmentPosition / parameters.bottomLength;
        
        // Calculate the spiral start position (where over-ease begins)
        const spiralStartAngle = (parameters.bottomLength / parameters.totalSegments) * parameters.totalDegrees * Math.PI / 180;
        const spiralStartX = outerRadius * Math.cos(spiralStartAngle);
        const spiralStartZ = outerRadius * Math.sin(spiralStartAngle);
        
        // Calculate the straight rail end position (straight down at 35.08°)
        // The straight rail goes directly down from the spiral start
        const straightEndX = spiralStartX; // Same X position
        const straightEndZ = spiralStartZ; // Same Z position (no lateral movement)
        
        // Linear interpolation from spiral to straight rail
        x = spiralStartX + (straightEndX - spiralStartX) * easeT;
        z = spiralStartZ + (straightEndZ - spiralStartZ) * easeT;
        
      } else if (segmentPosition >= parameters.totalSegments - parameters.topLength) {
        // Top up-ease: straight rail going up stairs at 35.08° angle
        // Start at spiral position and transition to straight vertical rail
        const easeT = (segmentPosition - (parameters.totalSegments - parameters.topLength)) / parameters.topLength;
        
        // Calculate the spiral end position (where up-ease begins)
        const spiralEndAngle = ((parameters.totalSegments - parameters.topLength) / parameters.totalSegments) * parameters.totalDegrees * Math.PI / 180;
        const spiralEndX = outerRadius * Math.cos(spiralEndAngle);
        const spiralEndZ = outerRadius * Math.sin(spiralEndAngle);
        
        // Calculate the straight rail end position (straight up at 35.08°)
        // The straight rail goes directly up from the spiral end
        const straightEndX = spiralEndX; // Same X position
        const straightEndZ = spiralEndZ; // Same Z position (no lateral movement)
        
        // Linear interpolation from spiral to straight rail
        x = spiralEndX + (straightEndX - spiralEndX) * easeT;
        z = spiralEndZ + (straightEndZ - spiralEndZ) * easeT;
        
      } else {
        // Main spiral: use main center
        centerX = 0;
        centerZ = 0;
        effectiveRadius = outerRadius;
        
        // Calculate position from main center
        x = centerX + effectiveRadius * Math.cos(angle);
        z = centerZ + effectiveRadius * Math.sin(angle);
      }
      
      const y = rise;
      outerPoints.push(new THREE.Vector3(x, y, z));
    }
    
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
        // Bottom over-ease: straight rail going down stairs at 35.08° angle
        // Start at spiral position and transition to straight vertical rail
        const easeT = segmentPosition / parameters.bottomLength;
        
        // Calculate the spiral start position (where over-ease begins)
        const spiralStartAngle = (parameters.bottomLength / parameters.totalSegments) * parameters.totalDegrees * Math.PI / 180;
        const spiralStartX = insideRadius * Math.cos(spiralStartAngle);
        const spiralStartZ = insideRadius * Math.sin(spiralStartAngle);
        
        // Calculate the straight rail end position (straight down at 35.08°)
        // The straight rail goes directly down from the spiral start
        const straightEndX = spiralStartX; // Same X position
        const straightEndZ = spiralStartZ; // Same Z position (no lateral movement)
        
        // Linear interpolation from spiral to straight rail
        x = spiralStartX + (straightEndX - spiralStartX) * easeT;
        z = spiralStartZ + (straightEndZ - spiralStartZ) * easeT;
        
      } else if (segmentPosition >= parameters.totalSegments - parameters.topLength) {
        // Top up-ease: straight rail going up stairs at 35.08° angle
        // Start at spiral position and transition to straight vertical rail
        const easeT = (segmentPosition - (parameters.totalSegments - parameters.topLength)) / parameters.topLength;
        
        // Calculate the spiral end position (where up-ease begins)
        const spiralEndAngle = ((parameters.totalSegments - parameters.topLength) / parameters.totalSegments) * parameters.totalDegrees * Math.PI / 180;
        const spiralEndX = insideRadius * Math.cos(spiralEndAngle);
        const spiralEndZ = insideRadius * Math.sin(spiralEndAngle);
        
        // Calculate the straight rail end position (straight up at 35.08°)
        // The straight rail goes directly up from the spiral end
        const straightEndX = spiralEndX; // Same X position
        const straightEndZ = spiralEndZ; // Same Z position (no lateral movement)
        
        // Linear interpolation from spiral to straight rail
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
  }, [parameters, manualRiseData, calculatedRiseData]);

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
      centerDots: []
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