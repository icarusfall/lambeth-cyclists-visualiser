import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import NavBar from "@/components/NavBar";
import PasswordGate from "@/components/PasswordGate";
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
  title: "Lambeth Cyclists",
  description:
    "Live map of roadworks, disruptions, collisions, and traffic orders affecting cycling in south London",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col h-screen`}
      >
        <PasswordGate>
          <NavBar />
          <div className="flex-1 relative overflow-hidden">
            {children}
          </div>
        </PasswordGate>
      </body>
    </html>
  );
}
