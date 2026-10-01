import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "솔로몬의 점심 메뉴 - 맛집 추천 & 자유로운 별점 리뷰",
  description: "NextJS, TypeScript, TailwindCSS로 만든 식당 CRUD 및 자유로운 별점 리뷰 사이트 (로그인 불필요)",
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
