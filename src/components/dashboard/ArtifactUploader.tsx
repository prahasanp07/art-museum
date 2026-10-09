'use client';

import React, { useState, useRef, useTransition, useMemo } from 'react';
import { Artwork } from '@/lib/types';
import { createClient } from '@/lib/supabase/client';

export interface ArtifactUploaderProps {
  profileId: string;
  artworks: Artwork[];
  slotMap?: Record<string, string | null>;
  onArtworkUploaded: (artwork: Artwork) => void;
  onArtworkDeleted: (artworkId: string) => void;
}

/**
 * Lightweight client-side image compression using native HTML5 Canvas.
 * Automatically downscales dimensions exceeding maxBounds and compresses quality,
 * drastically reducing upload bandwidth while preserving museum visual fidelity.
 */
async function compressImage(
  file: File,
  maxWidth = 2560,
  maxHeight = 2560,
  quality = 0.85
): Promise<{ file: File; originalSize: number; compressedSize: number }> {
  const originalSize = file.size;

  // If already under 500KB, retain original binary
  if (file.size <= 500 * 1024) {
    return { file, originalSize, compressedSize: file.size };
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Maintain aspect ratio while restricting maximum bounds
        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve({ file, originalSize, compressedSize: originalSize });
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        const outputMime = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        canvas.toBlob(
          (blob) => {
            if (!blob || blob.size >= file.size) {
              resolve({ file, originalSize, compressedSize: originalSize });
              return;
            }
            const compressedFile = new File([blob], file.name, {
              type: outputMime,
              lastModified: Date.now(),
            });
            resolve({
              file: compressedFile,
              originalSize,
              compressedSize: blob.size,
            });
          },
          outputMime,
          quality
        );
      };
      img.onerror = () => resolve({ file, originalSize, compressedSize: originalSize });
    };
    reader.onerror = () => resolve({ file, originalSize, compressedSize: originalSize });
  });
}

