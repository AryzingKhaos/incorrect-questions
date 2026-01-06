# Implementation Plan: Question Image Upload & Text Extraction

**Branch**: `001-image-text-extraction` | **Date**: 2026-01-06 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/001-image-text-extraction/spec.md`

## Summary

Students upload images of incorrect questions. The system extracts question text using Alibaba's Qwen-Plus AI model (via OpenAI SDK), displays extracted text with original image for user confirmation, allows retry if extraction is incorrect, and saves confirmed questions to browser localStorage. The feature includes a "Coming Soon: Manual Correction" placeholder for future editing functionality.

**Technical Approach**: Frontend-only React/Next.js application using Tailwind CSS + shadcn/ui components, Alibaba Qwen-Plus API for vision-to-text extraction via OpenAI SDK, client-side image processing, and localStorage for persistence.

## Technical Context

**Language/Version**: TypeScript 5.x with React 18+ / Next.js 14+
**Primary Dependencies**:
- React 18+ or Next.js 14+ (frontend framework)
- Tailwind CSS 3.x (styling)
- shadcn/ui (component library)
- openai SDK (for Alibaba Qwen-Plus API access)
- Browser File API (image upload)
- localStorage API (data persistence)

**Storage**: Browser localStorage (no backend database)
**Testing**: Optional for this feature (no tests required per constitution unless explicitly requested)
**Target Platform**: Modern web browsers (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+) on mobile, tablet, and desktop
**Project Type**: Web application (frontend-only)
**Performance Goals**:
- Image upload and AI extraction response within 5 seconds
- Support up to 50 stored questions without performance degradation
- Responsive UI on all screen sizes (320px to 2560px+)

**Constraints**:
- Client-side only (no backend API for data storage)
- localStorage quota management (~5-10MB for images and text)
- Image size limit: 5MB per file
- AI API rate limits (Alibaba Qwen-Plus API limits apply)

**Scale/Scope**:
- Target: Individual students managing 50-100 questions locally
- Single-user experience (no multi-user or sync features)
- Mobile-first responsive design

**AI Integration Details**:
- Model: Qwen-Plus (Alibaba Cloud)
- API Endpoint: `https://dashscope.aliyuncs.com/compatible-mode/v1`
- SDK: OpenAI SDK (compatible mode)
- API Key: `process.env.DASHSCOPE_API_KEY` (to be configured by user)
- Vision capability: Image-to-text extraction with structured output

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Principle I: LocalStorage-First Data Management ✅

**Status**: COMPLIANT

- Feature stores all question data in browser localStorage
- No backend API calls for data persistence
- localStorage schema includes versioning for future migrations
- Graceful handling of quota exceeded errors

### Principle II: Component Framework (Tailwind CSS + shadcn/ui) ✅

**Status**: COMPLIANT

- All UI components built with Tailwind CSS utility classes
- shadcn/ui used for Button, Card, Dialog, Toast, and form components
- No alternative component libraries introduced

### Principle III: Student-Centric UX Design ✅

**Status**: COMPLIANT

- Clear, student-friendly language in all UI text and error messages
- Visual feedback during upload and processing (loading states)
- Mobile-responsive design with Tailwind breakpoints
- Simple workflow: upload → confirm → save (minimal steps)
- Encouraging messaging (e.g., "Great! Your question is saved.")

### Principle IV: AI Integration Pattern (Prompt-First, Implementation-Later) ✅

**Status**: COMPLIANT

- AI prompts defined as constants with detailed comments
- Expected input/output structure documented
- Placeholder/mock responses during development
- Clear TODO markers for AI API integration points
- Prompts designed to be adjustable for education levels (elementary/middle/high school)

**Gate Result**: ✅ PASS - All constitutional principles satisfied

## Project Structure

### Documentation (this feature)

```text
specs/001-image-text-extraction/
├── plan.md              # This file
├── research.md          # Phase 0: Technical decisions and AI prompt design
├── data-model.md        # Phase 1: localStorage schema
├── quickstart.md        # Phase 1: Setup and development guide
└── contracts/           # Phase 1: AI API contracts and prompt specifications
    └── ai-extraction-api.md
```

### Source Code (repository root)

This is a frontend-only web application. Project structure follows Next.js/React conventions:

```text
src/
├── app/                          # Next.js app router (or pages/ for React)
│   ├── upload/                   # Upload page route
│   └── questions/                # Questions list/management page
├── components/                   # React components
│   ├── ui/                       # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   └── toast.tsx
│   ├── upload/                   # Upload-specific components
│   │   ├── ImageUploader.tsx    # File input and preview
│   │   ├── ConfirmationView.tsx # Show image + extracted text
│   │   └── RetryButton.tsx      # Retry extraction button
│   └── questions/                # Question management components
│       └── QuestionCard.tsx     # Display saved questions
├── lib/                          # Utility libraries
│   ├── ai/                       # AI integration
│   │   ├── prompts.ts            # AI prompt constants
│   │   ├── client.ts             # OpenAI SDK client setup
│   │   └── extraction.ts         # Image extraction logic
│   ├── storage/                  # localStorage management
│   │   ├── schema.ts             # Data schema types
│   │   ├── questions.ts          # Question CRUD operations
│   │   └── migration.ts          # Schema version management
│   └── validation/               # Input validation
│       └── imageValidator.ts     # File type/size validation
├── types/                        # TypeScript type definitions
│   ├── question.ts               # Question entity types
│   └── ai.ts                     # AI response types
└── config/                       # Configuration files
    └── env.ts                    # Environment variable access

public/
└── images/                       # Static assets (icons, placeholders)

.env.local                        # Environment variables (API keys)
package.json                      # Dependencies
tsconfig.json                     # TypeScript configuration
tailwind.config.js                # Tailwind CSS configuration
next.config.js                    # Next.js configuration (if using Next.js)
```

