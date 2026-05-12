'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { FileText, Calendar, Target, Sun, Settings, Upload, Trash2, Edit, GripVertical, Sparkles, AlertTriangle, Loader2 } from 'lucide-react';
import type { PlanStatus } from '@/lib/plans/lifecycle';
import { VALID_TRANSITIONS } from '@/lib/plans/lifecycle';
import { ProgressGrid } from '@/components/plans/progress-grid';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
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
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface MasterPlan {
  title: string;
  version: string;
  totalMonths: number;
  currentPhase: string;
  content?: string;
  warnings?: string[];
}

interface ProgressGridItem {
  date: string;
  status: "completed" | "incomplete" | "no_plan" | "future";
}

interface PlanProgress {
  periodStart: string;
  periodEnd: string;
  today: string;
  totalDaysToDate: number;
  completedDays: number;
  incompleteDays: number;
  noPlanDays: number;
  futureDays: number;
  grid: ProgressGridItem[];
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
  progress?: PlanProgress;
  warnings?: string[];
}

interface WeekPlan {
  period: string;
  status: string;
  goals: { description: string; source: string; expected: string }[];
  exercises: string[];
  deliverables: string[];
  boundaries: string[];
  content?: string;
  progress?: PlanProgress;
  warnings?: string[];
}

interface DailyPlan {
  date: string;
  status: string;
  weekPlan: string;
  phase: string;
  tasks: { description: string; completed: boolean }[];
  content?: string;
  warnings?: string[];
}

type PlanType = 'master' | 'monthly' | 'weekly' | 'daily';

// 可拖拽排序项组件属性
interface SortableItemProps {
  id: string;
  content: string;
}

// 4态：draft → active → completed → expired
const statusMap: Record<string, string> = {
  draft: '未开始',
  active: '进行中',
  completed: '已完成',
  expired: '逾期',
};

const getStatusLabel = (status: string | undefined) => {
  if (!status) return '未开始';
  return statusMap[status] || status;
};

