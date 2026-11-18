export default function Loading() {
  return (
    <div className="route-loading" aria-live="polite" aria-busy="true">
      <div className="route-loading-bar" />
      <p className="muted small">Ouverture du formulaire…</p>
    </div>
  );
}
