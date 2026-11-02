const test = require("node:test");
const assert = require("node:assert/strict");
const { seal, giverOf, reveal } = require("../js/secret.js");

test("aller-retour : le donneur est lisible, le prénom tiré se déchiffre", async () => {
  const token = await seal("Zoé", "Hélène");
  assert.equal(giverOf(token), "Zoé");
  assert.equal(await reveal(token), "Hélène");
});

test("le prénom tiré n'apparaît pas en clair dans le jeton", async () => {
  const token = await seal("Marie", "Paul");
  assert.ok(!token.includes("Paul"));
});

test("changer le prénom du donneur invalide le jeton", async () => {
  const parts = (await seal("Marie", "Paul")).split(".");
  parts[1] = Buffer.from("Mallory").toString("base64url");
  await assert.rejects(() => reveal(parts.join(".")), /invalide/);
});

test("un jeton mal formé est refusé", async () => {
  assert.throws(() => giverOf("n'importe quoi"), /invalide/);
  await assert.rejects(() => reveal("v1.a.b"), /invalide/);
});
