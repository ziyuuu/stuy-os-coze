'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { FileText, Calendar, Target, CheckCircle2, Sun, Settings, Upload, Trash2, Edit, GripVertical, Sparkles, Send, Loader2, RotateCcw, Save, X, MessageSquare } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';

interface MasterPlan {
  title: string;
  version: string;
  totalMonths: number;
  currentPhase: string;
  content?: string;
}

interface MonthPlan {
  monthNumber: string;
  index?: number;
  phase: string;
  period: string;
  status: string;
  goals: { headers: string[]; rows: string[][] } | null;
  modules: { id: string; name: string; description: string }[];
  resources: { id: string; name: string; status: string }[];
  content?: string;
}

interface WeekPlan {
  period: string;
  status: string;
  goals: { description: string; source: string; expected: string }[];
  exercises: string[];
  deliverables: string[];
  boundaries: string[];
  content?: string;
}

interface DailyPlan {
  date: string;
  status: string;
  weekPlan: string;
  phase: string;
  tasks: { description: string; completed: boolean }[];
  content?: string;
}

type PlanType = 'master' | 'month' | 'week' | 'daily';

// 可拖拽排序项组件属性
interface SortableItemProps {
  id: string;
  content: string;
}

// 状态映射函数 - 仅4种状态
const statusMap: Record<string, string> = {
  draft: '草稿',
  approved: '已批准',
  active: '进行中',
  completed: '已完成',
};

const getStatusLabel = (status: string | undefined) => {
  if (!status) return '待开始';
  return statusMap[status] || status;
};

const getStatusVariant = (status: string | undefined) => {
  if (!status || status === 'draft' || status === '草稿') return 'outline';
  if (status === 'active' || status === '进行中') return 'secondary';
  if (status === 'approved' || status === '已批准') return 'default';
  if (status === 'completed' || status === '已完成') return 'default';
  return 'outline';
};

function PlanSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-64" />
      <div className="grid gap-4 md:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
      <Skeleton className="h-[500px]" />
    </div>
  );
}

