/**
 * Question Entity Types
 * Feature: 001-image-text-extraction
 * Represents a single extracted question with all associated data
 */

export interface Question {
  // Core identifiers
  id: string; // UUID v4 generated on creation

  // Image data
  imageBase64: string; // Base64-encoded compressed image (data:image/jpeg;base64,...)
  fileSize: number; // Original file size in bytes
  fileFormat: string; // MIME type (e.g., 'image/jpeg', 'image/png', 'image/webp')

  // Extracted content
  extractedText: string; // AI-extracted question text (empty string if failed)
  confidence: number; // AI confidence score (0.0 - 1.0)
  noiseFiltered: boolean; // Whether AI removed extraneous content

  // Status tracking
  processingStatus: ProcessingStatus;
  errorMessage: string | null; // Error description if processingStatus is 'failed'

  // Timestamps
  uploadTimestamp: string; // ISO 8601 timestamp when image was uploaded
  confirmedAt: string | null; // ISO 8601 timestamp when user confirmed (null if pending)

  // Optional metadata
  gradeLevel?: GradeLevel; // Student's education level (if specified)
  subject?: string; // Subject area (if detected or specified)
}

export type ProcessingStatus = 'pending' | 'success' | 'failed';
export type GradeLevel = 'elementary' | 'middle' | 'high';

/**
 * LocalStorage Schema
 * Root schema for all persisted data
 */
export interface LocalStorageSchema {
  version: '1.0.0';
  questions: Record<string, Question>; // Keyed by question ID
  metadata: StorageMetadata;
}

export interface StorageMetadata {
  createdAt: string; // ISO 8601 timestamp of first use
  lastModified: string; // ISO 8601 timestamp of last write
  totalQuestions: number; // Count of questions in storage
}

/**
 * Upload Session (In-Memory Only)
 * Transient state for active upload flow. NOT persisted to localStorage.
 */
export interface UploadSession {
  sessionId: string; // UUID v4 for tracking
  file: File; // Original file object
  imagePreviewUrl: string; // Blob URL or base64 for preview
  uploadTimestamp: string; // ISO 8601
  status: 'uploading' | 'validating' | 'extracting' | 'confirming' | 'complete' | 'error';
  errorMessage: string | null;
}
