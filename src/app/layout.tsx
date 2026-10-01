import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "솔로몬 — 우리 팀 맛집 지도",
  description: "사무실 주변 맛집을 지도에서 찾고, 동료들의 추천과 리뷰로 오늘 점심을 골라보세요.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
