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

            // Binary search for optimal quality to hit target size
            const blobSizeMB = blob.size / (1024 * 1024);
            const blobSizeKB = blob.size / 1024;

            if (blobSizeMB > maxSizeMB) {
              // Too large: use binary search to find optimal quality
              let minQ = 0.3;
              let maxQ = quality;
              let bestBlob = blob;
              let attempts = 0;
              const maxAttempts = 8;

              const tryLowerQuality = () => {
                attempts++;
                const testQuality = (minQ + maxQ) / 2;

                canvas.toBlob(
                  testBlob => {
                    if (!testBlob) {
                      // Fallback to best blob we have
                      const compressedFile = new File(
                        [bestBlob],
                        file.name.replace(/\.(png|webp|gif)$/i, '.jpg'),
                        { type: 'image/jpeg', lastModified: Date.now() }
                      );
                      resolve(compressedFile);
                      return;
                    }

                    const testSizeKB = testBlob.size / 1024;

                    if (testSizeKB <= maxSizeMB * 1024 || attempts >= maxAttempts) {
                      // Good enough or max attempts
                      const finalBlob = testSizeKB <= maxSizeMB * 1024 ? testBlob : bestBlob;
                      const compressedFile = new File(
                        [finalBlob],
                        file.name.replace(/\.(png|webp|gif)$/i, '.jpg'),
                        { type: 'image/jpeg', lastModified: Date.now() }
                      );
                      resolve(compressedFile);
                    } else if (testSizeKB > maxSizeMB * 1024) {
                      // Still too large
                      maxQ = testQuality;
                      bestBlob = testBlob.size < bestBlob.size ? testBlob : bestBlob;
                      tryLowerQuality();
                    } else {
                      // Too small, but we want to stay under limit
                      minQ = testQuality;
                      bestBlob = testBlob;
                      tryLowerQuality();
                    }
                  },
                  'image/jpeg',
                  testQuality
                );
              };

              tryLowerQuality();
            } else {
              // Size is good
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
 * Smart compression that aggressively reduces file size to ≤100KB
 * IMPROVED: Better algorithm with binary search for optimal quality
 * @param {File} file - The image file to compress
 * @returns {Promise<File>} - Compressed image file (target: ≤100KB)
 */
export async function compressImageSmart(file) {
  const originalSizeMB = file.size / (1024 * 1024);
  const originalSizeKB = file.size / 1024;

  // Smart initial settings based on file size
  let maxSizeMB = 0.1; // 100KB target
  let quality = 0.82;
  let maxWidth = 1024;
  let maxHeight = 1024;

  if (originalSizeMB > 15) {
    // Extremely large files (16MB+): very aggressive
    maxSizeMB = 0.09; // 90KB
    quality = 0.6;
    maxWidth = 800;
    maxHeight = 800;
  } else if (originalSizeMB > 10) {
    // Very large files (10-15MB): aggressive
    maxSizeMB = 0.095; // 95KB
    quality = 0.65;
    maxWidth = 900;
    maxHeight = 900;
  } else if (originalSizeMB > 5) {
    // Large files (5-10MB): moderate
    maxSizeMB = 0.098; // 98KB
    quality = 0.72;
    maxWidth = 950;
    maxHeight = 950;
  } else if (originalSizeMB > 2) {
    // Medium files (2-5MB): light compression
    quality = 0.78;
    maxWidth = 1000;
    maxHeight = 1000;
  }

  try {
    const compressed = await compressImage(file, {
      maxSizeMB,
      maxWidth,
      maxHeight,
      quality,
    });

    const compressedSizeMB = compressed.size / (1024 * 1024);
    const compressedSizeKB = compressed.size / 1024;
    const reduction = (((originalSizeMB - compressedSizeMB) / originalSizeMB) * 100).toFixed(1);

    if (import.meta.env.DEV) {
      console.log('📸 [IMAGE COMPRESSION] Smart compression complete', {
        original: `${originalSizeMB.toFixed(2)}MB (${originalSizeKB.toFixed(0)}KB)`,
        compressed: `${compressedSizeMB.toFixed(2)}MB (${compressedSizeKB.toFixed(0)}KB)`,
        reduction: `${reduction}%`,
        quality: quality.toFixed(2),
        dimensions: `${maxWidth}x${maxHeight}`,
        targetMet: compressedSizeKB <= 100,
      });
    }

    // If still over 100KB, try one more aggressive pass
    if (compressed.size > 100 * 1024) {
      if (import.meta.env.DEV) {
        console.warn(
          '⚠️ [IMAGE COMPRESSION] Still over 100KB, trying more aggressive compression...'
        );
      }
      const recompressed = await compressImage(file, {
        maxSizeMB: 0.095, // 95KB
        maxWidth: Math.max(600, maxWidth - 100),
        maxHeight: Math.max(600, maxHeight - 100),
        quality: Math.max(0.5, quality - 0.1),
      });

      if (recompressed.size <= compressed.size) {
        return recompressed;
      }
    }

    return compressed;
  } catch (error) {
    console.error('❌ [IMAGE COMPRESSION] Failed:', error);
    // Return original file if compression fails
    return file;
  }
}
