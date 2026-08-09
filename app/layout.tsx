import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Family Budget Demo',
  description: 'Public portfolio demo of a family budget management app',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased bg-gray-50 text-gray-900">
        {children}
      </body>
    </html>
  );
}
