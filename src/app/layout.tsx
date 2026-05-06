import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { KPIProvider } from '@/context/KPIContext';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "KPI Management System",
  description: "Advanced KPI Tracking and Reporting Application",
  manifest: '/manifest.json',
  themeColor: '#555cf8',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
  icons: {
    icon: '/kpi_app_icon_1778028960513.jpg',
    apple: '/kpi_app_icon_1778028960513.jpg',
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
        <KPIProvider>
          {children}
        </KPIProvider>
      </body>
    </html>
  );
}
