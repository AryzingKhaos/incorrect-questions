/**
 * Image Validation Utilities
 * Feature: 001-image-text-extraction
 * Validates image format, size, and provides compression functionality
 */

/**
 * Validation result interface
 */
export interface ValidationResult {
  isValid: boolean;
  errorMessage: string | null;
}

/**
 * Supported image formats
 */
const SUPPORTED_FORMATS = ['image/jpeg', 'image/png', 'image/webp'];

/**
 * Maximum file size in bytes (5MB)
 */
const MAX_FILE_SIZE = 5 * 1024 * 1024;

/**
 * Validate image file format
 * @param file - File to validate
 * @returns ValidationResult
 */
export function validateImageFormat(file: File): ValidationResult {
  if (!SUPPORTED_FORMATS.includes(file.type)) {
    return {
      isValid: false,
      errorMessage: `Invalid file format. Please upload an image file (JPEG, PNG, or WebP). Your file type: ${file.type}`,
    };
  }

  return {
    isValid: true,
    errorMessage: null,
  };
}

/**
 * Validate image file size
 * @param file - File to validate
 * @returns ValidationResult
 */
export function validateImageSize(file: File): ValidationResult {
  if (file.size > MAX_FILE_SIZE) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
    return {
      isValid: false,
      errorMessage: `Image is too large (${sizeMB}MB). Please use an image under 5MB.`,
    };
  }

  return {
    isValid: true,
    errorMessage: null,
  };
}

/**
 * Validate image file (format and size)
 * @param file - File to validate
 * @returns ValidationResult
 */
export function validateImage(file: File): ValidationResult {
  // Check format first
  const formatResult = validateImageFormat(file);
  if (!formatResult.isValid) {
    return formatResult;
  }

  // Check size
  const sizeResult = validateImageSize(file);
  if (!sizeResult.isValid) {
    return sizeResult;
  }

  return {
    isValid: true,
    errorMessage: null,
  };
}

/**
 * Compress image to reduce file size
 * Maintains aspect ratio and converts to JPEG
 *
 * @param file - Original image file
 * @param maxSizeMB - Target maximum size in MB (default: 0.5MB)
 * @param quality - JPEG quality (0-1, default: 0.8)
 * @returns Promise<string> - Base64-encoded compressed image
 */
export async function compressImage(
  file: File,
  maxSizeMB: number = 0.5,
  quality: number = 0.8
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions (maintain aspect ratio)
        const maxDimension = 1200; // Sufficient for OCR
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = (height / width) * maxDimension;
            width = maxDimension;
          } else {
            width = (width / height) * maxDimension;
            height = maxDimension;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Convert to JPEG with quality adjustment
        const base64 = canvas.toDataURL('image/jpeg', quality);
        resolve(base64);
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Convert File to base64 data URL
 * @param file - File to convert
 * @returns Promise<string> - Base64-encoded data URL
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}
