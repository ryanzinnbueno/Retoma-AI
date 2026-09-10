import type { Metadata } from 'next';
import './globals.css';
import './retoma.css';
import './evolution.css';

export const metadata: Metadata = {
  title: 'Retoma — Recuperação de oportunidades comerciais',
  description: 'Retome conversas, acompanhe orçamentos e reconecte oportunidades com IA e atenção humana.',
  icons: {icon:'/retoma-icon.png'},
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body
        className="antialiased"
      >
        {children}
      </body>
    </html>
  );
}
