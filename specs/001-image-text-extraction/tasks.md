# Tasks: Question Image Upload & Text Extraction

**Input**: Design documents from `specs/001-image-text-extraction/`
**Prerequisites**: plan.md (required), spec.md (required), data-model.md, contracts/ai-extraction-api.md

**Tests**: No tests required per constitution (testing is optional for this feature)

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app (frontend-only)**: `src/` at repository root
- Project uses Next.js/React structure with TypeScript

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [ ] T001 Initialize Next.js project with TypeScript, Tailwind CSS, and App Router
- [ ] T002 [P] Install dependencies: `openai`, `uuid`, `@types/uuid`
- [ ] T003 [P] Initialize shadcn/ui with `npx shadcn-ui@latest init`
- [ ] T004 [P] Install shadcn/ui components: button, card, dialog, toast, badge, skeleton
- [ ] T005 [P] Configure Tailwind CSS with student-friendly color palette in tailwind.config.js
- [ ] T006 Create project directory structure (src/app, src/components, src/lib, src/types, src/config)
- [ ] T007 [P] Create `.env.local` file with DASHSCOPE_API_KEY placeholder and add to .gitignore
- [ ] T008 [P] Configure next.config.js for environment variables (if using Next.js)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T009 [P] Create TypeScript types for Question entity in src/types/question.ts
- [ ] T010 [P] Create TypeScript types for AI responses in src/types/ai.ts
- [ ] T011 [P] Implement localStorage schema interface in src/lib/storage/schema.ts
- [ ] T012 Implement initializeStorage function in src/lib/storage/schema.ts
- [ ] T013 [P] Implement getSchema and saveSchema utilities in src/lib/storage/schema.ts
- [ ] T014 [P] Define AI system prompt constant in src/lib/ai/prompts.ts
- [ ] T015 [P] Define AI user prompt generator function in src/lib/ai/prompts.ts
- [ ] T016 [P] Configure OpenAI SDK client for Qwen-Plus in src/lib/ai/client.ts
- [ ] T017 [P] Create image validator utility in src/lib/validation/imageValidator.ts (validate format and size)

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Upload Single Question Image (Priority: P1) 🎯 MVP

**Goal**: Enable students to upload question images, see extracted text for confirmation, and save to localStorage

**Independent Test**: Upload a clear single-question image, verify extracted text displays with original image, confirm save to localStorage, verify retrieval after page refresh

### Implementation for User Story 1

- [ ] T018 [P] [US1] Implement createQuestion CRUD function in src/lib/storage/questions.ts
- [ ] T019 [P] [US1] Implement getAllQuestions CRUD function in src/lib/storage/questions.ts
- [ ] T020 [P] [US1] Implement getQuestionById CRUD function in src/lib/storage/questions.ts
- [ ] T021 [P] [US1] Implement confirmQuestion CRUD function in src/lib/storage/questions.ts
- [ ] T022 [US1] Implement extractQuestionFromImage with mock response in src/lib/ai/extraction.ts
- [ ] T023 [P] [US1] Create ImageUploader component with file input in src/components/upload/ImageUploader.tsx
- [ ] T024 [P] [US1] Create ConfirmationView component (display image + extracted text) in src/components/upload/ConfirmationView.tsx
- [ ] T025 [US1] Add file selection handler with validation to ImageUploader component
- [ ] T026 [US1] Add image preview display logic to ImageUploader component
- [ ] T027 [US1] Integrate AI extraction call in ImageUploader (calls extractQuestionFromImage)
- [ ] T028 [US1] Add loading state during extraction in ImageUploader component
- [ ] T029 [P] [US1] Implement "Confirm & Save" button in ConfirmationView (calls confirmQuestion)
- [ ] T030 [P] [US1] Implement "Retry Scan" button in ConfirmationView (calls extractQuestionFromImage again)
- [ ] T031 [P] [US1] Add disabled "Edit" button with "Coming Soon: Manual Correction" text in ConfirmationView
- [ ] T032 [US1] Add success toast notification after question save in ConfirmationView
- [ ] T033 [P] [US1] Create upload page in src/app/upload/page.tsx
- [ ] T034 [US1] Integrate ImageUploader component into upload page
- [ ] T035 [P] [US1] Add page title and instructions for students in upload page

