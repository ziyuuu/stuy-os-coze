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
  GitBranch, 
  FileText, 
  RotateCcw, 
  GraduationCap,
  CheckCircle2,
  ListChecks,
  Info
} from 'lucide-react';
import Link from 'next/link';

interface FlowDetail {
  id: string;
  name: string;
  type: string;
  description: string;
  metadata: Record<string, unknown>;
  steps: { order: number; name: string; description: string }[];
  prerequisites: string[];
  inputs: string[];
  codeBlocks: { language: string; code: string }[];
  content: string;
}

const typeConfig: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  plan_generation: { label: '计划生成', icon: <FileText className="h-4 w-4" />, color: 'bg-blue-500' },
  review: { label: '复盘流程', icon: <RotateCcw className="h-4 w-4" />, color: 'bg-green-500' },
  lesson_prep: { label: '备课流程', icon: <GraduationCap className="h-4 w-4" />, color: 'bg-purple-500' },
  evaluation: { label: '评价流程', icon: <CheckCircle2 className="h-4 w-4" />, color: 'bg-orange-500' },
  general: { label: '其他', icon: <GitBranch className="h-4 w-4" />, color: 'bg-gray-500' },
};

export default function FlowDetailPage() {
  const params = useParams();
  const [flow, setFlow] = useState<FlowDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchFlowDetail() {
      try {
        const response = await fetch(`/api/flows/${params.id}`);
        const data = await response.json();
        
        if (data.success) {
          setFlow(data.data);
        } else {
          setError(data.error || '获取流程详情失败');
        }
      } catch (err) {
        setError('网络错误');
      } finally {
        setLoading(false);
      }
    }

    if (params.id) {
      fetchFlowDetail();
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

  if (error || !flow) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Card className="p-6 max-w-md">
          <div className="text-center">
            <h2 className="text-lg font-semibold mb-2">获取失败</h2>
            <p className="text-muted-foreground mb-4">{error || '流程不存在'}</p>
            <Link href="/flows">
              <Button variant="outline">返回流程中心</Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  const config = typeConfig[flow.type] || typeConfig.general;

  return (
    <div className="space-y-6">
      {/* 返回按钮 */}
      <Link href="/flows">
        <Button variant="ghost" className="pl-0">
          <ArrowLeft className="h-4 w-4 mr-2" />
          返回流程中心
        </Button>
      </Link>

      {/* 头部信息 */}
      <div className="flex items-start gap-4">
        <div className={`p-3 rounded-lg ${config.color} text-white`}>
          {config.icon}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h1 className="text-2xl font-bold">{flow.name}</h1>
            <Badge variant="secondary">{config.label}</Badge>
          </div>
          <p className="text-muted-foreground">{flow.description || '暂无描述'}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* 左侧：流程步骤 */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ListChecks className="h-5 w-5" />
                流程步骤
              </CardTitle>
              <CardDescription>
                共 {flow.steps.length} 个步骤
              </CardDescription>
            </CardHeader>
            <CardContent>
              {flow.steps.length > 0 ? (
                <div className="space-y-4">
                  {flow.steps.map((step, index) => (
                    <div key={index} className="relative">
                      {index < flow.steps.length - 1 && (
                        <div className="absolute left-5 top-12 w-0.5 h-full bg-border -translate-x-1/2" />
                      )}
                      <div className="flex gap-4">
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-medium relative z-10">
                          {step.order}
                        </div>
                        <div className="flex-1 pb-6">
                          <h4 className="font-medium">{step.name}</h4>
                          {step.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {step.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">暂无步骤定义</p>
              )}
            </CardContent>
          </Card>

          {/* 完整内容 */}
          <Card>
            <CardHeader>
              <CardTitle>完整内容</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <pre className="whitespace-pre-wrap text-sm bg-muted/50 p-4 rounded-lg overflow-auto max-h-96">
                  {flow.content}
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
                <div className="text-sm text-muted-foreground">流程 ID</div>
                <div className="font-mono text-sm">{flow.id}</div>
              </div>
              <Separator />
              <div>
                <div className="text-sm text-muted-foreground">类型</div>
                <Badge variant="outline" className="mt-1">{config.label}</Badge>
              </div>
            </CardContent>
          </Card>

          {flow.prerequisites.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  前置条件
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {flow.prerequisites.map((prereq, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <span className="text-primary">•</span>
                      <span>{prereq}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {flow.inputs.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">必读文件</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {flow.inputs.map((input, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <FileText className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <span className="text-muted-foreground">{input}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {flow.codeBlocks.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">代码片段</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {flow.codeBlocks.map((block, index) => (
                  <div key={index} className="rounded-lg bg-muted/50 p-3">
                    <Badge variant="outline" className="mb-2 text-xs">
                      {block.language}
                    </Badge>
                    <pre className="text-xs overflow-auto">
                      {block.code.slice(0, 200)}
                      {block.code.length > 200 && '...'}
                    </pre>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
