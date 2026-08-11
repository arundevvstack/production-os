import type {Metadata} from 'next';
import './globals.css';
import { SupabaseProvider } from '@/supabase/provider';
import { Toaster } from '@/components/ui/toaster';
import { Inter } from "next/font/google";
import dynamic from "next/dynamic";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

// Dynamically import GlobalCommandMenu so it doesn't block initial render
const GlobalCommandMenu = dynamic(() => import("@/components/system/GlobalCommandMenu").then(m => m.GlobalCommandMenu), { ssr: false });
import { ThemeProvider } from "@/components/providers/theme-provider";

export const metadata: Metadata = {
  title: 'DP Media OS | Multi-Tenant SaaS',
  description: 'Scalable Media Production OS for Companies',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <body className="font-body antialiased" suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <SupabaseProvider>
            {children}
            <Toaster />
            <GlobalCommandMenu />
          </SupabaseProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

