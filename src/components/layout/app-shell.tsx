"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "./sidebar";
import { AICoachPanel } from "../coach/ai-coach-panel";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLogin = pathname === "/login";

  if (isLogin) return <>{children}</>;

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto py-6 px-6">
        {children}
      </main>
      <AICoachPanel />
    </div>
  );
}
