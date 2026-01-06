# Quickstart Guide: Question Image Upload & Text Extraction

**Date**: 2026-01-06
**Feature**: 001-image-text-extraction

This guide walks you through setting up the development environment and implementing the question image extraction feature.

## Prerequisites

- Node.js 18+ installed
- Code editor (VS Code recommended)
- Alibaba Cloud account with DashScope API access
- Basic knowledge of React/Next.js and TypeScript

## Project Setup

### 1. Initialize Next.js Project (if starting from scratch)

```bash
# Create new Next.js project with TypeScript
npx create-next-app@latest incorrect-questions --typescript --tailwind --app --eslint

cd incorrect-questions
```

**Configuration options**:
- ✅ TypeScript
- ✅ ESLint
- ✅ Tailwind CSS
- ✅ `src/` directory
- ✅ App Router
- ❌ Turbopack (optional)

### 2. Install Dependencies

```bash
# Install shadcn/ui
npx shadcn-ui@latest init

# Install required components
npx shadcn-ui@latest add button card dialog toast badge skeleton

# Install OpenAI SDK for Qwen-Plus API
npm install openai

# Install additional utilities
npm install uuid
npm install --save-dev @types/uuid
```

### 3. Configure Environment Variables

Create `.env.local` file in project root:

```bash
# .env.local
DASHSCOPE_API_KEY=sk-your-api-key-here
```

**Get your API key**:
1. Go to [Alibaba Cloud DashScope Console](https://bailian.console.aliyun.com/)
2. Navigate to API management
3. Generate or copy your API key
4. Paste into `.env.local`

**Security Note**: Add `.env.local` to `.gitignore` (Next.js does this automatically)

### 4. Verify Tailwind Configuration

Ensure `tailwind.config.js` includes shadcn/ui paths:

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Student-friendly color palette
        primary: {
          DEFAULT: '#3b82f6',
          light: '#60a5fa',
          dark: '#2563eb',
        },
        success: {
          DEFAULT: '#10b981',
          light: '#34d399',
        },
        warning: {
          DEFAULT: '#f59e0b',
          light: '#fbbf24',
        },
        error: {
          DEFAULT: '#ef4444',
          light: '#f87171',
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
```

## Project Structure

Create the following directory structure:

```bash
mkdir -p src/app/upload
mkdir -p src/app/questions
mkdir -p src/components/ui
mkdir -p src/components/upload
mkdir -p src/components/questions
mkdir -p src/lib/ai
mkdir -p src/lib/storage
mkdir -p src/lib/validation
mkdir -p src/types
mkdir -p src/config
```

## Implementation Steps

### Step 1: Define TypeScript Types

**File**: `src/types/question.ts`

```typescript
export interface Question {
  id: string;
  imageBase64: string;
  fileSize: number;
  fileFormat: string;
  extractedText: string;
  confidence: number;
  noiseFiltered: boolean;
  processingStatus: 'pending' | 'success' | 'failed';
  errorMessage: string | null;
  uploadTimestamp: string;
  confirmedAt: string | null;
  gradeLevel?: 'elementary' | 'middle' | 'high';
  subject?: string;
}

export type GradeLevel = 'elementary' | 'middle' | 'high';
export type ProcessingStatus = 'pending' | 'success' | 'failed';
```

**File**: `src/types/ai.ts`

```typescript
export interface AIExtractionRequest {
  imageBase64: string;
  educationLevel: GradeLevel;
}

export interface AIExtractionResponse {
  questionText: string;
  confidence: number;
  noiseFiltered: boolean;
  errorMessage: string | null;
  educationLevel: GradeLevel;
}
```

### Step 2: Configure AI Client

**File**: `src/lib/ai/client.ts`

```typescript
import OpenAI from "openai";

// Initialize OpenAI client for Qwen-Plus
export const aiClient = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_DASHSCOPE_API_KEY || process.env.DASHSCOPE_API_KEY,
  baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
  dangerouslyAllowBrowser: true // Required for client-side usage
});

export const AI_MODEL = "qwen-plus";
```

**Note**: Using `NEXT_PUBLIC_` prefix exposes the key to the browser. For production, consider using a Next.js API route as a proxy.

### Step 3: Define AI Prompts

**File**: `src/lib/ai/prompts.ts`

See [contracts/ai-extraction-api.md](./contracts/ai-extraction-api.md) for complete prompt specifications.

```typescript
import { GradeLevel } from '@/types/question';

export const SYSTEM_PROMPT = `You are an expert AI assistant helping students digitize their incorrect questions for review and practice. Your task is to extract question text from images of homework, exams, or worksheets with high precision.`;

