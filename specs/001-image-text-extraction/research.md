# Research: Question Image Upload & Text Extraction

**Date**: 2026-01-06
**Feature**: 001-image-text-extraction

This document consolidates research findings for technical decisions, AI prompt engineering, and implementation patterns for the question image extraction feature.

## 1. AI Vision API Integration

### Decision: Use Alibaba Qwen-Plus via OpenAI SDK

**Rationale**:
- Qwen-Plus provides strong vision-to-text capabilities suitable for OCR and document extraction
- OpenAI SDK compatibility mode allows familiar API patterns
- Cost-effective for student use case
- User has existing Alibaba Cloud account

**Implementation Details**:

```typescript
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.DASHSCOPE_API_KEY,
  baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1"
});

// Vision API call with image
const response = await client.chat.completions.create({
  model: "qwen-plus",
  messages: [
    {
      role: "system",
      content: "You are an AI assistant helping students extract questions from images."
    },
    {
      role: "user",
      content: [
        {
          type: "text",
          text: "[AI PROMPT - see section 2]"
        },
        {
          type: "image_url",
          image_url: {
            url: `data:image/jpeg;base64,${base64Image}`
          }
        }
      ]
    }
  ]
});
```

**Error Handling**:
- Network errors: Retry with exponential backoff (max 3 attempts)
- API rate limits: Display friendly message "Please wait a moment and try again"
- Invalid image: Detect early with client-side validation
- No API key: Show setup instructions

**Alternatives Considered**:
- **Tesseract.js** (client-side OCR): Rejected due to lower accuracy for Chinese/mixed-language questions
- **Google Cloud Vision API**: Rejected due to higher cost and additional account setup
- **Claude 3.5 with vision**: Rejected as user specified Alibaba Qwen-Plus

## 2. Prompt Engineering for Question Extraction

### System Prompt Design

**Core Requirements**:
1. Extract ONLY question text (exclude student answers)
2. Filter noise (headers, page numbers, other questions)
3. Return structured JSON output
4. Handle edge cases gracefully

### Optimized Prompt (Production Version)

```typescript
const EXTRACTION_SYSTEM_PROMPT = `You are an expert AI assistant helping students digitize their incorrect questions for review and practice. Your task is to extract question text from images of homework, exams, or worksheets with high precision.`;

const EXTRACTION_USER_PROMPT = (educationLevel: 'elementary' | 'middle' | 'high') => `
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
`;
```

### Prompt Variations by Education Level

**Elementary School** (ages 6-12):
- Simpler language
- More visual content (pictures, diagrams)
- Shorter questions
- Likely Chinese or bilingual content

**Middle School** (ages 12-15):
- Mixed complexity
- More text-heavy questions
- Introduction of formulas and scientific notation

**High School** (ages 15-18):
- Complex mathematical/scientific notation
- Multi-part questions
- English or mixed-language content

### Example Outputs

**Success Case**:
```json
{
  "questionText": "下列哪个选项是正确的？\nA. 水在100°C时沸腾\nB. 水在0°C时沸腾\nC. 水在50°C时沸腾\nD. 水在200°C时沸腾",
  "confidence": 0.98,
  "noiseFiltered": true,
  "errorMessage": null,
  "educationLevel": "middle"
}
```

**Error Case** (no question found):
```json
{
  "questionText": "",
  "confidence": 0.0,
  "noiseFiltered": false,
  "errorMessage": "No question found in this image. Please try another photo with a clear question.",
  "educationLevel": "middle"
}
```

### Testing Strategy

1. **Test with sample images**:
   - Single clear question → High confidence (>0.9)
   - Multiple questions → Extract first, confidence moderate (0.7-0.9)
   - Question with student's answer → Filter answer, confidence moderate
   - Blank/unclear image → Error message, confidence low (<0.5)

2. **Iterate on prompts**:
   - Monitor extraction accuracy
   - Refine based on common failure patterns
   - Add specific instructions for problematic cases

## 3. Image Processing Best Practices

### Storage Strategy: Base64 vs Blob URLs

