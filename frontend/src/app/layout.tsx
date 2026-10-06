import { Lato } from 'next/font/google';
import './globals.css';

const lato = Lato({ 
  subsets: ['latin'], 
  weight: ['300', '400', '700', '900'],
  variable: '--font-lato'
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className={`${lato.variable} font-sans bg-white text-black antialiased`}>
        {children}
      </body>
    </html>
  );
}	