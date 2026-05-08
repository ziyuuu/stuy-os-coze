"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  GitBranch,
  FileText,
  RotateCcw,
  GraduationCap,
  Play,
  ArrowRight,
} from "lucide-react";
import { getAvailableFlows } from "@/lib/flow-definitions";
import type { FlowType } from "@/lib/flow-definitions";

const flowList = getAvailableFlows();

const typeConfig: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  plan_generation: { label: "计划生成", icon: <FileText className="h-4 w-4" />, color: "bg-blue-500" },
  review: { label: "复盘流程", icon: <RotateCcw className="h-4 w-4" />, color: "bg-green-500" },
  prep: { label: "备课流程", icon: <GraduationCap className="h-4 w-4" />, color: "bg-purple-500" },
};

function getExecutionRoute(flowType: FlowType, flowCategory: string): string {
  if (flowCategory === "review") return "/reviews-execute";
  if (flowCategory === "prep") return "/plans-execute?tab=prep";
  return "/plans-execute?tab=plan";
}

export default function FlowsPage() {
  const groups = useMemo(() => {
    const planGen = flowList.filter((f) => f.type === "plan_generation");
    const review = flowList.filter((f) => f.type === "review");
    const prep = flowList.filter((f) => f.type === "prep");
    return { plan_generation: planGen, review, prep };
  }, []);

  const totalCount = flowList.length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">流程中心</h1>
        <p className="text-muted-foreground mt-2">
          查看所有可用流程，选择后进入对应的执行页面
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatBox
          icon={<GitBranch className="h-5 w-5 text-primary" />}
          label="流程总数"
          value={totalCount}
          unit="个流程定义"
        />
        <StatBox
          icon={<FileText className="h-5 w-5 text-blue-500" />}
          label="计划生成"
          value={groups.plan_generation.length}
          unit="个流程"
        />
        <StatBox
          icon={<RotateCcw className="h-5 w-5 text-green-500" />}
          label="复盘"
          value={groups.review.length}
          unit="个流程"
        />
        <StatBox
          icon={<GraduationCap className="h-5 w-5 text-purple-500" />}
          label="备课"
          value={groups.prep.length}
          unit="个流程"
        />
      </div>

      {/* Flow tabs */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">全部 ({totalCount})</TabsTrigger>
          <TabsTrigger value="plan_generation">
            计划生成 ({groups.plan_generation.length})
          </TabsTrigger>
          <TabsTrigger value="review">
            复盘 ({groups.review.length})
          </TabsTrigger>
          <TabsTrigger value="prep">
            备课 ({groups.prep.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <FlowGrid flows={flowList} />
        </TabsContent>
        {Object.entries(groups).map(([type, typeFlows]) => (
          <TabsContent key={type} value={type}>
            <FlowGrid flows={typeFlows} />
          </TabsContent>
        ))}
      </Tabs>

      {/* Explanatory card */}
      <Card>
        <CardHeader>
          <CardTitle>流程系统说明</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <InfoBlock
              icon={<FileText className="h-4 w-4 text-blue-500" />}
              title="计划生成流程"
              text="从月计划到周计划、日计划的半自动派生流程，校验前置条件后生成草稿，经用户确认提交为正式 Artifact。"
            />
            <InfoBlock
              icon={<RotateCcw className="h-4 w-4 text-green-500" />}
              title="复盘流程"
              text="日、周、月复盘，需要用户提供完成情况等事实输入，生成复盘记录并提交确认。"
            />
            <InfoBlock
              icon={<GraduationCap className="h-4 w-4 text-purple-500" />}
              title="备课流程"
              text="基于已确认计划生成学习备课材料，明确学习目标、活动设计和检查标准。"
            />
            <InfoBlock
              icon={<GitBranch className="h-4 w-4 text-muted-foreground" />}
              title="Harness 受控执行"
              text="所有流程均通过 harness 状态机执行：校验 → 生成草稿 → 编辑 → 保存 Draft → 确认 Artifact。草稿不会自动成为正式记录。"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatBox({
  icon,
  label,
  value,
  unit,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  unit: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-2 pb-2">
        {icon}
        <CardTitle className="text-base">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-sm text-muted-foreground">{unit}</p>
      </CardContent>
    </Card>
  );
}

function FlowGrid({ flows }: { flows: typeof flowList }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {flows.map((flow) => {
        const config = typeConfig[flow.type] || {
          label: "其他",
          icon: <GitBranch className="h-4 w-4" />,
          color: "bg-gray-500",
        };
        const execRoute = getExecutionRoute(flow.id, flow.type);

        return (
          <Card key={flow.id} className="flex flex-col">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className={`p-2 rounded-lg ${config.color} text-white`}>{config.icon}</div>
                <Badge variant="outline">{config.label}</Badge>
              </div>
              <CardTitle className="text-lg mt-3">{flow.name}</CardTitle>
            </CardHeader>
            <CardContent className="flex-1">
              <CardDescription className="line-clamp-2">{flow.trigger}</CardDescription>
            </CardContent>
            <div className="px-6 pb-4">
              <Link href={execRoute}>
                <Button variant="outline" size="sm" className="w-full">
                  <Play className="h-4 w-4 mr-2" />
                  执行
                  <ArrowRight className="h-3 w-3 ml-auto" />
                </Button>
              </Link>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

function InfoBlock({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="p-4 rounded-lg bg-muted/50">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <h4 className="font-medium">{title}</h4>
      </div>
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  );
}
