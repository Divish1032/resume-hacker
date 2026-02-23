import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { cn } from "@/lib/utils";
import "./globals.css";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  title: "Resume Hacker | Open-Source AI ATS Resume Optimizer",
  description: "Free, open-source AI resume optimizer. Generate ATS-friendly resumes using local AI (Ollama) or cloud models (OpenAI, Claude, DeepSeek). Score your resume against job descriptions instantly.",
  keywords: ["AI resume builder", "ATS resume checker", "open-source resume generator", "local AI resume", "Ollama resume optimizer", "ATS score", "Next.js resume app"],
  authors: [{ name: "Open Source Contributors" }],
  creator: "Open Source Contributors",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://yourdomain.com", // User should update this
    title: "Resume Hacker | Open-Source AI ATS Resume Optimizer",
    description: "Free, open-source AI resume optimizer. Generate ATS-friendly resumes using local AI (Ollama) or cloud models.",
    siteName: "Resume Hacker",
    images: [
      {
        url: "/screenshot.png",
        width: 1200,
        height: 630,
        alt: "Resume Hacker UI preview showing AI ATS scoring",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Resume Hacker | Open-Source AI ATS Resume Optimizer",
    description: "Free, open-source AI resume optimizer. Generate ATS-friendly resumes using local AI (Ollama) or cloud models. Maximize your job matches today.",
    images: ["/screenshot.png"],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Resume Hacker",
  },
};

export const viewport: Viewport = {
  themeColor: "#4f46e5",
};

import { ThemeProvider } from "@/components/theme-provider";

import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn("min-h-screen bg-background font-sans antialiased overflow-hidden", inter.variable)}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <TooltipProvider>
            <div className="flex h-screen w-full">
              <Sidebar />
              <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
                <Header />
                <main className="flex-1 overflow-y-auto">
                  {children}
                </main>
              </div>
            </div>
          </TooltipProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
