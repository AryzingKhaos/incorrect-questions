/**
 * Upload Page
 * Feature: 001-image-text-extraction
 * Main page for uploading question images and extracting text
 */

import { ImageUploader } from '@/components/upload/ImageUploader';
import { Card } from '@/components/ui/card';

export default function UploadPage() {
  return (
    <main className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Page Title and Instructions (T035) */}
      <div className="space-y-3 mb-8">
        <h1 className="text-3xl font-bold tracking-tight">上传错题</h1>
        <p className="text-muted-foreground text-lg">
          拍照上传你的错题，我们会自动识别题目内容
        </p>
      </div>

      {/* Instructions Card (T035) */}
      <Card className="p-6 mb-6 bg-muted/50">
        <h2 className="font-semibold mb-3">使用说明</h2>
        <ol className="space-y-2 text-sm text-muted-foreground">
          <li className="flex items-start">
            <span className="font-semibold mr-2 text-foreground">1.</span>
            <span>选择你的年级（小学、初中或高中）</span>
          </li>
          <li className="flex items-start">
            <span className="font-semibold mr-2 text-foreground">2.</span>
            <span>点击上传按钮，选择错题照片（支持 JPEG、PNG、WebP 格式）</span>
          </li>
          <li className="flex items-start">
            <span className="font-semibold mr-2 text-foreground">3.</span>
            <span>等待 AI 自动识别题目内容（通常需要 1-3 秒）</span>
          </li>
          <li className="flex items-start">
            <span className="font-semibold mr-2 text-foreground">4.</span>
            <span>检查识别结果是否准确，如有错误可以重新扫描</span>
          </li>
          <li className="flex items-start">
            <span className="font-semibold mr-2 text-foreground">5.</span>
            <span>确认无误后，点击"确认并保存"即可保存到错题本</span>
          </li>
        </ol>
      </Card>

      {/* Image Uploader Component (T034) */}
      <Card className="p-6">
        <ImageUploader />
      </Card>

      {/* Tips Section (T035) */}
      <div className="mt-6 space-y-3">
        <h3 className="font-semibold text-sm">拍照小技巧</h3>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>确保光线充足，题目清晰可见</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>尽量保持照片平整，避免过度倾斜或弯曲</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>只拍摄题目部分，减少无关内容</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>如果一张图片包含多道题，系统会自动提取第一题</span>
          </li>
        </ul>
      </div>
    </main>
  );
}
