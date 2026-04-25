import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Planszowkowo",
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
        <header className="site-header">
          <div className="site-shell site-header__content">
            <Link href="/" className="site-title">
              Planszówkowo
            </Link>
            <Link href="/games/new" className="button button--primary">
              Dodaj gre
            </Link>
          </div>
        </header>
        <main className="site-shell site-main">{children}</main>
      </body>
    </html>
  );
}
