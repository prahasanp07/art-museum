'use client';

import React, { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import gsap from 'gsap';
import {
  createGalleryCurve,
  DEFAULT_CAMERA_WAYPOINTS,
} from './CameraController';

export interface WayfindingPathProps {
  /**
   * CatmullRomCurve3 spline path. Defaults to scrollytelling cameraCurve.
   */
  curve?: THREE.CatmullRomCurve3;
  /**
   * Number of equidistant points to sample along the curve. Default: 20.
   */
  pointCount?: number;
  /**
   * Arrow glow color. Default: '#38bdf8' (cyan-400).
   */
  color?: string;
  /**
   * Dimensions of each arrow plane [width, length]. Default: [0.55, 0.55].
   */
  arrowSize?: [number, number];
  /**
   * Vertical floor offset to avoid Z-fighting. Mandated: 0.01m.
   */
  yOffset?: number;
}

/**
 * Creates a high-contrast custom SVG chevron arrow alpha map texture.
 * Embedded directly as a data URI / Canvas for 100% reliable zero-latency rendering.
 */
export function createArrowAlphaMap(): THREE.CanvasTexture {
  if (typeof window === 'undefined') {
    return new THREE.CanvasTexture({} as HTMLCanvasElement);
  }

  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    ctx.clearRect(0, 0, 128, 128);

    // Primary Forward Curatorial Chevron
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(64, 22);
    ctx.lineTo(108, 66);
    ctx.lineTo(94, 80);
    ctx.lineTo(64, 50);
    ctx.lineTo(34, 80);
    ctx.lineTo(20, 66);
    ctx.closePath();
    ctx.fill();

    // Secondary Soft Echo Chevron (accentuates directional flow)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.beginPath();
    ctx.moveTo(64, 62);
    ctx.lineTo(98, 96);
    ctx.lineTo(88, 106);
    ctx.lineTo(64, 82);
    ctx.lineTo(40, 106);
    ctx.lineTo(30, 96);
    ctx.closePath();
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.generateMipmaps = true;
  return texture;
}

/**
 * WayfindingPath:
 * 1. Imports cameraCurve used for scrollytelling navigation.
 * 2. Samples 20 equidistant points along the curve.
 * 3. Spawns a small PlaneGeometry flat on the floor (Y = 0.01) utilizing a basic material with an SVG arrow alpha map.
 * 4. Attaches a gsap.to loop in a useEffect creating a staggered, continuous opacity pulse traveling through the arrows.
 */
export function WayfindingPath({
  curve,
  pointCount = 20,
  color = '#38bdf8',
  arrowSize = [0.55, 0.55],
  yOffset = 0.01,
}: WayfindingPathProps) {
  const materialsRef = useRef<(THREE.MeshBasicMaterial | null)[]>([]);

  // 1. Resolve camera navigation spline (defaults to default scrollytelling curve)
  const activeCurve = useMemo(() => {
    return curve || createGalleryCurve(DEFAULT_CAMERA_WAYPOINTS);
  }, [curve]);

  // 2. Generate custom SVG chevron arrow alpha map
  const alphaMap = useMemo(() => createArrowAlphaMap(), []);

  // Cleanup texture on unmount
  useEffect(() => {
    return () => {
      alphaMap.dispose();
    };
  }, [alphaMap]);

  // 3. Sample exactly 20 equidistant points along the curve using arc-length parameterization
  const waypoints = useMemo(() => {
    const points: Array<{
      position: [number, number, number];
      rotation: [number, number, number];
    }> = [];

    for (let i = 0; i < pointCount; i++) {
      const t = i / (pointCount - 1);
      const pos = activeCurve.getPointAt(t);
      const tangent = activeCurve.getTangentAt(t).normalize();

      // Tangent angle in the XZ plane for orienting the arrow forward along the path
      const rotationZ = Math.atan2(tangent.x, -tangent.z);

      points.push({
        position: [pos.x, yOffset, pos.z],
        rotation: [-Math.PI / 2, 0, rotationZ],
      });
    }

    return points;
  }, [activeCurve, pointCount, yOffset]);

  // 4. Staggered, continuous opacity pulse traveling through the array of arrows
  useEffect(() => {
    const materials = materialsRef.current.filter(Boolean) as THREE.MeshBasicMaterial[];
    if (materials.length === 0) return;

    // Set initial quiescent opacity
    materials.forEach((mat) => {
      mat.opacity = 0.12;
    });

    // Continuous wave traveling forward along the sequence of arrows
    const tween = gsap.to(materials, {
      opacity: 0.85,
      duration: 0.9,
      stagger: {
        each: 0.08,
        repeat: -1,
        yoyo: true,
      },
      ease: 'power2.inOut',
    });

    return () => {
      tween.kill();
    };
  }, [waypoints]);

  return (
    <group name="wayfinding-path">
      {waypoints.map((point, index) => (
        <mesh
          key={`waypoint-${index}`}
          position={point.position}
          rotation={point.rotation}
          castShadow={false}
          receiveShadow={false}
        >
          <planeGeometry args={arrowSize} />
          <meshBasicMaterial
            ref={(el) => {
              materialsRef.current[index] = el;
            }}
            color={color}
            transparent={true}
            opacity={0.12}
            alphaMap={alphaMap}
            depthWrite={false}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  );
}

export default WayfindingPath;
