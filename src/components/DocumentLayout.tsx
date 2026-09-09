import { Waypoints } from 'lucide-react';
import Link from 'next/link';
export function DocumentLayout({ children }: { children: React.ReactNode }) {
  return <div className="document-shell">
    <header className="document-header"><Link className="brand" href="/" prefetch={false}><span className="brand-symbol"><Waypoints size={22} /></span>civigraph</Link><nav aria-label="Navigation documentaire"><Link href="/" prefetch={false}>Explorer la carte</Link><a href="/methode">Sources et méthode</a></nav></header>
    <main className="document-main">{children}</main>
    <footer className="document-footer"><p>La sélection reste partielle et ne représente pas toute la vie politique. Un lien sur la carte ne signifie pas que ces personnes se connaissent.</p><a href="/methode">Sources et méthode</a></footer>
  </div>;
}
