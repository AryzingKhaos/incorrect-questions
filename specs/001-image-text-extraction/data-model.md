# Data Model: Question Image Upload & Text Extraction

**Date**: 2026-01-06
**Feature**: 001-image-text-extraction

This document defines the localStorage data schema, TypeScript interfaces, and CRUD operations for the question extraction feature.

## Schema Overview

The application uses browser localStorage to persist all question data. The schema includes versioning to support future migrations.

### Storage Keys

| Key | Purpose | Type |
|-----|---------|------|
| `incorrect-questions-data` | Main data storage (all questions and metadata) | JSON string |
| `incorrect-questions-schema-version` | Current schema version | String (semver) |

## TypeScript Interfaces

### LocalStorageSchema

Root schema for all persisted data.

```typescript
interface LocalStorageSchema {
  version: '1.0.0';
  questions: Record<string, Question>; // Keyed by question ID
  metadata: StorageMetadata;
}

interface StorageMetadata {
  createdAt: string; // ISO 8601 timestamp of first use
  lastModified: string; // ISO 8601 timestamp of last write
  totalQuestions: number; // Count of questions in storage
}
```

### Question Entity

Represents a single extracted question with all associated data.

```typescript
interface Question {
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

type ProcessingStatus = 'pending' | 'success' | 'failed';
type GradeLevel = 'elementary' | 'middle' | 'high';
```

### AI Response Types

Data structures for AI API interactions.

```typescript
interface AIExtractionRequest {
  imageBase64: string; // Base64-encoded image
  educationLevel: GradeLevel; // Target education level for prompt adjustment
}

interface AIExtractionResponse {
  questionText: string; // Extracted question text
  confidence: number; // Confidence score (0.0 - 1.0)
  noiseFiltered: boolean; // Whether noise was removed
  errorMessage: string | null; // Error message if extraction failed
  educationLevel: GradeLevel; // Echo back for validation
}
```

### Upload Session (In-Memory Only)

Transient state for active upload flow. NOT persisted to localStorage.

```typescript
interface UploadSession {
  sessionId: string; // UUID v4 for tracking
  file: File; // Original file object
  imagePreviewUrl: string; // Blob URL or base64 for preview
  uploadTimestamp: string; // ISO 8601
  status: 'uploading' | 'validating' | 'extracting' | 'confirming' | 'complete' | 'error';
  errorMessage: string | null;
}
```

## Data Relationships

```
LocalStorageSchema
├── version: "1.0.0"
├── questions: Record<string, Question>
│   ├── [questionId1]: Question { ... }
│   ├── [questionId2]: Question { ... }
│   └── [questionId3]: Question { ... }
└── metadata: StorageMetadata
    ├── createdAt: "2026-01-06T10:00:00Z"
    ├── lastModified: "2026-01-06T14:30:00Z"
    └── totalQuestions: 3
```

## CRUD Operations

### Initialization

Initialize storage on first app load.

```typescript
function initializeStorage(): LocalStorageSchema {
  const existingData = localStorage.getItem('incorrect-questions-data');

  if (existingData) {
    // Data exists, validate version
    const schema: LocalStorageSchema = JSON.parse(existingData);
    const storedVersion = schema.version;

    if (storedVersion !== '1.0.0') {
      // Future: Trigger migration
      throw new Error(`Schema migration needed: ${storedVersion} → 1.0.0`);
    }

    return schema;
  }

  // First-time initialization
  const newSchema: LocalStorageSchema = {
    version: '1.0.0',
    questions: {},
    metadata: {
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      totalQuestions: 0,
    },
  };

  localStorage.setItem('incorrect-questions-data', JSON.stringify(newSchema));
  localStorage.setItem('incorrect-questions-schema-version', '1.0.0');

  return newSchema;
}
```

### Create (Add Question)

Add a new question after AI extraction (before user confirmation).

```typescript
function createQuestion(
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
```

### Read (Get Questions)

Retrieve questions with optional filtering.