**Decision: Use Base64 encoding for localStorage**

**Rationale**:
- Simpler serialization (direct JSON.stringify)
- No cleanup required (Blob URLs need manual revocation)
- Works across page reloads without file system dependencies
- Sufficient for target scale (50 questions ~5MB total)

**Trade-offs**:
- Base64 is ~33% larger than binary
- Acceptable given 5MB image limit and compression

### Image Compression

**Strategy**:
1. Check file size on upload
2. If > 2MB, compress client-side before storage
3. Use canvas API to resize/compress
4. Target: <500KB per image for localStorage efficiency

**Implementation**:

```typescript
async function compressImage(file: File, maxSizeMB: number = 0.5): Promise<string> {
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
        ctx?.drawImage(img, 0, 0, width, height);

        // Convert to JPEG with quality adjustment
        const base64 = canvas.toDataURL('image/jpeg', 0.8);
        resolve(base64);
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
```

### Rotation Handling

**Approach**: Let AI model handle rotation
- Modern vision models (Qwen-Plus) handle rotated images well
- Client-side rotation adds complexity
- If issues arise, add EXIF orientation detection

## 4. localStorage Architecture

### Schema Design with Versioning

**Version 1.0.0 Schema**:

```typescript
interface LocalStorageSchema {
  version: '1.0.0';
  questions: Record<string, Question>;
  metadata: {
    createdAt: string; // ISO timestamp
    lastModified: string;
    totalQuestions: number;
  };
}

interface Question {
  id: string; // UUID v4
  imageBase64: string; // Compressed base64 encoded image
  extractedText: string; // AI-extracted question text
  uploadTimestamp: string; // ISO timestamp
  confirmedAt: string | null; // When user confirmed (null if pending)
  processingStatus: 'pending' | 'success' | 'failed';
  errorMessage: string | null; // Error if processing failed

  // Optional metadata
  gradeLevel?: 'elementary' | 'middle' | 'high';
  subject?: string;
  confidence?: number; // AI confidence score
  noiseFiltered?: boolean; // Whether AI filtered noise

  // File metadata
  fileSize: number; // Original file size in bytes
  fileFormat: string; // 'image/jpeg', 'image/png', etc.
}
```

### CRUD Operations

**Storage Keys**:
- Main data: `incorrect-questions-data`
- Schema version: `incorrect-questions-schema-version`

**Operations**:

```typescript
// Get all questions
function getQuestions(): Question[] {
  const data = localStorage.getItem('incorrect-questions-data');
  if (!data) return [];
  const schema: LocalStorageSchema = JSON.parse(data);
  return Object.values(schema.questions);
}

// Add new question
function addQuestion(question: Omit<Question, 'id'>): string {
  const id = crypto.randomUUID();
  const data = getSchema();
  data.questions[id] = { ...question, id };
  data.metadata.totalQuestions++;
  data.metadata.lastModified = new Date().toISOString();
  saveSchema(data);
  return id;
}

// Update question (for confirmation or retry)
function updateQuestion(id: string, updates: Partial<Question>): void {
  const data = getSchema();
  if (!data.questions[id]) throw new Error('Question not found');
  data.questions[id] = { ...data.questions[id], ...updates };
  data.metadata.lastModified = new Date().toISOString();
  saveSchema(data);
}

// Delete question
function deleteQuestion(id: string): void {
  const data = getSchema();
  delete data.questions[id];
  data.metadata.totalQuestions--;
  data.metadata.lastModified = new Date().toISOString();
  saveSchema(data);
}
```

### Quota Management

**Strategy**:
1. Check available space before saving: `navigator.storage.estimate()`
2. If quota exceeded, show error: "Storage is full. Please delete old questions."
3. Provide "Clear All" functionality with confirmation dialog
4. Display storage usage indicator in UI (optional enhancement)

**Quota Calculation**:
- Assume ~5-10MB localStorage limit (varies by browser)
- Target: 50 questions × 100KB each = ~5MB
- Compression ensures we stay within limits

### Migration Strategy

