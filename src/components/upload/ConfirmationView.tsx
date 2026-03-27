'use client';

/**
 * ConfirmationView Component
 * Feature: 001-image-text-extraction
 * Displays extracted text with original image for user confirmation
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AIExtractionResponse } from '@/types/ai';
import { toast } from 'sonner';

interface ConfirmationViewProps {
  imagePreview: string;
  extractedResult: AIExtractionResponse;
  onConfirm: () => void;
  onRetry: () => void;
}

export function ConfirmationView({
  imagePreview,
  extractedResult,
  onConfirm,
  onRetry,
}: ConfirmationViewProps) {
  const [isSaving, setIsSaving] = useState(false);

  /**
   * Handle confirm and save (T029)
   * With success toast notification (T032)
   */
  const handleConfirm = () => {
    setIsSaving(true);

    try {
      onConfirm();

      // Success toast notification (T032)
      toast.success('太棒了！', {
        description: '你的错题已成功保存。',
      });
    } catch (error: any) {
      toast.error('保存失败', {
        description: error.message || '请稍后重试。',
      });
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Handle retry scan (T030)
   */
  const handleRetry = () => {
    onRetry();
    toast.info('重新识别中...', {
      description: '正在重新扫描图片，请稍候。',
    });
  };

  return (
    <div className="space-y-4">
      {/* Extracted Text Display */}
      <Card className="p-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg">识别结果</h3>
            <div className="flex items-center gap-2">
              {/* Confidence Badge */}
              {extractedResult.confidence >= 0.8 && (
                <Badge variant="default">
                  置信度: {Math.round(extractedResult.confidence * 100)}%
                </Badge>
              )}
              {extractedResult.confidence < 0.8 && extractedResult.confidence >= 0.6 && (
                <Badge variant="secondary">
                  置信度: {Math.round(extractedResult.confidence * 100)}%
                </Badge>
              )}
              {extractedResult.confidence < 0.6 && (
                <Badge variant="outline">
                  置信度: {Math.round(extractedResult.confidence * 100)}%
                </Badge>
              )}

              {/* Noise Filtered Indicator (Enhanced for T040) */}
              {extractedResult.noiseFiltered && (
                <Badge variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-200">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1 inline" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  已智能过滤干扰内容
                </Badge>
              )}
            </div>
          </div>

          {/* Question Text */}
          <div className="p-3 bg-muted rounded-md">
            <p className="whitespace-pre-wrap text-sm leading-relaxed">
              {extractedResult.questionText}
            </p>
          </div>

          {/* Instruction */}
          <p className="text-xs text-muted-foreground">
            {extractedResult.noiseFiltered ? (
              <>
                ✓ AI已自动过滤：多余题目、学生答案、页眉页脚等干扰内容。请仔细核对识别结果是否准确。
                如有错误，可以重新扫描或等待后续手动编辑功能。
              </>
            ) : (
              <>
                请仔细核对识别结果是否准确。如有错误，可以重新扫描或等待后续手动编辑功能。
              </>
            )}
          </p>
        </div>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Confirm & Save Button (T029) */}
        <Button
          onClick={handleConfirm}
          disabled={isSaving}
          className="flex-1"
          size="lg"
        >
          {isSaving ? '保存中...' : '确认并保存'}
        </Button>

        {/* Retry Scan Button (T030) */}
        <Button
          variant="outline"
          onClick={handleRetry}
          disabled={isSaving}
          className="flex-1"
          size="lg"
        >
          重新扫描
        </Button>

        {/* Disabled Edit Button with "Coming Soon" (T031) */}
        <Button
          variant="ghost"
          disabled
          className="flex-1"
          size="lg"
        >
          手动编辑
          <span className="ml-2 text-xs text-muted-foreground">(即将推出)</span>
        </Button>
      </div>
    </div>
  );
}
