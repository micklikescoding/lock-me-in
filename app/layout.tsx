import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Let's Lock In | Find Music Producers by Artist",
  description: "Discover producers who have worked with your favorite artists and connect with them",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-900 text-white`}>
        <main className="container mx-auto px-4 py-8">
          {children}
        </main>
        <footer className="container mx-auto px-4 py-6 mt-8 border-t border-gray-800 text-center text-gray-500 text-sm">
          <p>
            Let's Lock In uses data from{' '}
            <a 
              href="https://genius.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 underline"
            >
              Genius
            </a>
          </p>
          <p className="mt-2">
            &copy; {new Date().getFullYear()} Let's Lock In
          </p>
        </footer>
      </body>
    </html>
  );
}
