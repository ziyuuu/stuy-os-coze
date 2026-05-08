// AI PM 转型学习管理系统 - 类型定义

export interface PlanMetadata {
  status: 'draft' | 'approved' | 'completed' | 'archived';
  createdAt: string;
  updatedAt: string;
  period?: {
    start: string;
    end: string;
  };
  phase?: string;
}

export interface MasterPlan {
  metadata: PlanMetadata;
  version: string;
  longTermGoals: string[];
  targetPosition: {
    primary: string;
    alternative: string[];
    constraints: string[];
  };
  phases: Phase[];
  capabilityModules: CapabilityModule[];
  portfolioStrategy: string;
  resourceStrategy: string;
}

export interface Phase {
  id: string;
  name: string;
  duration: string;
  objectives: string[];
  keyDeliverables: string[];
}

export interface CapabilityModule {
  id: string;
  name: string;
  trainingGoals: string[];
  keyCapabilities: string[];
  evidence: string[];
}

export interface AnnualPlan {
  metadata: PlanMetadata;
  year: number;
  phases: PhaseSchedule[];
  methodologyLine: string;
  resources: ResourceCandidate[];
}

export interface PhaseSchedule {
  phaseId: string;
  months: string[];
  intensity: 'light' | 'medium' | 'intensive';
  mainFocus: string;
}

export interface ResourceCandidate {
  id: string;
  name: string;
  type: 'course' | 'book' | 'article' | 'tool' | 'project';
  status: 'candidate' | 'approved' | 'completed' | 'rejected';
  priority: 'high' | 'medium' | 'low';
}

export interface MonthPlan {
  metadata: PlanMetadata;
  monthNumber: string;
  phase: string;
  period: {
    start: string;
    end: string;
  };
  goals: Goal[];
  modules: Module[];
  resources: ResourceCandidate[];
  deliverables: string[];
  schedule: WeekSchedule[];
}

export interface Goal {
  id: string;
  description: string;
  source: string;
  servicePhaseGoal: string;
  expectedEvidence: string;
  checkCriteria: string;
}

export interface Module {
  id: string;
  name: string;
  description: string;
  activities: string[];
}

export interface WeekSchedule {
  weekNumber: string;
  period: {
    start: string;
    end: string;
  };
  intensity: 'weak' | 'normal' | 'strong';
  mainFocus: string;
  status: 'pending' | 'in_progress' | 'completed';
}

export interface WeekPlan {
  metadata: PlanMetadata;
  weekNumber: string;
  monthPlanRef: string;
  period: {
    start: string;
    end: string;
  };
  goals: Goal[];
  exercises: Exercise[];
  deliverables: string[];
  dailyBreakdown?: DayPlan[];
}

export interface Exercise {
  id: string;
  name: string;
  description: string;
  expectedOutput: string;
}

export interface DayPlan {
  day: string;
  focus: string;
  tasks: Task[];
  status: 'pending' | 'in_progress' | 'completed';
}

export interface Task {
  id: string;
  description: string;
  estimatedMinutes?: number;
  completed: boolean;
}

export interface Flow {
  id: string;
  name: string;
  type: 'plan_generation' | 'review' | 'lesson_prep' | 'evaluation';
  description: string;
  steps: FlowStep[];
  status: 'idle' | 'in_progress' | 'completed';
  currentStep?: number;
}

export interface FlowStep {
  order: number;
  name: string;
  description: string;
  requiredInputs: string[];
  outputs: string[];
}

export interface Template {
  id: string;
  name: string;
  type: 'plan' | 'review' | 'evaluation' | 'output' | 'lesson_prep';
  description: string;
  content: string;
  variables: TemplateVariable[];
}

export interface TemplateVariable {
  name: string;
  description: string;
  required: boolean;
  defaultValue?: string;
}

export interface Resource {
  id: string;
  name: string;
  type: 'course' | 'book' | 'article' | 'tool' | 'project';
  url?: string;
  status: 'pending_review' | 'approved' | 'rejected' | 'in_use' | 'completed';
  reviewNotes?: string;
  usedInPhase?: string;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  responsibilities: string[];
  interactionGuidelines?: string;
}

export interface Methodology {
  id: string;
  name: string;
  description: string;
  applicationRules: string[];
  relatedPhases: string[];
}

export interface CurrentStatus {
  workspaceCreated: boolean;
  masterPlanCreated: boolean;
  annualPlanCreated: boolean;
  currentPhase: string;
  currentMonthPlan?: string;
  currentWeekPlan?: string;
  nextTasks: string[];
  lastUpdated: string;
}

// Dashboard 统计
export interface DashboardStats {
  currentPhase: string;
  currentMonth: string;
  currentWeek: string;
  planProgress: {
    totalGoals: number;
    completedGoals: number;
    percentage: number;
  };
  flowStatus: {
    total: number;
    inProgress: number;
    completed: number;
  };
  upcomingTasks: Task[];
}
