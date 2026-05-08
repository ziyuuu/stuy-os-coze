// AI PM 转型学习管理系统 - 文件解析工具
import fs from 'fs';
import path from 'path';

const DATA_PATH = path.join(process.cwd(), 'src/data/ai_pm_transition');

// 确保路径存在
function ensureDataPath(): string {
  if (!fs.existsSync(DATA_PATH)) {
    throw new Error(`数据目录不存在: ${DATA_PATH}`);
  }
  return DATA_PATH;
}

// 读取文件内容
export async function readFile(relativePath: string): Promise<string | null> {
  try {
    const filePath = path.join(ensureDataPath(), relativePath);
    if (!fs.existsSync(filePath)) {
      return null;
    }
    return fs.readFileSync(filePath, 'utf-8');
  } catch (error) {
    console.error(`读取文件失败: ${relativePath}`, error);
    return null;
  }
}

// 读取目录内容
export async function listDirectory(relativePath: string): Promise<string[]> {
  try {
    const dirPath = path.join(ensureDataPath(), relativePath);
    if (!fs.existsSync(dirPath)) {
      return [];
    }
    const stat = fs.statSync(dirPath);
    if (!stat.isDirectory()) {
      return [];
    }
    return fs.readdirSync(dirPath);
  } catch (error) {
    console.error(`读取目录失败: ${relativePath}`, error);
    return [];
  }
}

// 读取目录及子目录
export async function listDirectoryRecursive(relativePath: string): Promise<string[]> {
  const results: string[] = [];
  
  try {
    const dirPath = path.join(ensureDataPath(), relativePath);
    if (!fs.existsSync(dirPath)) {
      return results;
    }
    
    const items = fs.readdirSync(dirPath);
    
    for (const item of items) {
      const fullPath = path.join(dirPath, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        const subItems = await listDirectoryRecursive(path.join(relativePath, item));
        results.push(...subItems);
      } else {
        results.push(path.join(relativePath, item));
      }
    }
  } catch (error) {
    console.error(`递归读取目录失败: ${relativePath}`, error);
  }
  
  return results;
}

// 解析 Markdown 元数据（YAML front matter）
export function parseFrontMatter(content: string): { metadata: Record<string, unknown>; body: string } {
  const frontMatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
  const match = content.match(frontMatterRegex);
  
  if (!match) {
    return { metadata: {}, body: content };
  }
  
  const [, frontMatterStr, body] = match;
  const metadata: Record<string, unknown> = {};
  
  // 简单解析 YAML 风格的 front matter
  const lines = frontMatterStr.split('\n');
  let currentKey = '';
  let currentArray: string[] = [];
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    if (trimmedLine.startsWith('- ')) {
      currentArray.push(trimmedLine.slice(2).trim());
    } else if (trimmedLine.includes(':')) {
      // 保存之前的数组
      if (currentKey && currentArray.length > 0) {
        metadata[currentKey] = currentArray;
        currentArray = [];
      }
      
      const [key, ...valueParts] = trimmedLine.split(':');
      currentKey = key.trim();
      const value = valueParts.join(':').trim();
      
      if (value) {
        metadata[currentKey] = value;
        currentKey = '';
      }
    }
  }
  
  // 保存最后的数组
  if (currentKey && currentArray.length > 0) {
    metadata[currentKey] = currentArray;
  }
  
  return { metadata, body };
}

// 提取 Markdown 表格（正确处理多个表格）
export function parseMarkdownTable(content: string): { headers: string[]; rows: string[][] } | null {
  const lines = content.split('\n');
  
  // 找到所有表格区域（连续的包含 | 的行）
  const tables: { start: number; end: number; isMainTable: boolean }[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line.includes('|')) continue;
    
    // 检查是否是主要资源表格（有 "Resource ID" 列）
    const isMainTable = /\bResource\s+ID\b/.test(line);
    
    // 找到表格的结束位置（下一个不以 | 开头的行之前）
    let end = i;
    while (end + 1 < lines.length && lines[end + 1].trim().includes('|')) {
      end++;
    }
    
    tables.push({ start: i, end, isMainTable });
    
    // 跳过已处理的行
    i = end;
  }
  
  if (tables.length === 0) {
    return null;
  }
  
  // 优先选择主要资源表格（有 Resource ID 列）
  const targetTable = tables.find(t => t.isMainTable) || tables[tables.length - 1];
  const tableLines: number[] = [];
  for (let i = targetTable.start; i <= targetTable.end; i++) {
    tableLines.push(i);
  }
  
  const headers = lines[tableLines[0]]
    .split('|')
    .map(h => h.trim())
    .filter(h => h);
  
  // 跳过分隔行
  const startIndex = tableLines[1] === tableLines[0] + 1 ? 2 : 1;
  
  const rows: string[][] = [];
  for (let i = startIndex; i < tableLines.length; i++) {
    const row = lines[tableLines[i]]
      .split('|')
      .map(cell => cell.trim())
      .filter(cell => cell);
    if (row.length > 0) {
      rows.push(row);
    }
  }
  
  return { headers, rows };
}

// 提取标题
export function extractHeadings(content: string): { level: number; text: string }[] {
  const headingRegex = /^(#{1,6})\s+(.+)$/gm;
  const headings: { level: number; text: string }[] = [];
  let match;
  
  while ((match = headingRegex.exec(content)) !== null) {
    headings.push({
      level: match[1].length,
      text: match[2].trim()
    });
  }
  
  return headings;
}

// 提取列表项
export function extractListItems(content: string): string[] {
  const listRegex = /^[-*]\s+(.+)$/gm;
  const items: string[] = [];
  let match;
  
  while ((match = listRegex.exec(content)) !== null) {
    items.push(match[1].trim());
  }
  
  return items;
}

// 提取链接
export function extractLinks(content: string): { text: string; url: string }[] {
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  const links: { text: string; url: string }[] = [];
  let match;
  
  while ((match = linkRegex.exec(content)) !== null) {
    links.push({ text: match[1], url: match[2] });
  }
  
  return links;
}

// 提取代码块
export function extractCodeBlocks(content: string): { language: string; code: string }[] {
  const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g;
  const blocks: { language: string; code: string }[] = [];
  let match;
  
  while ((match = codeBlockRegex.exec(content)) !== null) {
    blocks.push({
      language: match[1] || 'text',
      code: match[2].trim()
    });
  }
  
  return blocks;
}

// 简化内容（用于预览）
export function simplifyContent(content: string, maxLength = 500): string {
  // 移除 Markdown 格式
  let simplified = content
    .replace(/#{1,6}\s+/g, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/\|/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  
  if (simplified.length > maxLength) {
    simplified = simplified.slice(0, maxLength) + '...';
  }
  
  return simplified;
}

// 获取文件修改时间
export function getFileModifiedTime(relativePath: string): string | null {
  try {
    const filePath = path.join(ensureDataPath(), relativePath);
    if (!fs.existsSync(filePath)) {
      return null;
    }
    const stat = fs.statSync(filePath);
    return stat.mtime.toISOString();
  } catch (error) {
    return null;
  }
}

// 获取目录修改时间
export function getDirModifiedTime(relativePath: string): string | null {
  try {
    const dirPath = path.join(ensureDataPath(), relativePath);
    if (!fs.existsSync(dirPath)) {
      return null;
    }
    const stat = fs.statSync(dirPath);
    return stat.mtime.toISOString();
  } catch (error) {
    return null;
  }
}
