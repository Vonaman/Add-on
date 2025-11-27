// app.js - Point d'entrée pour l'application

import { initializeDice } from "./components/dice.js";
import { initializeWheel } from "./components/wheel.js";
import { initializeGambling } from "./components/gambling.js";

// Exposer les fonctions à window pour les appels Alpine
window.initializeDice = initializeDice;
window.initializeWheel = initializeWheel;
window.initializeGambling = initializeGambling;

console.log("App loaded. initializeDice and initializeWheel are available.");
