import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Nav } from "@/components/nav";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "Goal Tracker",
  description: "Personal goal and habit tracker",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Goals",
  },
};

export const viewport: Viewport = {
  themeColor: "#020617",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-slate-950 gradient-mesh">
        <div className="flex min-h-screen">
          <Nav />
          <main className="flex-1 pb-20 md:pb-0 md:pl-64">
            <div className="max-w-4xl mx-auto px-4 py-6 md:px-8 md:py-8">
              {children}
            </div>
          </main>
        </div>
        <Toaster
          theme="dark"
          toastOptions={{
            style: {
              background: "#1e293b",
              border: "1px solid #334155",
              color: "#f1f5f9",
            },
          }}
        />
      </body>
    </html>
  );
}
