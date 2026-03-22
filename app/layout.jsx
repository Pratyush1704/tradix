import './globals.css';
import { DM_Sans } from 'next/font/google';

const inter = DM_Sans(
  { 
    subsets: ['latin'],
    weight: ['300', '400', '500', '600', '700', '800', '900'] 
  }
);

export const metadata = {
  title: 'TradiX.AI - Smart Stock Analyzer & Predictor',
  description: 'AI-powered stock analysis, real-time data, and future price predictions.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-black min-h-screen`}>
        {children}
      </body>
    </html>
  );
}