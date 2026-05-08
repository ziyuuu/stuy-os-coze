/**
 * 角色配置系统 — 客户端安全模块（零 Node.js 依赖）
 * 持久化逻辑在 config-persistence.ts
 */

export interface RoleConfig {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
  model?: string;
  ragConfig: {
    enabled: boolean;
    files: string[];
    instruction: string;
  };
}

export interface RoleOverrides {
  [roleId: string]: { systemPrompt: string; flowInstruction: string };
}

// 职业导师角色
export const careerMentorRole: RoleConfig = {
  id: "career_mentor",
  name: "职业导师",
  description: "指导职业发展和求职策略",
  systemPrompt: `你是一位专业的职业导师，专注于帮助用户实现 AI PM 职业转型。

## 你的职责
1. 帮助用户梳理职业目标和方向
2. 提供求职策略和面试建议
3. 指导作品集和简历优化
4. 分析 AI PM 岗位市场需求

## 你的风格
- 专业但不刻板
- 注重实际可执行性
- 鼓励用户的每一步进步
- 给出具体建议而非泛泛而谈

## 重要原则
- 不替用户做决定，而是提供分析框架
- 关注用户的长期发展而非短期利益
- 诚实指出需要改进的地方`,
  ragConfig: {
    enabled: true,
    files: [
      "src/data/ai_pm_transition/resources/resource_catalog.md",
      "src/data/ai_pm_transition/roles/career_mentor_role.md",
    ],
    instruction: "你可以参考用户的资源目录和职业导师角色定义来提供建议。",
  },
};

// 实践教练角色
export const practiceCoachRole: RoleConfig = {
  id: "practice_coach",
  name: "实践教练",
  description: "监督学习进度和实践执行",
  systemPrompt: `你是一位严格的实践教练，专注于监督用户的每日学习和实践执行。

## 你的职责
1. 每日检查学习计划完成情况
2. 督促用户执行学习任务
3. 提供实践反馈和改进建议
4. 帮助用户克服拖延和困难

## 你的风格
- 严格但不苛刻
- 关注过程而非结果
- 及时肯定进步，严肃指出问题
- 帮助用户建立自律习惯

## 重要原则
- 诚实反馈，不回避问题
- 帮助用户分解大目标为小任务
- 关注可持续性而非一时热情
- 记录和分析用户的学习模式`,
  ragConfig: {
    enabled: true,
    files: [
      "src/data/ai_pm_transition/current_week_plan.md",
      "src/data/ai_pm_transition/current_month_plan.md",
      "src/data/ai_pm_transition/master_plan.md",
      "src/data/ai_pm_transition/roles/practice_coach_role.md",
    ],
    instruction: "参考用户当前的学习计划和目标，提供针对性的监督和反馈。",
  },
};

// 教师角色
export const teacherRole: RoleConfig = {
  id: "teacher",
  name: "教师角色",
  description: "传授知识和解答疑惑",
  systemPrompt: `你是一位耐心的教师，专注于传授 AI PM 相关知识并解答疑惑。

## 你的职责
1. 讲解 AI PM 核心概念和方法论
2. 解答用户在学习和实践中的疑问
3. 提供案例分析和最佳实践
4. 帮助用户建立系统性知识框架

## 你的风格
- 耐心细致，深入浅出
- 理论与实践相结合
- 使用具体案例帮助理解
- 鼓励提问和讨论

## 重要原则
- 确保用户真正理解而非死记硬背
- 关联已有知识帮助新知识理解
- 提供延伸学习资源
- 适时测试用户理解程度`,
  ragConfig: {
    enabled: true,
    files: [
      "src/data/ai_pm_transition/resources/learning_methods.md",
      "src/data/ai_pm_transition/resources/resource_catalog.md",
      "src/data/ai_pm_transition/roles/teacher_role.md",
    ],
    instruction: "参考学习方法论和资源目录，为用户提供全面的知识讲解。",
  },
};

// 所有角色列表
export const ROLES: RoleConfig[] = [
  careerMentorRole,
  practiceCoachRole,
  teacherRole,
];

// 获取所有角色（返回副本，防止外部直接修改）
export function getRoles(): RoleConfig[] {
  return ROLES.map((r) => ({ ...r, ragConfig: { ...r.ragConfig } }));
}

// 根据 ID 获取角色配置
export function getRoleById(id: string): RoleConfig | undefined {
  return ROLES.find((role) => role.id === id);
}

// 仅内存更新（用于客户端即时反馈）
export function updateRoleConfigLocal(
  roleId: string,
  systemPrompt: string,
  flowInstruction: string
): boolean {
  const role = ROLES.find((r) => r.id === roleId);
  if (!role) return false;
  role.systemPrompt = systemPrompt;
  role.ragConfig.instruction = flowInstruction;
  return true;
}

// 获取所有角色 ID 和名称（用于选择器）
export function getRoleOptions(): Array<{ id: string; name: string; description: string }> {
  return ROLES.map((role) => ({
    id: role.id,
    name: role.name,
    description: role.description,
  }));
}
