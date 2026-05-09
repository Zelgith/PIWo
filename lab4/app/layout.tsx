import type { Metadata } from "next";
import Link from "next/link";
import { AuthControls } from "@/components/AuthControls";
import { AuthProvider } from "@/components/AuthProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Planszówkowo",
  description: "Prosta aplikacja do handlu grami planszowymi",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pl">
      <body>
        <AuthProvider>
          <header className="site-header">
            <div className="site-shell site-header__content">
              <Link href="/" className="site-title">
                Planszówkowo
              </Link>
              <AuthControls />
            </div>
          </header>
          <main className="site-shell site-main">{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
