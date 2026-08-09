import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Family Budget Demo',
  description: 'Public portfolio demo of a family budget management app',
  icons: { icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><text y="24" font-size="24">🐧</text></svg>' },
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
