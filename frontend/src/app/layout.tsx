import { Geist, Geist_Mono, Rubik } from "next/font/google";

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

const rubik = Rubik({
  variable: "--font-rubik",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
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
      <body className={`${geistSans.variable} ${geistMono.variable} ${rubik.variable} antialiased`}>
        <AuthProvider>
          <OrganizationsProvider>
            <Layout>{children}</Layout>
          </OrganizationsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
