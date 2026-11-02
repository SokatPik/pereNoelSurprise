# Père Noël surprise

Tirage au sort de Père Noël surprise : chacun pioche un prénom, personne ne sait qui a pioché qui, et personne ne peut tomber sur lui-même.

Application web sans serveur : tout se passe dans le navigateur, aucune donnée n'est stockée.

## Comment ça marche

1. L'organisateur saisit les prénoms (et, si besoin, des exclusions comme un couple).
2. Le tirage est **calculé en entier à l'avance** : mélange de Fisher-Yates, puis vérification qu'aucun participant n'est associé à lui-même ou à une personne exclue. Si ce n'est pas le cas, le mélange est refait (1 000 essais maximum).
3. Chaque participant reçoit un **lien personnel**. Le prénom tiré y est chiffré (AES-GCM) dans la partie après le `#`, qui n'est jamais envoyée à un serveur.
4. En ouvrant son lien, le participant confirme son identité (« Es-tu bien Marie ? ») puis découvre son résultat.

## Lancer le projet

Ouvrir `index.html` dans un navigateur suffit. Pour un comportement identique à la mise en ligne :

```bash
python3 -m http.server 8000   # puis ouvrir http://localhost:8000
```

## Tests

Node.js 20 ou plus, aucune dépendance à installer :

```bash
npm test
```

Les tests vérifient notamment que personne ne pioche son propre prénom, que chacun est tiré une seule fois, que les exclusions sont respectées et que les liens ne laissent pas voir le résultat.

## Mise en ligne (GitHub Pages)

1. Pousser le projet sur GitHub (branche `main`).
2. Dans le dépôt : **Settings → Pages → Source : GitHub Actions**.
3. Chaque `git push` lance les tests, puis publie le site si tout passe (`.github/workflows/pages.yml`).

## Structure

```
index.html          page unique (organisateur, liens, révélation)
css/style.css       styles
js/draw.js          tirage au sort (fonction pure, testable)
js/secret.js        chiffrement et lecture des liens personnels
js/app.js           interface
tests/              tests automatiques (node --test)
.github/workflows/  tests et déploiement GitHub Pages
```

## Limites connues

- La clé de chiffrement voyage dans le lien : elle empêche de lire un résultat à l'œil nu, mais l'organisateur, qui génère les liens, pourrait techniquement les déchiffrer. Le plus simple est qu'il participe sans regarder les liens des autres.
- Sans serveur, la révélation « une seule fois » ne peut pas être garantie : un lien peut être rouvert.
- Pas de suivi des liens ouverts, pas d'envoi par e-mail.

## Feuille de route (rendu le 14 novembre 2026)

| Dates | Étape |
|---|---|
| 31 oct – 1er nov | Cadrage : option A (web app sans serveur) |
| 2 – 3 nov | Algorithme de tirage et exclusions |
| 4 – 5 nov | Chiffrement des liens |
| 6 – 8 nov | Écran organisateur |
| 9 – 10 nov | Écran de révélation |
| 11 nov | Tests de bout en bout |
| 12 nov | Finitions (mobile, budget et date) |
| 13 nov | Mise en ligne et essai réel |
| 14 nov | Marge de sécurité et rendu |

Ce dépôt contient déjà un parcours complet (saisie, tirage, liens, révélation) : le calendrier sert maintenant à le fiabiliser et le peaufiner.

Idées pour la suite : budget et date de l'échange, code secret par participant, version avec serveur (option B).
