# Incorrect Questions Constitution

<!--
Sync Impact Report:
Version change: Initial → 1.0.0
New constitution created for incorrect-questions project (student error analysis web app)
Modified principles: N/A (initial creation)
Added sections: All sections (initial creation)
Removed sections: N/A

Templates status:
✅ .specify/templates/spec-template.md - Compatible (no updates needed)
✅ .specify/templates/plan-template.md - Compatible (references Constitution Check)
✅ .specify/templates/tasks-template.md - Compatible (no updates needed)

Follow-up TODOs: None
-->

## Core Principles

### I. LocalStorage-First Data Management

All data persistence MUST use browser localStorage. No backend API calls for data storage.

**Rationale**: This project is explicitly scoped as a frontend-only application during initial development. All user data (uploaded questions, AI analysis results, knowledge point categorizations, practice history) MUST be stored in localStorage to eliminate backend dependencies and enable rapid prototyping.

**Rules**:
- MUST NOT implement backend API endpoints for data persistence
- MUST structure localStorage data with clear schema and versioning
- MUST handle localStorage quota limits gracefully
- SHOULD provide data export functionality for user data portability

### II. Component Framework: Tailwind CSS + shadcn/ui

All UI components MUST be built using Tailwind CSS for styling and shadcn/ui for component primitives.

**Rationale**: Establishes consistency in design system and component architecture. shadcn/ui provides accessible, customizable components that integrate seamlessly with Tailwind CSS, reducing custom component development overhead while maintaining design flexibility.

**Rules**:
- MUST use Tailwind CSS utility classes for all styling (no custom CSS files unless absolutely necessary)
- MUST source UI components from shadcn/ui library
- MUST NOT introduce alternative component libraries (Material-UI, Ant Design, etc.)
- SHOULD customize shadcn/ui components through Tailwind configuration when needed

### III. Student-Centric UX Design

The application MUST be designed for students (elementary, middle school, and high school levels) as primary users.

**Rationale**: Target audience is students aged approximately 6-18. UX must prioritize simplicity, clarity, and age-appropriate interactions. Complex workflows, technical jargon, or enterprise-style interfaces are inappropriate for this user base.

**Rules**:
- MUST use clear, simple language appropriate for student comprehension
- MUST provide visual feedback for all user actions (uploads, processing, results)
- MUST design mobile-responsive interfaces (students often use phones/tablets)
- SHOULD use encouraging, supportive messaging (avoid intimidating or overly formal tone)
- SHOULD minimize required steps in core workflows (upload → analyze → practice)

### IV. AI Integration Pattern: Prompt-First, Implementation-Later

All AI functionality MUST have well-defined prompts documented in code, even if AI integration is not yet active.

**Rationale**: The project roadmap includes AI integration after initial framework is established. By defining prompts early, we establish clear intent for AI features and enable rapid integration once API keys are configured.

**Rules**:
- MUST document AI prompts as constants or configuration files with descriptive comments
- MUST define expected input/output structure for AI calls
- MUST implement placeholder/mock responses for AI features during development
- MUST leave clear TODO markers for AI API integration points (e.g., `// TODO: Replace with actual AI API call once API key configured`)
- SHOULD structure prompts to be easily adjustable based on student education level (elementary/middle/high school)

**Example AI Features**:
1. **Image OCR & Question Parsing**: Extract question text from uploaded images
2. **Knowledge Point Analysis**: Identify subject areas, topics, and concepts from questions
3. **Similar Question Generation**: Create practice questions based on identified knowledge points

## Technical Constraints

### Data Schema Requirements

localStorage data MUST be structured with versioning to enable future migrations.

**Required Structures**:
- **Questions Collection**: Store uploaded question images (base64 or blob URLs), extracted text, metadata (upload date, subject, grade level)
- **Knowledge Points Collection**: Store analyzed knowledge points with relationships to questions
- **Practice Sessions**: Store user practice history, answers, and performance metrics
- **Schema Version**: Track data structure version for future migration support

### Image Handling

Image uploads MUST be processed client-side with appropriate size/format validation.

**Rules**:
- MUST support common image formats (JPEG, PNG, WebP)
- MUST validate file size before processing (recommend max 5MB per image)
- SHOULD compress images client-side if oversized
- MUST provide clear error messages for unsupported formats or sizes

### Responsive Design Targets

Application MUST be fully functional on mobile, tablet, and desktop viewports.

**Breakpoints** (Tailwind defaults):
- Mobile: 320px - 639px (sm)
- Tablet: 640px - 1023px (md/lg)
- Desktop: 1024px+ (xl/2xl)

## Development Workflow

### Feature Implementation Order

Features MUST be implemented in priority order to maximize early value delivery.

**Recommended Phases**:
1. **Phase 1 - Core Upload & Storage**: Image upload interface, localStorage persistence, gallery view
2. **Phase 2 - AI Prompt Definitions**: Define all AI prompts with mock responses, test data flow
3. **Phase 3 - Knowledge Point Management**: Manual tagging UI (to simulate AI results), filtering, search
4. **Phase 4 - Practice Mode**: Question display, answer input, results tracking
5. **Phase 5 - AI Integration**: Replace mocks with actual API calls once keys available

### Testing Requirements

Testing is OPTIONAL unless explicitly specified for a feature.

**When Tests ARE Required**:
- If feature spec explicitly requests tests
- If component handles critical data operations (localStorage read/write, data migration)
- If implementing complex state management or business logic

**When Tests Are NOT Required**:
- Simple presentational components
- Standard CRUD interfaces
- Basic routing and navigation

### Code Quality Standards

Code MUST be maintainable, but avoid premature optimization or over-engineering.

**Rules**:
- MUST use TypeScript for type safety (if project is TypeScript-based)
- MUST extract reusable components when same pattern appears 3+ times
- SHOULD add comments for complex business logic or AI prompt rationale
- MUST NOT add unnecessary abstractions, helper utilities, or design patterns for hypothetical future needs

## Governance

### Amendment Process

This constitution may be amended when project scope, technical requirements, or constraints change.

**Amendment Triggers**:
- Backend API integration is introduced (violates Principle I)
- Alternative component library is needed (violates Principle II)
- Target audience expands beyond students (affects Principle III)
- AI integration approach changes (affects Principle IV)

**Amendment Procedure**:
1. Identify constitutional principle that conflicts with new requirement
2. Document why existing principle cannot accommodate change
3. Propose updated principle or new section
4. Run `/speckit.constitution` with updated requirements
5. Review impact on existing templates and artifacts
6. Update all affected documentation before implementation

### Versioning

**Version**: 1.0.0 | **Ratified**: 2026-01-06 | **Last Amended**: 2026-01-06

**Semantic Versioning Rules**:
- **MAJOR**: Principle removal, redefinition, or constraint that breaks existing implementations
- **MINOR**: New principle added, section expanded with new mandatory rules
- **PATCH**: Clarifications, wording improvements, typo fixes, non-semantic refinements

### Compliance

All feature specifications, implementation plans, and code reviews MUST verify compliance with this constitution.

**Constitution Check Gates**:
- Before Phase 0 research: Verify feature aligns with principles
- After Phase 1 design: Re-check that technical approach respects constraints
- During implementation: Validate data patterns, component choices, AI integration approach
- Pre-merge review: Ensure no violations introduced

**Violation Handling**:
If implementation requires violating a principle, it MUST be documented in plan.md "Complexity Tracking" section with clear justification for why the principle cannot be followed and what alternatives were considered.