function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function ArtifactUploader({
  profileId,
  artworks,
  slotMap = {},
  onArtworkUploaded,
  onArtworkDeleted,
}: ArtifactUploaderProps) {
  // Drag and Drop staging states
  const [isDragging, setIsDragging] = useState(false);
  const [stagedFile, setStagedFile] = useState<File | null>(null);
  const [stagedPreviewUrl, setStagedPreviewUrl] = useState<string | null>(null);
  const [compressionStats, setCompressionStats] = useState<{
    originalSize: number;
    compressedSize: number;
  } | null>(null);

  // Form metadata states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [externalLink, setExternalLink] = useState('');

  // UI status feedback
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [noticeMsg, setNoticeMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isPending, startTransition] = useTransition();

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper to validate whether a string is a standard UUID
  const isUUID = (str?: string | null): boolean =>
    Boolean(str && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str));

  // Supported file MIME types
  const validMimeTypes = ['image/png', 'image/jpeg', 'image/webp'];

  const handleStageFile = async (file: File) => {
    setErrorMsg(null);
    setNoticeMsg(null);
    setUploadStatus(null);

    if (!validMimeTypes.includes(file.type)) {
      setErrorMsg('Unsupported file type. Please upload a PNG, JPG, or WebP image.');
      return;
    }

    // Auto-populate title from filename if empty
    const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
    const formattedTitle = cleanName.charAt(0).toUpperCase() + cleanName.slice(1);
    setTitle(formattedTitle);

    // Create immediate local preview
    const localUrl = URL.createObjectURL(file);
    setStagedPreviewUrl(localUrl);

    // Run client-side compression check
    setUploadStatus('Optimizing image payload...');
    const result = await compressImage(file);
    setStagedFile(result.file);
    setCompressionStats({
      originalSize: result.originalSize,
      compressedSize: result.compressedSize,
    });
    setUploadStatus(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles && droppedFiles.length > 0) {
      await handleStageFile(droppedFiles[0]);
    }
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await handleStageFile(files[0]);
    }
  };

  const resetStagedFile = () => {
    if (stagedPreviewUrl) {
      URL.revokeObjectURL(stagedPreviewUrl);
    }
    setStagedFile(null);
    setStagedPreviewUrl(null);
    setCompressionStats(null);
    setTitle('');
    setDescription('');
    setExternalLink('');
    setErrorMsg(null);
    setUploadStatus(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stagedFile || !title.trim()) {
      setErrorMsg('Please provide a valid image and title.');
      return;
    }

    setErrorMsg(null);
    setNoticeMsg(null);
    setUploadStatus('Uploading artifact to storage...');

    startTransition(async () => {
      try {
        const supabase = createClient();

        // 1. Identify target user session
        const {
          data: { user },
        } = await supabase.auth.getUser();

        // Check if we have a valid Postgres UUID
        const validUserId = user?.id && isUUID(user.id) ? user.id : (isUUID(profileId) ? profileId : null);

        let finalStorageUrl = '';
        let uploadMethod: 'supabase' | 'local' = 'local';
        let notice: string | null = null;

        // 2. Try Supabase Storage IF authenticated with a valid user
        if (validUserId) {
          try {
            const sanitizedFileName = stagedFile.name.replace(/[^a-zA-Z0-9._-]/g, '_');
            const storagePath = `${validUserId}/${Date.now()}-${sanitizedFileName}`;

            const { data: uploadData, error: uploadError } = await supabase.storage
              .from('gallery-assets')
              .upload(storagePath, stagedFile, {
                cacheControl: '3600',
                upsert: true,
                contentType: stagedFile.type,
              });

            if (!uploadError && uploadData?.path) {
              const { data: urlData } = supabase.storage
                .from('gallery-assets')
                .getPublicUrl(uploadData.path);
              finalStorageUrl = urlData.publicUrl;
              uploadMethod = 'supabase';
            } else if (uploadError) {
              console.warn('Supabase storage upload returned error:', uploadError.message);
              if (
                uploadError.message?.includes('Bucket not found') ||
                uploadError.message?.includes('NoSuchBucket') ||
                (uploadError as any)?.statusCode === '404'
              ) {
                notice = "Bucket 'gallery-assets' does not exist in Supabase. Saved artifact to local server storage.";
              }
            }
          } catch (storageErr: any) {
            console.warn('Supabase storage upload failed:', storageErr);
          }
        }

        // 3. Fallback to local /api/upload endpoint if not uploaded to Supabase Storage
        if (!finalStorageUrl) {
          setUploadStatus('Saving artifact to local server storage...');
          try {
            const formData = new FormData();
            formData.append('file', stagedFile);
            const res = await fetch('/api/upload', {
              method: 'POST',
              body: formData,
            });
            const result = await res.json();
            if (result.success && result.url) {
              finalStorageUrl = result.url;
              uploadMethod = 'local';
            } else {
              throw new Error(result.error || 'Local storage upload failed');
            }
          } catch (localErr: any) {
            console.warn('Local API upload failed, falling back to data URL:', localErr);
            const dataUrl = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result as string);
              reader.onerror = reject;
              reader.readAsDataURL(stagedFile);
            });
            finalStorageUrl = dataUrl;
          }
        }

        setUploadStatus('Registering artwork in catalog...');

        // 4. Generate artwork record
        const artworkId =
          typeof crypto !== 'undefined' && crypto.randomUUID
            ? crypto.randomUUID()
            : `art-${Date.now()}`;

        const newArtwork: Artwork = {
          id: artworkId,
          profile_id: validUserId || profileId || 'p-01',
          title: title.trim(),
          description: description.trim() || null,
          storage_url: finalStorageUrl,
          external_link: externalLink.trim() || null,
          created_at: new Date().toISOString(),
        };

        let dbInserted = false;

        // 5. Database Insertion: ONLY execute if authenticated with a real valid UUID
        if (validUserId && user) {
          const { data: dbData, error: dbError } = await supabase
            .from('artworks')
            .insert({
              id: newArtwork.id,
              profile_id: validUserId,
              title: newArtwork.title,
              description: newArtwork.description,
              storage_url: newArtwork.storage_url,
              external_link: newArtwork.external_link,
            })
            .select()
            .single();

          if (dbError) {
            console.warn('Supabase database insert warning:', dbError.message);
          } else if (dbData) {
            dbInserted = true;
            onArtworkUploaded(dbData);
          }
        }

        if (!dbInserted) {
          // In demo mode or if Supabase DB insert didn't run, save into local state & storage
          onArtworkUploaded(newArtwork);
          if (!validUserId && !notice) {
            notice = 'Artifact saved to local demo catalog. Sign in to sync with Supabase cloud.';
          }
        }

        // Reset stage and show success notification
        resetStagedFile();
        if (notice) {
          setNoticeMsg(notice);
        }
        setUploadStatus(
          uploadMethod === 'supabase' && dbInserted
            ? 'Artifact successfully published to Supabase cloud!'
            : 'Artifact successfully saved to catalog!'
        );
        setTimeout(() => setUploadStatus(null), 5000);
      } catch (err: any) {
        setErrorMsg(err?.message || 'Failed to upload artwork. Please try again.');
        setUploadStatus(null);
      }
    });
  };

  const handleCopyUrl = (artwork: Artwork) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(artwork.storage_url);
      setCopiedId(artwork.id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const handleDeleteArtwork = async (artwork: Artwork) => {
    const confirmed = window.confirm(
      `Are you sure you want to remove "${artwork.title}" from your catalog?`
    );
    if (!confirmed) return;

    setDeletingId(artwork.id);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // Only attempt database delete if authenticated and artwork ID is a valid UUID
      if (user && isUUID(artwork.id)) {
        await supabase.from('artworks').delete().eq('id', artwork.id);

        if (artwork.storage_url.includes('gallery-assets')) {
          try {
            const urlParts = artwork.storage_url.split('/gallery-assets/');
            if (urlParts.length > 1) {
              const rawPath = decodeURIComponent(urlParts[1]);
              await supabase.storage.from('gallery-assets').remove([rawPath]);
            }
          } catch (storageErr) {
            console.warn('Storage removal cleanup notice:', storageErr);
          }
        }
      }

      onArtworkDeleted(artwork.id);
    } catch (err: any) {
      console.error('Failed to delete artwork:', err);
      onArtworkDeleted(artwork.id);
    } finally {
      setDeletingId(null);
    }
  };

  // Filter artworks by search query
  const filteredArtworks = useMemo(() => {
    if (!searchQuery.trim()) return artworks;
    const query = searchQuery.toLowerCase();
    return artworks.filter(
      (art) =>
        art.title.toLowerCase().includes(query) ||
        (art.description && art.description.toLowerCase().includes(query))
    );
  }, [artworks, searchQuery]);

  return (
    <div className="space-y-8">
      {/* 
        ========================================================================
        1. FILE UPLOAD & DRAG-AND-DROP PIPELINE ZONE
        ========================================================================
      */}
      <div className="bg-[#0b101d]/90 border border-white/10 rounded-2xl p-6 sm:p-7 backdrop-blur-xl shadow-2xl relative overflow-hidden">
        {/* Subtle Ambient Radial Glow */}
        <div
          className="pointer-events-none absolute -top-24 right-10 w-80 h-40 bg-cyan-500/10 blur-3xl rounded-full"
          aria-hidden="true"
        />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-5 border-b border-white/5">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-[10px] font-medium tracking-wide text-cyan-400 uppercase mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              <span>Asset Ingestion Pipeline</span>
            </div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              Artifact Uploader & Storage
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Drag and drop high-resolution artwork for automatic compression and instant 3D wall-mounting.
            </p>
          </div>

          {compressionStats && (
            <div className="bg-slate-900/80 border border-emerald-500/30 rounded-xl px-3.5 py-2 flex items-center gap-3 shrink-0">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <div className="text-[11px] font-mono">
                <span className="text-slate-400">Payload: </span>
                <span className="text-slate-300 line-through">
                  {formatBytes(compressionStats.originalSize)}
                </span>
                <span className="text-emerald-400 font-bold ml-1.5">
                  &rarr; {formatBytes(compressionStats.compressedSize)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Status and Error Alerts */}
        {errorMsg && (
          <div
            role="alert"
            className="mb-5 p-3.5 rounded-xl bg-red-950/50 border border-red-500/40 text-red-200 text-xs flex items-center justify-between gap-2"
          >
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-red-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>{errorMsg}</span>
            </div>
            <button onClick={() => setErrorMsg(null)} className="text-red-400 hover:text-white text-xs">
              &times;
            </button>
          </div>
        )}

        {noticeMsg && (
          <div
            role="status"
            className="mb-5 p-3.5 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-200 text-xs flex items-center justify-between gap-2 animate-fadeIn"
          >
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>{noticeMsg}</span>
            </div>
            <button onClick={() => setNoticeMsg(null)} className="text-amber-400 hover:text-white text-xs">
              &times;
            </button>
          </div>
        )}

        {uploadStatus && (
          <div
            role="status"
            className="mb-5 p-3.5 rounded-xl bg-cyan-950/50 border border-cyan-500/40 text-cyan-200 text-xs flex items-center gap-2.5 animate-fadeIn"
          >
            <svg className="w-4 h-4 text-cyan-400 animate-spin shrink-0" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span className="font-mono">{uploadStatus}</span>
          </div>
        )}

        {/* Upload Form or Drag Drop Target */}
        {!stagedFile ? (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all duration-200 group flex flex-col items-center justify-center ${isDragging
              ? 'border-cyan-400 bg-cyan-950/30 scale-[1.01] shadow-xl shadow-cyan-500/10'
              : 'border-slate-700/80 hover:border-cyan-500/50 hover:bg-slate-900/40 bg-[#070b15]/50'
              }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleFileInputChange}
              className="hidden"
            />

            <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 group-hover:scale-110 group-hover:border-cyan-400 group-hover:text-cyan-300 transition-all duration-300 shadow-lg shadow-cyan-500/10 mb-4">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
            </div>

            <h3 className="text-sm sm:text-base font-bold text-white mb-1 group-hover:text-cyan-300 transition-colors">
              {isDragging ? 'Drop Image Here to Ingest' : 'Click to Browse or Drag & Drop Artwork'}
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mb-3">
              Automatic asset optimization before uploading to storage. <br />
              Supports <strong className="text-slate-300">PNG, JPG, WebP</strong>.
            </p>
            <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500">
              <span className="px-2 py-0.5 rounded bg-slate-800 border border-white/5">PNG</span>
              <span className="px-2 py-0.5 rounded bg-slate-800 border border-white/5">JPG</span>
              <span className="px-2 py-0.5 rounded bg-slate-800 border border-white/5">WEBP</span>
              <span>&bull; Max 50MB Bucket Limit</span>
            </div>
          </div>
        ) : (
          /* Staged Artwork Metadata Form */
          <form onSubmit={handleUploadSubmit} className="space-y-5 animate-fadeIn">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* Preview Thumbnail */}
              <div className="md:col-span-4 flex flex-col items-center">
                <div className="w-full aspect-[4/3] rounded-xl overflow-hidden border border-cyan-500/30 bg-slate-950 relative shadow-xl">
                  {stagedPreviewUrl && (
                    <img
                      src={stagedPreviewUrl}
                      alt="Staged preview"
                      className="w-full h-full object-cover"
                    />
                  )}
                  <button
                    type="button"
                    onClick={resetStagedFile}
                    className="absolute top-2 right-2 bg-black/70 hover:bg-red-950 text-white hover:text-red-300 p-1.5 rounded-lg border border-white/10 transition-colors text-xs"
                    title="Remove selected file"
                  >
                    &times;
                  </button>
                </div>
                <div className="mt-2.5 text-center w-full">
                  <p className="text-[11px] font-mono text-slate-400 truncate">
                    {stagedFile.name}
                  </p>
                  {compressionStats && (
                    <p className="text-[10px] font-mono text-emerald-400 mt-0.5">
                      Ready: {formatBytes(compressionStats.compressedSize)}
                    </p>
                  )}
                </div>
              </div>

              {/* Form Metadata Fields */}
              <div className="md:col-span-8 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 tracking-wide uppercase mb-1.5">
                    Artwork Title <span className="text-cyan-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Celestial Nebula IV"
                    disabled={isPending}
                    className="w-full px-4 py-2.5 bg-[#070b15] border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all disabled:opacity-60"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 tracking-wide uppercase mb-1.5">
                    Curatorial Description
                  </label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Medium, materials, artistic narrative, and spatial lighting notes..."
                    disabled={isPending}
                    className="w-full px-4 py-2 bg-[#070b15] border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all disabled:opacity-60 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 tracking-wide uppercase mb-1.5">
                    External Link / Marketplace URL (Optional)
                  </label>
                  <input
                    type="url"
                    value={externalLink}
                    onChange={(e) => setExternalLink(e.target.value)}
                    placeholder="https://superrare.com/artwork/..."
                    disabled={isPending}
                    className="w-full px-4 py-2.5 bg-[#070b15] border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all disabled:opacity-60 text-xs"
                  />
                </div>

                {/* Form Buttons */}
                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={isPending || !title.trim()}
                    className="flex-1 py-3 px-5 rounded-xl bg-gradient-to-r from-cyan-500 via-indigo-600 to-cyan-500 hover:from-cyan-400 hover:via-indigo-500 hover:to-cyan-400 text-white text-xs font-semibold shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/35 transition-all duration-200 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isPending ? (
                      <>
                        <svg className="animate-spin w-4 h-4 text-white" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <span>Publishing to Gallery...</span>
                      </>
                    ) : (
                      <span>Upload & Register Artifact</span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={resetStagedFile}
                    disabled={isPending}
                    className="px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </form>
        )}
      </div>

      {/* 
        ========================================================================
        2. RESPONSIVE 2D ARTIFACTS GRID CARD LAYOUT
        ========================================================================
      */}
      <div className="bg-[#0b101d]/90 border border-white/10 rounded-2xl p-6 sm:p-7 backdrop-blur-xl shadow-2xl relative">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-5 border-b border-white/5">
          <div>
            <div className="flex items-center gap-3">
              <h3 className="text-base font-bold text-white tracking-tight">
                Curated Artifacts Catalog
              </h3>
              <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                {artworks.length} Artifacts
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              High-resolution textures served via edge CDN and mounted onto 3D corridor slots.
            </p>
          </div>

          {/* Quick Search Filter */}
          <div className="relative min-w-[240px]">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search catalog..."
              className="w-full pl-9 pr-4 py-2 bg-[#070b15] border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
            />
            <svg
              className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Empty Catalog State */}
        {filteredArtworks.length === 0 ? (
          <div className="py-16 text-center border border-dashed border-slate-800 rounded-2xl">
            <div className="w-12 h-12 rounded-full bg-slate-900 border border-white/10 flex items-center justify-center mx-auto text-slate-500 mb-3">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-sm font-bold text-slate-300">
              {searchQuery ? 'No matching artifacts found' : 'No artifacts in catalog yet'}
            </p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {searchQuery
                ? 'Try a different search keyword or clear the search filter.'
                : 'Upload your first digital painting or high-res photography using the dropzone above.'}
            </p>
          </div>
        ) : (
          /* Responsive 2D Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {filteredArtworks.map((art) => {
              // Check if currently mounted to any 3D slot
              const mountedSlotEntry = Object.entries(slotMap).find(
                ([, artId]) => artId === art.id
              );
              const isMounted = Boolean(mountedSlotEntry);
              const slotIdentifier = mountedSlotEntry ? mountedSlotEntry[0] : null;

              return (
                <div
                  key={art.id}
                  className="bg-[#070b15]/90 border border-white/10 rounded-2xl overflow-hidden hover:border-cyan-500/40 transition-all duration-300 group flex flex-col justify-between shadow-lg hover:shadow-cyan-500/10"
                >
                  <div>
                    {/* Artwork Image Container */}
                    <div className="aspect-[4/3] w-full overflow-hidden bg-slate-950 relative">
                      {art.storage_url ? (
                        <img
                          src={art.storage_url}
                          alt={art.title}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-700">
                          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}

                      {/* Mounted Status Badge */}
                      <div className="absolute top-2.5 left-2.5">
                        {isMounted ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-[10px] font-mono text-emerald-300 backdrop-blur-md shadow-md">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            <span>{slotIdentifier?.toUpperCase()}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-900/80 border border-white/10 text-[9px] font-mono text-slate-400 backdrop-blur-md">
                            Unmounted
                          </span>
                        )}
                      </div>

                      {/* Quick Copy Link Action Hover Pill */}
                      <button
                        type="button"
                        onClick={() => handleCopyUrl(art)}
                        aria-label="Copy asset URL"
                        className="absolute top-2.5 right-2.5 bg-black/60 hover:bg-black/80 text-white p-1.5 rounded-lg border border-white/10 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Copy direct asset URL"
                      >
                        {copiedId === art.id ? (
                          <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="w-3.5 h-3.5 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        )}
                      </button>
                    </div>

                    {/* Metadata Header & Description */}
                    <div className="p-4">
                      <h4 className="text-sm font-bold text-white truncate group-hover:text-cyan-300 transition-colors">
                        {art.title}
                      </h4>
                      <p className="text-xs text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                        {art.description || 'Curatorial piece with no description.'}
                      </p>

                      {art.external_link && (
                        <a
                          href={art.external_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[10px] font-mono text-cyan-400 hover:underline mt-2.5 truncate max-w-full"
                        >
                          <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                          <span className="truncate">{art.external_link}</span>
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Card Action Footer */}
                  <div className="p-3.5 pt-3 border-t border-white/5 flex items-center justify-between gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => handleCopyUrl(art)}
                      className="flex-1 py-1.5 px-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-white/5 text-slate-300 hover:text-white text-[11px] font-mono transition-colors flex items-center justify-center gap-1.5"
                    >
                      {copiedId === art.id ? (
                        <>
                          <svg className="w-3 h-3 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="text-emerald-400">Copied!</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-3 h-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          <span>Copy URL</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteArtwork(art)}
                      disabled={deletingId === art.id}
                      className="py-1.5 px-2.5 rounded-lg bg-slate-900 hover:bg-red-950/60 border border-white/5 hover:border-red-500/30 text-slate-400 hover:text-red-300 text-[11px] font-mono transition-colors flex items-center justify-center gap-1 disabled:opacity-50"
                      title="Delete artifact from catalog"
                    >
                      {deletingId === art.id ? (
                        <svg className="w-3 h-3 animate-spin text-red-400" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                      ) : (
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      )}
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default ArtifactUploader;
