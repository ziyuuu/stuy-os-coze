import type { Metadata } from 'next';
import { Inspector } from 'react-dev-inspector';
import { TopNav } from '@/components/layout/top-nav';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'AI PM 转型学习管理系统',
    template: '%s | AI PM 转型',
  },
  description:
    '12个月AI Product Manager转型学习工作区，管理层次化计划、流程驱动学习和资源追踪。',
  keywords: [
    '扣子编程',
    'Coze Code',
    'Vibe Coding',
    'AI 编程',
    '智能体搭建',
    '工作流搭建',
    '网站搭建',
    '网站部署',
    '全栈开发',
    'AI 工程师',
  ],
  authors: [{ name: 'Coze Code Team', url: 'https://code.coze.cn' }],
  generator: 'Coze Code',
  // icons: {
  //   icon: '',
  // },
  openGraph: {
    title: '扣子编程 | 你的 AI 工程师已就位',
    description:
      '我正在使用扣子编程 Vibe Coding，让创意瞬间上线。告别拖拽，拥抱心流。',
    url: 'https://code.coze.cn',
    siteName: '扣子编程',
    locale: 'zh_CN',
    type: 'website',
    // images: [
    //   {
    //     url: '',
    //     width: 1200,
    //     height: 630,
    //     alt: '扣子编程 - 你的 AI 工程师',
    //   },
    // ],
  },
  // twitter: {
  //   card: 'summary_large_image',
  //   title: 'Coze Code | Your AI Engineer is Here',
  //   description:
  //     'Build and deploy full-stack applications through AI conversation. No env setup, just flow.',
  //   // images: [''],
  // },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const isDev = process.env.COZE_PROJECT_ENV === 'DEV';

  return (
    <html lang="zh-CN">
      <body className="antialiased min-h-screen bg-background">
        {isDev && <Inspector />}
        <TopNav />
        <main className="container py-6 px-4">
          {children}
        </main>
      </body>
    </html>
  );
}