**Checkpoint**: At this point, User Story 1 should be fully functional - students can upload, confirm, and save questions

---

## Phase 4: User Story 2 - Handle Noisy Question Images (Priority: P2)

**Goal**: Enable AI to intelligently filter noise (multiple questions, student answers, headers) and extract only one clean question

**Independent Test**: Upload images with multiple questions or student annotations, verify only one complete question extracted without noise

### Implementation for User Story 2

- [ ] T036 [US2] Enhance AI prompt in src/lib/ai/prompts.ts to handle multiple questions (extract first only)
- [ ] T037 [US2] Enhance AI prompt in src/lib/ai/prompts.ts to filter student answers and annotations
- [ ] T038 [US2] Enhance AI prompt in src/lib/ai/prompts.ts to remove headers, page numbers, footers
- [ ] T039 [US2] Update extractQuestionFromImage to parse noiseFiltered flag from AI response in src/lib/ai/extraction.ts
- [ ] T040 [US2] Add visual indicator in ConfirmationView when noise was filtered (badge or icon)
- [ ] T041 [US2] Test with sample noisy images and refine prompts based on extraction quality

**Checkpoint**: At this point, User Stories 1 AND 2 should both work - students can upload clean or noisy images successfully

---

## Phase 5: User Story 3 - Validate and Handle Invalid Uploads (Priority: P3)

**Goal**: Provide clear, student-friendly error messages for invalid uploads and graceful error handling

**Independent Test**: Attempt various invalid uploads (oversized files, PDFs, blank images) and verify appropriate error messages appear

### Implementation for User Story 3

- [ ] T042 [P] [US3] Add file size validation error message to imageValidator in src/lib/validation/imageValidator.ts
- [ ] T043 [P] [US3] Add file format validation error message to imageValidator in src/lib/validation/imageValidator.ts
- [ ] T044 [US3] Implement error display UI in ImageUploader for validation failures
- [ ] T045 [US3] Add error handling for AI extraction failures in ImageUploader component
- [ ] T046 [US3] Display student-friendly message when no question found ("No question found in this image. Please try another photo.")
- [ ] T047 [P] [US3] Implement localStorage quota exceeded error handler in src/lib/storage/questions.ts
- [ ] T048 [US3] Display quota exceeded error message in ImageUploader ("Storage is full. Please delete old questions to make space.")
- [ ] T049 [US3] Add retry-with-exponential-backoff logic for AI API errors in src/lib/ai/extraction.ts
- [ ] T050 [US3] Add error toast notifications for all error scenarios in ImageUploader

**Checkpoint**: All user stories should now be independently functional with comprehensive error handling

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories and final touches

- [ ] T051 [P] Implement compressImage function for oversized images in src/lib/validation/imageValidator.ts
- [ ] T052 [P] Create QuestionCard component for displaying saved questions in src/components/questions/QuestionCard.tsx
- [ ] T053 [P] Create questions list page in src/app/questions/page.tsx
- [ ] T054 Integrate getAllQuestions in questions list page to display saved questions
- [ ] T055 [P] Add navigation between upload and questions pages (navigation menu or links)
- [ ] T056 [P] Implement deleteQuestion CRUD function in src/lib/storage/questions.ts
- [ ] T057 Add delete functionality to QuestionCard component
- [ ] T058 [P] Add Skeleton loading component for AI extraction in ConfirmationView
- [ ] T059 [P] Improve mobile responsive layout for upload page (Tailwind breakpoints)
- [ ] T060 [P] Improve mobile responsive layout for questions list page
- [ ] T061 [P] Add helpful tooltips for "Coming Soon: Manual Correction" button
- [ ] T062 [P] Create storage metrics utility in src/lib/storage/metrics.ts (getStorageMetrics function)
- [ ] T063 Test end-to-end flow on mobile devices (upload, confirm, save, view)
- [ ] T064 Test localStorage persistence across page reloads and browser sessions
- [ ] T065 [P] Add loading spinner component during AI extraction
- [ ] T066 Test with actual Qwen-Plus API (once DASHSCOPE_API_KEY configured)
- [ ] T067 Refine AI prompts based on real extraction results and accuracy
- [ ] T068 [P] Add README.md with setup instructions and quickstart guide
- [ ] T069 [P] Create sample question images for testing (store in public/test-images/)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3, 4, 5)**: All depend on Foundational phase completion
  - User Story 1 (P1): Can start after Foundational (Phase 2) - No dependencies on other stories
  - User Story 2 (P2): Can start after Foundational (Phase 2) - Enhances US1 prompts but independently testable
  - User Story 3 (P3): Can start after Foundational (Phase 2) - Adds error handling to US1 flow but independently testable
