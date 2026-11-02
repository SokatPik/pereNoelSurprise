/*
 * Tirage au sort du Père Noël surprise.
 * Fonction pure, sans lien avec l'interface : elle se teste seule (npm test).
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.Draw = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  const MAX_TRIES = 1000;

  // Entier aléatoire dans [0, max[ sans biais (rejet des valeurs hors plage).
  function randomInt(max) {
    const limit = Math.floor(0x100000000 / max) * max;
    const buf = new Uint32Array(1);
    let x;
    do {
      globalThis.crypto.getRandomValues(buf);
      x = buf[0];
    } while (x >= limit);
    return x % max;
  }

  // Mélange de Fisher-Yates sur une copie du tableau.
  function shuffle(items) {
    const a = items.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = randomInt(i + 1);
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  const norm = (name) => name.trim().toLowerCase();

  /**
   * @param {string[]} participants  prénoms, tous différents
   * @param {string[][]} exclusions  paires [a, b] qui ne doivent pas se tirer (dans les deux sens)
   * @param {number} maxTries        plafond d'essais avant d'abandonner
   * @returns {{giver: string, receiver: string}[] | null}  null si aucun tirage valide n'est trouvé
   */
  function draw(participants, exclusions = [], maxTries = MAX_TRIES) {
    const n = participants.length;
    if (n < 3) throw new Error("Il faut au moins 3 participants.");
    if (new Set(participants.map(norm)).size !== n) {
      throw new Error("Deux participants ont le même prénom. Ajoute une initiale pour les distinguer.");
    }

    const index = new Map(participants.map((p, i) => [norm(p), i]));
    const forbidden = new Set();
    for (const [a, b] of exclusions) {
      const i = index.get(norm(a));
      const j = index.get(norm(b));
      if (i === undefined || j === undefined) {
        throw new Error("Exclusion inconnue : « " + a + " - " + b + " ». Vérifie l'orthographe des prénoms.");
      }
      forbidden.add(i + "|" + j);
      forbidden.add(j + "|" + i);
    }

    const order = participants.map((_, i) => i);
    for (let t = 0; t < maxTries; t++) {
      const receivers = shuffle(order);
      let valid = true;
      for (let i = 0; i < n; i++) {
        if (receivers[i] === i || forbidden.has(i + "|" + receivers[i])) {
          valid = false;
          break;
        }
      }
      if (valid) {
        return participants.map((giver, i) => ({ giver, receiver: participants[receivers[i]] }));
      }
    }
    return null;
  }

  return { draw, shuffle, randomInt, MAX_TRIES };
});
