'use client';

// =============================================================================
// CivicConnect TN — Media Uploader Component (Photos & Video)
// =============================================================================

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { Camera, UploadCloud, X, AlertCircle, Film } from 'lucide-react';

export interface UploadedMediaItem {
  url: string;
  storage_path?: string;
  media_type: 'image' | 'video';
  file_name?: string;
}

interface MediaUploaderProps {
  media: UploadedMediaItem[];
  onChange: (items: UploadedMediaItem[]) => void;
  maxPhotos?: number;
  maxVideos?: number;
  required?: boolean;
}

export function MediaUploader({
  media,
  onChange,
  maxPhotos = 4,
  maxVideos = 1,
  required = false,
}: MediaUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const photosCount = media.filter((m) => m.media_type === 'image').length;
  const videosCount = media.filter((m) => m.media_type === 'video').length;

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError(null);
    setIsUploading(true);

    const newMediaItems: UploadedMediaItem[] = [...media];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const isVideo = file.type.startsWith('video/');
      const isImage = file.type.startsWith('image/');

      if (!isImage && !isVideo) {
        setError('Unsupported file type. Please choose an image or video.');
        continue;
      }

      if (isImage && photosCount + newMediaItems.filter((m) => m.media_type === 'image').length - media.filter((m) => m.media_type === 'image').length >= maxPhotos) {
        setError(`Maximum of ${maxPhotos} photos allowed.`);
        continue;
      }

      if (isVideo && videosCount + newMediaItems.filter((m) => m.media_type === 'video').length - media.filter((m) => m.media_type === 'video').length >= maxVideos) {
        setError(`Maximum of ${maxVideos} video allowed.`);
        continue;
      }

      try {
        const formData = new FormData();
        formData.append('file', file);

        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        const data = await res.json();
        if (res.ok && data.success) {
          newMediaItems.push({
            url: data.data.url,
            storage_path: data.data.storage_path,
            media_type: data.data.media_type,
            file_name: data.data.file_name,
          });
        } else {
          setError(data.error || 'Failed to upload media file.');
        }
      } catch (err) {
        console.error('Media upload error:', err);
        setError('An error occurred during file upload.');
      }
    }

    onChange(newMediaItems);
    setIsUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  const removeMedia = (index: number) => {
    const updated = media.filter((_, idx) => idx !== index);
    onChange(updated);
  };

  return (
    <div className={`space-y-4 p-4 sm:p-5 rounded-2xl bg-slate-900/70 border ${
      required && media.length === 0 ? 'border-amber-800/80 ring-1 ring-amber-500/20' : 'border-slate-800'
    }`}>
      <div className="flex items-start justify-between flex-wrap gap-2">
        <div>
          <label className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <Camera className="w-4 h-4 text-emerald-400" />
            <span>Photo & Video Evidence</span>
            {required ? (
              <span className="text-[10px] font-bold text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-800/60">
                * Mandatory for Web
              </span>
            ) : (
              <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                Optional
              </span>
            )}
          </label>
          <p className="text-xs text-slate-400 mt-0.5">
            {required
              ? `Upload at least 1 clear photo of the issue (Max ${maxPhotos} photos, ${maxVideos} video)`
              : `Upload clear photos or a short video of the issue (Max ${maxPhotos} photos, ${maxVideos} video)`}
          </p>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,video/*"
        onChange={(e) => handleFileUpload(e.target.files)}
        className="hidden"
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={(e) => handleFileUpload(e.target.files)}
        className="hidden"
      />

      {/* Upload Action Triggers */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => cameraInputRef.current?.click()}
          disabled={isUploading || photosCount >= maxPhotos}
          className="flex items-center justify-center gap-2.5 p-3 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/40 text-xs font-medium text-slate-200 transition-all cursor-pointer disabled:opacity-50"
        >
          <Camera className="w-4 h-4 text-emerald-400" />
          <span>Take Photo (Camera)</span>
        </button>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading || (photosCount >= maxPhotos && videosCount >= maxVideos)}
          className="flex items-center justify-center gap-2.5 p-3 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/40 text-xs font-medium text-slate-200 transition-all cursor-pointer disabled:opacity-50"
        >
          <UploadCloud className="w-4 h-4 text-teal-400" />
          <span>Choose from Gallery / Files</span>
        </button>
      </div>

      {/* Uploading progress indicator */}
      {isUploading && (
        <div className="flex items-center justify-center gap-2 py-3 text-xs text-emerald-400 bg-emerald-950/30 rounded-xl border border-emerald-800/40">
          <div className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
          <span>Uploading and optimizing media...</span>
        </div>
      )}

      {/* Uploaded Thumbnails Grid */}
      {media.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          {media.map((item, idx) => (
            <div
              key={idx}
              className="relative rounded-xl overflow-hidden bg-slate-950 border border-slate-800 aspect-square group shadow-md"
            >
              {item.media_type === 'video' ? (
                <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950 text-slate-400">
                  <Film className="w-8 h-8 text-indigo-400 mb-1" />
                  <span className="text-[10px] text-slate-400 font-medium">Video Attached</span>
                </div>
              ) : (
                <div className="w-full h-full relative">
                  <Image
                    src={item.url}
                    alt={`Upload ${idx + 1}`}
                    fill
                    sizes="(max-width: 640px) 50vw, 25vw"
                    className="object-cover"
                    unoptimized
                  />
                </div>
              )}

              <button
                type="button"
                onClick={() => removeMedia(idx)}
                className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-slate-950/80 hover:bg-rose-600 text-white flex items-center justify-center shadow transition-all cursor-pointer z-10"
                title="Remove"
              >
                <X className="w-3.5 h-3.5" />
              </button>

              <div className="absolute bottom-1.5 left-1.5 right-1.5 bg-slate-950/85 backdrop-blur-xs rounded-md px-1.5 py-0.5 text-[9px] font-medium text-emerald-400 flex items-center gap-1 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Evidence Attached</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
