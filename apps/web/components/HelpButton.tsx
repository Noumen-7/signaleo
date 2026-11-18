'use client';

import { useEffect, useId, useState } from 'react';

export function HelpButton() {
  const [open, setOpen] = useState(false);
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        className="help-fab"
        aria-label="Comment utiliser Signal'eo"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        ?
      </button>

      {open && (
        <div className="help-overlay" role="presentation" onClick={() => setOpen(false)}>
          <div
            className="help-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="help-head">
              <h2 id={titleId}>Comment ça marche</h2>
              <button type="button" className="help-close" onClick={() => setOpen(false)} aria-label="Fermer">
                ×
              </button>
            </div>
            <ol className="help-steps">
              <li>
                <strong>Signaler</strong>
                <span>Décris la situation sans donner ton nom. Tu reçois un code secret.</span>
              </li>
              <li>
                <strong>Garder le code</strong>
                <span>Note-le bien : c’est le seul moyen de retrouver ton dossier.</span>
              </li>
              <li>
                <strong>Suivre</strong>
                <span>Entre ton code pour voir l’avancement et échanger des messages.</span>
              </li>
            </ol>
            <p className="help-note">
              L’espace responsable est réservé au personnel de l’établissement (connexion
              requise).
            </p>
            <button type="button" className="btn" onClick={() => setOpen(false)}>
              Compris
            </button>
          </div>
        </div>
      )}
    </>
  );
}
