# Feature Specification: Question Image Upload & Text Extraction

**Feature Branch**: `001-image-text-extraction`
**Created**: 2026-01-06
**Status**: Draft
**Input**: User description: "用户上传图片文件，图片内容是学生的错题。然后你负责生成提示词，交给AI，让AI转换成纯文字。需要注意的是，可能包含有一些杂乱的信息，这部分要后续再考虑会有什么极端情况，但原则就是只保留一道完整的题，如果有学生的作答信息、其他题目的信息，都不保存。转换得到的纯文字保存。"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Upload Single Question Image (Priority: P1)

A student takes a photo of a question they got wrong in their homework or exam and uploads it to the app. The system processes the image, extracts the question text, and displays it for user confirmation. If the extraction is correct, the student confirms and saves it. If incorrect, the student can retry the extraction.

**Why this priority**: This is the foundational capability. Without the ability to capture and store individual questions, the entire app cannot function. This represents the core value proposition. User confirmation ensures data quality before saving.

**Independent Test**: Can be fully tested by uploading a clear image of a single question, verifying that the extracted text is displayed for confirmation, and checking that confirmed questions are saved in localStorage.

**Acceptance Scenarios**:

1. **Given** the student is on the upload page, **When** they select an image file containing a single question, **Then** the image is uploaded, text is extracted and displayed in a confirmation view
2. **Given** the extracted text is displayed, **When** the student reviews it, **Then** they see two options: "Confirm & Save" and "Retry Scan"
3. **Given** the extraction is correct, **When** the student clicks "Confirm & Save", **Then** the question is saved to localStorage and a success message is shown
4. **Given** the extraction is incorrect or incomplete, **When** the student clicks "Retry Scan", **Then** the extraction process runs again with the same image
5. **Given** the student is viewing extracted text, **When** they want to manually correct errors, **Then** they see a disabled edit button with text "Coming Soon: Manual Correction" indicating future functionality

---

### User Story 2 - Handle Noisy Question Images (Priority: P2)