export function generateUserPrompt(educationLevel: GradeLevel): string {
  return `
Carefully analyze the provided image and extract the question text according to these rules:

**EXTRACT:**
- The complete question text exactly as it appears
- Any diagrams, figures, or charts descriptions
- Multiple choice options if they are part of the question

**DO NOT EXTRACT:**
- Student's handwritten or typed answers
- Other questions on the same page (extract only ONE question)
- Page numbers, headers, footers, or instructional text

**OUTPUT FORMAT:**
Return ONLY valid JSON (no markdown, no code blocks):
{
  "questionText": "The extracted question text here",
  "confidence": 0.95,
  "noiseFiltered": true,
  "errorMessage": null,
  "educationLevel": "${educationLevel}"
}

**CONTEXT:**
This is a ${educationLevel} school level question from a student's homework or exam.
`.trim();
}
```

### Step 4: Implement Extraction Logic

**File**: `src/lib/ai/extraction.ts`

```typescript
import { aiClient, AI_MODEL } from './client';
import { SYSTEM_PROMPT, generateUserPrompt } from './prompts';
import { AIExtractionResponse, GradeLevel } from '@/types/ai';

export async function extractQuestionFromImage(
  imageBase64: string,
  educationLevel: GradeLevel = 'middle',
  maxRetries: number = 3
): Promise<AIExtractionResponse> {
  // TODO: Replace with actual API call once API key configured
  // For now, return mock response
  if (!process.env.NEXT_PUBLIC_DASHSCOPE_API_KEY) {
    console.warn('No API key found, using mock response');
    return mockExtraction(educationLevel);
  }

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await aiClient.chat.completions.create({
        model: AI_MODEL,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          {
            role: 'user',
            content: [
              { type: 'text', text: generateUserPrompt(educationLevel) },
              {
                type: 'image_url',
                image_url: { url: imageBase64 }
              }
            ]
          }
        ]
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('Empty response from AI');
      }

      const result: AIExtractionResponse = JSON.parse(content);
      return result;

    } catch (error: any) {
      lastError = error;

      // Don't retry authentication errors
      if (error.status === 401) {
        throw new Error('API key is invalid. Please check your configuration.');
      }

      // Exponential backoff for retries
      if (error.status === 429 || error.status >= 500) {
        const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      throw error;
    }
  }

  throw new Error(`Failed after ${maxRetries} attempts: ${lastError?.message}`);
}

// Mock response for development
function mockExtraction(educationLevel: GradeLevel): Promise<AIExtractionResponse> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        questionText: '1. 下列物质中，属于纯净物的是（  ）\nA. 空气\nB. 盐水\nC. 蒸馏水\nD. 矿泉水',
        confidence: 0.95,
        noiseFiltered: true,
        errorMessage: null,
        educationLevel
      });
    }, 1500); // Simulate network delay
  });
}
```

### Step 5: Implement localStorage Operations

**File**: `src/lib/storage/questions.ts`

See [data-model.md](./data-model.md) for complete schema and CRUD operations.

```typescript
import { Question } from '@/types/question';
import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEY = 'incorrect-questions-data';

export function getAllQuestions(): Question[] {
  if (typeof window === 'undefined') return [];

  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) return [];

  const schema = JSON.parse(data);
  return Object.values(schema.questions);
}

export function createQuestion(questionData: Omit<Question, 'id'>): string {
  const id = uuidv4();
  const question: Question = { ...questionData, id };

  // Save to localStorage
  const schema = getSchema();
  schema.questions[id] = question;
  schema.metadata.totalQuestions++;
  schema.metadata.lastModified = new Date().toISOString();
  saveSchema(schema);

  return id;
}

// Add other CRUD functions (getQuestionById, updateQuestion, deleteQuestion)
// See data-model.md for complete implementation
```

### Step 6: Create Upload UI Component

**File**: `src/components/upload/ImageUploader.tsx`

```typescript
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { extractQuestionFromImage } from '@/lib/ai/extraction';
import { createQuestion } from '@/lib/storage/questions';

