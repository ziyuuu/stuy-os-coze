"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

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

interface ProgressGridProps {
  progress?: PlanProgress | null;
}

const DAY_LABELS = ["一", "二", "三", "四", "五", "六", "日"];

const STATUS_COLORS: Record<string, string> = {
  completed: "bg-green-500 hover:bg-green-600",
  incomplete: "bg-red-400 hover:bg-red-500",
  no_plan: "bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600",
  future: "bg-transparent border border-gray-200 dark:border-gray-600",
};

const STATUS_LABELS: Record<string, string> = {
  completed: "已完成",
  incomplete: "未完成",
  no_plan: "无计划",
  future: "未到来",
};

export function ProgressGrid({ progress }: ProgressGridProps) {
  if (!progress || !progress.grid || progress.grid.length === 0) {
    return null;
  }

  const weeks = chunkByWeek(progress.grid);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">
          进度概览
          <span className="text-xs text-muted-foreground ml-2">
            {progress.periodStart} ~ {progress.periodEnd}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Summary */}
        <div className="flex flex-wrap gap-3 mb-4 text-xs">
          <StatBadge color="bg-green-500" label="已完成" value={progress.completedDays} />
          <StatBadge color="bg-red-400" label="未完成" value={progress.incompleteDays} />
          <StatBadge color="bg-gray-300 dark:bg-gray-600" label="无计划" value={progress.noPlanDays} />
          <StatBadge color="bg-white border dark:bg-transparent dark:border-gray-500" label="未到来" value={progress.futureDays} />
          <span className="text-muted-foreground self-center">
            {progress.totalDaysToDate > 0
              ? `完成率 ${Math.round((progress.completedDays / progress.totalDaysToDate) * 100)}%`
              : ""}
          </span>
        </div>

        {/* Grid */}
        <div className="inline-flex flex-col gap-1">
          {/* Day headers */}
          <div className="flex gap-1">
            {DAY_LABELS.map((label) => (
              <div
                key={label}
                className="w-7 h-5 flex items-center justify-center text-[10px] text-muted-foreground"
              >
                {label}
              </div>
            ))}
          </div>
          {/* Week rows */}
          {weeks.map((week, wi) => (
            <div key={wi} className="flex gap-1 items-center">
              {week.map((item, di) => (
                <div
                  key={di}
                  className={cn(
                    "w-7 h-7 rounded-sm flex items-center justify-center text-[9px] transition-colors cursor-default",
                    STATUS_COLORS[item.status],
                    item.status === "future" ? "" : item.status === "no_plan" ? "text-gray-600 dark:text-gray-300" : "text-white/80"
                  )}
                  title={`${item.date}: ${STATUS_LABELS[item.status]}`}
                >
                  {item.date.slice(8)}
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 mt-3 text-[10px] text-muted-foreground">
          {(["completed", "incomplete", "no_plan", "future"] as const).map((s) => (
            <span key={s} className="flex items-center gap-1">
              <span className={cn("w-3 h-3 rounded-sm inline-block", STATUS_COLORS[s])} />
              {STATUS_LABELS[s]}
            </span>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function StatBadge({
  color,
  label,
  value,
}: {
  color: string;
  label: string;
  value: number;
}) {
  return (
    <span className="flex items-center gap-1">
      <span className={cn("w-3 h-3 rounded-sm inline-block", color)} />
      <span>
        {label} {value}
      </span>
    </span>
  );
}

function chunkByWeek(items: ProgressGridItem[]): ProgressGridItem[][] {
  const weeks: ProgressGridItem[][] = [];
  let currentWeek: ProgressGridItem[] = [];

  // Pad start of first week to align with Monday
  const firstDate = new Date(items[0]?.date + "T00:00:00");
  const firstDay = firstDate.getDay();
  const mondayOffset = firstDay === 0 ? 6 : firstDay - 1; // days from Monday (0 = Mon in China)
  for (let i = 0; i < mondayOffset; i++) {
    currentWeek.push({ date: "", status: "future" as const });
  }

  for (const item of items) {
    currentWeek.push(item);
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }

  // Pad remaining cells
  if (currentWeek.length > 0 && currentWeek.length < 7) {
    while (currentWeek.length < 7) {
      currentWeek.push({ date: "", status: "future" as const });
    }
    weeks.push(currentWeek);
  }

  return weeks;
}