A student uploads an image that contains the target question plus additional noise (other questions, student's handwritten answers, page numbers, headers). The system intelligently extracts only the complete target question and filters out irrelevant content.

**Why this priority**: Real-world photos often capture more than intended. Students may photograph an entire worksheet or page section. This feature improves usability by reducing manual cropping requirements.

**Independent Test**: Can be tested by uploading images with multiple questions or student annotations, then verifying only one complete question is extracted without student answers or other questions.

**Acceptance Scenarios**:

1. **Given** the uploaded image contains multiple questions, **When** text extraction occurs, **Then** the system extracts only one complete question and prompts the user if clarification is needed about which question to extract
2. **Given** the image includes student handwritten answers alongside the question, **When** extraction occurs, **Then** the system removes all student answer content and preserves only the original question text
3. **Given** the image has headers, page numbers, or other page elements, **When** processing completes, **Then** these extraneous elements are filtered out from the saved question

---

### User Story 3 - Validate and Handle Invalid Uploads (Priority: P3)

A student attempts to upload an invalid file (wrong format, too large, corrupted, or no readable question content). The system validates the upload and provides clear, student-friendly error messages.

**Why this priority**: Error handling improves user experience but is not critical for MVP functionality. Students can retry with valid images.

**Independent Test**: Can be tested by attempting various invalid uploads (oversized files, PDFs, blank images) and verifying appropriate error messages appear.

**Acceptance Scenarios**:

1. **Given** the student selects a file over 5MB, **When** attempting to upload, **Then** the system shows a friendly error message: "Image is too large. Please use an image under 5MB."
2. **Given** the student selects an unsupported format (PDF, DOC), **When** attempting to upload, **Then** the system displays: "Please upload an image file (JPEG, PNG, or WebP)."
3. **Given** the uploaded image is blank or contains no readable text, **When** extraction completes, **Then** the system shows: "No question found in this image. Please try another photo."

---

### Edge Cases

- What happens when the image is rotated or skewed? (System should handle common orientations; if text is unreadable, treat as "no readable text" scenario)
- What happens when the image contains both printed and handwritten text? (Focus on extracting printed question text; handwritten content is typically student answers and should be filtered)
- What happens when the question spans multiple pages or images? (Out of scope for this feature; assume single-page questions only)
- What happens when localStorage quota is exceeded? (Show error: "Storage is full. Please delete old questions to make space.")
- What happens if the same question is uploaded multiple times? (Allow duplicates for now; de-duplication is a future enhancement)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST accept image file uploads in JPEG, PNG, and WebP formats
- **FR-002**: System MUST validate uploaded files are under 5MB in size before processing
- **FR-003**: System MUST process uploaded images client-side (no backend API calls)
- **FR-004**: System MUST generate an AI prompt designed to extract question text from the image
- **FR-005**: System MUST define the expected structure for AI responses (extracted question text, confidence level, metadata)
- **FR-006**: System MUST implement placeholder/mock AI responses during development (actual AI integration will be added later when API keys are configured)
- **FR-007**: System MUST filter out student answers, other questions, and extraneous content, preserving only one complete question
- **FR-008**: System MUST display the extracted question text in a confirmation view with the original uploaded image for user verification
- **FR-009**: System MUST provide a "Confirm & Save" button that saves the extracted text to localStorage when clicked
- **FR-010**: System MUST provide a "Retry Scan" button that re-runs the extraction process on the same image when clicked
- **FR-011**: System MUST display a disabled "Edit" button (or similar UI element) with the text "Coming Soon: Manual Correction" to indicate planned future functionality
- **FR-012**: System MUST save confirmed question text to localStorage with a unique identifier and timestamp only after user confirmation
- **FR-013**: System MUST display visual feedback during upload and processing (loading indicator)
- **FR-014**: System MUST provide clear, student-friendly error messages for invalid uploads or processing failures
- **FR-015**: System MUST handle localStorage quota exceeded errors gracefully with actionable messages

### AI Prompt Requirements

- **FR-016**: AI prompt MUST instruct the model to extract only the question text, excluding all student answers and annotations
- **FR-017**: AI prompt MUST instruct the model to extract only ONE complete question, even if multiple questions appear in the image
- **FR-018**: AI prompt MUST request structured output including: extracted question text, confidence score, and indication of whether filtering was applied
- **FR-019**: AI prompt SHOULD be adjustable for different education levels (elementary, middle school, high school) to handle age-appropriate content

### Key Entities *(include if feature involves data)*

- **Question**: Represents a single extracted question from an uploaded image
  - Unique identifier (generated on save)
  - Original image (stored as base64 or blob URL in localStorage)
  - Extracted text (the cleaned question content)
  - Upload timestamp
  - Processing status (pending, success, failed)
  - Grade level (if specified by student; optional)
  - Subject (if specified or detected; optional)
  - Metadata (file size, format, extraction confidence)

- **Upload Session**: Represents a single upload transaction
  - Session ID
  - Upload timestamp
  - File metadata (name, size, format)
  - Processing status
  - Error messages (if any)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Students can upload a question image and see extracted text displayed for confirmation within 5 seconds (mock response during development)
- **SC-002**: Students can clearly see both the original image and extracted text side-by-side in the confirmation view
- **SC-003**: 90% of students successfully confirm and save extracted questions on their first attempt (indicating good extraction accuracy)
- **SC-004**: Students who encounter extraction errors can retry scanning and achieve successful extraction within 2-3 attempts
- **SC-005**: System correctly rejects invalid file formats and oversized files 100% of the time with appropriate error messages
- **SC-006**: Confirmed questions are successfully persisted to localStorage and retrievable after page refresh
- **SC-007**: The "Coming Soon: Manual Correction" indicator is clearly visible and understood by students (no confusion about why edit is disabled)
- **SC-008**: System handles up to 50 stored questions in localStorage without performance degradation (on typical student devices)

## Assumptions

- Students will primarily upload photos taken with mobile devices or screenshots
- Questions are predominantly printed text (textbooks, worksheets, exams); handwritten questions are secondary use case
- Each upload represents one question; multi-question extraction is out of scope for this feature
- AI prompt engineering will be refined iteratively based on mock response testing before actual AI integration
- localStorage capacity of ~5-10MB is sufficient for storing 50-100 questions (assuming compressed images and text)
- No user authentication or multi-device sync is required in this phase

## Out of Scope

- **Manual editing of extracted question text** (UI placeholder for "Coming Soon: Manual Correction" will be shown, but actual editing functionality is deferred to future release)
- Multi-question extraction from a single image (only one question per upload)
- Handwriting recognition for student-written questions (focus on printed text)
- Question categorization or tagging (handled by future features)
- AI integration with actual API keys (prompts defined, but mocked for now)
- Export or sharing of saved questions
- Undo/redo functionality for question management
- Batch upload of multiple images at once (only single image upload per transaction)
