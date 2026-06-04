import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "참외농장 관리시스템",
  description: "스마트팜 & 귀농 통합 관리",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="min-h-full bg-[#f5f7f2]">{children}</body>
    </html>
  );
}
