import Link from 'next/link';

export default function Home() {
  return (
    <>
      <section className="hero">
        <h1>Tu vis ou tu vois du harcèlement ? Parle-en, sans donner ton nom.</h1>
        <p>
          Signal&apos;eo te permet de signaler une situation de harcèlement à ton établissement,
          de façon totalement anonyme, puis de suivre la prise en charge grâce à un code secret.
        </p>
        <div className="actions">
          <Link href="/deposer" className="btn">Faire un signalement</Link>
          <Link href="/suivi" className="btn btn-outline">Suivre mon signalement</Link>
        </div>
      </section>

      <section className="grid-3">
        <div className="card">
          <h3>1. Tu décris la situation</h3>
          <p className="muted">
            Type de harcèlement, date, lieu, personnes concernées et ce qui s&apos;est passé.
            Aucun nom, aucun e-mail ne t&apos;est demandé.
          </p>
        </div>
        <div className="card">
          <h3>2. Tu reçois un code secret</h3>
          <p className="muted">
            Ce code est affiché une seule fois. Note-le bien : il est le seul moyen de suivre ton
            signalement. Tes parents peuvent aussi l&apos;utiliser.
          </p>
        </div>
        <div className="card">
          <h3>3. Tu suis la prise en charge</h3>
          <p className="muted">
            Avec ton code, tu vois où en est ton dossier et tu peux échanger des messages avec
            l&apos;adulte référent, toujours anonymement.
          </p>
        </div>
      </section>
    </>
  );
}
