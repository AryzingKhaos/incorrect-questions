/**
 * Question CRUD Operations
 * Feature: 001-image-text-extraction
 * Manages question entities in localStorage
 */

import { Question } from '@/types/question';
import { AIExtractionResponse } from '@/types/ai';
import { getSchema, saveSchema } from './schema';

/**
 * Create a new question after AI extraction (before user confirmation)
 *
 * @param imageBase64 - Base64-encoded image data
 * @param fileSize - Original file size in bytes
 * @param fileFormat - MIME type (e.g., 'image/jpeg')
 * @param extractionResponse - AI extraction result
 * @returns Question ID (UUID)
 */
export function createQuestion(
  imageBase64: string,
  fileSize: number,
  fileFormat: string,
  extractionResponse: AIExtractionResponse
): string {
  const schema = getSchema();

  const questionId = crypto.randomUUID();
  const now = new Date().toISOString();

  const question: Question = {
    id: questionId,
    imageBase64,
    fileSize,
    fileFormat,
    extractedText: extractionResponse.questionText,
    confidence: extractionResponse.confidence,
    noiseFiltered: extractionResponse.noiseFiltered,
    processingStatus: extractionResponse.errorMessage ? 'failed' : 'pending',
    errorMessage: extractionResponse.errorMessage,
    uploadTimestamp: now,
    confirmedAt: null,
    gradeLevel: extractionResponse.educationLevel,
  };

  schema.questions[questionId] = question;
  schema.metadata.totalQuestions++;
  schema.metadata.lastModified = now;

  saveSchema(schema);

  return questionId;
}

/**
 * Get all questions from storage
 *
 * @returns Array of all questions
 */
export function getAllQuestions(): Question[] {
  const schema = getSchema();
  return Object.values(schema.questions);
}

/**
 * Get a single question by ID
 *
 * @param id - Question ID
 * @returns Question object or null if not found
 */
export function getQuestionById(id: string): Question | null {
  const schema = getSchema();
  return schema.questions[id] || null;
}

/**
 * Confirm a question (user clicked "Confirm & Save")
 * Updates the question status to success and sets confirmedAt timestamp
 *
 * @param id - Question ID to confirm
 * @throws Error if question not found
 */
export function confirmQuestion(id: string): void {
  const schema = getSchema();
  const question = schema.questions[id];

  if (!question) {
    throw new Error(`Question not found: ${id}`);
  }

  question.confirmedAt = new Date().toISOString();
  question.processingStatus = 'success';
  schema.metadata.lastModified = new Date().toISOString();

  saveSchema(schema);
}

/**
 * Update extraction result (after retry)
 *
 * @param id - Question ID
 * @param extractionResponse - New AI extraction result
 * @throws Error if question not found
 */
export function updateExtraction(id: string, extractionResponse: AIExtractionResponse): void {
  const schema = getSchema();
  const question = schema.questions[id];

  if (!question) {
    throw new Error(`Question not found: ${id}`);
  }

  question.extractedText = extractionResponse.questionText;
  question.confidence = extractionResponse.confidence;
  question.noiseFiltered = extractionResponse.noiseFiltered;
  question.errorMessage = extractionResponse.errorMessage;
  question.processingStatus = extractionResponse.errorMessage ? 'failed' : 'pending';
  schema.metadata.lastModified = new Date().toISOString();

  saveSchema(schema);
}

/**
 * Delete a question from storage
 *
 * @param id - Question ID to delete
 * @throws Error if question not found
 */
export function deleteQuestion(id: string): void {
  const schema = getSchema();

  if (!schema.questions[id]) {
    throw new Error(`Question not found: ${id}`);
  }

  delete schema.questions[id];
  schema.metadata.totalQuestions--;
  schema.metadata.lastModified = new Date().toISOString();

  saveSchema(schema);
}

/**
 * Get questions by processing status
 *
 * @param status - Processing status to filter by
 * @returns Array of questions matching the status
 */
export function getQuestionsByStatus(status: Question['processingStatus']): Question[] {
  const schema = getSchema();
  return Object.values(schema.questions).filter(q => q.processingStatus === status);
}

/**
 * Get confirmed questions (ready for practice)
 * Sorted by confirmation date (most recent first)
 *
 * @returns Array of confirmed questions
 */
export function getConfirmedQuestions(): Question[] {
  const schema = getSchema();
  return Object.values(schema.questions)
    .filter(q => q.confirmedAt !== null)
    .sort((a, b) => new Date(b.confirmedAt!).getTime() - new Date(a.confirmedAt!).getTime());
}

/**
 * Clear all questions from storage
 */
export function clearAllQuestions(): void {
  const schema = getSchema();
  schema.questions = {};
  schema.metadata.totalQuestions = 0;
  schema.metadata.lastModified = new Date().toISOString();

  saveSchema(schema);
}
