import { DocumentLayout } from '@/components/DocumentLayout';
import Link from 'next/link';
export default function NotFound() {
  return <DocumentLayout><div className="document-title"><p className="eyebrow">404</p><h1>Page introuvable</h1><p>Cette adresse ne correspond à aucune page ou entité de ce corpus.</p><Link className="primary-button" href="/" prefetch={false}>Revenir à l’exploration</Link></div></DocumentLayout>;
}
