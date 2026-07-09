import type { Metadata, Viewport } from "next";
import { ShellHeader } from "@/components/ShellHeader";
import "./globals.css";

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
    <html lang="en">
      <body>
        <ShellHeader />
        {children}
      </body>
    </html>
  );
}
