/**
 * LLM Service - 使用 Coze SDK 调用 LLM
 * 
 * 核心功能：
 * 1. 按规定路径读取文件并理解内容
 * 2. 将文件内容发送给 AI 模型
 * 3. 流式返回 AI 生成结果
 * 4. 支持多种模型配置
 */

import { NextRequest } from "next/server";
import { readFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";
import os from "os";
import { LLMClient, Config } from "coze-coding-dev-sdk";

const DATA_BASE_PATH = join(process.cwd(), "src/data/ai_pm_transition");

// 默认模型
export const DEFAULT_MODEL = "doubao-seed-1-8-251228";

export interface LLMServiceConfig {
  model?: string;
  temperature?: number;
  thinking?: "enabled" | "disabled";
}

export interface FileReadResult {
  success: boolean;
  path: string;
  content: string;
  error?: string;
}

/**
 * 按路径读取文件
 */
export function readFileByPath(relativePath: string): FileReadResult {
  try {
    const fullPath = join(DATA_BASE_PATH, relativePath);
    const content = readFileSync(fullPath, "utf-8");
    return {
      success: true,
      path: relativePath,
      content,
    };
  } catch (error) {
    return {
      success: false,
      path: relativePath,
      content: "",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * 按顺序读取多个文件
 */
export function readFilesInOrder(paths: string[]): {
  success: boolean;
  results: FileReadResult[];
  error?: string;
} {
  const results: FileReadResult[] = [];
  
  for (const path of paths) {
    const result = readFileByPath(path);
    results.push(result);
    
    if (!result.success) {
      return {
        success: false,
        results,
        error: `Failed to read ${path}: ${result.error}`,
      };
    }
  }
  
  return { success: true, results };
}

/**
 * 构建发送给 LLM 的上下文消息
 */
export function buildContextMessage(
  files: FileReadResult[],
  instruction: string
): string {
  let message = `【任务指令】\n${instruction}\n\n`;
  
  message += "【必需阅读的文件】\n";
  message += "请按以下顺序阅读并理解每个文件：\n\n";
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    message += `--- 文件 ${i + 1}: ${file.path} ---\n`;
    message += file.content;
    message += "\n\n";
  }
  
  message += "【要求】\n";
  message += "1. 请仔细阅读以上所有文件，理解其内容和关系\n";
  message += "2. 根据任务指令和文件内容，生成符合格式要求的输出\n";
  message += "3. 输出应该遵循原始文件的格式和结构\n";
  message += "4. 如果发现任何问题（如前置条件不满足），请明确指出\n";
  
  return message;
}

/**
 * LLM Service 类 - 使用 Coze SDK
 */
export class LLMService {
  private client: LLMClient;

  constructor() {
    const config = new Config({
      apiKey: process.env.COZE_WORKLOAD_IDENTITY_API_KEY || "",
      baseUrl: process.env.COZE_INTEGRATION_BASE_URL,
    });
    this.client = new LLMClient(config);
  }

  /**
   * 流式调用 LLM
   */
  async *streamGenerate(
    files: FileReadResult[],
    instruction: string,
    config?: LLMServiceConfig
  ): AsyncGenerator<string, void, unknown> {
    const contextMessage = buildContextMessage(files, instruction);
    
    const messages = [
      {
        role: "system" as const,
        content: `你是一个专业的 AI PM 学习教练。你需要：
1. 严格按照用户提供的文件路径读取并理解内容
2. 严格按照任务指令执行
3. 遵循文件的原始格式和结构
4. 生成的内容应该可直接保存为 Markdown 文件
5. 如果发现问题或前置条件不满足，必须明确指出`,
      },
      {
        role: "user" as const,
        content: contextMessage,
      },
    ];

    const model = config?.model || DEFAULT_MODEL;
    const temperature = config?.temperature ?? 0.7;

    try {
      const response = await this.client.invoke(messages, {
        model,
        temperature,
        streaming: true,
      });

      if (!response.content) {
        throw new Error("No response content");
      }

      yield response.content;
    } catch (error) {
      throw new Error(`LLM API error: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  /**
   * 非流式调用 LLM
   */
  async generate(
    files: FileReadResult[],
    instruction: string,
    config?: LLMServiceConfig
  ): Promise<string> {
    let result = "";
    
    for await (const chunk of this.streamGenerate(files, instruction, config)) {
      result += chunk;
    }
    
    return result;
  }
}

/**
 * 读取多个文件内容
 */
export async function readFileContents(paths: string[]): Promise<string[]> {
  const results: string[] = [];
  
  for (const filePath of paths) {
    try {
      const content = readFileSync(filePath, "utf-8");
      results.push(content);
    } catch {
      results.push("");
    }
  }
  
  return results;
}

interface LLMSettings {
  systemModel?: string;
  customModel?: string;
  customApiKey?: string;
  customEndpoint?: string;
}

function resolveLLMSettingsPath(): string | null {
  const candidates = [
    process.env.STUDY_OS_STORAGE_DIR,
    join(process.cwd(), ".study-os-runtime"),
    join(os.tmpdir(), "study-os-runtime"),
  ].filter((v): v is string => Boolean(v));

  for (const dir of candidates) {
    const filePath = join(dir, "settings", "llm-settings.json");
    if (existsSync(filePath)) return filePath;
  }
  return null;
}

function loadLLMSettings(): LLMSettings | null {
  try {
    const path = resolveLLMSettingsPath();
    if (!path) return null;
    return JSON.parse(readFileSync(path, "utf-8")) as LLMSettings;
  } catch {
    return null;
  }
}

/**
 * 流式生成文本 - 通用接口
 * 优先使用用户自定义 API 设置，否则回退到 Coze 平台 env vars
 */
export async function generateFromLLM(
  messages: Array<{ role: "user" | "assistant" | "system"; content: string }>,
  systemPrompt: string,
  onChunk: (chunk: string) => void,
  options?: {
    model?: string;
    temperature?: number;
  }
): Promise<string> {
  const settings = loadLLMSettings();

  // 用户自定义 API 优先
  const apiKey =
    settings?.customApiKey ||
    process.env.COZE_WORKLOAD_IDENTITY_API_KEY ||
    "";
  const baseUrl =
    settings?.customEndpoint ||
    process.env.COZE_INTEGRATION_BASE_URL;

  const config = new Config({ apiKey, baseUrl });
  const client = new LLMClient(config);

  const model = options?.model || settings?.customModel || settings?.systemModel || DEFAULT_MODEL;
  const temperature = options?.temperature ?? 0.7;

  const allMessages = [
    { role: "system" as const, content: systemPrompt },
    ...messages,
  ];

  try {
    const response = await client.invoke(allMessages, {
      model,
      temperature,
      streaming: true,
    });

    if (!response.content) {
      throw new Error("No response content");
    }

    onChunk(response.content);
    return response.content;
  } catch (error) {
    throw new Error(`LLM API error: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

/**
 * 测试 LLM 连接（支持 Coze 平台和自定义 API）
 */
export async function testLLMConnection(options?: {
  apiKey?: string;
  model?: string;
  endpoint?: string;
}): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    const { apiKey, model, endpoint } = options || {};
    
    // 如果提供了 endpoint 和 apiKey，使用自定义 API（OpenAI 兼容格式）
    if (endpoint && apiKey) {
      const response = await fetch(`${endpoint}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: model || "deepseek-v4-flash",
          messages: [{ role: "user", content: "Hello" }],
          max_tokens: 10,
        }),
      });

      if (response.ok) {
        return { success: true, message: "自定义 API 连接成功" };
      } else {
        const error = await response.json().catch(() => ({}));
        return { 
          success: false, 
          message: error.error?.message || `连接失败 (${response.status})` 
        };
      }
    }
    
    // 否则使用 Coze 平台
    const config = new Config({
      apiKey: apiKey || process.env.COZE_WORKLOAD_IDENTITY_API_KEY || "",
      baseUrl: process.env.COZE_INTEGRATION_BASE_URL,
    });
    const client = new LLMClient(config);
    
    const modelName = model || DEFAULT_MODEL;
    
    const response = await client.invoke([
      { role: "user", content: "Hello" }
    ], {
      model: modelName,
      temperature: 0.7,
    });

    if (response.content) {
      return { success: true, message: "Coze 平台连接成功" };
    } else {
      return { success: false, message: "API 返回为空" };
    }
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : "连接失败" };
  }
}
