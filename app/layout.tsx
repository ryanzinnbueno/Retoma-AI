import type { Metadata } from 'next';
import './globals.css';
import './retoma.css';
import './evolution.css';

export const metadata: Metadata = {
  title: 'Retoma — Recuperação de orçamentos',
  description: 'Recuperação assistida de vendas. IA real, dados de teste e WhatsApp simulado.',
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