export default function PlansPage() {
  const [masterPlan, setMasterPlan] = useState<MasterPlan | null>(null);
  const [monthPlan, setMonthPlan] = useState<MonthPlan | null>(null);
  const [weekPlan, setWeekPlan] = useState<WeekPlan | null>(null);
  const [dailyPlan, setDailyPlan] = useState<DailyPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 状态编辑弹窗
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [statusPlanType, setStatusPlanType] = useState<PlanType | null>(null);
  const [newStatus, setNewStatus] = useState('draft');

  // 上传弹窗
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadPlanType, setUploadPlanType] = useState<PlanType | null>(null);
  const [uploadContent, setUploadContent] = useState('');

  // 删除确认弹窗
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletePlanType, setDeletePlanType] = useState<PlanType | null>(null);

  // 编辑弹窗
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editPlanType, setEditPlanType] = useState<PlanType | null>(null);
  const [editContent, setEditContent] = useState('');
  const [originalContent, setOriginalContent] = useState(''); // 原始内容用于比较
  const [hasChanges, setHasChanges] = useState(false); // 是否有未保存的更改
  const [aiChatOpen, setAiChatOpen] = useState(false); // AI 对话弹窗
  const [aiMessages, setAiMessages] = useState<Array<{role: 'user' | 'assistant'; content: string}>>([]);
  const [aiInput, setAiInput] = useState(''); // AI 输入
  const [items, setItems] = useState<string[]>([]); // 拖拽列表
  const [isAiLoading, setIsAiLoading] = useState(false); // AI 加载状态
  const [saveResult, setSaveResult] = useState<string | null>(null); // harness 保存结果

  // 拖拽功能
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = parseInt(String(active.id).replace('item-', ''));
      const newIndex = parseInt(String(over.id).replace('item-', ''));
      if (!isNaN(oldIndex) && !isNaN(newIndex)) {
        setItems((items) => {
          const newItems = [...items];
          const [removed] = newItems.splice(oldIndex, 1);
          newItems.splice(newIndex, 0, removed);
          return newItems;
        });
        // 同时更新文本内容
        setEditContent((prev) => {
          const lines = prev.split('\n').filter(l => l.trim());
          const newLines = [...lines];
          const [removed] = newLines.splice(oldIndex, 1);
          newLines.splice(newIndex, 0, removed);
          return newLines.join('\n');
        });
      }
    }
  };

  // AI 对话处理
  const handleAiChat = async () => {
    if (!aiInput.trim() || isAiLoading) return;
    
    const userMessage = aiInput;
    setAiInput('');
    setAiMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsAiLoading(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          currentContent: editContent,
          planType: editPlanType,
        }),
      });
      const data = await response.json();
      
      if (data.success) {
        setAiMessages(prev => [...prev, { role: 'assistant', content: data.data }]);
      } else {
        setAiMessages(prev => [...prev, { role: 'assistant', content: '抱歉，AI 处理失败了。' }]);
      }
    } catch (err) {
      setAiMessages(prev => [...prev, { role: 'assistant', content: '抱歉，AI 处理失败了。' }]);
    } finally {
      setIsAiLoading(false);
    }
  };

  // 打开编辑弹窗时初始化
  const handleOpenEdit = (planType: PlanType, content: string) => {
    setEditPlanType(planType);
    setEditContent(content);
    setOriginalContent(content);
    setHasChanges(false);
    setAiMessages([]);
    setAiChatOpen(false);
    // 初始化拖拽列表
    const lines = content.split('\n').filter(l => l.trim());
    setItems(lines);
    setEditDialogOpen(true);
  };

  const fetchPlans = async () => {
    try {
      const [masterRes, monthRes, weekRes, dailyRes] = await Promise.all([
        fetch('/api/plans/master'),
        fetch('/api/plans/month'),
        fetch('/api/plans/week'),
        fetch('/api/plans/daily'),
      ]);

      const masterData = await masterRes.json();
      const monthData = await monthRes.json();
      const weekData = await weekRes.json();
      const dailyData = await dailyRes.json();

      if (masterData.success) setMasterPlan(masterData.data);
      if (monthData.success) setMonthPlan(monthData.data);
      if (weekData.success) setWeekPlan(weekData.data);
      if (dailyData.success) setDailyPlan(dailyData.data);
    } catch (err) {
      setError('获取计划数据失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  // 打开状态编辑弹窗
  const openStatusDialog = (planType: PlanType, currentStatus: string) => {
    setStatusPlanType(planType);
    setNewStatus(currentStatus);
    setStatusDialogOpen(true);
  };

  // 打开上传弹窗
  const openUploadDialog = (planType: PlanType) => {
    setUploadPlanType(planType);
    setUploadContent('');
    setUploadDialogOpen(true);
  };

  // 打开删除确认弹窗
  const openDeleteDialog = (planType: PlanType) => {
    setDeletePlanType(planType);
    setDeleteDialogOpen(true);
  };

  // 打开编辑弹窗
  const openEditDialog = (planType: PlanType) => {
    setEditPlanType(planType);
    // 根据计划类型获取当前内容
    let content = '';
    if (planType === 'month' && monthPlan) {
      content = monthPlan.content || '';
    } else if (planType === 'week' && weekPlan) {
      content = weekPlan.content || '';
    } else if (planType === 'daily' && dailyPlan) {
      content = dailyPlan.content || '';
    } else if (planType === 'master' && masterPlan) {
      content = masterPlan.content || '';
    }
    setEditContent(content);
    setOriginalContent(content); // 保存原始内容用于检测变化
    // 解析内容为行列表用于拖拽
    const lines = content.split('\n').filter(line => line.trim());
    setItems(lines);
    setEditDialogOpen(true);
  };

  // Harness: save content as draft and confirm as artifact
  const saveViaHarness = async (planType: string, content: string) => {
    const artifactKind = "plan";
    const title = `${planType}_plan ${new Date().toISOString().split("T")[0]}`;

    // Step 1: Create draft
    const draftRes = await fetch("/api/workflows/execute", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        workflowType: planType === "master" ? "master_plan" : planType === "month" ? "month_plan" : planType === "week" ? "week_plan" : "daily_plan",
        artifactKind,
        title,
        content,
        evidenceType: "draft",
        metadata: { planType, source: "plans_management_page" },
      }),
    });
    const draftData = await draftRes.json();
    if (!draftData.success) throw new Error(draftData.error || "创建 Draft 失败");

    // Step 2: Confirm
    const confirmRes = await fetch("/api/workflows/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        draftId: draftData.data.draft.id,
        confirmedBy: "local-user",
        note: `Plan content confirmed from plans management page.`,
      }),
    });
    const confirmData = await confirmRes.json();
    if (!confirmData.success) throw new Error(confirmData.error || "确认失败");

    const suggestion = confirmData.data.stateUpdateSuggestion || "";
    return {
      draftId: draftData.data.draft.id,
      artifactId: confirmData.data.artifact.id,
      suggestion,
    };
  };

  // 保存编辑内容
  const handleSaveEdit = async () => {
    if (!editPlanType || !editContent.trim()) return;

    // 检测是否有变化
    if (editContent === originalContent) {
      setEditDialogOpen(false);
      return;
    }

    try {
      const result = await saveViaHarness(editPlanType, editContent);
      setSaveResult(
        `Artifact: ${result.artifactId}\n${result.suggestion || ""}`
      );
      setEditDialogOpen(false);
      fetchPlans();
    } catch (err) {
      console.error("保存编辑失败", err);
    }
  };

  // 保存状态
  const handleSaveStatus = async () => {
    if (!statusPlanType) return;
    
    try {
      // 根据计划类型调用不同的 API
      const apiMap: Record<string, string> = {
        master: '/api/plans/master',
        month: '/api/plans/month',
        week: '/api/plans/week',
        daily: '/api/plans/daily'
      };
      
      const response = await fetch(apiMap[statusPlanType] || apiMap.master, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        setStatusDialogOpen(false);
        fetchPlans();
      }
    } catch (err) {
      console.error('保存状态失败', err);
    }
  };

  // 上传计划
  const handleUploadPlan = async () => {
    if (!uploadPlanType) return;

    try {
      const result = await saveViaHarness(uploadPlanType, uploadContent);
      setSaveResult(
        `Artifact: ${result.artifactId}\n${result.suggestion || ""}`
      );
      setUploadDialogOpen(false);
      setUploadContent("");
      fetchPlans();
    } catch (err) {
      console.error("上传计划失败", err);
    }
  };

  // 删除计划
  const handleDeletePlan = async () => {
    if (!deletePlanType) return;
    
    try {
      const endpoint = `/api/plans/${deletePlanType}`;
      const response = await fetch(endpoint, { method: 'DELETE' });

      if (response.ok) {
        setDeleteDialogOpen(false);
        fetchPlans();
      }
    } catch (err) {
      console.error('删除计划失败', err);
    }
  };

  // 渲染设置菜单
  const renderSettingsMenu = (planType: PlanType, currentStatus: string) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Settings className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => openStatusDialog(planType, currentStatus)}>
          <Edit className="mr-2 h-4 w-4" />
          调整状态
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => openEditDialog(planType)}>
          <FileText className="mr-2 h-4 w-4" />
          编辑内容
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => openUploadDialog(planType)}>
          <Upload className="mr-2 h-4 w-4" />
          上传计划
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onClick={() => openDeleteDialog(planType)}
          className="text-destructive focus:text-destructive"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          删除
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  if (loading) {
    return <PlanSkeleton />;
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
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">计划管理</h1>
          <p className="text-muted-foreground mt-2">
            管理你的 AI PM 转型学习计划
          </p>
        </div>
        <Link href="/plans-execute">
          <Button variant="outline" size="sm">
            <Sparkles className="h-4 w-4 mr-2" />
            生成新计划
          </Button>
        </Link>
      </div>

      {/* Harness save result */}
      {saveResult && (
        <Card className="border-green-500 bg-green-50 dark:bg-green-950/20">
          <CardContent className="py-3">
            <p className="text-sm text-green-700 dark:text-green-400 whitespace-pre-wrap">
              {saveResult}
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="mt-2"
              onClick={() => setSaveResult(null)}
            >
              关闭
            </Button>
          </CardContent>
        </Card>
      )}

      {/* 计划概览卡片 - 统一4个计划的卡片版式 */}
      <div className="grid gap-4 md:grid-cols-4">
        {/* Master Plan */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">总计划</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {masterPlan?.totalMonths || 12} 个月
              </Badge>
              {renderSettingsMenu('master', masterPlan?.version || '2.0')}
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12 个月</div>
            <p className="text-xs text-muted-foreground">
              v{masterPlan?.version || '2.0'}
            </p>
          </CardContent>
        </Card>

        {/* Month Plan */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">月计划</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Badge 
                variant={getStatusVariant(monthPlan?.status)} 
                className="text-xs"
              >
                {getStatusLabel(monthPlan?.status)}
              </Badge>
              {renderSettingsMenu('month', monthPlan?.status || 'draft')}
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Month {monthPlan?.index || monthPlan?.monthNumber || '-'}</div>
            <p className="text-xs text-muted-foreground">{monthPlan?.phase}</p>
          </CardContent>
        </Card>

        {/* Week Plan */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">周计划</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Badge 
                variant={getStatusVariant(weekPlan?.status)} 
                className="text-xs"
              >
                {getStatusLabel(weekPlan?.status)}
              </Badge>
              {renderSettingsMenu('week', weekPlan?.status || 'draft')}
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{weekPlan?.period?.split(' ')[0] || '-'}</div>
            <p className="text-xs text-muted-foreground">
              {weekPlan?.goals.length || 0} 项目标
            </p>
          </CardContent>
        </Card>

        {/* Daily Plan */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="flex items-center gap-2">
              <Sun className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">日计划</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Badge 
                variant={getStatusVariant(dailyPlan?.status)} 
                className="text-xs"
              >
                {getStatusLabel(dailyPlan?.status)}
              </Badge>
              {renderSettingsMenu('daily', dailyPlan?.status || 'draft')}
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dailyPlan?.date || '-'}</div>
            <p className="text-xs text-muted-foreground">
              {dailyPlan?.tasks.length || 0} 项任务
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 详细计划标签页 */}
      <Tabs defaultValue="master" className="space-y-4">
        <TabsList>
          <TabsTrigger value="master">总计划</TabsTrigger>
          <TabsTrigger value="month">月计划</TabsTrigger>
          <TabsTrigger value="week">周计划</TabsTrigger>
          <TabsTrigger value="daily">日计划</TabsTrigger>
        </TabsList>

        {/* Master Plan Tab */}
        <TabsContent value="master" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>总计划</CardTitle>
              <CardDescription>{masterPlan?.title} · v{masterPlan?.version}</CardDescription>
            </CardHeader>
            <CardContent>
              {masterPlan?.content ? (
                <div className="prose prose-sm max-w-none">
                  <pre className="whitespace-pre-wrap text-sm bg-muted/50 p-4 rounded-lg font-sans">
                    {masterPlan.content}
                  </pre>
                </div>
              ) : (
                <p className="text-muted-foreground">暂无总计划</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Month Plan Tab */}
        <TabsContent value="month" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>本月计划</CardTitle>
                <Badge variant={monthPlan?.status === 'completed' ? 'default' : monthPlan?.status === 'formal' ? 'secondary' : 'outline'}>
                  {monthPlan?.status || 'pending'}
                </Badge>
              </div>
              <CardDescription>Month {monthPlan?.index || 1} · {monthPlan?.phase || 'Phase'}</CardDescription>
            </CardHeader>
            <CardContent>
              {monthPlan?.content ? (
                <div className="prose prose-sm max-w-none">
                  <pre className="whitespace-pre-wrap text-sm bg-muted/50 p-4 rounded-lg font-sans">
                    {monthPlan.content}
                  </pre>
                </div>
              ) : monthPlan?.goals?.rows ? (
                <div className="space-y-3">
                  {monthPlan.goals.rows.map((row, index) => (
                    <div key={index} className="p-4 rounded-lg border bg-card">
                      <div className="flex items-start gap-3">
                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-sm font-medium">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{row[0]}</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            来源: {row[1]} · 预期产出: {row[3]}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">暂无月计划</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Week Plan Tab */}
        <TabsContent value="week" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>本周计划</CardTitle>
                <Badge variant={getStatusVariant(weekPlan?.status)}>
                  {getStatusLabel(weekPlan?.status)}
                </Badge>
              </div>
              <CardDescription>{weekPlan?.period || 'Week 1'}</CardDescription>
            </CardHeader>
            <CardContent>
              {weekPlan?.content ? (
                <div className="prose prose-sm max-w-none">
                  <pre className="whitespace-pre-wrap text-sm bg-muted/50 p-4 rounded-lg font-sans">
                    {weekPlan.content}
                  </pre>
                </div>
              ) : weekPlan?.goals && weekPlan.goals.length > 0 ? (
                <div className="space-y-4">
                  {weekPlan.goals.map((goal, index) => (
                    <div key={index} className="p-4 rounded-lg border bg-card">
                      <div className="flex items-start gap-3">
                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-sm font-medium">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{goal.description}</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            来源: {goal.source} · 预期: {goal.expected}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">暂无周计划</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Daily Plan Tab */}
        <TabsContent value="daily" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>今日任务</CardTitle>
                <Badge variant={dailyPlan?.status === 'completed' ? 'default' : dailyPlan?.status === 'active' ? 'secondary' : 'outline'}>
                  {dailyPlan?.status || 'pending'}
                </Badge>
              </div>
              <CardDescription>{dailyPlan?.date} · {dailyPlan?.phase}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {dailyPlan?.tasks.map((task, index) => (
                  <div 
                    key={index} 
                    className={`flex items-center gap-3 p-3 rounded-lg ${
                      task.completed ? 'bg-green-500/10' : 'bg-muted/50'
                    }`}
                  >
                    <div className={`flex items-center justify-center w-6 h-6 rounded-full ${
                      task.completed ? 'bg-green-500/20 text-green-500' : 'bg-primary/10 text-primary'
                    }`}>
                      {task.completed ? '✓' : index + 1}
                    </div>
                    <span className={task.completed ? 'line-through text-muted-foreground' : ''}>
                      {task.description}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 调整状态弹窗 */}
      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>调整状态</DialogTitle>
            <DialogDescription>
              修改 {statusPlanType === 'master' ? '总计划' : 
                    statusPlanType === 'month' ? '月计划' : 
                    statusPlanType === 'week' ? '周计划' : '日计划'} 的状态
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select value={newStatus} onValueChange={setNewStatus}>
              <SelectTrigger>
                <SelectValue placeholder="选择状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">草稿</SelectItem>
                <SelectItem value="approved">已批准</SelectItem>
                <SelectItem value="active">进行中</SelectItem>
                <SelectItem value="completed">已完成</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSaveStatus}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 上传计划弹窗 */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>上传计划</DialogTitle>
            <DialogDescription>
              粘贴计划内容，上传 {uploadPlanType === 'master' ? '总计划' : 
                              uploadPlanType === 'month' ? '月计划' : 
                              uploadPlanType === 'week' ? '周计划' : '日计划'}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              value={uploadContent}
              onChange={(e) => setUploadContent(e.target.value)}
              placeholder="粘贴计划内容..."
              className="min-h-[300px] font-mono text-sm"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleUploadPlan} disabled={!uploadContent.trim()}>
              上传
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除确认弹窗 */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>
              确定要删除 {deletePlanType === 'master' ? '总计划' : 
                           deletePlanType === 'month' ? '月计划' : 
                           deletePlanType === 'week' ? '周计划' : '日计划'} 吗？此操作不可撤销。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              取消
            </Button>
            <Button variant="destructive" onClick={handleDeletePlan}>
              删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 编辑内容弹窗 - 增强版 */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>编辑内容</DialogTitle>
            <DialogDescription>
              编辑 {editPlanType === 'master' ? '总计划' : 
                    editPlanType === 'month' ? '月计划' : 
                    editPlanType === 'week' ? '周计划' : '日计划'} 的内容
            </DialogDescription>
          </DialogHeader>
          
          {/* Tab 切换 */}
          <div className="flex gap-2 mb-4 flex-shrink-0">
            <Button 
              variant={!aiChatOpen ? "default" : "outline"} 
              size="sm"
              onClick={() => setAiChatOpen(false)}
            >
              手动编辑
            </Button>
            <Button 
              variant={aiChatOpen ? "default" : "outline"} 
              size="sm"
              onClick={() => setAiChatOpen(true)}
            >
              AI 对话
            </Button>
          </div>
          
          {/* 内容区域 - 可滚动 */}
          <div className="flex-1 overflow-y-auto min-h-0 pr-2">
            {!aiChatOpen ? (
              /* 手动编辑模式 */
              <div className="space-y-4 pb-4">
                {/* 拖拽列表 */}
                <div className="border rounded-lg p-3 bg-muted/30">
                  <p className="text-xs text-muted-foreground mb-2">拖拽调整顺序（按住 grip 图标拖动）：</p>
                  <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={items.map((_, i) => `item-${i}`)} strategy={verticalListSortingStrategy}>
                      <div className="space-y-2">
                        {items.map((item, index) => (
                          <SortableItemComponent 
                            key={`item-${index}`}
                            id={`item-${index}`} 
                            content={`${index + 1}. ${item}`} 
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                </div>
                {/* 文本编辑区 */}
                <div>
                  <p className="text-xs text-muted-foreground mb-2">文本编辑：</p>
                  <Textarea
                    value={editContent}
                    onChange={(e) => {
                      setEditContent(e.target.value);
                      setHasChanges(e.target.value !== originalContent);
                      const lines = e.target.value.split('\n').filter(l => l.trim());
                      setItems(lines);
                    }}
                    placeholder="在下方文本框中编辑内容..."
                    className="min-h-[150px] font-mono text-sm"
                  />
                </div>
              </div>
            ) : (
              /* AI 对话模式 */
              <div className="flex flex-col h-full">
                <div className="flex-1 overflow-auto py-4 space-y-4">
                  {aiMessages.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      <MessageSquare className="mx-auto h-12 w-12 mb-4 opacity-50" />
                      <p>发送消息与 AI 对话，帮你修改计划内容</p>
                      <p className="text-sm mt-2">例如：把第二个任务改成练习题</p>
                    </div>
                  ) : (
                    aiMessages.map((msg, i) => (
                      <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] rounded-lg p-3 ${
                          msg.role === 'user' 
                            ? 'bg-primary text-primary-foreground' 
                            : 'bg-muted'
                        }`}>
                          <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <div className="flex gap-2 pt-4 border-t flex-shrink-0">
                  <Input
                    value={aiInput}
                    onChange={(e) => setAiInput(e.target.value)}
                    placeholder="输入修改指令..."
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleAiChat()}
                    disabled={isAiLoading}
                  />
                  <Button onClick={handleAiChat} disabled={isAiLoading || !aiInput.trim()}>
                    {isAiLoading ? '思考中...' : '发送'}
                  </Button>
                </div>
              </div>
            )}
          </div>
          
          {/* 保存按钮 - 始终可见 */}
          <DialogFooter className="flex-shrink-0 pt-4 border-t">
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSaveEdit} disabled={!editContent.trim()}>
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// 可拖拽排序项组件
function SortableItemComponent({ id, content }: { id: string; content: string }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "p-3 bg-muted/50 border rounded-lg cursor-grab active:cursor-grabbing flex items-start gap-2 mb-2",
        isDragging && "opacity-50 shadow-lg z-50 bg-primary/10"
      )}
      {...attributes}
      {...listeners}
    >
      <GripVertical className="h-4 w-4 mt-1 text-muted-foreground flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="text-sm whitespace-pre-wrap">{content}</div>
      </div>
    </div>
  );
}
