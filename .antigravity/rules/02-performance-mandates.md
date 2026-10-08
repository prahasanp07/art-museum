# 02 - WebGL & Rendering Performance Mandates

The agent must strictly comply with the following constraints when generating or refactoring 3D code:

## 1. Draw Call Budget
- Total draw calls per scene must remain under 200 on mobile viewports and under 500 on desktop.
- Identical structural items (frames, stanchions, track lights) must utilize `<instancedMesh>` via `@react-three/drei` or native Three.js. Do not map separate `<mesh>` components for repeated geometries.

## 2. Lighting & Shading
- Zero dynamic shadow mapping: do not declare `castShadow` or `receiveShadow` on meshes.
- All architectural environments (GLB files) must rely on baked lightmaps and ambient occlusion maps.
- Use `MeshBasicMaterial` for baked architectural geometry and `MeshStandardMaterial` with minimal roughness maps only for framed artwork planes.

## 3. State Decoupling
- Never invoke standard React `useState` or consume `React.useContext` inside an R3F `useFrame` hook.
- All camera coordinates, scroll progress, and frame-rate-critical metrics must be read transiently from the Zustand store via `useGalleryStore.getState()`.

## 4. Texture Pipeline
- Artwork textures bound to 3D planes must be lazy-loaded using `<Suspense>`.
- Unmounted artwork textures and geometries must be explicitly cleared using `texture.dispose()` and `geometry.dispose()` to prevent WebGL memory leaks during multi-room navigation.