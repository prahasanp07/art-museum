# 03 - Camera & Scrollytelling Specifications

## Execution Model
The gallery camera moves along a parameterized 3D path governed by normalized progress $t \in [0, 1]$.

1. **Curves:** Dual `CatmullRomCurve3` splines:
   - `cameraCurve`: Camera translation path through gallery corridors.
   - `lookAtCurve`: Point-of-interest focus points directing the camera towards active artworks.
2. **RAF Synchronization:**
   - Lenis must be initialized with `autoRaf: false`.
   - GSAP's ticker must drive the Lenis animation frame directly.
   - Lag smoothing in GSAP must be disabled (`gsap.ticker.lagSmoothing(0)`) to eliminate camera positional snapping.
3. **Scroll Bridge:**
   - A hidden container (`h-[500vh]`) provides the physical scrollbar track.
   - GSAP `ScrollTrigger` listens to this track and updates `scrollProgress` in `useGalleryStore` without triggering DOM re-renders.
4. **Inspection Mode:**
   - Clicking an artwork switches `isInspecting: true` in Zustand.
   - Camera position lerps directly to the artwork's surface normal offset ($1.8\text{m}$ distance) and pauses spline advancement until dismissed.