'use client';

/**
 * ImageUploader Component
 * Feature: 001-image-text-extraction
 * Handles image file selection, validation, preview, and AI extraction
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { validateImage, fileToBase64 } from '@/lib/validation/imageValidator';
import { extractQuestionFromImage } from '@/lib/ai/extraction';
import { createQuestion, confirmQuestion } from '@/lib/storage/questions';
import { GradeLevel } from '@/types/question';
import { AIExtractionResponse } from '@/types/ai';
import { ConfirmationView } from './ConfirmationView';

export function ImageUploader() {
  // State management
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>('');
  const [extractedResult, setExtractedResult] = useState<AIExtractionResponse | null>(null);
  const [questionId, setQuestionId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [educationLevel, setEducationLevel] = useState<GradeLevel>('middle');

  /**
   * Handle file selection with validation (T025)
   */
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Reset state
    setError(null);
    setExtractedResult(null);
    setQuestionId(null);

    // Validate file (T025)
    const validation = validateImage(selectedFile);
    if (!validation.isValid) {
      setError(validation.errorMessage);
      return;
    }

    setFile(selectedFile);

    try {
      // Generate preview (T026)
      const base64 = await fileToBase64(selectedFile);
      setPreview(base64);

      // Trigger AI extraction (T027)
      await extractText(selectedFile, base64);
    } catch (err) {
      setError('Failed to process image. Please try again.');
      console.error('Image processing error:', err);
    }
  };

  /**
   * Extract text from image using AI (T027)
   * Includes loading state (T028)
   */
  const extractText = async (file: File, base64Preview: string) => {
    setIsProcessing(true);
    setError(null);

    try {
      // Call AI extraction
      const result = await extractQuestionFromImage(base64Preview, educationLevel);

      if (result.errorMessage) {
        setError(result.errorMessage);
        setExtractedResult(null);
        return;
      }

      // Create question in storage (pending confirmation)
      const id = createQuestion(
        base64Preview,
        file.size,
        file.type,
        result
      );

      setExtractedResult(result);
      setQuestionId(id);
    } catch (err: any) {
      setError(err.message || 'Failed to extract text. Please try again.');
      console.error('Extraction error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Handle retry extraction
   */
  const handleRetry = async () => {
    if (!file || !preview) return;
    await extractText(file, preview);
  };

  /**
   * Handle question confirmation and save
   */
  const handleConfirm = () => {
    if (!questionId) return;

    try {
      confirmQuestion(questionId);

      // Reset form after successful save
      setFile(null);
      setPreview('');
      setExtractedResult(null);
      setQuestionId(null);
      setError(null);

      // Clear file input
      const input = document.getElementById('image-upload') as HTMLInputElement;
      if (input) input.value = '';
    } catch (err: any) {
      setError(err.message || 'Failed to save question.');
    }
  };

  /**
   * Handle education level change
   */
  const handleEducationLevelChange = (level: GradeLevel) => {
    setEducationLevel(level);
  };

  return (
    <div className="space-y-6">
      {/* Education Level Selector */}
      <div className="space-y-2">
        <label className="text-sm font-medium">学生年级</label>
        <div className="flex gap-2">
          <Button
            type="button"
            variant={educationLevel === 'elementary' ? 'default' : 'outline'}
            onClick={() => handleEducationLevelChange('elementary')}
            size="sm"
          >
            小学
          </Button>
          <Button
            type="button"
            variant={educationLevel === 'middle' ? 'default' : 'outline'}
            onClick={() => handleEducationLevelChange('middle')}
            size="sm"
          >
            初中
          </Button>
          <Button
            type="button"
            variant={educationLevel === 'high' ? 'default' : 'outline'}
            onClick={() => handleEducationLevelChange('high')}
            size="sm"
          >
            高中
          </Button>
        </div>
      </div>

      {/* File Input (T023) */}
      <div className="space-y-2">
        <label htmlFor="image-upload" className="text-sm font-medium">
          上传错题图片
        </label>
        <input
          id="image-upload"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileSelect}
          className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
          disabled={isProcessing}
        />
        <p className="text-xs text-muted-foreground">
          支持 JPEG、PNG、WebP 格式，文件大小不超过 5MB
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-md">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Image Preview (T026) */}
      {preview && (
        <div className="space-y-4">
          <div className="border rounded-lg p-4">
            <img
              src={preview}
              alt="上传的问题图片"
              className="max-w-full h-auto max-h-96 mx-auto rounded-md"
            />
          </div>

          {/* Loading State (T028) */}
          {isProcessing && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">正在识别问题内容...</p>
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-12 w-3/4" />
            </div>
          )}

          {/* Confirmation View (T024, T029-T032) */}
          {!isProcessing && extractedResult && questionId && (
            <ConfirmationView
              imagePreview={preview}
              extractedResult={extractedResult}
              onConfirm={handleConfirm}
              onRetry={handleRetry}
            />
          )}
        </div>
      )}
    </div>
  );
}
