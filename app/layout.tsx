import type { Metadata } from "next";
import { Inter, Roboto_Mono, Space_Mono } from "next/font/google";
import localFont from "next/font/local";
import { APP_NAME, APP_DESCRIPTION } from "@/config/branding";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Toaster } from "sonner";
import { CommandPalette } from "@/components/CommandPalette";
import "./globals.css";

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter"
});

const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-space-mono",
});

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

const robotoMono = Roboto_Mono({
  subsets: ["latin"],
  variable: "--font-roboto-mono",
});

export const metadata: Metadata = {
  title: APP_NAME,
  description: APP_DESCRIPTION,
  applicationName: APP_NAME,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${spaceMono.variable} ${geistSans.variable} ${geistMono.variable} ${robotoMono.variable} font-mono`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          forcedTheme="dark"
          disableTransitionOnChange
        >
          {children}
          <Toaster 
            position="bottom-right" 
            toastOptions={{
              className: "brutalist-toast",
            }}
          />
          <CommandPalette />
        </ThemeProvider>
      </body>
    </html>
  );
}
