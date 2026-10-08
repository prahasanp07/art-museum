# 01 - Project Overview & Architecture

## Objective
Build a production-grade multi-tenant B2B SaaS platform where digital creators host personalized, 60fps 3D scrollytelling art galleries. 

## High-Level Architecture
- **2D Application Layer (Next.js App Router):** Manages user authentication, public creator directory (`/`), artist dashboard (`/dashboard`), and asset uploading.
- **3D Render Layer (React Three Fiber):** Self-contained WebGL viewport (`/[username]`) isolated from the primary React DOM tree to prevent layout thrashing.
- **Animation Engine (GSAP + Lenis):** Drives a unified requestAnimationFrame (RAF) loop interpolating camera spline coordinates based on vertical scroll depth.
- **Persistence & Storage (Supabase):** PostgreSQL with Row Level Security (RLS) for tenant isolation, Supabase Auth, and S3-compatible Edge Storage for 2D/3D assets.

## Directory Structure Contract
src/
├── app/
│   ├── (marketing)/page.tsx       # Landing page & creator directory
│   ├── [username]/page.tsx        # Public 3D gallery canvas
│   ├── dashboard/page.tsx         # Creator management portal
│   ├── layout.tsx                 # Root layout with SmoothScrollProvider
│   └── globals.css
├── components/
│   ├── 3d/                        # R3F Canvas, Scene, CameraController, GallerySlot
│   ├── dashboard/                 # Upload widgets, slot mapping forms
│   ├── providers/                 # SmoothScrollProvider (GSAP + Lenis tick sync)
│   └── ui/                        # Tailwind DOM overlays (placards, navigation)
├── store/                         # Zustand state management (transient updates)
└── lib/                           # Supabase browser/server client helpers