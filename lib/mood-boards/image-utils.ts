import { formatFilenameToTitle } from "./helpers";
import { MoodBoardImage } from "./types";
import { generateId } from "./helpers";

/**
 * Optimizes an uploaded image file to a data URL that can be safely stored in localStorage.
 * Scales large images down to max 1200px width/height to avoid exceeding storage limits.
 */
export async function processUploadedImage(
  file: File,
  position = 0
): Promise<MoodBoardImage> {
  const suggestedTitle = formatFilenameToTitle(file.name);
  const dataUrl = await readFileAsOptimizedDataUrl(file);

  return {
    id: generateId("img"),
    name: suggestedTitle,
    title: suggestedTitle,
    originalFileName: file.name,
    previewUrl: dataUrl,
    fileType: file.type || "image/jpeg",
    size: file.size,
    position,
    uploadedAt: new Date().toISOString(),
  };
}

export function readFileAsOptimizedDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    // If not in browser
    if (typeof window === "undefined" || typeof FileReader === "undefined") {
      resolve("");
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Failed to read image file"));
    reader.onload = () => {
      const result = reader.result as string;

      // If file is SVG, don't downscale with canvas
      if (file.type === "image/svg+xml" || file.name.endsWith(".svg")) {
        resolve(result);
        return;
      }

      // If file is under 400KB, use directly
      if (file.size < 400 * 1024) {
        resolve(result);
        return;
      }

      // Resize via Canvas for larger files to prevent localStorage bloat
      try {
        const img = new Image();
        img.onerror = () => resolve(result); // fallback to original
        img.onload = () => {
          const maxDim = 1200;
          let width = img.width;
          let height = img.height;

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            resolve(result);
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          const mime = file.type === "image/png" ? "image/png" : "image/jpeg";
          const quality = mime === "image/jpeg" ? 0.85 : undefined;
          const optimized = canvas.toDataURL(mime, quality);
          resolve(optimized);
        };
        img.src = result;
      } catch {
        resolve(result);
      }
    };

    reader.readAsDataURL(file);
  });
}
