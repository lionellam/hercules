import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Hercules",
  description: "Log expenses the way you'd say them.",
  appleWebApp: { capable: true, title: "Hercules", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#18181b" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        {/* Before the first paint: applies a saved theme, so dark mode doesn't flash white, and, with the experimental
            Loading Screen switched on, shows the loading screen (components/loading-screen.tsx, Architecture decision 47) */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var d=document.documentElement;try{var t=localStorage.getItem("theme");if(t==="light"||t==="dark")d.dataset.theme=t}catch(e){}try{var x=JSON.parse(localStorage.getItem("hercules-experiments")||"{}");if(x&&x["loading-screen"]===true)d.dataset.splash="on"}catch(e){}})()`,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
