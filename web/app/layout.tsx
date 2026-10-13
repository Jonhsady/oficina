import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Fraunces, Sora } from 'next/font/google';
import './globals.css';

const fraunces = Fraunces({ subsets: ['latin'], variable: '--font-fraunces' });
const sora = Sora({ subsets: ['latin'], variable: '--font-sora' });

export const metadata: Metadata = {
  title: 'Oficina',
  description: 'Painel de ordens de serviço',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={`${fraunces.variable} ${sora.variable}`}>{children}</body>
    </html>
  );
}