export function ImageUploader() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>('');
  const [extractedText, setExtractedText] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate file
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(selectedFile.type)) {
      alert('Please upload an image file (JPEG, PNG, or WebP).');
      return;
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      alert('Image is too large. Please use an image under 5MB.');
      return;
    }

    setFile(selectedFile);

    // Generate preview
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(selectedFile);

    // Extract text
    await extractText(selectedFile);
  };

  const extractText = async (file: File) => {
    setIsProcessing(true);
    try {
      const base64 = await fileToBase64(file);
      const result = await extractQuestionFromImage(base64, 'middle');

      if (result.errorMessage) {
        alert(result.errorMessage);
      } else {
        setExtractedText(result.questionText);
      }
    } catch (error) {
      alert('Failed to extract text. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirm = () => {
    if (!file || !extractedText) return;

    // Save to localStorage
    createQuestion({
      imageBase64: preview,
      extractedText,
      fileSize: file.size,
      fileFormat: file.type,
      uploadTimestamp: new Date().toISOString(),
      confirmedAt: new Date().toISOString(),
      processingStatus: 'success',
      confidence: 0.95,
      noiseFiltered: true,
      errorMessage: null,
    });

    alert('Great! Your question is saved.');
    // Reset form
    setFile(null);
    setPreview('');
    setExtractedText('');
  };

  return (
    <div className="space-y-4">
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileSelect}
        className="block w-full text-sm"
      />

      {preview && (
        <div className="space-y-4">
          <img src={preview} alt="Preview" className="max-w-md" />

          {isProcessing ? (
            <p>Processing...</p>
          ) : extractedText ? (
            <>
              <div className="p-4 border rounded">
                <h3 className="font-bold mb-2">Extracted Question:</h3>
                <p className="whitespace-pre-wrap">{extractedText}</p>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleConfirm}>Confirm & Save</Button>
                <Button variant="outline" onClick={() => extractText(file!)}>
                  Retry Scan
                </Button>
              </div>
              <p className="text-sm text-gray-500">
                Coming Soon: Manual Correction
              </p>
            </>
          ) : null}
        </div>
      )}
    </div>
  );
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
```

### Step 7: Create Upload Page

**File**: `src/app/upload/page.tsx`

```typescript
import { ImageUploader } from '@/components/upload/ImageUploader';

export default function UploadPage() {
  return (
    <main className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Upload Question</h1>
      <ImageUploader />
    </main>
  );
}
```

## Running the Application

### Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000/upload](http://localhost:3000/upload)

### Test the Upload Flow

1. Select an image file (JPEG, PNG, or WebP under 5MB)
2. Wait for AI extraction (mock response if no API key)
3. Review extracted text
4. Click "Confirm & Save" or "Retry Scan"
5. Question saved to localStorage

### Verify localStorage

Open browser DevTools → Application → Local Storage → `localhost:3000`

Look for `incorrect-questions-data` key with JSON data.

## Development Tips

### Use Mock Responses

If you don't have an API key yet, the system will automatically use mock responses:

```typescript
// In src/lib/ai/extraction.ts
if (!process.env.NEXT_PUBLIC_DASHSCOPE_API_KEY) {
  return mockExtraction(educationLevel);
}
```

### Debug AI Responses

Add logging to see AI responses:

```typescript
console.log('AI Response:', response.choices[0]?.message?.content);
```

### Test Different Education Levels

```typescript
// Change education level in ImageUploader
const result = await extractQuestionFromImage(base64, 'high');
```

### Clear localStorage

```typescript
// In browser console
localStorage.clear();
```

## Common Issues

### Issue: "API key is invalid"

**Solution**: Double-check `.env.local` has correct key format:
```
DASHSCOPE_API_KEY=sk-xxxxxxxxxxxxxxxx
```

Restart dev server after adding/changing env variables.

### Issue: "localStorage is not defined"

**Solution**: Ensure storage operations only run client-side:
```typescript
if (typeof window === 'undefined') return;
```

### Issue: Images not displaying

**Solution**: Check base64 encoding includes data URL prefix:
```typescript
`data:image/jpeg;base64,${base64String}`
```

### Issue: "Rate limit exceeded"

**Solution**: Implement exponential backoff (already in `extraction.ts`) or reduce request frequency.

## Next Steps

1. ✅ Complete basic upload flow
2. ⬜ Add questions list page (`src/app/questions/page.tsx`)
3. ⬜ Implement retry functionality
4. ⬜ Add "Coming Soon: Manual Correction" UI
5. ⬜ Optimize image compression
6. ⬜ Add loading states and animations
7. ⬜ Test with real question images
8. ⬜ Refine AI prompts based on accuracy

## Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Alibaba Cloud DashScope](https://help.aliyun.com/zh/model-studio/)
- [OpenAI SDK](https://github.com/openai/openai-node)

## Support

For issues or questions:
1. Check [spec.md](./spec.md) for feature requirements
2. Review [research.md](./research.md) for technical decisions
3. Consult [data-model.md](./data-model.md) for schema details
4. Check [contracts/ai-extraction-api.md](./contracts/ai-extraction-api.md) for API integration
