'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  BookOpen,
  Video,
  FileText,
  Wrench,
  FolderOpen,
  Users,
  Lightbulb,
  Plus,
  Loader2,
} from 'lucide-react';

interface Resource {
  id: string;
  name: string;
  type: string;
  status: string;
  priority: string;
}

interface ResourceSummary {
  totalResources: number;
  totalSourceMaterials: number;
  totalMethodologies: number;
  totalRoles: number;
}

const typeIcons: Record<string, React.ReactNode> = {
  course: <Video className="h-4 w-4" />,
  book: <BookOpen className="h-4 w-4" />,
  article: <FileText className="h-4 w-4" />,
  tool: <Wrench className="h-4 w-4" />,
  project: <FolderOpen className="h-4 w-4" />,
};

const statusColors: Record<string, string> = {
  approved: 'bg-green-500',
  pending: 'bg-yellow-500',
  rejected: 'bg-red-500',
  in_use: 'bg-blue-500',
  completed: 'bg-purple-500',
};

function ResourceSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-64" />
      <div className="grid gap-4 md:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
      <Skeleton className="h-96" />
    </div>
  );
}

const RESOURCE_TYPES = [
  { value: 'source_material', label: '来源材料' },
  { value: 'learning_record', label: '学习记录' },
  { value: 'idea_pool', label: '想法池' },
];

