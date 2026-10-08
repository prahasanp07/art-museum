'use client';

import Link from 'next/link';
import { Gallery } from '@/lib/types';

interface GallerySettingsProps {
  gallery: Gallery;
  username: string;
  onUpdate: (updated: Partial<Gallery>) => void;
}

const TEMPLATES = [
  { id: 'minimalist-cube-v1', name: 'Minimalist Cube V1', description: 'Dark obsidian finish with concrete gallery floors.' },
  { id: 'brutalist-atrium-v1', name: 'Brutalist Atrium V1', description: 'Monolithic concrete pillars with high industrial ceilings.' },
  { id: 'solarium-v1', name: 'Solarium Rotunda V1', description: 'Luminous ambient atmosphere with diffused skylights.' },
];

export function GallerySettings({
  gallery,
  username,
  onUpdate,
}: GallerySettingsProps) {
  return (
    <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-6 backdrop-blur-md">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-white/10">
        <div>
          <h3 className="text-base font-bold text-white">Spatial Environment Settings</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure 3D architecture, lighting, and tenant publication status
          </p>
        </div>

        {/* Live 3D Gallery Preview Button */}
        <Link
          href={`/${username}`}
          target="_blank"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white text-xs font-semibold shadow-lg shadow-cyan-500/20 transition-all hover:scale-[1.02]"
        >
          <span>Open Live 3D Viewport</span>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Template Selector */}
        <div>
          <label className="block text-xs font-mono text-slate-300 uppercase mb-2">
            Architectural Template
          </label>
          <div className="space-y-2.5">
            {TEMPLATES.map((tmpl) => (
              <label
                key={tmpl.id}
                onClick={() => onUpdate({ template_id: tmpl.id })}
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                  gallery.template_id === tmpl.id
                    ? 'bg-cyan-500/10 border-cyan-400/50 text-white'
                    : 'bg-slate-950/40 border-white/10 text-slate-400 hover:border-white/20'
                }`}
              >
                <input
                  type="radio"
                  name="template"
                  checked={gallery.template_id === tmpl.id}
                  onChange={() => onUpdate({ template_id: tmpl.id })}
                  className="mt-1 accent-cyan-400"
                />
                <div>
                  <div className="text-xs font-semibold text-white">{tmpl.name}</div>
                  <div className="text-[11px] text-slate-400">{tmpl.description}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Ambient Lighting & Status */}
        <div className="space-y-6">
          {/* Custom Ambient Light */}
          <div>
            <label className="block text-xs font-mono text-slate-300 uppercase mb-2">
              Custom Ambient Light Hex (04-database-schema)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={gallery.custom_ambient_light_hex || '#e2e8f0'}
                onChange={(e) =>
                  onUpdate({ custom_ambient_light_hex: e.target.value })
                }
                className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border border-white/20 p-1"
              />
              <input
                type="text"
                value={gallery.custom_ambient_light_hex || '#e2e8f0'}
                onChange={(e) =>
                  onUpdate({ custom_ambient_light_hex: e.target.value })
                }
                className="bg-slate-950 border border-white/10 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-cyan-400 w-32"
              />
              <span className="text-[11px] text-slate-500">
                Affects global scene atmosphere
              </span>
            </div>
          </div>

          {/* Publication Toggle */}
          <div className="pt-4 border-t border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-white">Publish Status</div>
                <div className="text-[11px] text-slate-400">
                  {gallery.is_published
                    ? 'Gallery is public and indexed in creator directory.'
                    : 'Gallery is in draft mode (only visible to owner).'}
                </div>
              </div>
              <button
                type="button"
                onClick={() => onUpdate({ is_published: !gallery.is_published })}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
                  gallery.is_published
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}
              >
                {gallery.is_published ? 'Published' : 'Draft'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GallerySettings;
