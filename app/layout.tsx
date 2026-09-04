import type { Metadata } from 'next';
import './globals.css';
import './retoma.css';

export const metadata: Metadata = {
  title: 'Retoma — Recuperação de orçamentos',
  description: 'Protótipo interativo de recuperação assistida de orçamentos. Dados fictícios e IA simulada.',
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
