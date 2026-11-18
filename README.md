# Signal'eo

Plateforme web de signalement **anonyme** du harcèlement scolaire.  
Stack : **Next.js** · **NestJS** · **Prisma** · **PostgreSQL**.

```
signaleo/
  apps/api/     API NestJS (port 3001)
  apps/web/     Interface Next.js (port 3000)
  .env          Configuration locale (ne pas committer)
```

## Prérequis

- Node.js ≥ 20
- PostgreSQL accessible sur `localhost:5432`

## Lancement

```powershell
# À la racine du projet
# Config : Copy-Item .env.example .env  puis adapter DATABASE_URL, secrets…
npm install
npm run db:deploy
npm run db:seed
npm run dev
```

- Web : http://localhost:3000  
- API : http://localhost:3001  

## Comptes initiaux (seed)

| Rôle | E-mail | Mot de passe |
|------|--------|--------------|
| Responsable | `responsable@ecole.local` | `SignalEo2026!` |
| Administrateur | `nomena7nomcdi@gmail.com` | `azertyuiopqsdfghjklm` |

Connexion sur `/responsable/login` : **e-mail + mot de passe** (minimum 12 caractères).

**Comptes :** inscription uniquement sur `/responsable/login` (déconnecté). Une fois connecté, on ne crée plus de compte. L’**admin** valide / désactive / réactive avec confirmation — **sans voir le mot de passe**, **sans accès aux signalements**.

## Fonctionnalités

- Dépôt anonyme (sans compte) et code de suivi unique  
- Suivi + messagerie (élève ou parent via le même code)  
- Pièce jointe image optionnelle (JPEG / PNG / WebP, max. 10 Mo)  
- Responsable : dossiers, filtres, urgents, traitement, notes
- Admin technique : validation / désactivation des comptes (avec confirmation) + journal d’audit (aucun dossier)
- Chiffrement des contenus sensibles ; session personnel jusqu’à déconnexion ou expiration du jeton (8 h)  

## Pages

| URL | Description |
|-----|-------------|
| `/` | Accueil |
| `/deposer` | Formulaire de signalement |
| `/suivi` | Suivi par code |
| `/responsable/login` | Connexion |
| `/responsable` | Tableau de bord (responsable) |
| `/responsable/[id]` | Détail d’un dossier |
| `/responsable/comptes` | Validation des comptes (admin uniquement) |

## Sécurité (production)

- Servir l’application en **HTTPS**  
- Ne pas journaliser les adresses IP  
- Ne jamais committer `.env`  
