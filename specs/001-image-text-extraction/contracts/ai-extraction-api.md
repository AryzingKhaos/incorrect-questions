# AI Extraction API Contract

**Date**: 2026-01-06
**Feature**: 001-image-text-extraction
**AI Provider**: Alibaba Cloud (DashScope)
**Model**: Qwen-Plus
**SDK**: OpenAI SDK (compatibility mode)

This document specifies the contract for integrating with Alibaba's Qwen-Plus AI model for question text extraction from images.

## API Configuration

### Client Setup

```typescript
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.DASHSCOPE_API_KEY, // Required: API key from Alibaba Cloud
  baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1"
});
```

### Environment Variables

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `DASHSCOPE_API_KEY` | Yes | Alibaba Cloud DashScope API key | `sk-xxxxxxxxxxxxxx` |

**Setup Instructions**:
1. Create `.env.local` file in project root
2. Add line: `DASHSCOPE_API_KEY=sk-your-api-key-here`
3. Restart development server

## Request Format

### Vision API Call Structure

```typescript
const response = await client.chat.completions.create({
  model: "qwen-plus",
  messages: [
    {
      role: "system",
      content: SYSTEM_PROMPT
    },
    {
      role: "user",
      content: [
        {
          type: "text",
          text: generateUserPrompt(educationLevel)
        },
        {
          type: "image_url",
          image_url: {
            url: `data:image/jpeg;base64,${imageBase64}`
          }
        }
      ]
    }
  ]
});
```

### Image Encoding

**Format**: Base64-encoded data URL
**Supported Types**: JPEG, PNG, WebP
**Max Size**: 5MB (before encoding)
**Compression**: Recommended to compress images to <500KB for faster processing

**Encoding Example**:
```typescript
function encodeImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Result format: "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
```

## Prompt Specifications

### System Prompt

**Purpose**: Establish AI's role and context

```typescript
const SYSTEM_PROMPT = `You are an expert AI assistant helping students digitize their incorrect questions for review and practice. Your task is to extract question text from images of homework, exams, or worksheets with high precision.`;
```

### User Prompt (Dynamic)

**Purpose**: Provide specific extraction instructions

```typescript
function generateUserPrompt(educationLevel: 'elementary' | 'middle' | 'high'): string {
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
```

### Prompt Parameters

| Parameter | Type | Values | Purpose |
|-----------|------|--------|---------|
| `educationLevel` | string | `'elementary'`, `'middle'`, `'high'` | Adjust language complexity and expectations |

## Response Format

### Success Response

```typescript
interface AICompletionResponse {
  id: string; // Unique request ID
  object: "chat.completion";
  created: number; // Unix timestamp
  model: "qwen-plus";
  choices: [
    {
      index: 0;
      message: {
        role: "assistant";
        content: string; // JSON string (see below)
      };
      finish_reason: "stop";
    }
  ];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}
```

### Parsed Content (from `choices[0].message.content`)

```typescript
interface ExtractionResult {
  questionText: string; // Extracted question text
  confidence: number; // 0.0 to 1.0
  noiseFiltered: boolean; // true if noise was removed
  errorMessage: string | null; // Error description or null
  educationLevel: 'elementary' | 'middle' | 'high'; // Echo back
}
```

### Example Success Response

```json
{
  "id": "chatcmpl-abc123",
  "object": "chat.completion",
  "created": 1704556800,
  "model": "qwen-plus",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "{\"questionText\":\"下列哪个选项是正确的？\\nA. 水在100°C时沸腾\\nB. 水在0°C时沸腾\\nC. 水在50°C时沸腾\\nD. 水在200°C时沸腾\",\"confidence\":0.98,\"noiseFiltered\":true,\"errorMessage\":null,\"educationLevel\":\"middle\"}"
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 2450,
    "completion_tokens": 85,
    "total_tokens": 2535
  }
}
```

### Example Error Response (No Question Found)

```json
{
  "id": "chatcmpl-def456",
  "object": "chat.completion",
  "created": 1704556810,
  "model": "qwen-plus",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "{\"questionText\":\"\",\"confidence\":0.0,\"noiseFiltered\":false,\"errorMessage\":\"No question found in this image. Please try another photo.\",\"educationLevel\":\"high\"}"
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 2380,
    "completion_tokens": 45,
    "total_tokens": 2425
  }
}
```

## Error Handling

### API-Level Errors

```typescript
interface APIError {
  error: {
    message: string;
    type: string;
    code: string;
  };
}
```

### Common Error Scenarios

| HTTP Status | Error Type | User Message | Retry Strategy |
|-------------|------------|--------------|----------------|
| 401 | `authentication_error` | "API key is missing or invalid. Please check your configuration." | No retry |
| 429 | `rate_limit_exceeded` | "Too many requests. Please wait a moment and try again." | Retry after 5s |
| 500 | `internal_error` | "Something went wrong. Please try again." | Retry with exponential backoff |
| 503 | `service_unavailable` | "Service is temporarily unavailable. Please try again later." | Retry after 10s |

### TypeScript Error Handler

