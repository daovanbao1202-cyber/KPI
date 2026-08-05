import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { KPIProvider } from '@/context/KPIContext';
import ServiceWorkerRegistration from '@/components/layout/ServiceWorkerRegistration';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: '#555cf8',
  width: 'device-width',
  initialScale: 1,
  // maximumScale: 1 was here, which stops people pinch-zooming. On a phone
  // that makes the denser tables unreadable for anyone who needs to zoom.
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  title: 'K-Pulse — Quản lý KPI',
  description: 'Theo dõi KPI, giao việc và báo cáo hiệu suất',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'K-Pulse',
  },
  icons: {
    icon: [
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: '/icon-192.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ServiceWorkerRegistration />
        <KPIProvider>
          {children}
        </KPIProvider>
      </body>
    </html>
  );
}