```typescript
// Get all questions
function getAllQuestions(): Question[] {
  const schema = getSchema();
  return Object.values(schema.questions);
}

// Get single question by ID
function getQuestionById(id: string): Question | null {
  const schema = getSchema();
  return schema.questions[id] || null;
}

// Get questions by status
function getQuestionsByStatus(status: ProcessingStatus): Question[] {
  const schema = getSchema();
  return Object.values(schema.questions).filter(q => q.processingStatus === status);
}

// Get confirmed questions (ready for practice)
function getConfirmedQuestions(): Question[] {
  const schema = getSchema();
  return Object.values(schema.questions)
    .filter(q => q.confirmedAt !== null)
    .sort((a, b) => new Date(b.confirmedAt!).getTime() - new Date(a.confirmedAt!).getTime());
}
```

### Update (Modify Question)

Update question fields (typically after user confirmation or retry).

```typescript
// Confirm a question (user clicked "Confirm & Save")
function confirmQuestion(id: string): void {
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

// Update extraction result (after retry)
function updateExtraction(id: string, extractionResponse: AIExtractionResponse): void {
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

// Generic update (for flexibility)
function updateQuestion(id: string, updates: Partial<Question>): void {
  const schema = getSchema();

  if (!schema.questions[id]) {
    throw new Error(`Question not found: ${id}`);
  }

  schema.questions[id] = {
    ...schema.questions[id],
    ...updates,
  };
  schema.metadata.lastModified = new Date().toISOString();

  saveSchema(schema);
}
```

### Delete (Remove Question)

Remove a question from storage.

```typescript
function deleteQuestion(id: string): void {
  const schema = getSchema();

  if (!schema.questions[id]) {
    throw new Error(`Question not found: ${id}`);
  }

  delete schema.questions[id];
  schema.metadata.totalQuestions--;
  schema.metadata.lastModified = new Date().toISOString();

  saveSchema(schema);
}

// Delete all questions (clear storage)
function clearAllQuestions(): void {
  const schema = getSchema();
  schema.questions = {};
  schema.metadata.totalQuestions = 0;
  schema.metadata.lastModified = new Date().toISOString();

  saveSchema(schema);
}
```

## Utility Functions

### Schema Access

```typescript
function getSchema(): LocalStorageSchema {
  const data = localStorage.getItem('incorrect-questions-data');

  if (!data) {
    return initializeStorage();
  }

  return JSON.parse(data) as LocalStorageSchema;
}

function saveSchema(schema: LocalStorageSchema): void {
  try {
    localStorage.setItem('incorrect-questions-data', JSON.stringify(schema));
  } catch (error) {
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      throw new Error('Storage is full. Please delete old questions to make space.');
    }
    throw error;
  }
}
```

### Storage Metrics

```typescript
interface StorageMetrics {
  totalQuestions: number;
  confirmedQuestions: number;
  pendingQuestions: number;
  failedQuestions: number;
  estimatedSizeKB: number;
  percentUsed: number; // Estimated percentage of localStorage quota
}

async function getStorageMetrics(): Promise<StorageMetrics> {
  const schema = getSchema();
  const questions = Object.values(schema.questions);

  const dataString = localStorage.getItem('incorrect-questions-data') || '';
  const sizeBytes = new Blob([dataString]).size;
  const sizeKB = Math.round(sizeBytes / 1024);

  // Estimate localStorage quota (typically 5-10MB)
  const estimate = await navigator.storage?.estimate();
  const quotaBytes = estimate?.quota || 10 * 1024 * 1024; // Default 10MB
  const percentUsed = (sizeBytes / quotaBytes) * 100;

  return {
    totalQuestions: schema.metadata.totalQuestions,
    confirmedQuestions: questions.filter(q => q.confirmedAt !== null).length,
    pendingQuestions: questions.filter(q => q.processingStatus === 'pending').length,
    failedQuestions: questions.filter(q => q.processingStatus === 'failed').length,
    estimatedSizeKB: sizeKB,
    percentUsed: Math.round(percentUsed * 100) / 100,
  };
}
```

