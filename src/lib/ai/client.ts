/**
 * AI Client Configuration
 * Feature: 001-image-text-extraction
 * OpenAI SDK client configured for Alibaba Qwen-Plus API
 */

import OpenAI from 'openai';

/**
 * AI Model Identifier
 * Using Alibaba Qwen-Plus via DashScope API
 */
export const AI_MODEL = 'qwen-plus';

/**
 * OpenAI Client Instance
 * Configured for Alibaba Cloud DashScope compatibility mode
 *
 * IMPORTANT: This client is configured with dangerouslyAllowBrowser: true
 * for client-side usage. For production, consider using a Next.js API route
 * as a proxy to keep the API key secure.
 */
export const aiClient = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_DASHSCOPE_API_KEY || process.env.DASHSCOPE_API_KEY || '',
  baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
  dangerouslyAllowBrowser: true, // Required for client-side usage
});

/**
 * Check if API key is configured
 * @returns true if API key is available
 */
export function isApiKeyConfigured(): boolean {
  return !!(process.env.NEXT_PUBLIC_DASHSCOPE_API_KEY || process.env.DASHSCOPE_API_KEY);
}
