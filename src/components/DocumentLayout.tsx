import { Waypoints } from 'lucide-react';
import Link from 'next/link';
export function DocumentLayout({ children }: { children: React.ReactNode }) {
  return <div className="document-shell">
    <header className="document-header"><Link className="brand" href="/" prefetch={false}><span className="brand-symbol"><Waypoints size={22} /></span>civigraph</Link><nav aria-label="Navigation documentaire"><Link href="/" prefetch={false}>Explorer la carte</Link><a href="/methode">Méthode et couverture</a></nav></header>
    <main className="document-main">{children}</main>
    <footer className="document-footer"><p>Un corpus exploratoire, non exhaustif et non représentatif. Un lien documenté n’implique pas une proximité personnelle.</p><a href="/methode">Méthode et couverture</a></footer>
  </div>;
}
