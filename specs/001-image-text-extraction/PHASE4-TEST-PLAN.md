# Phase 4 Testing Plan: User Story 2 - Handle Noisy Question Images

**Feature**: Question Image Upload & Text Extraction
**Phase**: 4 (User Story 2 - P2)
**Goal**: Verify AI intelligently filters noise and extracts clean questions
**Date**: 2026-01-29

---

## Overview

Phase 4 enhances the AI extraction to handle real-world noisy images:
- Images with multiple questions
- Student answers and annotations
- Headers, footers, page numbers
- Teacher marks and grades

**Expected Outcome**: AI extracts ONLY the first clean question, sets `noiseFiltered: true`

---

## Implementation Changes

### 1. Enhanced AI Prompts (T036-T038)
- ✅ Added explicit instructions for multiple question handling
- ✅ Defined 6 noise types: student answers, annotations, headers/footers, instructional text, teacher marks, layout elements
- ✅ Added 5 noise detection scenarios with examples
- ✅ Enhanced confidence scoring guidelines
- ✅ Improved error messaging for failed extractions

**File**: `src/lib/ai/prompts.ts`

### 2. Extraction Function (T039)
- ✅ Already parses `noiseFiltered` flag from AI JSON response
- ✅ Handles retry logic with exponential backoff
- ✅ Falls back to mock response during development

**File**: `src/lib/ai/extraction.ts`

### 3. Visual Indicator (T040)
- ✅ Enhanced badge with shield icon: "已智能过滤干扰内容"
- ✅ Blue color scheme (bg-blue-100, text-blue-800) for visibility
- ✅ Conditional instruction text explaining what was filtered
- ✅ Appears alongside confidence badge

**File**: `src/components/upload/ConfirmationView.tsx`

---

## Test Scenarios

### Test 1: Multiple Questions ✓ PRIORITY
**Setup**: Upload image with 3 numbered questions (e.g., "1. ...", "2. ...", "3. ...")

**Expected**:
- Only Question 1 extracted
- `noiseFiltered: true`
- Blue "已智能过滤干扰内容" badge visible
- Instruction text mentions "多余题目"
- Confidence ≥ 0.7

**How to Verify**:
1. Check extracted text contains only first question
2. Verify no text from Question 2 or 3 appears
3. Confirm badge is displayed
4. Confidence score is reasonable

---

### Test 2: Student Answers Visible ✓ PRIORITY
**Setup**: Upload image showing:
- Multiple choice question with one option circled
- OR handwritten solution work in margins
- OR typed answer below question

**Expected**:
- Question extracted without the circled answer
- `noiseFiltered: true`
- Badge appears
- Options (A, B, C, D) included but markings removed

**How to Verify**:
1. Options text is present
2. No mention of "circled" or student work
3. Clean question format

---

### Test 3: Headers and Footers ✓
**Setup**: Upload image with:
- "Page 3 of 10" at top
- School name header
- Student name and date footer

**Expected**:
- Only question content extracted
- No page numbers, school name, student name, or date
- `noiseFiltered: true`

---

### Test 4: Student Annotations ✓
**Setup**: Upload image with:
- Yellow highlighting on question text
- Underlined words or phrases
- Margin notes like "?" or "重要"

**Expected**:
- Clean question text extracted
- No mention of highlights, underlines, or notes
- `noiseFiltered: true`

---

### Test 5: Teacher Marks ✓
**Setup**: Upload image with:
- Grade visible (e.g., "85/100" or "✓")
- Red pen corrections
- Teacher comments

**Expected**:
- Original question extracted (not the corrected version)
- No grades or teacher comments
- `noiseFiltered: true`

---

### Test 6: Mixed Content ✓
**Setup**: Upload image with:
- "Section A: Multiple Choice" instruction
- Question appears in a larger page layout
- Table of contents or other questions nearby

**Expected**:
- Only the target question isolated
- No section headers or instructions
- `noiseFiltered: true`

---

### Test 7: Clean Single Question (Baseline) ✓
**Setup**: Upload pristine image:
- Exactly one question
- No distractions, headers, or student work
- Professional formatting

**Expected**:
- Question extracted accurately
- `noiseFiltered: false` (no filtering needed)
- NO blue badge shown
- Standard instruction text
- High confidence (≥ 0.9)

---

### Test 8: Edge Cases ✓

#### 8a. Blank Image
**Expected**: `errorMessage: "图片中没有找到清晰的题目，请重新拍照"`

#### 8b. Oversized File (>10MB)
**Expected**: Validation error before AI extraction

#### 8c. Blurry/Low Quality
**Expected**: Low confidence (<0.6), possibly error message

#### 8d. Non-Chinese Question
**Expected**: Should work (AI is multilingual), but focus on Chinese for this feature

---

## Manual Testing Checklist

### Pre-Test Setup
- [ ] Ensure `.env.local` has `DASHSCOPE_API_KEY` (or run with mock mode)
- [ ] Start dev server: `npm run dev`
- [ ] Open browser to `http://localhost:3000/upload`

