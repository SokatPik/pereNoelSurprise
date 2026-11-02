const test = require("node:test");
const assert = require("node:assert/strict");
const { draw } = require("../js/draw.js");

const names = (n) => Array.from({ length: n }, (_, i) => "P" + (i + 1));

test("personne ne pioche son propre prénom et chacun est tiré une seule fois", () => {
  for (let n = 3; n <= 12; n++) {
    for (let k = 0; k < 500; k++) {
      const participants = names(n);
      const result = draw(participants);
      assert.equal(result.length, n);
      assert.deepEqual(result.map((r) => r.giver), participants);
      for (const { giver, receiver } of result) assert.notEqual(giver, receiver);
      assert.equal(new Set(result.map((r) => r.receiver)).size, n);
    }
  }
});

test("les exclusions sont respectées dans les deux sens", () => {
  const exclusions = [["P1", "P2"], ["P3", "P4"]];
  for (let k = 0; k < 1000; k++) {
    const result = draw(names(6), exclusions);
    for (const { giver, receiver } of result) {
      for (const [a, b] of exclusions) {
        assert.ok(!(giver === a && receiver === b), giver + " ne doit pas tirer " + receiver);
        assert.ok(!(giver === b && receiver === a), giver + " ne doit pas tirer " + receiver);
      }
    }
  }
});

test("renvoie null quand aucun tirage n'est possible", () => {
  const exclusions = [["P1", "P2"], ["P2", "P3"], ["P1", "P3"]];
  assert.equal(draw(names(3), exclusions), null);
});

test("refuse moins de 3 participants", () => {
  assert.throws(() => draw(["A", "B"]), /au moins 3/);
});

test("refuse les prénoms en double, sans tenir compte de la casse", () => {
  assert.throws(() => draw(["Marie", "marie", "Paul"]), /même prénom/);
});

test("refuse une exclusion qui cite un prénom inconnu", () => {
  assert.throws(() => draw(names(4), [["P1", "Inconnu"]]), /Exclusion inconnue/);
});
