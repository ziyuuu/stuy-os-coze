"use client";

import { useEffect, useMemo, useState } from "react";
import { Archive, CheckCircle2, Clock, FileText, FolderOpen, Image } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Artifact } from "@/lib/harness/types";

const typeConfig: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  plan: { label: "计划", icon: <FileText className="h-4 w-4" />, color: "bg-blue-500" },
  lesson_prep: { label: "备课", icon: <FolderOpen className="h-4 w-4" />, color: "bg-purple-500" },
  output: { label: "产出", icon: <Archive className="h-4 w-4" />, color: "bg-cyan-500" },
  source_material: { label: "资料", icon: <FolderOpen className="h-4 w-4" />, color: "bg-slate-500" },
  learning_record: { label: "学习记录", icon: <FileText className="h-4 w-4" />, color: "bg-emerald-500" },
  idea_pool: { label: "想法池", icon: <Image className="h-4 w-4" />, color: "bg-pink-500" },
  review: { label: "复盘", icon: <FileText className="h-4 w-4" />, color: "bg-green-500" },
  unknown: { label: "未分类", icon: <Archive className="h-4 w-4" />, color: "bg-muted-foreground" },
};

export default function OutputsPage() {
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadArtifacts = async () => {
      try {
        const response = await fetch("/api/artifacts?status=committed");
        const data = await response.json();
        if (data.success) setArtifacts(data.data || []);
      } finally {
        setLoading(false);
      }
    };
    loadArtifacts();
  }, []);

  const groups = useMemo(() => {
    return {
      outputs: artifacts.filter((artifact) => artifact.kind === "output"),
      reviews: artifacts.filter((artifact) => artifact.kind === "review"),
      imported: artifacts.filter((artifact) =>
        ["source_material", "learning_record", "idea_pool", "unknown"].includes(artifact.kind)
      ),
      all: artifacts,
    };
  }, [artifacts]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">产出记录</h1>
        <p className="text-muted-foreground mt-2">
          只展示已经通过 harness 提交的正式记录，示例数据不会计入真实进度
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <SummaryCard icon={<CheckCircle2 className="h-5 w-5 text-green-500" />} title="正式产出" value={groups.outputs.length} />
        <SummaryCard icon={<FileText className="h-5 w-5 text-blue-500" />} title="复盘记录" value={groups.reviews.length} />
        <SummaryCard icon={<Clock className="h-5 w-5 text-muted-foreground" />} title="导入资产" value={groups.imported.length} />
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">全部 ({groups.all.length})</TabsTrigger>
          <TabsTrigger value="outputs">产出 ({groups.outputs.length})</TabsTrigger>
          <TabsTrigger value="reviews">复盘 ({groups.reviews.length})</TabsTrigger>
          <TabsTrigger value="imported">导入资产 ({groups.imported.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <ArtifactSection loading={loading} artifacts={groups.all} />
        </TabsContent>
        <TabsContent value="outputs">
          <ArtifactSection loading={loading} artifacts={groups.outputs} />
        </TabsContent>
        <TabsContent value="reviews">
          <ArtifactSection loading={loading} artifacts={groups.reviews} />
        </TabsContent>
        <TabsContent value="imported">
          <ArtifactSection loading={loading} artifacts={groups.imported} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SummaryCard({ icon, title, value }: { icon: React.ReactNode; title: string; value: number }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-2 pb-2">
        {icon}
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-sm text-muted-foreground">条记录</p>
      </CardContent>
    </Card>
  );
}

function ArtifactSection({ loading, artifacts }: { loading: boolean; artifacts: Artifact[] }) {
  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">加载中...</CardContent>
      </Card>
    );
  }

  if (artifacts.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          暂无正式记录。生成、导入或复盘内容经确认后会出现在这里。
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {artifacts.map((artifact) => {
        const typeInfo = typeConfig[artifact.kind] || typeConfig.unknown;
        return (
          <Card key={artifact.id} className="hover:border-primary/50 transition-colors">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`p-2 rounded-lg ${typeInfo.color} text-white`}>
                    {typeInfo.icon}
                  </div>
                  <div className="min-w-0">
                    <CardTitle className="text-base truncate">{artifact.title}</CardTitle>
                    <CardDescription className="text-xs truncate">{artifact.id}</CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant="outline" className="text-xs">{typeInfo.label}</Badge>
                  <Badge variant="secondary" className="text-xs">{artifact.createdAt.slice(0, 10)}</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground line-clamp-3">{artifact.content}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
