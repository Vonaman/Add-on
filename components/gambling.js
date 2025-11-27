// components/gambling.js

export function initializeGambling() {
  console.log("initializeGambling called");

  const container = document.querySelector(".gambling-container");
  console.log("Container:", container);
  if (!container) {
    console.error("Gambling container not found");
    return;
  }

  // Guard per-container instead of global flag so reloading the page/view works
  if (container._gamblingInitialized) {
    console.log("Already initialized for this container, returning");
    return;
  }
  container._gamblingInitialized = true;

  const betInput = container.querySelector(".gambling-bet");
  const btnRed = container.querySelector(".gambling-color-red");
  const btnBlack = container.querySelector(".gambling-color-black");
  const beLuckyBtn = container.querySelector(".be-lucky-btn");
  const slider = container.querySelector(".gambling-slider");
  const sliderContainer = container.querySelector(".gambling-slider-container");

  console.log("Elements found:", {
    betInput,
    btnRed,
    btnBlack,
    beLuckyBtn,
    slider,
    sliderContainer,
  });

  let chosen = "red";
  const setChosen = (c) => {
    console.log("setChosen called with:", c);
    chosen = c;
    // toggle active class for visual highlighting
    if (btnRed.classList) {
      btnRed.classList.toggle("active", c === "red");
      btnBlack.classList.toggle("active", c === "black");
      console.log("Active class toggled on buttons");
    } else {
      btnRed.style.outline =
        c === "red" ? "4px solid rgba(255,255,255,0.6)" : "none";
      btnBlack.style.outline =
        c === "black" ? "4px solid rgba(255,255,255,0.6)" : "none";
    }
  };

  btnRed.addEventListener("click", () => {
    console.log("Red button clicked");
    setChosen("red");
  });
  btnBlack.addEventListener("click", () => {
    console.log("Black button clicked");
    setChosen("black");
  });
  setChosen("red");
  console.log("Initial choice set to red, slider building started");

  // build the slider content (pattern alternating red/black)
  const buildSlider = (length) => {
    console.log("buildSlider called with length:", length);
    slider.innerHTML = "";
    for (let i = 0; i < length; i++) {
      const cell = document.createElement("div");
      cell.className = "gambling-cell flex-shrink-0";
      const isRed = i % 2 === 0;
      cell.style.background = isRed ? "#D62323" : "#000000";
      slider.appendChild(cell);
    }
    console.log("Slider cells built, total cells:", slider.children.length);
    // Show the arrow when slider is built
    sliderContainer.classList.add("active");
  };

  // helper to create modal
  function showModal(title, text) {
    // reuse wheel modal classes if present, otherwise create a simple modal
    let backdrop = document.querySelector(".gambling-modal-backdrop");
    if (!backdrop) {
      backdrop = document.createElement("div");
      backdrop.className = "gambling-modal-backdrop";
      document.body.appendChild(backdrop);
    }
    let modal = document.querySelector(".gambling-modal");
    if (!modal) {
      modal = document.createElement("div");
      modal.className = "gambling-modal";
      modal.innerHTML = `
        <div class="gambling-modal-content wheel-modal-content">
          <button class="gambling-modal-close wheel-modal-close" aria-label="Fermer">&times;</button>
          <div class="gambling-modal-text wheel-modal-text"></div>
        </div>
      `;
      document.body.appendChild(modal);
      modal
        .querySelector(".gambling-modal-close")
        .addEventListener("click", closeModal);
      backdrop.addEventListener("click", closeModal);
    }
    const textEl = modal.querySelector(".gambling-modal-text");
    textEl.innerHTML = `<div class="font-bold text-xl mb-2">${title}</div><div>${text}</div>`;
    backdrop.classList.add("active");
    modal.classList.add("active");
  }
  function closeModal() {
    const backdrop = document.querySelector(".gambling-modal-backdrop");
    const modal = document.querySelector(".gambling-modal");
    if (backdrop) backdrop.classList.remove("active");
    if (modal) modal.classList.remove("active");
  }

  // Spin animation
  let running = false;
  beLuckyBtn.addEventListener("click", () => {
    console.log("Be lucky button clicked");
    if (running) {
      console.log("Already running, returning");
      return;
    }
    const bet = parseInt(betInput.value, 10);
    console.log("Bet value:", bet);
    // Enforce minimum bet of 5
    if (!bet || bet < 5) {
      showModal("Invalid bet", "Minimum bet is 5.");
      return;
    }

    console.log("Starting spin with bet:", bet, "and chosen color:", chosen);
    // prepare slider
    const cells = 30; // number of cells in the strip
    // ensure slider is populated (visible before spin)
    if (!slider.children.length) {
      console.log("Building slider before spin");
      buildSlider(cells);
    }

    // animation params
    const duration = 6000; // 6 seconds total
    const start = performance.now();
    const cycles = 4; // full cycles before stopping
    const targetIndex = Math.floor(Math.random() * cells);
    const totalSteps = cycles * cells + targetIndex;

    running = true;
    beLuckyBtn.disabled = true;
    btnRed.disabled = true;
    btnBlack.disabled = true;
    betInput.disabled = true;

    const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

    function frame(now) {
      const elapsed = now - start;
      const t = Math.min(elapsed / duration, 1);
      const eased = easeOutCubic(t);
      const currentStep = Math.floor(eased * totalSteps);

      // highlight the current cell by scroll transform
      const offset = currentStep % cells;
      // compute cell width + gap dynamically for robustness
      let cellWidthPx = 80;
      const first = slider.children[0];
      if (first) {
        const rect0 = first.getBoundingClientRect();
        cellWidthPx = rect0.width;
        if (slider.children.length > 1) {
          const rect1 = slider.children[1].getBoundingClientRect();
          const gapPx = rect1.left - rect0.left - rect0.width;
          cellWidthPx = cellWidthPx + (isFinite(gapPx) ? gapPx : 0);
        }
      }
      const visibleCount = Math.max(
        1,
        Math.floor(sliderContainer.clientWidth / cellWidthPx)
      );
      const centerOffset = Math.floor(visibleCount / 2);
      const translate = -(offset - centerOffset) * cellWidthPx;
      slider.style.transform = `translateX(${translate}px)`;

      if (t < 1) {
        requestAnimationFrame(frame);
      } else {
        // finished
        running = false;
        beLuckyBtn.disabled = false;
        btnRed.disabled = false;
        btnBlack.disabled = false;
        betInput.disabled = false;

        const finalIndex = targetIndex % cells;
        const finalColor = finalIndex % 2 === 0 ? "red" : "black";
        const won = finalColor === chosen;
        if (won) {
          const points = bet * 2;
          showModal(
            "You won!",
            `Congratulations — you win <strong>${points}</strong> points. (Bet x2)`
          );
        } else {
          showModal(
            "You lost!",
            `Sorry — you lost your bet of <strong>${bet}</strong>.`
          );
        }
      }
    }
    requestAnimationFrame(frame);
  });
}
