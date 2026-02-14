import { redirect } from 'next/navigation';

/**
 * Página raíz - Redirige al Dashboard.
 * No tiene UI propia.
 */
export default function HomePage() {
  redirect('/dashboard');
}