## Validation Rules

### Question Validation

```typescript
function validateQuestion(question: Partial<Question>): string[] {
  const errors: string[] = [];

  // Required fields
  if (!question.imageBase64) {
    errors.push('Image data is required');
  }

  if (!question.extractedText && question.processingStatus === 'success') {
    errors.push('Extracted text is required for successful extractions');
  }

  // Confidence score range
  if (question.confidence !== undefined && (question.confidence < 0 || question.confidence > 1)) {
    errors.push('Confidence must be between 0 and 1');
  }

  // File size limits
  if (question.fileSize && question.fileSize > 5 * 1024 * 1024) {
    errors.push('File size exceeds 5MB limit');
  }

  // Valid file format
  const validFormats = ['image/jpeg', 'image/png', 'image/webp'];
  if (question.fileFormat && !validFormats.includes(question.fileFormat)) {
    errors.push(`Invalid file format: ${question.fileFormat}`);
  }

  return errors;
}
```

## Schema Migration (Future)

Placeholder for future schema version migrations.

```typescript
function migrateSchema(oldVersion: string, newVersion: string): LocalStorageSchema {
  let schema = getSchema();

  if (oldVersion === '1.0.0' && newVersion === '2.0.0') {
    // Example migration: Add new field to all questions
    Object.values(schema.questions).forEach(question => {
      // Apply transformations
      // (question as any).newField = defaultValue;
    });

    schema.version = '2.0.0' as any;
    localStorage.setItem('incorrect-questions-schema-version', '2.0.0');
  }

  saveSchema(schema);
  return schema;
}
```

## Example Data

### Sample Question (Success)

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "imageBase64": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD...",
  "fileSize": 245678,
  "fileFormat": "image/jpeg",
  "extractedText": "下列哪个选项是正确的？\nA. 水在100°C时沸腾\nB. 水在0°C时沸腾\nC. 水在50°C时沸腾\nD. 水在200°C时沸腾",
  "confidence": 0.98,
  "noiseFiltered": true,
  "processingStatus": "success",
  "errorMessage": null,
  "uploadTimestamp": "2026-01-06T10:15:30Z",
  "confirmedAt": "2026-01-06T10:15:45Z",
  "gradeLevel": "middle"
}
```

### Sample Question (Failed Extraction)

```json
{
  "id": "650e8400-e29b-41d4-a716-446655440001",
  "imageBase64": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD...",
  "fileSize": 102400,
  "fileFormat": "image/png",
  "extractedText": "",
  "confidence": 0.0,
  "noiseFiltered": false,
  "processingStatus": "failed",
  "errorMessage": "No question found in this image. Please try another photo.",
  "uploadTimestamp": "2026-01-06T11:20:00Z",
  "confirmedAt": null,
  "gradeLevel": "high"
}
```

## Implementation File Structure

Recommended organization for data model implementation:

```
src/lib/storage/
├── schema.ts          # TypeScript interfaces and types
├── questions.ts       # CRUD operations for Question entity
├── metrics.ts         # Storage metrics and monitoring
├── validation.ts      # Validation rules and utilities
└── migration.ts       # Schema versioning and migration logic
```

## Testing Considerations

While tests are optional per constitution, consider these test scenarios if implementing:

1. **CRUD Operations**: Create, read, update, delete questions
2. **Quota Handling**: Simulate QuotaExceededError
3. **Schema Migration**: Test version upgrades
4. **Data Integrity**: Validate JSON serialization/deserialization
5. **Concurrent Access**: Handle multiple tabs (if applicable)

## Next Steps

1. Implement TypeScript interfaces in `src/types/question.ts` and `src/types/ai.ts`
2. Implement CRUD functions in `src/lib/storage/questions.ts`
3. Implement storage metrics in `src/lib/storage/metrics.ts`
4. Create validation utilities in `src/lib/validation/`
5. Integrate with React components via custom hooks (e.g., `useQuestions()`, `useStorageMetrics()`)
