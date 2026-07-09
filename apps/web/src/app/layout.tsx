import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque } from "next/font/google";
import { ShellHeader } from "@/components/ShellHeader";
import "./globals.css";

const display = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "gloomy — ask, see, understand",
  description:
    "Ask a question, get one interactive component back — diagrams, step-throughs, quizzes, simulations — instead of a wall of chat text.",
};

export const viewport: Viewport = {
  themeColor: "#0b0b10",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={display.variable}>
      <body>
        <ShellHeader />
        {children}
      </body>
    </html>
  );
}
