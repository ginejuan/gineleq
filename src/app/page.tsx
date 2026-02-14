import { redirect } from 'next/navigation';

/**
 * Página raíz — Redirige al Dashboard.
 * Si el usuario no está autenticado, el middleware
 * lo interceptará antes y lo enviará a /login.
 */
export default function HomePage() {
  redirect('/dashboard');
}
