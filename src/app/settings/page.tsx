import Link from "next/link";
import {
  BrainCircuit,
  Database,
  Users,
  FolderOpen,
  BookOpen,
  Upload,
  Archive,
  GitCompare,
  FileText,
  GitBranch,
  Settings2,
} from "lucide-react";

const sections = [
  {
    title: "系统配置",
    items: [
      { href: "/settings/llm", label: "LLM API 设置", desc: "配置自定义模型和 API Key", icon: BrainCircuit },
      { href: "/settings/memory", label: "Memory 状态", desc: "查看和编辑学习记忆状态", icon: Database },
      { href: "/settings/edit", label: "设置编辑", desc: "高级系统设置", icon: Settings2 },
    ],
  },
  {
    title: "资源与方法论",
    items: [
      { href: "/roles", label: "角色方法论", desc: "配置 AI 教练角色人设和提示词", icon: Users },
      { href: "/templates", label: "模板库", desc: "管理和编辑计划/复盘模板", icon: FolderOpen },
      { href: "/resources", label: "资源管理", desc: "查看学习资源目录和方法论", icon: BookOpen },
    ],
  },
  {
    title: "数据与工具",
    items: [
      { href: "/import", label: "导入中心", desc: "导入外部文档和数据", icon: Upload },
      { href: "/outputs", label: "产出记录", desc: "浏览所有学习产出 Artifact", icon: Archive },
      { href: "/upload-compare", label: "上传对比", desc: "对比上传文件的变化", icon: GitCompare },
      { href: "/plans/adjust", label: "计划调整", desc: "使用流程调整计划", icon: FileText },
      { href: "/flows", label: "流程中心", desc: "查看和执行所有工作流", icon: GitBranch },
    ],
  },
];

export default function SettingsPage() {
  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold mb-8">设置</h1>
      <div className="space-y-10">
        {sections.map((section) => (
          <div key={section.title}>
            <h2 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wider">
              {section.title}
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {section.items.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-start gap-3 p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <Icon className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <div className="font-medium text-sm">{item.label}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {item.desc}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
