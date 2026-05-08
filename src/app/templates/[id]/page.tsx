'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, 
  FolderOpen, 
  FileText, 
  RotateCcw, 
  GraduationCap,
  CheckCircle2,
  Archive,
  List,
  Variable
} from 'lucide-react';
import Link from 'next/link';

interface TemplateDetail {
  id: string;
  name: string;
  type: string;
  description: string;
  metadata: Record<string, unknown>;
  variables: { name: string; description: string; required: boolean }[];
  content: string;
}

const typeConfig: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  plan: { label: '计划模板', icon: <FileText className="h-4 w-4" />, color: 'bg-blue-500' },
  review: { label: '复盘模板', icon: <RotateCcw className="h-4 w-4" />, color: 'bg-green-500' },
  lesson_prep: { label: '备课模板', icon: <GraduationCap className="h-4 w-4" />, color: 'bg-purple-500' },
  evaluation: { label: '评价模板', icon: <CheckCircle2 className="h-4 w-4" />, color: 'bg-orange-500' },
  output: { label: '产出模板', icon: <Archive className="h-4 w-4" />, color: 'bg-cyan-500' },
  portfolio: { label: '作品集模板', icon: <FolderOpen className="h-4 w-4" />, color: 'bg-pink-500' },
  closed_loop: { label: '闭环模板', icon: <CheckCircle2 className="h-4 w-4" />, color: 'bg-indigo-500' },
  general: { label: '其他', icon: <FolderOpen className="h-4 w-4" />, color: 'bg-gray-500' },
};

export default function TemplateDetailPage() {
  const params = useParams();
  const [template, setTemplate] = useState<TemplateDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTemplateDetail() {
      try {
        const response = await fetch(`/api/templates/${params.id}`);
        const data = await response.json();
        
        if (data.success) {
          setTemplate(data.data);
        } else {
          setError(data.error || '获取模板详情失败');
        }
      } catch (err) {
        setError('网络错误');
      } finally {
        setLoading(false);
      }
    }

    if (params.id) {
      fetchTemplateDetail();
    }
  }, [params.id]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (error || !template) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Card className="p-6 max-w-md">
          <div className="text-center">
            <h2 className="text-lg font-semibold mb-2">获取失败</h2>
            <p className="text-muted-foreground mb-4">{error || '模板不存在'}</p>
            <Link href="/templates">
              <Button variant="outline">返回模板库</Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  const config = typeConfig[template.type] || typeConfig.general;

  return (
    <div className="space-y-6">
      {/* 返回按钮 */}
      <Link href="/templates">
        <Button variant="ghost" className="pl-0">
          <ArrowLeft className="h-4 w-4 mr-2" />
          返回模板库
        </Button>
      </Link>

      {/* 头部信息 */}
      <div className="flex items-start gap-4">
        <div className={`p-3 rounded-lg ${config.color} text-white`}>
          {config.icon}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h1 className="text-2xl font-bold">{template.name}</h1>
            <Badge variant="secondary">{config.label}</Badge>
          </div>
          <p className="text-muted-foreground">{template.description || '暂无描述'}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* 左侧：模板内容 */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                模板内容
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <pre className="whitespace-pre-wrap text-sm bg-muted/50 p-4 rounded-lg overflow-auto max-h-[600px] font-mono">
                  {template.content}
                </pre>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 右侧：元信息 */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">基本信息</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm text-muted-foreground">模板 ID</div>
                <div className="font-mono text-sm">{template.id}</div>
              </div>
              <Separator />
              <div>
                <div className="text-sm text-muted-foreground">类型</div>
                <Badge variant="outline" className="mt-1">{config.label}</Badge>
              </div>
            </CardContent>
          </Card>

          {template.variables.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Variable className="h-4 w-4" />
                  变量说明
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {template.variables.map((variable, index) => (
                    <div key={index} className="p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-2 mb-1">
                        <code className="text-sm font-mono bg-muted px-1.5 py-0.5 rounded">
                          {variable.name}
                        </code>
                        {variable.required && (
                          <Badge variant="default" className="text-xs">必填</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {variable.description}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <List className="h-4 w-4" />
                使用说明
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="text-muted-foreground">
                1. 复制模板内容到编辑器
              </p>
              <p className="text-muted-foreground">
                2. 替换所有变量为实际内容
              </p>
              <p className="text-muted-foreground">
                3. 根据需要调整结构
              </p>
              <p className="text-muted-foreground">
                4. 保存为新文件
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
