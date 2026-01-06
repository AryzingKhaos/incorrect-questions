import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function Home() {
  return (
    <main className="container mx-auto px-4 py-16 max-w-4xl">
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-bold tracking-tight">欢迎使用错题本</h1>
        <p className="text-xl text-muted-foreground">
          拍照上传错题，AI 智能识别，轻松整理你的错题集
        </p>

        <div className="flex justify-center gap-4 pt-6">
          <Button asChild size="lg">
            <Link href="/upload">开始上传错题</Link>
          </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mt-16">
        <Card className="p-6 text-center">
          <div className="text-3xl mb-3">📸</div>
          <h3 className="font-semibold mb-2">拍照上传</h3>
          <p className="text-sm text-muted-foreground">
            用手机拍下错题照片，一键上传
          </p>
        </Card>

        <Card className="p-6 text-center">
          <div className="text-3xl mb-3">🤖</div>
          <h3 className="font-semibold mb-2">AI 识别</h3>
          <p className="text-sm text-muted-foreground">
            AI 自动提取题目内容，准确快速
          </p>
        </Card>

        <Card className="p-6 text-center">
          <div className="text-3xl mb-3">📚</div>
          <h3 className="font-semibold mb-2">便捷整理</h3>
          <p className="text-sm text-muted-foreground">
            错题自动保存，随时查看复习
          </p>
        </Card>
      </div>
    </main>
  );
}
