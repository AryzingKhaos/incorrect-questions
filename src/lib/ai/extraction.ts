/**
 * AI Question Extraction
 * Feature: 001-image-text-extraction
 * Extracts question text from images using Alibaba Qwen-Plus AI
 */

import { aiClient, AI_MODEL, isApiKeyConfigured } from './client';
import { SYSTEM_PROMPT, generateUserPrompt } from './prompts';
import { AIExtractionResponse } from '@/types/ai';
import { GradeLevel } from '@/types/question';

/**
 * Extract question text from image using AI
 * Falls back to mock response if API key is not configured
 *
 * @param imageBase64 - Base64-encoded image (data:image/jpeg;base64,...)
 * @param educationLevel - Target education level (elementary, middle, high)
 * @param maxRetries - Maximum retry attempts (default: 3)
 * @returns AI extraction response with question text and metadata
 */
export async function extractQuestionFromImage(
  imageBase64: string,
  educationLevel: GradeLevel = 'middle',
  maxRetries: number = 3
): Promise<AIExtractionResponse> {
  // Use mock response if API key not configured
  if (!isApiKeyConfigured()) {
    console.warn('No API key found, using mock response');
    return mockExtraction(educationLevel);
  }

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await aiClient.chat.completions.create({
        model: AI_MODEL,
        messages: [
          {
            role: 'system',
            content: SYSTEM_PROMPT,
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: generateUserPrompt(educationLevel),
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageBase64,
                },
              },
            ],
          },
        ],
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('Empty response from AI');
      }

      // Parse JSON response
      const result: AIExtractionResponse = JSON.parse(content);
      return result;

    } catch (error: any) {
      lastError = error;

      // Don't retry authentication errors
      if (error.status === 401) {
        throw new Error('API key is invalid. Please check your configuration.');
      }

      // Exponential backoff for rate limits or server errors
      if (error.status === 429 || (error.status && error.status >= 500)) {
        const delay = Math.min(1000 * Math.pow(2, attempt), 10000); // Max 10s
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      // For other errors, throw immediately
      throw error;
    }
  }

  // All retries exhausted
  throw new Error(`Failed after ${maxRetries} attempts: ${lastError?.message}`);
}

/**
 * Mock extraction response for development
 * Simulates AI extraction with realistic delay
 *
 * @param educationLevel - Target education level
 * @returns Mock AI extraction response
 */
function mockExtraction(educationLevel: GradeLevel): Promise<AIExtractionResponse> {
  return new Promise((resolve) => {
    // Simulate network delay (1-2 seconds)
    setTimeout(() => {
      resolve({
        questionText: '1. 下列物质中，属于纯净物的是（  ）\nA. 空气\nB. 盐水\nC. 蒸馏水\nD. 矿泉水',
        confidence: 0.95,
        noiseFiltered: true,
        errorMessage: null,
        educationLevel,
      });
    }, 1500);
  });
}
