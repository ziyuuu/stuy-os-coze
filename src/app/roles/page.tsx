'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, Lightbulb, Settings, Upload, Check, AlertCircle } from 'lucide-react';
import { getRoles, updateRoleConfigLocal, type RoleConfig } from '@/lib/roles/config';

export default function RolesPage() {
  const router = useRouter();
  const [editingRole, setEditingRole] = useState<RoleConfig | null>(null);
  const [editedPrompt, setEditedPrompt] = useState('');
  const [editedFlow, setEditedFlow] = useState('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [importStatus, setImportStatus] = useState<'idle' | 'importing' | 'success' | 'error'>('idle');
  const [roles, setRoles] = useState(getRoles());
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/roles/update')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setRoles(data.data);
      })
      .catch(() => {});
  }, []);
  const roleCards = roles.map(role => ({
    id: role.id,
    name: role.name,
    icon: role.id === 'career_mentor' ? '🎯' : role.id === 'practice_coach' ? '📖' : '👨‍🏫',
    color: role.id === 'career_mentor' ? 'bg-blue-500' : role.id === 'practice_coach' ? 'bg-green-500' : 'bg-purple-500',
    description: role.description,
    responsibilities: [
      role.systemPrompt.match(/##\s*你的职责\n([\s\S]*?)##/)?.[1]?.split('\n').filter(l => l.trim().startsWith('-')).map(l => l.replace(/^[-\d.]\s*/, '').trim()) || [],
      role.systemPrompt.match(/##\s*你的风格\n([\s\S]*?)##/)?.[1]?.split('\n').filter(l => l.trim().startsWith('-')).map(l => l.replace(/^[-\d.]\s*/, '').trim()) || []
    ].flat().slice(0, 4)
  }));

  const methodologies = [
    {
      id: '4cid',
      name: '4C/ID 模型',
      category: '学习设计',
      description: '完整任务驱动 + 局部专项补强的学习设计方法',
      principles: [
        '完整任务优先：围绕可解释的产品任务组织学习',
        '课程支撑线：为完整任务提供必要的知识支撑',
        '程序性脚手架：提供示例、模板、问题清单',
        '局部专项练习：针对短板进行针对性补强'
      ]
    },
    {
      id: 'retrieval',
      name: '检索练习',
      category: '学习方法',
      description: '先回忆、再应用、查漏、修正的学习循环',
      principles: [
        '先回忆：尝试回忆关键概念和方法',
        '再应用：将知识应用于实际问题',
        '再查漏：识别知识和技能的缺口',
        '再修正：补充和完善知识体系'
      ]
    },
    {
      id: 'spiral',
      name: '螺旋递进',
      category: '学习节奏',
      description: '同一能力在不同复杂度和场景中反复调用',
      principles: [
        '能力复用：在相近问题中调用相同能力',
        '难度递进：逐步增加问题的复杂度和真实性',
        '交错练习：避免单一技能的过度集中',
        '迁移判断：训练在不同场景中选择合适方法'
      ]
    },
    {
      id: 'formative',
      name: '形成性评价',
      category: '评价方法',
      description: '在学习过程中持续评估和反馈',
      principles: [
        '检查标准：关键产出必须有明确的检查标准',
        '及时反馈：发现缺口后立即提供改进建议',
        '迭代改进：基于反馈持续优化学习方案',
        '证据导向：用实际产出证明能力提升'
      ]
    }
  ];

  const handleEditRole = (role: typeof roles[0]) => {
    setEditingRole(role);
    setEditedPrompt(role.systemPrompt);
    setEditedFlow(role.ragConfig.instruction);
    setSaveStatus('idle');
  };

  const handleSaveRole = async () => {
    if (!editingRole) return;
    
    setSaveStatus('saving');
    try {
      const response = await fetch('/api/roles/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roleId: editingRole.id,
          systemPrompt: editedPrompt,
          flowInstruction: editedFlow
        })
      });
      
      if (response.ok) {
        setSaveStatus('success');
        updateRoleConfigLocal(editingRole.id, editedPrompt, editedFlow);
        setTimeout(() => setEditingRole(null), 1500);
      } else {
        setSaveStatus('error');
      }
    } catch {
      setSaveStatus('error');
    }
  };

  const handleImportMethodology = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setImportStatus('importing');
    try {
      const content = await file.text();
      const response = await fetch('/api/methodologies/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, filename: file.name })
      });
      
      if (response.ok) {
        setImportStatus('success');
        setTimeout(() => setImportStatus('idle'), 2000);
      } else {
        setImportStatus('error');
      }
    } catch {
      setImportStatus('error');
    }
    e.target.value = '';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">角色与方法论</h1>
        <p className="text-muted-foreground mt-2">
          了解学习系统中的角色定义和核心方法论
        </p>
      </div>

      {/* 角色部分 */}
      <div>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Users className="h-5 w-5" />
          角色能力
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          {roleCards.map((role) => (
            <Card key={role.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${role.color} text-white`}>
                      <span className="text-lg">{role.icon}</span>
                    </div>
                    <CardTitle>{role.name}</CardTitle>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleEditRole(roles.find(r => r.id === role.id)!)}
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
                <CardDescription>{role.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {role.responsibilities.map((resp, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <Badge variant="outline" className="h-5 min-w-[1.5rem] flex items-center justify-center text-xs">
                        {index + 1}
                      </Badge>
                      <span>{resp}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* 方法论部分 */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            核心方法论
          </h2>
          <div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImportMethodology}
              accept=".md,.txt"
              className="hidden"
            />
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={importStatus === 'importing'}
            >
              {importStatus === 'importing' ? (
                <>导入中...</>
              ) : importStatus === 'success' ? (
                <><Check className="h-4 w-4 mr-1" />导入成功</>
              ) : importStatus === 'error' ? (
                <><AlertCircle className="h-4 w-4 mr-1" />导入失败</>
              ) : (
                <><Upload className="h-4 w-4 mr-1" />导入方法论</>
              )}
            </Button>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {methodologies.map((method) => (
            <Card key={method.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{method.name}</CardTitle>
                  <Badge variant="outline">{method.category}</Badge>
                </div>
                <CardDescription>{method.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1.5">
                  {method.principles.map((p, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-primary">•</span>
                      {p}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* 编辑角色弹窗 */}
      {editingRole && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">设置 - {editingRole.name}</h3>
              <Button variant="ghost" size="sm" onClick={() => setEditingRole(null)}>
                ✕
              </Button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">系统提示词</label>
                <textarea
                  value={editedPrompt}
                  onChange={(e) => setEditedPrompt(e.target.value)}
                  className="w-full h-48 p-3 rounded-md border bg-background text-sm font-mono"
                  placeholder="输入系统提示词..."
                />
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">流程指令</label>
                <textarea
                  value={editedFlow}
                  onChange={(e) => setEditedFlow(e.target.value)}
                  className="w-full h-24 p-3 rounded-md border bg-background text-sm"
                  placeholder="输入流程指令..."
                />
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditingRole(null)}>
                  取消
                </Button>
                <Button 
                  onClick={handleSaveRole}
                  disabled={saveStatus === 'saving'}
                >
                  {saveStatus === 'saving' ? '保存中...' : saveStatus === 'success' ? '已保存' : saveStatus === 'error' ? '保存失败' : '保存'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
