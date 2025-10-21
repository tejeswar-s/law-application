
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Law App",
  description: "A virtual courtroom where justice moves fast",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-gray-100 text-gray-900 antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
