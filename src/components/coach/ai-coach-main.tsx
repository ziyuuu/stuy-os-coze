"use client";

import { useEffect, useState } from "react";
import { CoachChat } from "./coach-chat";
import { Badge } from "@/components/ui/badge";
import { Target, MapPin, Loader2 } from "lucide-react";

export function AICoachMain() {
  const [currentGoal, setCurrentGoal] = useState("");
  const [currentPhase, setCurrentPhase] = useState("");
  const [nextActions, setNextActions] = useState<string[]>([]);
  const [loadingContext, setLoadingContext] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/memory-state");
        const data = await res.json();
        if (cancelled) return;
        if (data.success && data.data) {
          const state = data.data;
          setCurrentGoal(state.currentGoal || "");
          setCurrentPhase(state.currentPhase || "");
          setNextActions(state.nextActions || []);
        }
      } catch {} finally {
        if (!cancelled) setLoadingContext(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="flex flex-col h-full">
      {/* MemoryState 上下文提示条 */}
      {loadingContext ? (
        <div className="border-b px-4 py-3 flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          加载上下文...
        </div>
      ) : (currentPhase || currentGoal || nextActions.length > 0) ? (
        <div className="border-b bg-muted/30 px-4 py-3 space-y-2">
          <p className="text-xs text-muted-foreground font-medium">
            AI 教练上下文
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {currentPhase && (
              <Badge variant="secondary" className="gap-1">
                <MapPin className="h-3 w-3" />
                {currentPhase}
              </Badge>
            )}
            {currentGoal && (
              <Badge variant="outline" className="gap-1 max-w-md truncate">
                <Target className="h-3 w-3" />
                {currentGoal}
              </Badge>
            )}
          </div>
          {nextActions.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {nextActions.slice(0, 4).map((action, i) => (
                <span key={i} className="text-xs text-muted-foreground">
                  #{i + 1} {action}
                  {i < Math.min(nextActions.length, 4) - 1 && " · "}
                </span>
              ))}
            </div>
          )}
        </div>
      ) : null}

      {/* 教练对话区 */}
      <div className="flex-1 min-h-0">
        <CoachChat />
      </div>
    </div>
  );
}
