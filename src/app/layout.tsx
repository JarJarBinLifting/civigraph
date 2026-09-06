import type { Metadata } from 'next';
import '@fontsource-variable/dm-sans';
import '@fontsource-variable/manrope';
import './globals.css';

export const metadata: Metadata = {
  title: 'Civigraph — Les liens de la vie publique',
  description: 'Explorez les parcours et les relations documentées de la vie politique française. Chaque lien a une histoire. Et une source.',
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="fr"><body>{children}</body></html>;
}