### During Testing
- [ ] Test Scenario 1: Multiple questions
- [ ] Test Scenario 2: Student answers
- [ ] Test Scenario 3: Headers/footers
- [ ] Test Scenario 4: Annotations
- [ ] Test Scenario 5: Teacher marks
- [ ] Test Scenario 6: Mixed content
- [ ] Test Scenario 7: Clean question (baseline)
- [ ] Test Scenario 8: Edge cases

### Visual Verification
- [ ] Blue "已智能过滤干扰内容" badge appears when appropriate
- [ ] Badge does NOT appear for clean images
- [ ] Shield icon renders correctly in badge
- [ ] Enhanced instruction text shows when noise filtered
- [ ] Confidence badge displays reasonable scores
- [ ] Responsive layout works on mobile (375px width)

### Functional Verification
- [ ] "确认并保存" button works after noise filtering
- [ ] "重新扫描" button allows retry with same image
- [ ] Success toast appears after save
- [ ] Questions saved to localStorage correctly
- [ ] Page refresh shows saved questions persist

---

## Mock Mode Testing

**Current Mock Response** (when no API key):
```json
{
  "questionText": "1. 下列物质中，属于纯净物的是（  ）\nA. 空气\nB. 盐水\nC. 蒸馏水\nD. 矿泉水",
  "confidence": 0.95,
  "noiseFiltered": true,
  "errorMessage": null,
  "educationLevel": "middle"
}
```

**Demonstrates**:
- ✅ Chinese middle school question
- ✅ Multiple choice format
- ✅ High confidence
- ✅ Noise filtering flag set
- ✅ Clean extraction

**Test in Mock Mode**:
1. Upload any valid image (JPG/PNG)
2. Verify badge appears (because `noiseFiltered: true`)
3. Verify extraction completes in ~1.5 seconds
4. Verify save functionality works

---

## Real API Testing (When Key Configured)

### Prerequisites
1. Add to `.env.local`:
   ```
   DASHSCOPE_API_KEY=sk-xxxxx
   ```
2. Restart dev server
3. Prepare actual test images

### API-Specific Tests
- [ ] Verify actual Qwen-Plus API integration
- [ ] Test with 10+ diverse images
- [ ] Measure average extraction time (should be <5s)
- [ ] Check API error handling (401, 429, 500)
- [ ] Verify retry logic with exponential backoff
- [ ] Monitor API costs and rate limits

### Prompt Refinement
If extraction quality is poor:
1. Collect failed examples
2. Analyze what AI extracted vs expected
3. Refine prompts in `src/lib/ai/prompts.ts`
4. Re-test same images
5. Document improvements

---

## Regression Testing (US1 Still Works)

After Phase 4 changes, verify User Story 1 still functions:
- [ ] Upload clean single question image
- [ ] Extraction completes successfully
- [ ] Confirmation view displays correctly
- [ ] Save to localStorage works
- [ ] Toast notifications appear
- [ ] Retry button functions
- [ ] Page refresh persists data

---

## Performance Benchmarks

### Target Metrics
- **Extraction Time**: <5 seconds per image
- **Mock Mode**: ~1.5 seconds (simulated)
- **Confidence Threshold**: ≥0.7 for "acceptable" quality
- **Noise Detection Rate**: ≥80% true positives

### How to Measure
1. Use browser DevTools Network tab
2. Time from upload to results display
3. Log confidence scores for 20+ test images
4. Calculate average, min, max

---

## Known Limitations

1. **AI Accuracy**: Not 100% perfect, depends on:
   - Image quality (lighting, resolution, focus)
   - Handwriting legibility
   - Question complexity

2. **Language Support**: Optimized for Chinese, may work for other languages

3. **Diagram Handling**: AI provides text descriptions, not visual extraction

4. **Manual Correction**: Not yet implemented (placeholder button shown)

---

## Success Criteria

Phase 4 is complete when:
- ✅ All 6 implementation tasks (T036-T041) marked done
- ✅ Build succeeds with no errors
- ✅ At least 3 noise scenarios tested and working
- ✅ Badge appears correctly for noisy images
- ✅ Badge does NOT appear for clean images
- ✅ User Story 1 still works (no regressions)
- ✅ Documentation updated (this test plan)

---

## Next Steps After Phase 4

Once Phase 4 testing is complete:
1. **Phase 5**: User Story 3 - Error handling and validation
2. **Phase 6**: Polish - questions list, delete, responsive design
3. **Real API Testing**: Configure DASHSCOPE_API_KEY and test with actual images
4. **User Acceptance**: Have students test with real homework photos

---

## Notes

- **Mock mode is sufficient** for Phase 4 completion
- Real API testing can be done later during Phase 6 polish
- Focus on UI/UX correctness: badge, instructions, confidence display
- Prompt engineering is iterative - refine as needed with real data
