import type { Metadata } from "next";
import { Inter, Geist_Mono, Geist } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { GlobalLoadingOverlay } from "@/components/organisms/GlobalLoadingOverlay";
import { Web3Provider } from "@/components/providers/Web3Provider";
import { Toaster } from "react-hot-toast";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Edge Protocol",
  description: "A decentralized prediction market",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn("h-full", "antialiased", "dark", inter.variable, geistMono.variable, "font-sans", geist.variable)}
    >
      <body className="min-h-full flex flex-col bg-[#070709] text-white font-sans selection:bg-white/20">
        <Web3Provider>
          <GlobalLoadingOverlay />
          {children}
          <Toaster position="bottom-right" toastOptions={{ className: 'dark:bg-neutral-900 dark:text-white border border-neutral-800' }} />
        </Web3Provider>
      </body>
    </html>
  );
}
