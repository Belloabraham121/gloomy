import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Instrument_Serif } from "next/font/google";
import { ThemeProvider } from "@/components/OpenUiThemeProvider";
import { ShellHeader } from "@/components/ShellHeader";
// OpenUI's component styles (Stack/Card/Charts/Table/...) and KaTeX's math
// styles, both unlayered - loaded before globals.css so gloomy's own tokens
// win any (unlikely) class-name overlap. See docs/openui-migration.md.
import "@openuidev/react-ui/styles/index.css";
import "katex/dist/katex.min.css";
import "./globals.css";

const display = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "500", "600", "700", "800"],
});

const serif = Instrument_Serif({
  subsets: ["latin"],
  variable: "--font-serif",
  weight: "400",
  style: ["normal", "italic"],
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
    <html lang="en" className={`${display.variable} ${serif.variable}`}>
      <body>
        <ThemeProvider mode="dark">
          <ShellHeader />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
