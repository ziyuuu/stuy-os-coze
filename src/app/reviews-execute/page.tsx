"use client";

import { FlowExecutionWorkbench } from "@/components/flows/flow-execution-workbench";

const FETCH_CATEGORIES = ["review"];

export default function ReviewsExecutePage() {
  return (
    <FlowExecutionWorkbench
      fetchCategories={FETCH_CATEGORIES}
      title="复盘执行"
      requireUserInput={true}
    />
  );
}
