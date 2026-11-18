import Link from 'next/link';
import { HelpButton } from '@/components/HelpButton';

export default function Home() {
  return (
    <div className="gate">
      <div className="gate-inner">
        <p className="gate-kicker">Signalement anonyme · établissement</p>
        <h1 className="gate-title">
          Que veux-tu faire&nbsp;?
        </h1>
        <p className="gate-lead">
          Deux choix simples. Aucun compte. Aucun nom demandé.
        </p>

        <div className="gate-actions">
          <Link href="/deposer" className="gate-btn gate-btn-primary" prefetch>
            <span className="gate-btn-label">Signaler</span>
            <span className="gate-btn-sub">Décrire une situation en toute confidentialité</span>
          </Link>
          <Link href="/suivi" className="gate-btn gate-btn-secondary" prefetch>
            <span className="gate-btn-label">Suivre</span>
            <span className="gate-btn-sub">Retrouver un dossier avec ton code secret</span>
          </Link>
        </div>

        <Link href="/responsable" className="gate-staff" prefetch={false}>
          Espace responsable
        </Link>
      </div>

      <HelpButton />
    </div>
  );
}
