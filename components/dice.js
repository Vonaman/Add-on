// components/dice.js - Logique du dice 3D avec Zdog

export function initializeDice() {
  // Déjà initialisé ? skip.
  if (window._diceInitialized) return;
  window._diceInitialized = true;

  // Charger Zdog si nécessaire
  if (!window.Zdog) {
    const s = document.createElement("script");
    s.src = "https://unpkg.com/zdog@1/dist/zdog.dist.min.js";
    s.onload = () => setupDice();
    s.onerror = () => console.error("Échec du chargement de Zdog.");
    document.head.appendChild(s);
  } else {
    setupDice();
  }
}

function setupDice() {
  const { Illustration, Group, Box, Hemisphere, TAU, easeInOut } = window.Zdog;

  const root = document.querySelector(".dice-container");
  const canvas = root.querySelector("canvas");

  // Attendre que le canvas ait ses dimensions CSS appliquées
  const waitForCanvasSize = () => {
    return new Promise((resolve) => {
      const checkSize = () => {
        const rect = canvas.getBoundingClientRect();
        if (rect.width > 10 && rect.height > 10) {
          resolve(rect);
        } else {
          requestAnimationFrame(checkSize);
        }
      };
      checkSize();
    });
  };

  waitForCanvasSize().then((rect) => {
    const DPR = Math.max(window.devicePixelRatio || 1, 1);
    canvas.width = Math.max(1, Math.round(rect.width * DPR));
    canvas.height = Math.max(1, Math.round(rect.height * DPR));
    setupDiceRenderer(canvas, rect, DPR);
  });

  function setupDiceRenderer(canvas, rect, DPR) {
    const button = document.querySelector(".dice-container button[data-state]");

    const colors = {
      white: "hsl(0 0% 99%)",
      black: "#2D8BAF",
      red: "hsl(4 77% 55%)",
    };

    const stroke = 20;
    const size = 50;
    const diameter = 13;
    const offset = 16;

    // Calculer un zoom adapté
    const minCss = Math.min(rect.width, rect.height);
    const targetFraction = 0.4;
    const zoomBase = (minCss * targetFraction) / size;
    const computedZoom = Math.max(0.5, Math.min(6, zoomBase * DPR));

    const illustration = new Illustration({
      element: canvas,
      zoom: computedZoom,
      rotate: {
        x: (TAU / 14) * -1,
        y: TAU / 8,
      },
    });

    const dice = new Box({
      addTo: illustration,
      color: colors.white,
      stroke,
      width: size,
      height: size,
      depth: size,
    });

    const dot = new Hemisphere({
      color: colors.black,
      stroke: 0,
      diameter,
    });

    // Face 1 (un point au centre)
    const one = new Group({
      addTo: dice,
      translate: { y: (size / 2 + stroke / 2) * -1 },
      rotate: { x: TAU / 4 },
    });
    dot.copy({ addTo: one, color: colors.red });

    // Face 6 (six points)
    const six = new Group({
      addTo: dice,
      translate: { y: size / 2 + stroke / 2 },
      rotate: { x: (TAU / 4) * -1 },
    });
    for (const { x, y } of [
      { x: offset, y: offset * -1 },
      { x: offset, y: 0 },
      { x: offset, y: offset },
      { x: offset * -1, y: offset },
      { x: offset * -1, y: 0 },
      { x: offset * -1, y: offset * -1 },
    ]) {
      dot.copy({ addTo: six, translate: { x, y } });
    }

    // Face 2 (deux points diagonaux)
    const two = new Group({
      addTo: dice,
      translate: { z: (size / 2 + stroke / 2) * -1 },
      rotate: { x: TAU / 2 },
    });
    for (const { x, y } of [
      { x: offset, y: offset * -1 },
      { x: offset * -1, y: offset },
    ]) {
      dot.copy({ addTo: two, translate: { x, y } });
    }

    // Face 5 (cinq points)
    const five = new Group({
      addTo: dice,
      translate: { z: size / 2 + stroke / 2 },
    });
    for (const { x, y } of [
      { x: 0, y: 0 },
      { x: offset, y: offset * -1 },
      { x: offset, y: offset },
      { x: offset * -1, y: offset },
      { x: offset * -1, y: offset * -1 },
    ]) {
      dot.copy({ addTo: five, translate: { x, y } });
    }

    // Face 3 (trois points diagonaux)
    const three = new Group({
      addTo: dice,
      translate: { x: (size / 2 + stroke / 2) * -1 },
      rotate: { y: TAU / 4 },
    });
    for (const { x, y } of [
      { x: 0, y: 0 },
      { x: offset, y: offset * -1 },
      { x: offset * -1, y: offset },
    ]) {
      dot.copy({ addTo: three, translate: { x, y } });
    }

    // Face 4 (quatre points)
    const four = new Group({
      addTo: dice,
      translate: { x: size / 2 + stroke / 2 },
      rotate: { y: (TAU / 4) * -1 },
    });
    for (const { x, y } of [
      { x: offset, y: offset * -1 },
      { x: offset, y: offset },
      { x: offset * -1, y: offset },
      { x: offset * -1, y: offset * -1 },
    ]) {
      dot.copy({ addTo: four, translate: { x, y } });
    }

    illustration.updateRenderGraph();

    // Logique de lancer (time-based, ease-in-out sur 2s)
    let state = "wait";
    let angles = {
      x: illustration.rotate.x,
      y: illustration.rotate.y,
      z: illustration.rotate.z,
    };
    let anglesNext = { ...angles };

    const durationDice = 2000; // 2 secondes
    const easeInOutCubic = (t) =>
      t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    const animateTime = (start, now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / durationDice, 1);
      const ease = easeInOutCubic(progress);

      illustration.rotate.x = angles.x + (anglesNext.x - angles.x) * ease;
      illustration.rotate.y = angles.y + (anglesNext.y - angles.y) * ease;
      illustration.rotate.z = angles.z + (anglesNext.z - angles.z) * ease;
      illustration.updateRenderGraph();

      if (progress < 1) {
        requestAnimationFrame((t) => animateTime(start, t));
      } else {
        // finaliser
        angles = {
          x: anglesNext.x % TAU,
          y: anglesNext.y % TAU,
          z: anglesNext.z % TAU,
        };
        illustration.rotate.x = angles.x;
        illustration.rotate.y = angles.y;
        illustration.rotate.z = angles.z;
        illustration.updateRenderGraph();
        state = "wait";
        button.setAttribute("data-state", state);
        if (button) {
          button.disabled = false;
        }
      }
    };

    const handleClick = () => {
      if (state !== "wait") return;

      // Générer un résultat équitable : 1 chance sur 6 pour chaque face (1-6)
      const result = Math.floor(Math.random() * 6) + 1;

      // Rotation aléatoire (comme avant) - indépendante du résultat
      const [x, y, z] = Array(3)
        .fill()
        .map((_) => (Math.floor(Math.random() * 4) * TAU) / 4 + TAU * 2);
      anglesNext = { x, y, z };
      state = "roll";
      button.setAttribute("data-state", state);
      if (button) button.disabled = true;
      requestAnimationFrame((t) => animateTime(t, t));
    };

    button.addEventListener("click", handleClick);
  }
}
