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
- Question numbering if present (e.g., "1.", "Question 5:")

**DO NOT EXTRACT (Noise Filtering):**
- **Multiple Questions**: If multiple questions appear, extract ONLY the FIRST complete question. Ignore all subsequent questions.
- **Student Answers**: Remove any handwritten or typed answers, circled options, student work, or calculations
- **Student Annotations**: Filter out underlining, highlighting, check marks, question marks, or notes added by students
- **Headers & Footers**: Exclude page numbers, school names, class names, dates, or student names at top/bottom of page
- **Instructional Text**: Remove general directions like "Choose the best answer" or "Show your work"
- **Teacher's Marks**: Exclude grades, scores, check marks, red marks, or teacher comments
- **Page Layout Elements**: Remove section dividers, page breaks, or formatting artifacts

**NOISE DETECTION SCENARIOS:**
1. **Multiple Questions Present**: If you see "Question 1", "Question 2", or numbered items, extract ONLY the first one
2. **Student Work Visible**: If you see handwritten solutions, crossed-out text, or margin notes, exclude these completely
3. **Answer Key Present**: If multiple choice options are circled/marked, extract the options but ignore the markings
4. **Mixed Content**: If question appears alongside tables of contents, instructions, or other questions, isolate only the target question
5. **Partial Pages**: If the image shows part of a larger page with headers/footers, extract only the question content

**INSTRUCTIONS:**
1. Identify the FIRST complete question in the image (look for question numbers like "1.", "Q1:", or the topmost question)
2. Extract the question text while removing all noise elements listed above
3. Set noiseFiltered=true if ANY noise was removed (student answers, headers, multiple questions, etc.)
4. Set noiseFiltered=false ONLY if the image contains a single clean question with no distractions
5. If the question references a diagram or image, describe it briefly in [brackets]
6. Preserve mathematical notation, symbols, and formatting as closely as possible
7. If no clear question is found, return errorMessage with a student-friendly explanation

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
  - 0.9-1.0: Clean, clear question with no ambiguity
  - 0.7-0.9: Question extracted successfully but had noise or formatting issues
  - 0.5-0.7: Question partially visible or heavily noisy
  - Below 0.5: Poor image quality or unclear question
- **noiseFiltered**: true if you removed ANY noise (student answers, headers, multiple questions, annotations, etc.), false only if image is pristine
- **errorMessage**: null if successful, or a student-friendly error message if failed (e.g., "图片中没有找到清晰的题目，请重新拍照")

**CONTEXT:**
This is a ${educationLevel} school level question from a student's homework or exam. The student wants to save ONLY ONE question for review, even if the image contains multiple questions.
`.trim();
}
