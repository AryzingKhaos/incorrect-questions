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

              {/* Noise Filtered Indicator */}
              {extractedResult.noiseFiltered && (
                <Badge variant="secondary">已过滤干扰内容</Badge>
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
            请仔细核对识别结果是否准确。如有错误，可以重新扫描或等待后续手动编辑功能。
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
