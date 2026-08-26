import React from "react";
import { ImagePlus, Video, X } from "lucide-react";

interface PhotosSectionProps {
  existingImages: string[];
  imagePreviews: string[];
  onAddImages: (files: File[]) => void;
  onRemoveExisting: (index: number) => void;
  onRemoveNew: (index: number) => void;
  maxImages?: number;

  videoPreview: string;
  existingVideoUrl: string;
  onAddVideo: (file: File) => void;
  onRemoveVideo: () => void;
}

export default function PhotosSection({
  existingImages,
  imagePreviews,
  onAddImages,
  onRemoveExisting,
  onRemoveNew,
  maxImages = 8,
  videoPreview,
  existingVideoUrl,
  onAddVideo,
  onRemoveVideo,
}: PhotosSectionProps) {
  const totalImages = existingImages.length + imagePreviews.length;

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) onAddImages(files);
    e.target.value = "";
  };

  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
          Photos ({totalImages}/{maxImages}) *
        </p>
        {totalImages > 0 ? (
          <div className="grid grid-cols-4 gap-2">
            {existingImages.map((url, i) => (
              <div key={`e-${i}`} className="relative aspect-square">
                <img src={url} alt="" className="w-full h-full object-cover rounded-xl" />
                <button
                  type="button"
                  onClick={() => onRemoveExisting(i)}
                  className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-destructive flex items-center justify-center"
                >
                  <X className="w-3 h-3 text-white" />
                </button>
                {i === 0 && (
                  <span className="absolute bottom-1 left-1 text-[8px] bg-black/60 text-white px-1 rounded">
                    Main
                  </span>
                )}
              </div>
            ))}
            {imagePreviews.map((preview, i) => (
              <div key={`n-${i}`} className="relative aspect-square">
                <img src={preview} alt="" className="w-full h-full object-cover rounded-xl" />
                <button
                  type="button"
                  onClick={() => onRemoveNew(i)}
                  className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-destructive flex items-center justify-center"
                >
                  <X className="w-3 h-3 text-white" />
                </button>
              </div>
            ))}
            {totalImages < maxImages && (
              <label className="aspect-square border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors">
                <ImagePlus className="w-5 h-5 text-muted-foreground" />
                <input type="file" accept="image/*" multiple className="hidden" onChange={handleFileInput} />
              </label>
            )}
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary/50 transition-colors">
            <ImagePlus className="w-8 h-8 text-muted-foreground mb-2" />
            <span className="text-sm font-medium text-muted-foreground">Tap to add photos</span>
            <span className="text-xs text-muted-foreground mt-0.5">Up to {maxImages} photos</span>
            <input type="file" accept="image/*" multiple className="hidden" onChange={handleFileInput} />
          </label>
        )}
      </div>

      <div className="space-y-2">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Product Video (optional)</p>
        {videoPreview || existingVideoUrl ? (
          <div className="relative">
            <video src={videoPreview || existingVideoUrl} className="w-full rounded-xl" controls />
            <button
              type="button"
              onClick={onRemoveVideo}
              className="absolute top-2 right-2 w-6 h-6 rounded-full bg-destructive flex items-center justify-center"
            >
              <X className="w-3 h-3 text-white" />
            </button>
          </div>
        ) : (
          <label className="flex items-center gap-2 text-xs text-primary font-semibold cursor-pointer border border-dashed border-border rounded-xl p-3 hover:border-primary/50 transition-colors">
            <Video className="w-4 h-4" /> Add Product Video
            <input
              type="file"
              accept="video/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onAddVideo(f);
              }}
            />
          </label>
        )}
      </div>
    </div>
  );
}