const getStatusVariant = (status: string | undefined) => {
  if (!status || status === 'draft') return 'outline';
  if (status === 'active') return 'secondary';
  if (status === 'completed') return 'default';
  if (status === 'expired') return 'destructive';
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
  const [statusDialogCurrent, setStatusDialogCurrent] = useState<PlanStatus>('draft');
  const [newStatus, setNewStatus] = useState('draft');
  const [statusError, setStatusError] = useState<string | null>(null);
  const validStatusTargets = VALID_TRANSITIONS[statusDialogCurrent] || [];

  // 上传弹窗
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadPlanType, setUploadPlanType] = useState<PlanType | null>(null);
  const [uploadContent, setUploadContent] = useState('');

  // 删除确认弹窗
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletePlanType, setDeletePlanType] = useState<PlanType | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // 编辑弹窗
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editPlanType, setEditPlanType] = useState<PlanType | null>(null);
  const [editContent, setEditContent] = useState('');
  const [originalContent, setOriginalContent] = useState(''); // 原始内容用于比较
  const [hasChanges, setHasChanges] = useState(false);
  const [items, setItems] = useState<string[]>([]);
  const [saveResult, setSaveResult] = useState<string | null>(null);
  const [unsavedDialogOpen, setUnsavedDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingStatus, setIsSavingStatus] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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
          const lines = prev.split('\n');
          const newLines = [...lines];
          const [removed] = newLines.splice(oldIndex, 1);
          newLines.splice(newIndex, 0, removed);
          return newLines.join('\n');
        });
      }
    }
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
    setStatusDialogCurrent((currentStatus || 'draft') as PlanStatus);
    setNewStatus(currentStatus || 'draft');
    setStatusError(null);
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
    if (planType === 'monthly' && monthPlan) {
      content = monthPlan.content || '';
    } else if (planType === 'weekly' && weekPlan) {
      content = weekPlan.content || '';
    } else if (planType === 'daily' && dailyPlan) {
      content = dailyPlan.content || '';
    } else if (planType === 'master' && masterPlan) {
      content = masterPlan.content || '';
    }
    setEditContent(content);
    setOriginalContent(content); // 保存原始内容用于检测变化
    // 解析内容为行列表用于拖拽
    const lines = content.split('\n');
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
        workflowType: planType === "master" ? "master_plan" : planType === "monthly" ? "month_plan" : planType === "weekly" ? "week_plan" : "daily_plan",
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

  const handleCloseEdit = () => {
    if (hasChanges) {
      setUnsavedDialogOpen(true);
    } else {
      setEditDialogOpen(false);
    }
  };

  // 保存编辑内容
  const handleSaveEdit = async () => {
    if (!editPlanType || !editContent.trim() || isSaving) return;

    if (editContent === originalContent) {
      setEditDialogOpen(false);
      return;
    }

    setIsSaving(true);
    try {
      const result = await saveViaHarness(editPlanType, editContent);
      setSaveResult(
        `Artifact: ${result.artifactId}\n${result.suggestion || ""}`
      );
      setEditDialogOpen(false);
      fetchPlans();
    } catch (err) {
      console.error("保存编辑失败", err);
    } finally {
      setIsSaving(false);
    }
  };

  // 保存状态
  const handleSaveStatus = async () => {
    if (!statusPlanType || isSavingStatus) return;
    setStatusError(null);
    setIsSavingStatus(true);

    try {
      const apiMap: Record<string, string> = {
        master: '/api/plans/master',
        monthly: '/api/plans/month',
        weekly: '/api/plans/week',
        daily: '/api/plans/daily'
      };

      const response = await fetch(apiMap[statusPlanType] || apiMap.master, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        setStatusDialogOpen(false);
        setStatusError(null);
        fetchPlans();
      } else {
        const data = await response.json().catch(() => ({}));
        setStatusError(data.error || '状态更新失败，请重试');
      }
    } catch (err) {
      setStatusError(err instanceof Error ? err.message : '保存状态失败');
    } finally {
      setIsSavingStatus(false);
    }
  };

  // 上传计划
  const handleUploadPlan = async () => {
    if (!uploadPlanType || isUploading) return;

    setIsUploading(true);
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
    } finally {
      setIsUploading(false);
    }
  };

  // 删除计划
  const handleDeletePlan = async () => {
    if (!deletePlanType || isDeleting) return;
    setDeleteError(null);
    setIsDeleting(true);

    try {
      const urlType = deletePlanType === 'monthly' ? 'month' : deletePlanType === 'weekly' ? 'week' : deletePlanType;
      const endpoint = `/api/plans/${urlType}`;
      const response = await fetch(endpoint, { method: 'DELETE' });

      if (response.ok) {
        setDeleteDialogOpen(false);
        setDeleteError(null);
        fetchPlans();
      } else {
        const data = await response.json().catch(() => ({}));
        setDeleteError(data.error || `删除失败 (${response.status})`);
      }
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : '删除计划失败');
    } finally {
      setIsDeleting(false);
    }
  };

  // 渲染设置菜单
  const renderSettingsMenu = (planType: PlanType, currentStatus?: string) => {
    const hasStatus = planType !== 'master'; // master 计划只有版本号，没有状态
    return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Settings className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {hasStatus && currentStatus !== undefined && (
          <DropdownMenuItem onClick={() => openStatusDialog(planType, currentStatus)}>
            <Edit className="mr-2 h-4 w-4" />
            调整状态
          </DropdownMenuItem>
        )}
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
  );};

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

      {/* Auto-transition warnings */}
      {(() => {
        const allWarnings: { plan: string; warnings: string[] }[] = [];
        if (masterPlan?.warnings?.length) allWarnings.push({ plan: '总计划', warnings: masterPlan.warnings });
        if (monthPlan?.warnings?.length) allWarnings.push({ plan: '月计划', warnings: monthPlan.warnings });
        if (weekPlan?.warnings?.length) allWarnings.push({ plan: '周计划', warnings: weekPlan.warnings });
        if (dailyPlan?.warnings?.length) allWarnings.push({ plan: '日计划', warnings: dailyPlan.warnings });
        if (allWarnings.length === 0) return null;
        return (
          <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20">
            <CardContent className="py-3">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <span className="text-sm font-medium text-yellow-700 dark:text-yellow-400">系统提醒</span>
              </div>
              {allWarnings.map((pw, i) => (
                <div key={i} className="mb-1">
                  <span className="text-xs font-medium text-yellow-600">{pw.plan}：</span>
                  {pw.warnings.map((w, j) => (
                    <p key={j} className="text-sm text-yellow-700 dark:text-yellow-400 ml-2">{w}</p>
                  ))}
                </div>
              ))}
            </CardContent>
          </Card>
        );
      })()}

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
              {renderSettingsMenu('master')}
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{masterPlan?.totalMonths || 12} 个月</div>
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
              {renderSettingsMenu('monthly', monthPlan?.status || 'draft')}
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
              {renderSettingsMenu('weekly', weekPlan?.status || 'draft')}
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
          <TabsTrigger value="monthly">月计划</TabsTrigger>
          <TabsTrigger value="weekly">周计划</TabsTrigger>
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
        <TabsContent value="monthly" className="space-y-4">
          <ProgressGrid progress={monthPlan?.progress} />
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>本月计划</CardTitle>
                <Badge variant={getStatusVariant(monthPlan?.status)}>
                  {getStatusLabel(monthPlan?.status)}
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
              ) : monthPlan?.goals?.rows && monthPlan.goals.rows.length > 0 ? (
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
        <TabsContent value="weekly" className="space-y-4">
          <ProgressGrid progress={weekPlan?.progress} />
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
                    statusPlanType === 'monthly' ? '月计划' :
                    statusPlanType === 'weekly' ? '周计划' : '日计划'} 的状态
              （当前：{statusMap[statusDialogCurrent] || statusDialogCurrent}）
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-3">
            <Select value={newStatus} onValueChange={setNewStatus}>
              <SelectTrigger>
                <SelectValue placeholder="选择状态" />
              </SelectTrigger>
              <SelectContent>
                {(["draft", "active", "completed", "expired"] as PlanStatus[]).map((s) => (
                  <SelectItem
                    key={s}
                    value={s}
                    disabled={s === statusDialogCurrent || !validStatusTargets.includes(s)}
                  >
                    {statusMap[s]}
                    {s === statusDialogCurrent ? ' (当前)' : !validStatusTargets.includes(s) ? ' (不可用)' : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {statusError && (
              <div className="flex items-center gap-2 text-sm text-red-500 bg-red-50 dark:bg-red-950/20 p-3 rounded-lg">
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                <span>{statusError}</span>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusDialogOpen(false)} disabled={isSavingStatus}>
              取消
            </Button>
            <Button onClick={handleSaveStatus} disabled={isSavingStatus}>
              {isSavingStatus && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              保存
            </Button>
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
                              uploadPlanType === 'monthly' ? '月计划' :
                              uploadPlanType === 'weekly' ? '周计划' : '日计划'}
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
            <Button variant="outline" onClick={() => setUploadDialogOpen(false)} disabled={isUploading}>
              取消
            </Button>
            <Button onClick={handleUploadPlan} disabled={isUploading || !uploadContent.trim()}>
              {isUploading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
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
                           deletePlanType === 'monthly' ? '月计划' :
                           deletePlanType === 'weekly' ? '周计划' : '日计划'} 吗？此操作不可撤销。
            </DialogDescription>
          </DialogHeader>
          {deleteError && (
            <div className="flex items-center gap-2 text-sm text-red-500 bg-red-50 dark:bg-red-950/20 p-3 rounded-lg">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              <span>{deleteError}</span>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDeleteDialogOpen(false); setDeleteError(null); }} disabled={isDeleting}>
              取消
            </Button>
            <Button variant="destructive" onClick={handleDeletePlan} disabled={isDeleting}>
              {isDeleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 编辑内容弹窗 - 增强版 */}
      <Dialog open={editDialogOpen} onOpenChange={(open) => { if (!open) handleCloseEdit(); }}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>编辑内容</DialogTitle>
            <DialogDescription>
              编辑 {editPlanType === 'master' ? '总计划' :
                    editPlanType === 'monthly' ? '月计划' :
                    editPlanType === 'weekly' ? '周计划' : '日计划'} 的内容
            </DialogDescription>
          </DialogHeader>
          
          {/* 内容区域 - 可滚动 */}
          <div className="flex-1 overflow-y-auto min-h-0 pr-2">
            <div className="space-y-4 pb-4">
              {/* 拖拽列表 */}
              <div className="border rounded-lg p-3 bg-muted/30">
                <p className="text-xs text-muted-foreground mb-2">拖拽调整顺序（按住 grip 图标拖动）：</p>
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={items.map((_, i) => `item-${i}`)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-2">
                      {items.map((item, index) => (
                        <SortableItemComponent
                          key={item.slice(0, 40) + index}
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
                    const lines = e.target.value.split('\n');
                    setItems(lines);
                  }}
                  placeholder="在下方文本框中编辑内容..."
                  className="min-h-[150px] font-mono text-sm"
                />
              </div>
            </div>
          </div>
          
          {/* 保存按钮 - 始终可见 */}
          <DialogFooter className="flex-shrink-0 pt-4 border-t">
            <Button variant="outline" onClick={handleCloseEdit} disabled={isSaving}>
              取消
            </Button>
            <Button onClick={handleSaveEdit} disabled={isSaving || !editContent.trim()}>
              {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 未保存更改确认弹窗 */}
      <Dialog open={unsavedDialogOpen} onOpenChange={setUnsavedDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>有未保存的更改</DialogTitle>
            <DialogDescription>
              确定要放弃未保存的更改吗？
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUnsavedDialogOpen(false)}>
              继续编辑
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setUnsavedDialogOpen(false);
                setHasChanges(false);
                setEditDialogOpen(false);
              }}
            >
              放弃
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
        {content.trim() ? (
          <div className="text-sm whitespace-pre-wrap">{content}</div>
        ) : (
          <div className="text-sm text-muted-foreground italic h-4">&nbsp;</div>
        )}
      </div>
    </div>
  );
}
