import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import WhatsAppButton from "@/components/ui/WhatsAppButton";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Tenndalux - Diseño Excepcional",
  description: "Un sistema de diseño que refleja elegancia, exclusividad y modernidad.",
  icons: { icon: '/favicon.ico?v=tenndalux-1' },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${inter.variable} antialiased`}
      >
        {children}
        <WhatsAppButton />
      </body>
    </html>
  );
}
