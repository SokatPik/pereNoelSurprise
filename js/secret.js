/*
 * Liens personnels : le résultat de chaque participant est chiffré (AES-GCM, Web Crypto)
 * et placé dans la partie du lien après le « # », qui n'est jamais envoyée à un serveur.
 *
 * Format du jeton : v1.<donneur>.<clé>.<iv + résultat chiffré>   (tout en base64url)
 *
 * Limite connue : la clé voyage dans le lien. Cela empêche de lire un résultat « à l'œil nu »,
 * mais l'organisateur, qui génère les liens, pourrait techniquement les déchiffrer.
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.Secret = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  const enc = new TextEncoder();
  const dec = new TextDecoder();
  const VERSION = "v1";

  function toB64(bytes) {
    let s = "";
    for (const b of bytes) s += String.fromCharCode(b);
    return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }

  function fromB64(str) {
    const pad = "=".repeat((4 - (str.length % 4)) % 4);
    const bin = atob(str.replace(/-/g, "+").replace(/_/g, "/") + pad);
    return Uint8Array.from(bin, (c) => c.charCodeAt(0));
  }

  function parse(token) {
    const parts = String(token).split(".");
    if (parts.length !== 4 || parts[0] !== VERSION) throw new Error("Lien invalide.");
    try {
      return { giverBytes: fromB64(parts[1]), keyBytes: fromB64(parts[2]), packed: fromB64(parts[3]) };
    } catch (e) {
      throw new Error("Lien invalide.");
    }
  }

  // Crée le jeton d'un participant : son prénom en clair, le prénom tiré chiffré.
  async function seal(giver, receiver) {
    const subtle = globalThis.crypto.subtle;
    const key = await subtle.generateKey({ name: "AES-GCM", length: 128 }, true, ["encrypt"]);
    const keyBytes = new Uint8Array(await subtle.exportKey("raw", key));
    const iv = globalThis.crypto.getRandomValues(new Uint8Array(12));
    const giverBytes = enc.encode(giver);
    // Le prénom du donneur est lié au chiffrement : on ne peut pas changer l'étiquette du lien.
    const ct = new Uint8Array(
      await subtle.encrypt({ name: "AES-GCM", iv, additionalData: giverBytes }, key, enc.encode(receiver))
    );
    const packed = new Uint8Array(iv.length + ct.length);
    packed.set(iv);
    packed.set(ct, iv.length);
    return [VERSION, toB64(giverBytes), toB64(keyBytes), toB64(packed)].join(".");
  }

  // Prénom du propriétaire du lien (pour la question « Es-tu bien… ? »), sans rien déchiffrer.
  function giverOf(token) {
    return dec.decode(parse(token).giverBytes);
  }

  // Prénom tiré, déchiffré.
  async function reveal(token) {
    const { giverBytes, keyBytes, packed } = parse(token);
    const subtle = globalThis.crypto.subtle;
    const key = await subtle.importKey("raw", keyBytes, { name: "AES-GCM" }, false, ["decrypt"]);
    const iv = packed.slice(0, 12);
    const ct = packed.slice(12);
    try {
      const plain = await subtle.decrypt({ name: "AES-GCM", iv, additionalData: giverBytes }, key, ct);
      return dec.decode(plain);
    } catch (e) {
      throw new Error("Lien invalide ou modifié.");
    }
  }

  return { seal, giverOf, reveal };
});
