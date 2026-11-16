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
Pour un nouveau responsable : l’admin le crée sur `/responsable/comptes` et lui donne e-mail + mot de passe.

## Fonctionnalités

- Dépôt anonyme (sans compte) et code de suivi unique  
- Suivi + messagerie (élève ou parent via le même code)  
- Pièce jointe image optionnelle (JPEG / PNG / WebP, max. 10 Mo)  
- Espace personnel : filtres, urgents, traitement, notes internes  
- Administrateur : audit, gestion des comptes (sans lecture des dossiers)  
- Chiffrement des contenus sensibles ; session personnel conservée jusqu’à déconnexion ou expiration du jeton (8 h)  

## Pages

| URL | Description |
|-----|-------------|
| `/` | Accueil |
| `/deposer` | Formulaire de signalement |
| `/suivi` | Suivi par code |
| `/responsable/login` | Connexion |
| `/responsable` | Tableau de bord |
| `/responsable/[id]` | Détail d’un dossier |
| `/responsable/comptes` | Gestion des comptes (admin) |

## Sécurité (production)

- Servir l’application en **HTTPS**  
- Ne pas journaliser les adresses IP  
- Ne jamais committer `.env`  
