# Test Images for Question Extraction

This directory contains sample images for testing the question extraction feature with various noise scenarios.

## Test Scenarios for User Story 2 (Noisy Images)

### Scenario 1: Multiple Questions
**Expected Behavior**: AI extracts ONLY the first question, ignores subsequent questions
- Image should contain 2+ numbered questions (e.g., "1.", "2.", "3.")
- AI should extract only Question 1
- `noiseFiltered: true`

### Scenario 2: Student Answers Present
**Expected Behavior**: AI extracts question only, removes student's handwritten or typed answers
- Image shows a question with circled multiple choice answer (e.g., C is circled)
- Image shows handwritten solution work in margins
- AI should extract clean question without the answer markings
- `noiseFiltered: true`

### Scenario 3: Headers and Footers
**Expected Behavior**: AI removes page numbers, school names, dates, student names
- Image shows "Page 3 of 10" at top
- Image shows "Student Name: 张三" and "Date: 2024-01-15"
- AI should extract only the question content
- `noiseFiltered: true`

### Scenario 4: Student Annotations
**Expected Behavior**: AI filters out highlighting, underlining, margin notes
- Question text is highlighted in yellow
- Student wrote "?" or "check this" in margin
- Important parts are underlined
- AI extracts clean question text without annotations
- `noiseFiltered: true`

### Scenario 5: Teacher Marks
**Expected Behavior**: AI removes grades, check marks, red corrections
- Image shows "85/100" or "✓" mark
- Teacher's red pen corrections visible
- AI extracts original question only
- `noiseFiltered: true`

### Scenario 6: Mixed Content
**Expected Behavior**: AI isolates the question from surrounding content
- Image contains instructions like "Section A: Choose the best answer"
- Question appears among table of contents or other layout elements
- AI extracts only the actual question
- `noiseFiltered: true`

### Scenario 7: Clean Single Question (Baseline)
**Expected Behavior**: No filtering needed
- Image contains exactly one question with no distractions
- No student work, no headers/footers, no other questions
- `noiseFiltered: false`
- Confidence should be high (0.9+)

## Testing Instructions

1. **Manual Testing**: Upload each test image type through the upload page
2. **Verify Badge**: Check if "已智能过滤干扰内容" badge appears when appropriate
3. **Verify Text**: Confirm extracted text is clean and contains only the question
4. **Verify Confidence**: Check that confidence scores reflect image quality
5. **Verify Instructions**: When noise is filtered, check for enhanced instruction text

## Mock Response Testing

During development (without API key), the mock response simulates:
- A middle school chemistry question
- High confidence (0.95)
- Noise filtering enabled
- Clean extracted question text

To test with real API:
1. Configure `DASHSCOPE_API_KEY` in `.env.local`
2. Restart development server
3. Upload actual test images
4. Refine prompts based on extraction quality

## Sample Question Types to Test

- **Math**: Equations, diagrams, word problems
- **Science**: Diagrams, experiments, multiple choice
- **Language**: Reading comprehension, grammar questions
- **Social Studies**: Maps, timelines, essay prompts

## Notes

- Test images should be JPG or PNG format
- Recommended size: 500KB - 2MB
- Recommended resolution: 1024x768 or higher
- Take photos in good lighting for best results
