'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { Text } from '@react-three/drei';
import { Profile } from '@/lib/types';
import { useGalleryStore } from '@/store/useGalleryStore';

export interface CreatorPlaqueProps {
  profile?: Profile | null;
  display_name?: string | null;
  username?: string | null;
  bio?: string | null;
  avatar_url?: string | null;
  position?: [number, number, number];
  rotation?: [number, number, number];
  onClick?: () => void;
}

/**
 * Avatar circular display with CORS-resilient texture loading and monogram fallback.
 */
function AvatarDisplay({
  url,
  displayName,
}: {
  url?: string | null;
  displayName: string;
}) {
  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (!url) {
      setHasError(true);
      return;
    }

    let active = true;
    let currentTex: THREE.Texture | null = null;
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin('anonymous');

    const tryLoad = (src: string, isProxy = false) => {
      loader.load(
        src,
        (loaded) => {
          if (!active) {
            loaded.dispose();
            return;
          }
          loaded.colorSpace = THREE.SRGBColorSpace;
          loaded.generateMipmaps = true;
          currentTex = loaded;
          setTexture(loaded);
          setHasError(false);
        },
        undefined,
        () => {
          if (!active) return;
          // Retry through local proxy if external CORS fails
          if (
            !isProxy &&
            (src.startsWith('http://') || src.startsWith('https://')) &&
            !src.includes('/api/proxy-image')
          ) {
            tryLoad(`/api/proxy-image?url=${encodeURIComponent(src)}`, true);
            return;
          }
          setHasError(true);
        }
      );
    };

    tryLoad(url);

    return () => {
      active = false;
      if (currentTex) {
        currentTex.dispose();
      }
    };
  }, [url]);

  const monogram = useMemo(() => {
    return displayName
      .split(' ')
      .map((part) => part[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'EV';
  }, [displayName]);

  return (
    <group position={[0, 0.45, 0.035]}>
      {/* Outer subtle glowing cyan rim ring */}
      <mesh position={[0, 0, -0.002]}>
        <ringGeometry args={[0.39, 0.415, 64]} />
        <meshBasicMaterial color="#38bdf8" />
      </mesh>

      {/* Outer dark border backing */}
      <mesh position={[0, 0, -0.003]}>
        <circleGeometry args={[0.42, 64]} />
        <meshBasicMaterial color="#020617" />
      </mesh>

      {/* Avatar Image or Monogram */}
      {texture && !hasError ? (
        <mesh>
          <circleGeometry args={[0.39, 64]} />
          <meshBasicMaterial map={texture} toneMapped={true} />
        </mesh>
      ) : (
        <group>
          <mesh>
            <circleGeometry args={[0.39, 64]} />
            <meshBasicMaterial color="#1e293b" />
          </mesh>
          <Text
            position={[0, 0, 0.01]}
            fontSize={0.26}
            color="#38bdf8"
            anchorX="center"
            anchorY="middle"
          >
            {monogram}
          </Text>
        </group>
      )}
    </group>
  );
}

/**
 * 3D Entryway Bio Plaque Component:
 * - Positioned on the left entry corridor wall facing into the gallery center.
 * - Displays creator avatar, display name, handle, and curatorial biography.
 * - Interactive: hover cursor feedback and inspection click support.
 */
export function CreatorPlaque({
  profile,
  display_name,
  username,
  bio,
  avatar_url,
  position = [-4.88, 1.8, 2.5],
  rotation = [0, Math.PI / 2, 0],
  onClick,
}: CreatorPlaqueProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  const displayName = display_name || profile?.display_name || 'Elena Vance';
  const rawUsername = username || profile?.username || 'pragana-innovations';
  const usernameHandle = rawUsername.startsWith('@') ? rawUsername : `@${rawUsername}`;
  const bioText =
    bio ||
    profile?.bio ||
    'Generative light artist & web designer exploring spatial computing.';
  const avatarSrc = avatar_url !== undefined ? avatar_url : (profile?.avatar_url ?? null);

  const handleClick = (e: any) => {
    e.stopPropagation();

    if (onClick) {
      onClick();
      return;
    }

    // Dynamically calculate surface normal based on Y rotation
    const rotY = rotation[1] || 0;
    const normalX = Math.sin(rotY);
    const normalZ = Math.cos(rotY);
    const normal: [number, number, number] = [
      Math.abs(normalX) < 0.001 ? 0 : normalX,
      0,
      Math.abs(normalZ) < 0.001 ? 0 : normalZ,
    ];

    const normalOffset = 2.6;
    const targetPosition: [number, number, number] = [
      position[0] + normal[0] * normalOffset,
      position[1],
      position[2] + normal[2] * normalOffset,
    ];

    // Release pointer lock if engaged
    if (typeof document !== 'undefined' && document.pointerLockElement) {
      document.exitPointerLock();
      useGalleryStore.getState().setIsPointerLocked(false);
    }

    useGalleryStore.getState().enterInspection({
      artworkId: 'entry-creator-plaque',
      targetPosition,
      targetLookAt: position,
      position,
      normal,
      distance: normalOffset,
      cameraOffset: [normal[0] * normalOffset, 0, normal[2] * normalOffset],
    });
  };

  return (
    <group
      ref={groupRef}
      position={position}
      rotation={rotation}
      onClick={handleClick}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        if (typeof document !== 'undefined') {
          document.body.style.cursor = 'pointer';
        }
      }}
      onPointerOut={() => {
        setHovered(false);
        if (typeof document !== 'undefined') {
          document.body.style.cursor = 'default';
        }
      }}
    >
      {/* 
        1. Outer Molding Bevel / Frame:
        Thin matte border providing architectural contrast against the gallery wall
      */}
      <mesh position={[0, 0, 0.005]}>
        <planeGeometry args={[2.52, 2.32]} />
        <meshBasicMaterial color={hovered ? '#38bdf8' : '#1e293b'} />
      </mesh>

      {/* 
        2. Main Backdrop Panel:
        Dark matte panel acting as the museum introductory exhibition board
      */}
      <mesh position={[0, 0, 0.01]}>
        <planeGeometry args={[2.48, 2.28]} />
        <meshBasicMaterial
          color="#0c0d12"
          transparent={true}
          opacity={0.92}
        />
      </mesh>

      {/* 
        3. Subtle Inner Accent Line
      */}
      <mesh position={[0, 0.88, 0.015]}>
        <planeGeometry args={[2.0, 0.005]} />
        <meshBasicMaterial color={hovered ? '#38bdf8' : '#334155'} />
      </mesh>

      {/* 
        4. Header Label: Curatorial Institution Title
      */}
      <Text
        position={[0, 0.98, 0.02]}
        fontSize={0.075}
        color="#94a3b8"
        anchorX="center"
        anchorY="middle"
        letterSpacing={0.16}
      >
        EXHIBITION ATELIER & CURATOR
      </Text>

      {/* 
        5. Creator Avatar (~0.8m diameter)
      */}
      <AvatarDisplay url={avatarSrc} displayName={displayName} />

      {/* 
        6. Display Name (Bold, white, font size ~0.22)
      */}
      <Text
        position={[0, -0.12, 0.03]}
        fontSize={0.22}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        maxWidth={2.2}
      >
        {displayName}
      </Text>

      {/* 
        7. Username Handle (Font size ~0.13, sky blue / muted)
      */}
      <Text
        position={[0, -0.32, 0.03]}
        fontSize={0.13}
        color="#38bdf8"
        anchorX="center"
        anchorY="middle"
        letterSpacing={0.04}
      >
        {usernameHandle}
      </Text>

      {/* 
        8. Curatorial Bio (Font size ~0.10, slate/light gray, maxWidth 2.2, line height 1.4)
      */}
      <Text
        position={[0, -0.58, 0.03]}
        fontSize={0.10}
        color="#cbd5e1"
        anchorX="center"
        anchorY="middle"
        maxWidth={2.2}
        lineHeight={1.4}
        textAlign="center"
      >
        {bioText}
      </Text>

      {/* 
        9. Interactive Action Prompt
      */}
      <group position={[0, -0.92, 0.02]}>
        <mesh position={[0, 0, -0.005]}>
          <planeGeometry args={[1.5, 0.16]} />
          <meshBasicMaterial
            color={hovered ? '#0e7490' : '#1e293b'}
            transparent={true}
            opacity={0.6}
          />
        </mesh>
        <Text
          fontSize={0.065}
          color={hovered ? '#67e8f9' : '#94a3b8'}
          anchorX="center"
          anchorY="middle"
          letterSpacing={0.1}
        >
          {hovered ? 'CLICK TO FOCUS CURATOR BIO' : 'CURATORIAL BIOGRAPHY'}
        </Text>
      </group>
    </group>
  );
}

export default CreatorPlaque;
