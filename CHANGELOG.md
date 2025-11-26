# Changelog

## 2025-11-26
- Bouton « Connexion » relié à la modale Firebase (login + création) au lieu du placeholder.
- Initialisation Firebase mutualisée via `/public/static/firebase-init.js` + messages d'erreur explicites sur les dashboards Client/Employé/Admin.
- Bouton de déconnexion Admin protégé contre l'absence de configuration Firebase.

## 2025-02-28
- Ajout de `SOMMAIRE-PROJET.md` pour fournir un overview immédiat (URLs, stack, déploiement, 3D, backlog).
- README enrichi avec les liens directs vers les pages mises à jour (hero, visite 3D, dashboards) pour faciliter la vérification.

## 2025-02-27
- Ajout de liens publics directs vers les dashboards client et employé pour faciliter la vérification des aperçus pré-login.
- Hero d'accueil enrichi avec des CTA vers les deux portails afin de rendre les nouveaux aperçus immédiatement accessibles.

## 2025-02-26
- Ajout d'aperçus statiques (hero + cartes) sur les dashboards client et employé pour éviter les pages vides avant authentification.
- Documentation mise à jour pour décrire le comportement pré-login des portails.

## 2025-02-24
- Ajout d'une section d'installation dans le README précisant d'exécuter `npm install` avant le build pour éviter l'erreur "vite: command not found".

## 2025-02-23
- Ajout d'une section "Liens publics" dans le README pour rappeler l'URL de production, le domaine personnalisé et le dernier déploiement de prévisualisation.

## 2025-02-22
- Hero d'accueil refondu : message sécurité/IA, CTA vers plan 3D et alertes, logo 3D GLB avec fallback statique.
- Visite 3D pleine largeur : viewer Three.js amélioré, bouton Plein écran et texte de secours si WebGL absent.
- Documentation mise à jour (README) pour refléter l'expérience 3D et les nouvelles CTA.