**Future-proofing**:
```typescript
function migrateSchema(oldVersion: string, newVersion: string): void {
  // Example: Migrating from 1.0.0 to 2.0.0
  if (oldVersion === '1.0.0' && newVersion === '2.0.0') {
    const data = getSchema();
    // Apply transformations
    // ...
    data.version = '2.0.0';
    saveSchema(data);
  }
}

// Run on app initialization
function initializeStorage(): void {
  const currentVersion = '1.0.0';
  const storedVersion = localStorage.getItem('incorrect-questions-schema-version');

  if (!storedVersion) {
    // First-time initialization
    initializeNewSchema(currentVersion);
  } else if (storedVersion !== currentVersion) {
    // Migration needed
    migrateSchema(storedVersion, currentVersion);
  }
}
```

## 5. shadcn/ui Component Selection

### Required Components

Based on feature requirements, install these shadcn/ui components:

1. **Button** - "Confirm & Save", "Retry Scan", "Upload" buttons
2. **Card** - Display questions in list view
3. **Dialog** - Confirmation modals, error dialogs
4. **Toast** - Success/error notifications
5. **Input** - File input styling (if needed)
6. **Badge** - Status indicators (pending, success, failed)
7. **Skeleton** - Loading states during AI processing

### Installation Commands

```bash
npx shadcn-ui@latest init
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add toast
npx shadcn-ui@latest add badge
npx shadcn-ui@latest add skeleton
```

### Tailwind Customization for Student-Friendly Design

**Color Palette** (Add to `tailwind.config.js`):

```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        // Friendly, encouraging colors
        primary: {
          DEFAULT: '#3b82f6', // Bright blue
          light: '#60a5fa',
          dark: '#2563eb',
        },
        success: {
          DEFAULT: '#10b981', // Green
          light: '#34d399',
        },
        warning: {
          DEFAULT: '#f59e0b', // Orange
          light: '#fbbf24',
        },
        error: {
          DEFAULT: '#ef4444', // Red (gentle tone)
          light: '#f87171',
        },
        background: {
          DEFAULT: '#f9fafb', // Very light gray
          paper: '#ffffff',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'], // Clean, readable font
      },
    },
  },
};
```

**Typography**:
- Use larger font sizes (16px minimum for body text)
- Clear heading hierarchy
- Plenty of whitespace

**Interactive Elements**:
- Large touch targets (min 44px × 44px for mobile)
- Hover states with smooth transitions
- Disabled states clearly differentiated

## Summary of Key Decisions

| Area | Decision | Rationale |
|------|----------|-----------|
| AI Model | Alibaba Qwen-Plus via OpenAI SDK | Strong vision capabilities, cost-effective, user's preferred provider |
| Prompt Strategy | Structured JSON output with strict filtering rules | Ensures consistent extraction quality and easy parsing |
| Image Storage | Base64 encoding in localStorage | Simpler implementation, sufficient for scale (50 questions) |
| Compression | Client-side resize + JPEG quality 0.8 | Target <500KB per image for localStorage efficiency |
| localStorage Schema | Versioned schema with migration path | Future-proof for schema changes |
| UI Framework | shadcn/ui with Tailwind CSS | Accessible components, student-friendly customization |

## Open Questions & Future Research

1. **Handwriting Recognition**: Currently focused on printed text. If handwritten questions become common, consider:
   - Upgrading to a model with better handwriting support
   - Prompting user to prefer printed materials

2. **Multi-language Support**: Current prompts handle Chinese and English. If other languages needed:
   - Add language detection
   - Adjust prompts per language

3. **Offline Mode**: Currently requires internet for AI API. Future enhancement:
   - Cache AI responses for offline retry
   - Consider client-side OCR fallback (Tesseract.js)

4. **Performance Optimization**: If image processing becomes slow:
   - Use Web Workers for compression
   - Lazy-load images in question list

## Next Steps

1. Implement data model based on localStorage schema → `data-model.md`
2. Document AI API contract with prompt specifications → `contracts/ai-extraction-api.md`
3. Write setup guide for development environment → `quickstart.md`
4. Update agent context with chosen technologies
