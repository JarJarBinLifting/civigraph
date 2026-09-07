import type { GraphData, Relation } from '@/lib/types';
import { passageOverlap } from '@/lib/system-analysis';
import { RelationEvidence } from './DetailPanel';
import { sharedPassageFacts } from '@/lib/system-reading';

export function PassageEvidence({ statements, data }: { statements: Relation[]; data: GraphData }) {
  return <div className="passage-evidence">{statements.map(statement => <RelationEvidence key={statement.id} relation={statement} data={data} compact />)}</div>;
}

export function OverlapReceipt({ left, right }: { left: Relation[]; right: Relation[] }) {
  const counts = passageOverlap(left, right);
  const facts = sharedPassageFacts(left, right);
  const labels = { documented: 'chevauchement documenté', possible: 'chevauchement possible', outside: 'périodes distinctes', unknown: 'dates insuffisantes' };
  return <div className="overlap-receipt">{facts.sameInstitution && <strong>{left.every(r => r.category === 'education') && right.every(r => r.category === 'education') ? 'Même établissement' : 'Même institution'}<br /></strong>}{Object.entries(counts).filter(([, count]) => count).map(([key, count]) => `${count} ${labels[key as keyof typeof labels]}`).join(' · ')}{facts.sameInstitution && <small>{facts.promotions.length ? `Même promotion documentée : ${facts.promotions.join(' · ')}` : 'Aucune même promotion documentée par ces déclarations.'}</small>}<small>Comparaisons de déclarations, sans déduire de rencontre ni de présence simultanée de tout un groupe.</small></div>;
}
