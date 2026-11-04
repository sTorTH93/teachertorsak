import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ClassCheck — ระบบเช็คงานนักเรียนในชั่วโมงเรียน',
  description: 'ระบบเช็คการส่งงานของนักเรียนในคาบเรียน บันทึกคะแนน ตรวจจับส่งช้า พร้อมรายงานผลและ Export Excel',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th" className="h-full">
      <body className="min-h-full flex flex-col font-sans antialiased bg-zinc-50 dark:bg-zinc-950">
        {children}
      </body>
    </html>
  );
}