```typescript
async function extractQuestionWithRetry(
  imageBase64: string,
  educationLevel: GradeLevel,
  maxRetries: number = 3
): Promise<ExtractionResult> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await client.chat.completions.create({
        model: "qwen-plus",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: [
              { type: "text", text: generateUserPrompt(educationLevel) },
              {
                type: "image_url",
                image_url: { url: `data:image/jpeg;base64,${imageBase64}` }
              }
            ]
          }
        ]
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error("Empty response from AI");
      }

      const result: ExtractionResult = JSON.parse(content);
      return result;

    } catch (error: any) {
      lastError = error;

      // Don't retry authentication errors
      if (error.status === 401) {
        throw new Error("API key is missing or invalid. Please check your configuration.");
      }

      // For rate limits or server errors, wait before retry
      if (error.status === 429 || error.status >= 500) {
        const delay = Math.min(1000 * Math.pow(2, attempt), 10000); // Exponential backoff (max 10s)
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
```

## Rate Limits

| Limit Type | Value | Notes |
|------------|-------|-------|
| Requests per minute | Variable (check Alibaba Cloud docs) | Depends on account tier |
| Max image size | 5MB | Enforced client-side before API call |
| Token limit per request | ~8000 tokens | Includes image tokens + prompt |

**Rate Limit Handling**:
- Implement exponential backoff for 429 errors
- Show user-friendly message: "Too many requests. Please wait a moment."
- Consider queuing requests if multiple images uploaded rapidly

## Cost Estimation

**Qwen-Plus Pricing** (as of 2026-01-06, verify current rates):
- ~¥0.008 per 1000 tokens (input + output)
- Average image: ~2000 tokens
- Average prompt + response: ~500 tokens
- **Estimated cost per extraction**: ¥0.02 (~$0.003 USD)

**Budget Considerations**:
- 100 questions: ¥2 (~$0.30)
- 1000 questions: ¥20 (~$3)
- Retry adds cost (minimize retries with validation)

## Mock Implementation (Development)

For development without API key:

```typescript
function mockExtractionResponse(educationLevel: GradeLevel): ExtractionResult {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1500));

  // Return mock data
  return {
    questionText: "1. 下列物质中，属于纯净物的是（  ）\nA. 空气\nB. 盐水\nC. 蒸馏水\nD. 矿泉水",
    confidence: 0.95,
    noiseFiltered: true,
    errorMessage: null,
    educationLevel
  };
}

// Use in development
const result = process.env.NODE_ENV === 'development' && !process.env.DASHSCOPE_API_KEY
  ? await mockExtractionResponse(educationLevel)
  : await extractQuestionWithRetry(imageBase64, educationLevel);
```

## Testing

### Test Cases

1. **Valid Single Question**:
   - Input: Clear image with one question
   - Expected: `confidence > 0.8`, `noiseFiltered = false`

2. **Multiple Questions (Extract First)**:
   - Input: Image with 3 questions
   - Expected: Only first question extracted, `noiseFiltered = true`

3. **Question + Student Answer**:
   - Input: Question with handwritten answer
   - Expected: Answer filtered out, `noiseFiltered = true`

4. **No Readable Question**:
   - Input: Blank or unclear image
   - Expected: `errorMessage !== null`, `confidence < 0.3`

5. **Rotated Image**:
   - Input: Image rotated 90 degrees
   - Expected: Correct extraction (model should handle rotation)

### Integration Test Example

```typescript
describe('AI Extraction API', () => {
  it('should extract question from clear image', async () => {
    const imageBase64 = loadTestImage('single-question.jpg');
    const result = await extractQuestionWithRetry(imageBase64, 'middle');

    expect(result.questionText).not.toBe('');
    expect(result.confidence).toBeGreaterThan(0.8);
    expect(result.errorMessage).toBeNull();
  });

  it('should handle no question found', async () => {
    const imageBase64 = loadTestImage('blank.jpg');
    const result = await extractQuestionWithRetry(imageBase64, 'middle');

    expect(result.questionText).toBe('');
    expect(result.errorMessage).not.toBeNull();
  });
});
```

## Implementation Checklist

- [ ] Install OpenAI SDK: `npm install openai`
- [ ] Create `.env.local` with `DASHSCOPE_API_KEY`
- [ ] Implement `src/lib/ai/client.ts` (client setup)
- [ ] Implement `src/lib/ai/prompts.ts` (system and user prompts)
- [ ] Implement `src/lib/ai/extraction.ts` (extraction logic with retry)
- [ ] Add error handling with user-friendly messages
- [ ] Implement mock responses for development
- [ ] Test with sample images across education levels
- [ ] Monitor API usage and costs

## Security Considerations

- **API Key Storage**: Never commit `.env.local` to git (add to `.gitignore`)
- **Client-Side Exposure**: API key will be exposed in browser. For production, consider proxy through serverless function
- **Rate Limiting**: Implement client-side throttling to avoid abuse
- **Image Data**: Images sent to Alibaba Cloud servers (inform users if privacy-sensitive)

## Next Steps

1. Implement AI client in `src/lib/ai/`
2. Integrate with upload flow in React components
3. Test extraction quality with real question images
4. Iterate on prompts based on accuracy metrics
5. Consider adding user feedback loop to improve prompts
