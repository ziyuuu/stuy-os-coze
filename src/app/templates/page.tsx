'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  FolderOpen, 
  FileText, 
  RotateCcw, 
  GraduationCap,
  CheckCircle2,
  Archive,
  Briefcase
} from 'lucide-react';
import Link from 'next/link';

interface Template {
  id: string;
  name: string;
  type: string;
  description: string;
}

interface TemplateGroup {
  plan: Template[];
  review: Template[];
  lesson_prep: Template[];
  evaluation: Template[];
  output: Template[];
  portfolio: Template[];
  closed_loop: Template[];
  general: Template[];
}

const typeConfig: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  plan: { label: '计划模板', icon: <FileText className="h-4 w-4" />, color: 'bg-blue-500' },
  review: { label: '复盘模板', icon: <RotateCcw className="h-4 w-4" />, color: 'bg-green-500' },
  lesson_prep: { label: '备课模板', icon: <GraduationCap className="h-4 w-4" />, color: 'bg-purple-500' },
  evaluation: { label: '评价模板', icon: <CheckCircle2 className="h-4 w-4" />, color: 'bg-orange-500' },
  output: { label: '产出模板', icon: <Archive className="h-4 w-4" />, color: 'bg-cyan-500' },
  portfolio: { label: '作品集模板', icon: <Briefcase className="h-4 w-4" />, color: 'bg-pink-500' },
  closed_loop: { label: '闭环模板', icon: <CheckCircle2 className="h-4 w-4" />, color: 'bg-indigo-500' },
  general: { label: '其他', icon: <FolderOpen className="h-4 w-4" />, color: 'bg-gray-500' },
};

function TemplateCard({ template }: { template: Template }) {
  const config = typeConfig[template.type] || typeConfig.general;
  
  return (
    <Link href={`/templates/${template.id}`}>
      <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className={`p-2 rounded-lg ${config.color} text-white`}>
              {config.icon}
            </div>
            <Badge variant="outline" className="text-xs">{config.label}</Badge>
          </div>
          <CardTitle className="text-base mt-3">{template.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <CardDescription className="line-clamp-3">
            {template.description || '暂无描述'}
          </CardDescription>
        </CardContent>
      </Card>
    </Link>
  );
}

function TemplateSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-64" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(9)].map((_, i) => (
          <Skeleton key={i} className="h-40" />
        ))}
      </div>
    </div>
  );
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [groupedTemplates, setGroupedTemplates] = useState<TemplateGroup | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTemplates() {
      try {
        const response = await fetch('/api/templates');
        const data = await response.json();
        
        if (data.success) {
          setTemplates(data.data.templates);
          setGroupedTemplates(data.data.groupedTemplates);
        } else {
          setError(data.error || '获取模板列表失败');
        }
      } catch (err) {
        setError('网络错误');
      } finally {
        setLoading(false);
      }
    }

    fetchTemplates();
  }, []);

  if (loading) {
    return <TemplateSkeleton />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="p-6">
          <div className="text-center text-red-500">{error}</div>
        </Card>
      </div>
    );
  }

  const totalCount = templates.length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">模板库</h1>
        <p className="text-muted-foreground mt-2">
          浏览和使用各类学习管理模板，快速生成计划、复盘和产出文档
        </p>
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center gap-2 pb-2">
            <FolderOpen className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">模板总数</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-2 pb-2">
            <FileText className="h-5 w-5 text-blue-500" />
            <CardTitle className="text-base">计划模板</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{groupedTemplates?.plan?.length || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-2 pb-2">
            <RotateCcw className="h-5 w-5 text-green-500" />
            <CardTitle className="text-base">复盘模板</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{groupedTemplates?.review?.length || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-2 pb-2">
            <GraduationCap className="h-5 w-5 text-purple-500" />
            <CardTitle className="text-base">其他模板</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalCount - (groupedTemplates?.plan?.length || 0) - (groupedTemplates?.review?.length || 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 模板分类标签页 */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList className="flex flex-wrap">
          <TabsTrigger value="all">全部 ({totalCount})</TabsTrigger>
          <TabsTrigger value="plan">
            计划 ({groupedTemplates?.plan?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="review">
            复盘 ({groupedTemplates?.review?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="lesson_prep">
            备课 ({groupedTemplates?.lesson_prep?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="evaluation">
            评价 ({groupedTemplates?.evaluation?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="output">
            产出 ({groupedTemplates?.output?.length || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {templates.map((template) => (
              <TemplateCard key={template.id} template={template} />
            ))}
          </div>
        </TabsContent>

        {Object.entries(groupedTemplates || {}).map(([type, typeTemplates]: [string, Template[]]) => (
          <TabsContent key={type} value={type}>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {typeTemplates.map((template) => (
                <TemplateCard key={template.id} template={template} />
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
