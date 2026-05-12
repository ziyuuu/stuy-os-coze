import type { Metadata } from 'next';
import { AppShell } from '@/components/layout/app-shell';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'AI PM 转型学习管理系统',
    template: '%s | AI PM 转型',
  },
  description:
    '12个月AI Product Manager转型学习工作区，AI教练驱动的计划执行与复盘系统。',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased min-h-screen bg-background">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
