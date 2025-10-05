import type { Metadata } from "next";
import "./globals.css";
import { QueryProvider } from "@/providers/QueryProvider";
import Header from "@/components/layouts/Headers";
import Footer from "@/components/layouts/Footer";
import UpDownButton from "@/components/shared/FloatingButtons";

export const metadata: Metadata = {
  title: "ParkYongHo1.blog",
  description: "ParkYongHo1의 개발 블로그",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head></head>
      <body suppressHydrationWarning>
        <Header />
        <main className="w-[80%] mx-auto">
          <QueryProvider>{children}</QueryProvider>
        </main>
        <UpDownButton />
        <Footer />
      </body>
    </html>
  );
}