**Structure Decision**: Selected **Option 2: Web application (frontend-only variant)**. Since this is a client-side-only application with no backend, we use a simplified frontend structure. Next.js is recommended for built-in routing, image optimization, and developer experience, but plain React is also viable. The `src/` directory contains all application code organized by feature domain (upload, questions) and cross-cutting concerns (AI, storage, validation).

## Complexity Tracking

> **No constitutional violations** - This section is empty as the feature complies with all principles.

## Phase 0: Research (to be completed in research.md)

The following research tasks will be documented in `research.md`:

1. **AI Vision API Integration**
   - Alibaba Qwen-Plus API capabilities for image-to-text extraction
   - OpenAI SDK compatibility mode setup
   - Vision API best practices for OCR and text extraction
   - Handling rotated/skewed images
   - Error handling and retry strategies

2. **Prompt Engineering for Question Extraction**
   - Crafting prompts to extract ONLY question text (filter student answers)
   - Structured output format (JSON with confidence scores)
   - Handling multiple questions in one image
   - Filtering noise (headers, page numbers, annotations)
   - Adapting prompts for different education levels

3. **Image Processing Best Practices**
   - Client-side image compression techniques
   - Base64 vs Blob URL storage for localStorage
   - Image format conversion (if needed)
   - Memory management for large images

4. **localStorage Architecture**
   - Schema design with versioning
   - Quota management and compression strategies
   - CRUD operations with error handling
   - Migration strategy for schema updates

5. **shadcn/ui Component Selection**
   - Identify required components (Button, Card, Dialog, Toast, FileInput)
   - Installation and configuration
   - Tailwind CSS customization for student-friendly design

## Phase 1: Design (to be completed in data-model.md, contracts/, quickstart.md)

### Data Model (data-model.md)

Define localStorage schema for:
- **Question** entity with all fields from spec
- **Upload Session** entity
- **Schema Version** metadata
- CRUD operation interfaces
- Migration utilities

### Contracts (contracts/ai-extraction-api.md)

Document:
- OpenAI SDK client configuration for Qwen-Plus
- Image encoding format (base64)
- Request structure (messages array with image and prompt)
- Response structure (extracted text, confidence, metadata)
- Detailed AI prompts with examples
- Error response formats
- Rate limiting handling

### Quickstart Guide (quickstart.md)

Provide:
- Project setup instructions (clone, install dependencies)
- Environment variable configuration (`.env.local` with `DASHSCOPE_API_KEY`)
- Development server startup
- Running the upload flow end-to-end
- Testing with sample question images
- Debugging tips for AI integration

## Implementation Notes

### AI Prompt Strategy

The AI prompt must be meticulously crafted to achieve high extraction quality. Key requirements:

1. **Clear Instructions**: Explicitly state to extract ONLY the question, excluding answers
2. **Structured Output**: Request JSON format with `{ questionText: string, confidence: number, noiseFiltered: boolean }`
3. **Context Awareness**: Mention that the image is from a student's homework/exam
4. **Edge Case Handling**: Instruct what to do if multiple questions or no question found
5. **Education Level**: Optional parameter to adjust language complexity

**Example Prompt Template** (to be refined in research.md):

```
You are an AI assistant helping students digitize their incorrect questions for review.

Analyze the provided image and extract ONLY the question text. Do NOT include:
- Student's handwritten or typed answers
- Other questions on the same page
- Page numbers, headers, or footers
- Instructions or metadata

If multiple questions appear, extract only the FIRST complete question.
If no clear question is found, respond with an error message.

Return your response in JSON format:
{
  "questionText": "The extracted question text",
  "confidence": 0.95,  // Your confidence score (0-1)
  "noiseFiltered": true,  // Whether you removed extraneous content
  "errorMessage": null  // Or describe why extraction failed
}

Image context: [Elementary/Middle/High School] level student homework/exam question.
```

### Development Phases (Recommended Order)

Per constitution Development Workflow, implement in this order:

**Phase 1 - Core Upload & Storage** (US1):
1. Basic image upload UI with file input
2. Image validation (format, size)
3. Display uploaded image preview
4. localStorage schema setup
5. Save/retrieve questions from localStorage

**Phase 2 - AI Prompt Definitions** (US1 + US2):
6. Define AI prompt constants
7. OpenAI SDK client setup (with mock responses initially)
8. Confirmation view with extracted text display
9. "Confirm & Save" and "Retry Scan" buttons
10. "Coming Soon: Manual Correction" placeholder

**Phase 3 - Error Handling** (US3):
11. File validation error messages
12. localStorage quota error handling
13. AI extraction failure handling
14. Retry logic for failed extractions

**Phase 4 - AI Integration** (when API key available):
15. Replace mock responses with actual Qwen-Plus API calls
16. Test with real question images
17. Refine prompts based on extraction quality
18. Handle rate limiting and API errors

**Phase 5 - Polish**:
19. Loading states and animations
20. Mobile responsive adjustments
21. Accessibility improvements
22. Performance optimization (image compression)

## Next Steps

1. Complete Phase 0 research → `research.md`
2. Generate data model → `data-model.md`
3. Define AI API contracts → `contracts/ai-extraction-api.md`
4. Write quickstart guide → `quickstart.md`
5. Update agent context with React, Next.js, Qwen-Plus, OpenAI SDK
6. Re-evaluate Constitution Check after design
7. Proceed to task generation with `/speckit.tasks`
