"use client";

import { CoachChat } from "./coach-chat";

export function AICoachPanel() {
  return (
    <aside className="sticky top-0 h-screen flex flex-col border-l bg-background/95 backdrop-blur w-80 shrink-0">
      <CoachChat compact />
    </aside>
  );
}
