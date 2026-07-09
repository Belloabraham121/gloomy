import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "gloomy",
  description: "OKX Hackathon: generative-UI explanations grounded in real sources.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
