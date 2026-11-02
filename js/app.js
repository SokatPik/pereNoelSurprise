/* Interface : écran organisateur (saisie, tirage, liens) et écran de révélation. */
(function () {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const views = { organizer: $("organizer"), links: $("links"), reveal: $("reveal") };

  function show(name) {
    for (const [key, el] of Object.entries(views)) el.hidden = key !== name;
  }

  function parseParticipants(text) {
    return text
      .split("\n")
      .map((line) => line.trim().replace(/\s+/g, " "))
      .filter(Boolean);
  }

  // « Marie - Paul » : un tiret entouré d'espaces, pour ne pas casser « Jean-Pierre ».
  function parseExclusions(text) {
    return text
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const pair = line.split(/\s+[-–—]\s+/);
        if (pair.length !== 2 || !pair[0] || !pair[1]) {
          throw new Error("Exclusion illisible : « " + line + " ». Écris-la sous la forme « Marie - Paul ».");
        }
        return pair;
      });
  }

  function renderLinks(items) {
    const list = $("links-list");
    list.replaceChildren();
    for (const { giver, link } of items) {
      const li = document.createElement("li");

      const name = document.createElement("span");
      name.className = "link-name";
      name.textContent = giver;

      const input = document.createElement("input");
      input.type = "text";
      input.readOnly = true;
      input.value = link;
      input.setAttribute("aria-label", "Lien de " + giver);

      const button = document.createElement("button");
      button.type = "button";
      button.className = "secondary";
      button.textContent = "Copier le lien";
      button.addEventListener("click", async () => {
        try {
          await navigator.clipboard.writeText(link);
          button.textContent = "Lien copié";
        } catch (e) {
          input.select();
          button.textContent = "Copie le lien sélectionné";
        }
        setTimeout(() => (button.textContent = "Copier le lien"), 2500);
      });

      li.append(name, input, button);
      list.append(li);
    }
  }

  $("draw-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const error = $("error");
    error.textContent = "";
    try {
      const participants = parseParticipants($("participants").value);
      const exclusions = parseExclusions($("exclusions").value);
      const result = window.Draw.draw(participants, exclusions);
      if (!result) {
        throw new Error("Aucun tirage possible avec ces exclusions. Retire-en une ou ajoute des participants.");
      }
      const base = location.href.split("#")[0];
      const items = await Promise.all(
        result.map(async ({ giver, receiver }) => ({
          giver,
          link: base + "#" + (await window.Secret.seal(giver, receiver)),
        }))
      );
      renderLinks(items);
      show("links");
    } catch (err) {
      error.textContent = err.message;
    }
  });

  $("restart").addEventListener("click", () => {
    $("links-list").replaceChildren();
    show("organizer");
  });

  // ----- Écran de révélation -----

  function resetReveal(giver) {
    $("confirm-name").textContent = giver;
    $("confirm").hidden = false;
    $("wrong").hidden = true;
    $("result").hidden = true;
    $("gift-name").textContent = "";
    $("reveal-error").textContent = "";
  }

  $("yes").addEventListener("click", async () => {
    try {
      const receiver = await window.Secret.reveal(location.hash.slice(1));
      $("gift-name").textContent = receiver;
      $("confirm").hidden = true;
      $("result").hidden = false;
    } catch (err) {
      $("reveal-error").textContent = err.message + " Demande un nouveau lien à l'organisateur.";
    }
  });

  $("no").addEventListener("click", () => {
    $("confirm").hidden = true;
    $("wrong").hidden = false;
  });

  function route() {
    const token = location.hash.slice(1);
    if (!token) {
      show("organizer");
      return;
    }
    try {
      resetReveal(window.Secret.giverOf(token));
      show("reveal");
    } catch (err) {
      show("organizer");
      $("error").textContent = "Ce lien n'est pas valide. Demande-en un nouveau à l'organisateur.";
    }
  }

  window.addEventListener("hashchange", route);
  route();
})();
