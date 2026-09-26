import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SupportBot",
  description: "AI customer support widget — live in 60 seconds",
  icons: {
    icon: "/supportbot-logo-headset.svg",
    shortcut: "/supportbot-logo-headset.svg",
    apple: "/supportbot-logo-headset.svg",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
