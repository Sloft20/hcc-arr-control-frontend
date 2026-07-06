import type { Metadata } from "next";
import { Space_Mono, DM_Sans } from "next/font/google";
import { ThemeProvider } from "@/context/ThemeContext";
import { ControllerAuthProvider } from "@/context/ControllerAuth";
import { Watermark } from "@/components/Watermark";
import "./globals.css";

const spaceMono = Space_Mono({ weight: ["400", "700"], subsets: ["latin"], variable: "--font-mono", display: "swap" });
const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-sans", display: "swap" });

export const metadata: Metadata = {
  title: "HCC Arr Control",
  description: "Controle de SLAs",
  manifest: "/manifest.json", // Adicione esta linha!
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" data-theme="dark">
      <body className={`${spaceMono.variable} ${dmSans.variable}`}>
        <ThemeProvider>
          <ControllerAuthProvider>
            {children}
            <Watermark />
          </ControllerAuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