export default function ResourcesPage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [sourceMaterials, setSourceMaterials] = useState<{ id: string; name: string; type: string }[]>([]);
  const [notionExports, setNotionExports] = useState<{ id: string; name: string; count: number }[]>([]);
  const [methodologies, setMethodologies] = useState<string[]>([]);
  const [roles, setRoles] = useState<{ id: string; name: string; description: string }[]>([]);
  const [summary, setSummary] = useState<ResourceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 添加资源 Dialog 状态
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newType, setNewType] = useState('source_material');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const fetchResources = async () => {
    try {
      const response = await fetch('/api/resources');
      const data = await response.json();

      if (data.success) {
        setResources(data.data.resources);
        setSourceMaterials(data.data.sourceMaterials);
        setNotionExports(data.data.notionExports);
        setMethodologies(data.data.methodologies);
        setRoles(data.data.roles);
        setSummary(data.data.summary);
      } else {
        setError(data.error || '获取资源列表失败');
      }
    } catch {
      setError('网络错误');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAddResource = async () => {
    if (!newTitle.trim() || !newContent.trim()) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      // Step 1: create draft
      const execRes = await fetch('/api/workflows/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workflowType: 'resource_ingest',
          artifactKind: newType,
          title: newTitle.trim(),
          content: newContent.trim(),
        }),
      });
      const execData = await execRes.json();
      if (!execData.success) throw new Error(execData.error || '创建草稿失败');

      // Step 2: confirm draft
      const draftId = execData.data.draft.id;
      const confirmRes = await fetch('/api/workflows/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ draftId }),
      });
      const confirmData = await confirmRes.json();
      if (!confirmData.success) throw new Error(confirmData.error || '确认失败');

      setDialogOpen(false);
      setNewTitle('');
      setNewContent('');
      setNewType('source_material');
      fetchResources();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : '提交失败');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <ResourceSkeleton />;
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

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">资源管理</h1>
          <p className="text-muted-foreground mt-2">
            管理你的学习资源、来源材料和方法论库
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              添加资源
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>添加资源</DialogTitle>
              <DialogDescription>
                添加新的学习资料、来源材料或想法
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="res-type">资源类型</Label>
                <Select value={newType} onValueChange={setNewType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RESOURCE_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="res-title">标题</Label>
                <Input
                  id="res-title"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="资源标题..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="res-content">内容</Label>
                <Textarea
                  id="res-content"
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="资源内容或描述..."
                  rows={5}
                />
              </div>
              {submitError && (
                <p className="text-sm text-red-500">{submitError}</p>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={submitting}>
                取消
              </Button>
              <Button onClick={handleAddResource} disabled={submitting || !newTitle.trim() || !newContent.trim()}>
                {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                提交
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center gap-2 pb-2">
            <BookOpen className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">学习资源</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.totalResources || 0}</div>
            <p className="text-sm text-muted-foreground">个资源</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-2 pb-2">
            <FileText className="h-5 w-5 text-blue-500" />
            <CardTitle className="text-base">来源材料</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.totalSourceMaterials || 0}</div>
            <p className="text-sm text-muted-foreground">份材料</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-2 pb-2">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            <CardTitle className="text-base">方法论</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.totalMethodologies || 0}</div>
            <p className="text-sm text-muted-foreground">个方法</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-2 pb-2">
            <Users className="h-5 w-5 text-purple-500" />
            <CardTitle className="text-base">角色</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.totalRoles || 0}</div>
            <p className="text-sm text-muted-foreground">个角色</p>
          </CardContent>
        </Card>
      </div>

      {/* 资源分类标签页 */}
      <Tabs defaultValue="resources" className="space-y-4">
        <TabsList>
          <TabsTrigger value="resources">学习资源 ({resources.length})</TabsTrigger>
          <TabsTrigger value="sources">来源材料 ({sourceMaterials.length})</TabsTrigger>
          <TabsTrigger value="methodologies">方法论 ({methodologies.length})</TabsTrigger>
          <TabsTrigger value="roles">角色 ({roles.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="resources">
          <Card>
            <CardHeader>
              <CardTitle>资源目录</CardTitle>
              <CardDescription>
                所有学习资源的分类和状态
              </CardDescription>
            </CardHeader>
            <CardContent>
              {resources.length > 0 ? (
                <div className="space-y-2">
                  {resources.map((resource) => (
                    <div 
                      key={resource.id}
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-muted-foreground">
                          {typeIcons[resource.type] || <FileText className="h-4 w-4" />}
                        </div>
                        <div>
                          <div className="font-medium">{resource.name}</div>
                          <div className="text-sm text-muted-foreground">{resource.id}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {resource.type}
                        </Badge>
                        <div className={`w-2 h-2 rounded-full ${statusColors[resource.status] || 'bg-gray-500'}`} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">暂无资源数据</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sources">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>来源笔记</CardTitle>
                <CardDescription>原始学习笔记和材料</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {sourceMaterials.slice(0, 10).map((material) => (
                    <div 
                      key={material.id}
                      className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50"
                    >
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{material.name}</span>
                    </div>
                  ))}
                  {sourceMaterials.length > 10 && (
                    <p className="text-sm text-muted-foreground text-center pt-2">
                      还有 {sourceMaterials.length - 10} 项...
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Notion 导出</CardTitle>
                <CardDescription>从 Notion 导入的学习资料</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {notionExports.map((exportItem) => (
                    <div 
                      key={exportItem.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                    >
                      <div className="flex items-center gap-2">
                        <FolderOpen className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{exportItem.name}</span>
                      </div>
                      <Badge variant="secondary">{exportItem.count} 文件</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="methodologies">
          <Card>
            <CardHeader>
              <CardTitle>学习方法论</CardTitle>
              <CardDescription>
                4C/ID 模型、间隔复习、螺旋递进等学习方法
              </CardDescription>
            </CardHeader>
            <CardContent>
              {methodologies.length > 0 ? (
                <div className="grid gap-3 md:grid-cols-2">
                  {methodologies.map((method, index) => (
                    <div 
                      key={index}
                      className="flex items-start gap-3 p-4 rounded-lg border"
                    >
                      <Lightbulb className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                      <span className="font-medium">{method}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">暂无方法论数据</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roles">
          <div className="grid gap-4 md:grid-cols-2">
            {roles.map((role) => (
              <Card key={role.id}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    {role.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {role.description || '暂无描述'}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
