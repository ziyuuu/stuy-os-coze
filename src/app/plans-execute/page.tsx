"use client";

import { FlowExecutionWorkbench } from "@/components/flows/flow-execution-workbench";

const FETCH_CATEGORIES = ["plan", "prep"];

const TABS = [
  {
    id: "plan",
    label: "计划生成",
    flowTypes: ["daily_plan", "week_plan", "month_plan"],
  },
  {
    id: "prep",
    label: "备课",
    flowTypes: ["daily_prep", "week_prep", "month_prep"],
  },
];

export default function PlansExecutePage() {
  return (
    <FlowExecutionWorkbench
      fetchCategories={FETCH_CATEGORIES}
      title="计划与备课"
      requireUserInput={false}
      tabs={TABS}
    />
  );
}
