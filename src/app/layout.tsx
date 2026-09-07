import type { Metadata, Viewport } from "next";
import {
  Cormorant_Garamond,
  Noto_Sans_SC,
  Noto_Serif_SC,
} from "next/font/google";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  display: "swap",
});

const notoSans = Noto_Sans_SC({
  variable: "--font-noto-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  display: "swap",
});

const notoSerif = Noto_Serif_SC({
  variable: "--font-noto-serif",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "花が代わりに語る · Flowers Say What I Cannot",
  description: "静かなデジタルガーデン。言葉にできなかった想いを、花が伝えます。",
};

export const viewport: Viewport = {
  themeColor: "#F7F3EA",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body
        className={`${cormorant.variable} ${notoSans.variable} ${notoSerif.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
