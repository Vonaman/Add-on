// components/wheel.js - Roulette casino

export function initializeWheel() {
  if (window._wheelInitialized) return;
  window._wheelInitialized = true;

  const wheelContainer = document.querySelector(".wheel-container");
  if (!wheelContainer) return;

  const canvas = wheelContainer.querySelector("canvas");
  if (!canvas) {
    console.error("Pas de canvas trouvé dans .wheel-container");
    return;
  }

  // Attendre que le canvas ait des dimensions CSS (optimisé pour un chargement rapide)
  const waitForCanvasSize = () => {
    return new Promise((resolve) => {
      const checkSize = () => {
        const rect = canvas.getBoundingClientRect();
        // Réduire le seuil minimum pour accélérer la détection (30px au lieu de 50px)
        if (rect.width > 30 && rect.height > 30) {
          resolve(rect);
        } else {
          requestAnimationFrame(checkSize);
        }
      };
      checkSize();
    });
  };

  waitForCanvasSize().then((rect) => {
    setupWheel(canvas, rect);
  });
}

function setupWheel(canvas, rect) {
  // Configurer le contexte 2D
  const ctx = canvas.getContext("2d");
  const DPR = window.devicePixelRatio || 1;

  // Dimensionner le canvas
  canvas.width = Math.round(rect.width * DPR);
  canvas.height = Math.round(rect.height * DPR);
  ctx.scale(DPR, DPR);

  const width = rect.width;
  const height = rect.height;
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) / 2 - 20;

  // Config: utiliser 8 sections (plus petite roulette), aucune case verte
  const segments = 8;
  // Couleurs fournies par l'utilisateur (une couleur par segment)
  const colors = [
    "#74C5E2",
    "#E7837F",
    "#2D8BAF",
    "#D62323",
    "#C6D056",
    "#F4536E",
    "#FABA62",
    "#F5B49E",
  ];

  // Tableau d'id -> phrase (1..8)
  // Personnalisez ces phrases selon vos besoins
  const phrases = {
    0: "Phrase pour l'id 1",
    1: "Phrase pour l'id 2",
    2: "Phrase pour l'id 3",
    3: "Phrase pour l'id 4",
    4: "Phrase pour l'id 5",
    5: "Phrase pour l'id 6",
    6: "Phrase pour l'id 7",
    7: "Phrase pour l'id 8",
  };

  // s'assurer de récupérer le container depuis le canvas (au cas où
  // initializeWheel a été appelé depuis un autre scope)
  const wheelContainerLocal =
    canvas.closest(".wheel-container") ||
    document.querySelector(".wheel-container");

  // Labels: permettre d'utiliser du texte pour chaque segment via l'attribut
  // data-labels="A,B,C,1,2,3,4,5" sur .wheel-container
  const rawLabels =
    (wheelContainerLocal && wheelContainerLocal.getAttribute("data-labels")) ||
    null;
  const labels = rawLabels
    ? rawLabels.split(",").map((s) => s.trim())
    : Array.from({ length: segments }, (_, i) => String(i + 1));

  let rotation = 0;
  let isSpinning = false;
  const button =
    // cibler d'abord la classe explicite fournie dans le HTML
    wheelContainerLocal.querySelector(".wheel-spin-btn") ||
    wheelContainerLocal.querySelector("button[data-state]") ||
    Array.from(wheelContainerLocal.querySelectorAll("button")).find((b) =>
      b.textContent.includes("Spin")
    );

  function drawWheel() {
    // Effacer le canvas
    ctx.clearRect(0, 0, width, height);

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(rotation);

    // Dessiner les segments
    for (let i = 0; i < segments; i++) {
      const startAngle = (i / segments) * Math.PI * 2;
      const endAngle = ((i + 1) / segments) * Math.PI * 2;

      // Remplir le segment
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = colors[i];
      ctx.fill();

      // Bordure du segment
      ctx.strokeStyle = "#ddd";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Ne pas dessiner de texte/numéros sur les segments —
      // le système d'id interne (1..segments) est conservé pour la logique.
    }

    // Dessiner le cercle central
    ctx.beginPath();
    ctx.arc(0, 0, 20, 0, Math.PI * 2);
    ctx.fillStyle = "#fff";
    ctx.fill();
    ctx.strokeStyle = "#333";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.restore();

    // Dessiner l'aiguille en haut (pointeur)
    ctx.fillStyle = "#FFD700";
    ctx.beginPath();
    ctx.moveTo(centerX - 10, centerY - radius - 10);
    ctx.lineTo(centerX + 10, centerY - radius - 10);
    ctx.lineTo(centerX, centerY - radius + 5);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "#333";
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  // Première peinture
  drawWheel();

  // Fonction pour afficher la modal avec la phrase gagnante
  function showWinningModal(winningLabel) {
    // Chercher ou créer le backdrop (fond semi-transparent)
    let backdrop = document.querySelector(".wheel-modal-backdrop");
    if (!backdrop) {
      backdrop = document.createElement("div");
      backdrop.className = "wheel-modal-backdrop";
      document.body.appendChild(backdrop);
    }

    // Chercher ou créer la modal
    let modal = document.querySelector(".wheel-modal");
    if (!modal) {
      modal = document.createElement("div");
      modal.className = "wheel-modal";
      modal.innerHTML = `
        <div class="wheel-modal-content">
          <button class="wheel-modal-close" aria-label="Fermer">&times;</button>
          <div class="wheel-modal-text"></div>
        </div>
      `;
      document.body.appendChild(modal);

      // Ajouter l'événement de fermeture sur la croix
      const closeBtn = modal.querySelector(".wheel-modal-close");
      closeBtn.addEventListener("click", closeWinningModal);

      // Fermer aussi en cliquant sur le backdrop
      backdrop.addEventListener("click", closeWinningModal);
    }

    // Mettre à jour le texte et afficher la modal
    const textEl = modal.querySelector(".wheel-modal-text");
    textEl.textContent = winningLabel;
    backdrop.classList.add("active");
    modal.classList.add("active");
  }

  function closeWinningModal() {
    const backdrop = document.querySelector(".wheel-modal-backdrop");
    const modal = document.querySelector(".wheel-modal");
    if (backdrop) backdrop.classList.remove("active");
    if (modal) modal.classList.remove("active");
  }

  // Gestion du bouton spin
  if (button) {
    button.addEventListener("click", () => {
      if (isSpinning) return;

      isSpinning = true;
      button.disabled = true;
      button.textContent = "Spinning...";

      // Spin aléatoire
      const targetRotation =
        rotation + Math.random() * Math.PI * 2 + Math.PI * 6;
      const duration = 5000; // 5 secondes
      const startTime = performance.now();

      // easing easeInOutCubic
      const easeInOutCubic = (t) =>
        t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

      const animate = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        const easeProgress = easeInOutCubic(progress);

        rotation = rotation + (targetRotation - rotation) * easeProgress;

        drawWheel();

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          isSpinning = false;
          button.disabled = false;
          button.textContent = "Spin Again";

          // Calculer le segment gagnant
          const normalizedRotation =
            ((rotation % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
          const winningSegment = Math.floor(
            (segments -
              Math.floor((normalizedRotation / (Math.PI * 2)) * segments)) %
              segments
          );
          // id (1..8) correspondant au segment gagnant
          const winningId = winningSegment % segments;
          // Chercher la phrase associée à l'id dans le tableau `phrases`
          const winningPhrase = phrases[winningId] || null;
          // Pour affichage, préférer la phrase si présente, sinon le label segment
          const winningLabel =
            winningPhrase ||
            (labels[winningSegment] !== undefined
              ? labels[winningSegment]
              : String(winningId));
          console.log("Winning segment:", winningSegment, winningLabel);

          // Afficher le résultat dans une modal
          showWinningModal(winningLabel);
        }
      };

      requestAnimationFrame(animate);
    });
  }
}
