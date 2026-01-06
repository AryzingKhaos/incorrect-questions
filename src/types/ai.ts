/**
 * AI Response Types
 * Feature: 001-image-text-extraction
 * Data structures for AI API interactions with Alibaba Qwen-Plus
 */

import { GradeLevel } from './question';

/**
 * Request structure for AI extraction
 */
export interface AIExtractionRequest {
  imageBase64: string; // Base64-encoded image
  educationLevel: GradeLevel; // Target education level for prompt adjustment
}

/**
 * Response structure from AI extraction
 */
export interface AIExtractionResponse {
  questionText: string; // Extracted question text
  confidence: number; // Confidence score (0.0 - 1.0)
  noiseFiltered: boolean; // Whether noise was removed
  errorMessage: string | null; // Error message if extraction failed
  educationLevel: GradeLevel; // Echo back for validation
}
