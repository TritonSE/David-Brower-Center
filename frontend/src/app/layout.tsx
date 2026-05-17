import { Geist, Geist_Mono } from "next/font/google";

import Layout from "../components/Layout";
import { AuthProvider } from "../contexts/AuthContext";
import { OrganizationsProvider } from "../contexts/OrganizationsContext";

import type { Metadata } from "next";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "David Brower Center",
  description: "David Brower Center platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <AuthProvider>
          <OrganizationsProvider>
            <Layout>{children}</Layout>
          </OrganizationsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
