import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'GineLeq - Lista de Espera Quirúrgica',
  description: 'Sistema de Gestión de Lista de Espera Quirúrgica para Ginecología',
};

/**
 * Root Layout
 * 
 * Layout base que aplica fuente y estilos globales.
 * El Sidebar se incluye SOLO en las páginas protegidas
 * (vía le layout de grupo o directamente en cada sub-layout).
 * Las páginas de auth (/login, /registro, /recuperar) tienen su propio layout
 * sin sidebar.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={inter.variable}>
        {children}
      </body>
    </html>
  );
}