- **Polish (Phase 6)**: Depends on at least US1 being complete (MVP)

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Refines US1 AI prompts but can be tested independently with noisy images
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - Adds error handling to US1 but can be tested independently with invalid files

### Within Each User Story

- Models/types created in Foundational phase
- Storage operations before UI components
- AI integration before UI displays results
- Core components before page integration
- Loading states and error handling after core functionality

### Parallel Opportunities

- **Setup Phase**: T002, T003, T004, T005, T007, T008 (all can run in parallel after T001)
- **Foundational Phase**: T009, T010, T011, T013, T014, T015, T016, T017 (can run in parallel after T012 completes)
- **User Story 1**:
  - T018, T019, T020, T021 (CRUD functions in parallel)
  - T023, T024 (UI components in parallel)
  - T029, T030, T031, T035 (independent UI elements in parallel)
- **User Story 3**: T042, T043, T047 (validation and error utilities in parallel)
- **Polish Phase**: T051, T052, T053, T055, T058, T059, T060, T061, T062, T065, T068, T069 (most polish tasks in parallel)

Once Foundational phase completes, all three user stories CAN be worked on in parallel by different team members if desired.

---

## Parallel Example: User Story 1 Core CRUD

```bash
# Launch all CRUD functions for User Story 1 together:
Task: "Implement createQuestion CRUD function in src/lib/storage/questions.ts"
Task: "Implement getAllQuestions CRUD function in src/lib/storage/questions.ts"
Task: "Implement getQuestionById CRUD function in src/lib/storage/questions.ts"
Task: "Implement confirmQuestion CRUD function in src/lib/storage/questions.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T008)
2. Complete Phase 2: Foundational (T009-T017) - **CRITICAL GATE**
3. Complete Phase 3: User Story 1 (T018-T035)
4. **STOP and VALIDATE**: Test User Story 1 independently with clear question images
5. Once US1 works, optionally add US2 and US3

**MVP Deliverable**: Students can upload clear question images, see extracted text (mock), confirm, and save to localStorage.

### Incremental Delivery

1. **Foundation** (Setup + Foundational) → All infrastructure ready
2. **US1** (Phase 3) → Test with clear images → **MVP COMPLETE** 🎯
3. **US2** (Phase 4) → Test with noisy images → Improved robustness
4. **US3** (Phase 5) → Test with invalid files → Full error handling
5. **Polish** (Phase 6) → Enhanced UX, questions list, delete functionality

Each user story adds value without breaking previous stories.

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together (blocking)
2. Once Foundational is done:
   - **Developer A**: User Story 1 (T018-T035)
   - **Developer B**: User Story 2 (T036-T041) - can mock US1 components
   - **Developer C**: User Story 3 (T042-T050) - can mock US1 components
3. Stories complete and integrate independently
4. **Team**: Polish phase together (T051-T069)

---

## Notes

- **[P] tasks** = different files, no dependencies (can run in parallel)
- **[Story] label** = maps task to specific user story for traceability
- Each user story should be independently completable and testable
- **Mock responses** are used until DASHSCOPE_API_KEY is configured
- Commit after each task or logical group of parallel tasks
- Stop at any checkpoint to validate story works independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
- **Focus on MVP**: Get US1 working first before adding US2/US3

---

## Task Count Summary

- **Phase 1 (Setup)**: 8 tasks
- **Phase 2 (Foundational)**: 9 tasks (BLOCKING)
- **Phase 3 (US1 - MVP)**: 18 tasks
- **Phase 4 (US2)**: 6 tasks
- **Phase 5 (US3)**: 9 tasks
- **Phase 6 (Polish)**: 19 tasks

**Total Tasks**: 69
**MVP Scope**: Phases 1-3 (35 tasks) for fully functional question upload and confirmation

**Parallel Opportunities**: ~40% of tasks marked [P] can run in parallel
**Independent Stories**: US1, US2, US3 can be implemented and tested independently after Foundational phase
