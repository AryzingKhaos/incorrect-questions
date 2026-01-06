/**
 * AI Prompt Definitions
 * Feature: 001-image-text-extraction
 * Defines system and user prompts for question extraction via Alibaba Qwen-Plus
 */

import { GradeLevel } from '@/types/question';

/**
 * System Prompt
 * Establishes AI's role and context
 */
export const SYSTEM_PROMPT = `You are an expert AI assistant helping students digitize their incorrect questions for review and practice. Your task is to extract question text from images of homework, exams, or worksheets with high precision.`;

/**
 * User Prompt Generator
 * Provides specific extraction instructions based on education level
 *
 * @param educationLevel - Target education level (elementary, middle, high)
 * @returns Formatted prompt string with extraction rules
 */
export function generateUserPrompt(educationLevel: GradeLevel): string {
  return `
Carefully analyze the provided image and extract the question text according to these rules:

**EXTRACT:**
- The complete question text exactly as it appears
- Any diagrams, figures, or charts descriptions (e.g., "See Figure 1: [brief description]")
- Multiple choice options if they are part of the question (A, B, C, D)

**DO NOT EXTRACT:**
- Student's handwritten or typed answers
- Other questions on the same page (extract only ONE question)
- Page numbers, headers, footers, or instructional text
- Teacher's marks, grades, or comments

**INSTRUCTIONS:**
1. If multiple questions appear in the image, extract ONLY the FIRST complete question
2. If the question references a diagram or image, describe it briefly
3. Preserve mathematical notation, symbols, and formatting as closely as possible
4. If no clear question is found, return an error

**OUTPUT FORMAT:**
Return ONLY valid JSON (no markdown, no code blocks):
{
  "questionText": "The extracted question text here",
  "confidence": 0.95,
  "noiseFiltered": true,
  "errorMessage": null,
  "educationLevel": "${educationLevel}"
}

- **questionText**: The complete extracted question (empty string if extraction failed)
- **confidence**: Your confidence score from 0.0 to 1.0
- **noiseFiltered**: true if you removed student answers or other noise, false otherwise
- **errorMessage**: null if successful, or a student-friendly error message if failed

**CONTEXT:**
This is a ${educationLevel} school level question from a student's homework or exam.
`.trim();
}
