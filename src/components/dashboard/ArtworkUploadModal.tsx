'use client';

import { useRef, useState } from 'react';
import { Artwork } from '@/lib/types';

interface ArtworkUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (artwork: Artwork) => void;
}

export function ArtworkUploadModal({
  isOpen,
  onClose,
  onUpload,
}: ArtworkUploadModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [storageUrl, setStorageUrl] = useState('');
  const [externalLink, setExternalLink] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!title) {
      // Auto-populate title from filename without extension
      const name = file.name.replace(/\.[^/.]+$/, '');
      setTitle(name.charAt(0).toUpperCase() + name.slice(1));
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        setStorageUrl(event.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !storageUrl) return;

    setIsSubmitting(true);
    const newArt: Artwork = {
      id: `art-${Date.now()}`,
      profile_id: 'p-01',
      title,
      description: description || null,
      storage_url: storageUrl,
      external_link: externalLink || null,
      created_at: new Date().toISOString(),
    };

    onUpload(newArt);
    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 max-w-lg w-full text-white shadow-2xl relative">
        <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-5">
          <h3 className="text-lg font-bold">Upload New Artwork</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors text-sm"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-mono text-slate-300 uppercase mb-1">
              Artwork Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Some old Warship"
              className="w-full bg-slate-950 border border-white/10 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-cyan-400"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-300 uppercase mb-1">
              Image File Upload or Remote URL *
            </label>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 border border-white/10 rounded-lg text-xs font-mono text-cyan-300 transition-colors flex items-center gap-1.5"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Choose Image File...
                </button>
                <span className="text-[11px] text-slate-400">or paste direct image URL below</span>
              </div>

              <input
                type="text"
                required
                value={storageUrl}
                onChange={(e) => setStorageUrl(e.target.value)}
                placeholder="https://images.unsplash.com/... or data:image/..."
                className="w-full bg-slate-950 border border-white/10 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-cyan-400 font-mono text-xs"
              />
            </div>

            {/* Thumbnail preview */}
            {storageUrl && (
              <div className="mt-2.5 h-24 w-full rounded-lg overflow-hidden border border-white/10 bg-slate-950 relative flex items-center justify-center">
                <img
                  src={storageUrl}
                  alt="Preview"
                  className="h-full w-full object-cover"
                  onError={() => {}}
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-300 uppercase mb-1">
              Curatorial Description
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Curator notes, technique, resolution and medium..."
              className="w-full bg-slate-950 border border-white/10 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-cyan-400"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-300 uppercase mb-1">
              External Marketplace Link (Optional)
            </label>
            <input
              type="url"
              value={externalLink}
              onChange={(e) => setExternalLink(e.target.value)}
              placeholder="https://superrare.com/..."
              className="w-full bg-slate-950 border border-white/10 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-cyan-400 font-mono text-xs"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !storageUrl}
              className="px-5 py-2 text-xs font-semibold rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-colors shadow-lg shadow-cyan-500/20 disabled:opacity-50"
            >
              Add to Catalog
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ArtworkUploadModal;
