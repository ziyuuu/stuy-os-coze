'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  FileText,
  GitBranch,
  FolderOpen,
  BookOpen,
  Users,
  Archive,
  GraduationCap,
  Calendar,
  ClipboardList,
  Upload,
  Settings,
  LogOut,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const navItems = [
  {
    href: '/',
    label: '首页',
    icon: LayoutDashboard,
  },
  {
    href: '/plans',
    label: '计划管理',
    icon: FileText,
  },
  {
    href: '/flows',
    label: '流程中心',
    icon: GitBranch,
  },
  {
    href: '/plans-execute',
    label: '计划执行',
    icon: Calendar,
  },
  {
    href: '/reviews-execute',
    label: '复盘执行',
    icon: ClipboardList,
  },
  {
    href: '/templates',
    label: '模板库',
    icon: FolderOpen,
  },
  {
    href: '/resources',
    label: '资源管理',
    icon: BookOpen,
  },
  {
    href: '/import',
    label: '导入中心',
    icon: Upload,
  },
  {
    href: '/roles',
    label: '角色方法论',
    icon: Users,
  },
  {
    href: '/outputs',
    label: '产出记录',
    icon: Archive,
  },
];

export function TopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    await fetch('/api/auth/logout', { method: 'POST' });
    router.replace('/login');
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center px-4">
        <div className="flex items-center gap-2 mr-8">
          <GraduationCap className="h-6 w-6 text-primary" />
          <span className="font-bold text-lg hidden sm:inline">AI PM 转型</span>
        </div>

        <nav className="flex items-center gap-1 flex-1 overflow-x-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors shrink-0',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden md:inline">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-1 ml-auto shrink-0">
          <Link
            href="/settings/llm"
            className={cn(
              'flex items-center gap-1 px-2 py-2 text-sm font-medium rounded-md transition-colors',
              pathname.startsWith('/settings')
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            )}
            title="设置"
          >
            <Settings className="h-4 w-4" />
          </Link>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            disabled={loggingOut}
            className="text-muted-foreground hover:text-foreground"
            title="退出登录"
          >
            {loggingOut ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <LogOut className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </header>
  );
}
