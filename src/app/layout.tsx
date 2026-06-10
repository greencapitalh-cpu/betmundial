import type { Metadata, Viewport } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { LocaleProvider } from "@/components/LocaleProvider";
import PwaRegister from "@/components/PwaRegister";

export const metadata: Metadata = {
  title: "EscrowBet.cool - Verifiable P2P Escrow by UDoChain",
  description: "A live conditional escrow demo where two peers lock equal value and verified World Cup results trigger settlement and receipts.",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#06101d",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <LocaleProvider>
          <PwaRegister />
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </LocaleProvider>
      </body>
    </html>
  );
}
