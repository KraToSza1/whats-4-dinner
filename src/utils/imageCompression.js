/**
 * Smart Image Compression Utility
 * Compresses images client-side before upload to reduce file size dramatically
 * Handles PNG, JPEG, WebP formats and converts to optimized JPEG
 */

/**
 * Compress an image file to a target size
 * @param {File} file - The image file to compress
 * @param {Object} options - Compression options
 * @param {number} options.maxSizeMB - Maximum file size in MB (default: 0.1 = 100KB)
 * @param {number} options.maxWidth - Maximum width in pixels (default: 1024)
 * @param {number} options.maxHeight - Maximum height in pixels (default: 1024)
 * @param {number} options.quality - JPEG quality 0-1 (default: 0.85)
 * @returns {Promise<File>} - Compressed image file
 */
export async function compressImage(file, options = {}) {
  const {
    maxSizeMB = 0.1, // 100KB target
    maxWidth = 1024,
    maxHeight = 1024,
    quality = 0.85,
  } = options;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = e => {
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions maintaining aspect ratio
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        // Create canvas
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        // Draw and compress
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to blob with quality
        canvas.toBlob(
          blob => {
            if (!blob) {
              reject(new Error('Failed to compress image'));
              return;
            }

            // If still too large, reduce quality further
            const blobSizeMB = blob.size / (1024 * 1024);
            if (blobSizeMB > maxSizeMB) {
              // Recursively compress with lower quality
              const newQuality = Math.max(0.5, quality - 0.1);
              canvas.toBlob(
                smallerBlob => {
                  if (!smallerBlob) {
                    reject(new Error('Failed to compress image further'));
                    return;
                  }

                  const compressedFile = new File(
                    [smallerBlob],
                    file.name.replace(/\.(png|webp|gif)$/i, '.jpg'),
                    { type: 'image/jpeg', lastModified: Date.now() }
                  );

                  resolve(compressedFile);
                },
                'image/jpeg',
                newQuality
              );
            } else {
              const compressedFile = new File(
                [blob],
                file.name.replace(/\.(png|webp|gif)$/i, '.jpg'),
                { type: 'image/jpeg', lastModified: Date.now() }
              );

              resolve(compressedFile);
            }
          },
          'image/jpeg',
          quality
        );
      };

      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };

      img.src = e.target.result;
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Smart compression that aggressively reduces file size
 * @param {File} file - The image file to compress
 * @returns {Promise<File>} - Compressed image file (target: ~100KB)
 */
export async function compressImageSmart(file) {
  const originalSizeMB = file.size / (1024 * 1024);

  // For very large files (16MB+), be more aggressive
  let maxSizeMB = 0.1; // 100KB default
  let quality = 0.85;
  let maxWidth = 1024;
  let maxHeight = 1024;

  if (originalSizeMB > 10) {
    // Very large files: more aggressive compression
    maxSizeMB = 0.08; // 80KB
    quality = 0.75;
    maxWidth = 800;
    maxHeight = 800;
  } else if (originalSizeMB > 5) {
    // Large files: moderate compression
    maxSizeMB = 0.09; // 90KB
    quality = 0.8;
    maxWidth = 900;
    maxHeight = 900;
  }

  try {
    const compressed = await compressImage(file, {
      maxSizeMB,
      maxWidth,
      maxHeight,
      quality,
    });

    const compressedSizeMB = compressed.size / (1024 * 1024);
    const reduction = (((originalSizeMB - compressedSizeMB) / originalSizeMB) * 100).toFixed(1);

    if (import.meta.env.DEV) {
      console.log('📸 [IMAGE COMPRESSION]', {
        original: `${originalSizeMB.toFixed(2)}MB`,
        compressed: `${compressedSizeMB.toFixed(2)}MB`,
        reduction: `${reduction}%`,
        quality,
        dimensions: `${maxWidth}x${maxHeight}`,
      });
    }

    return compressed;
  } catch (error) {
    console.error('❌ [IMAGE COMPRESSION] Failed:', error);
    // Return original file if compression fails
    return file;
  }
}
