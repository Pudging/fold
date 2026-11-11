import * as verifier from 'quantum.verify';

// Qollab only accepts backend jobs while this top-level run is still active.
let finishRun;
const verified = new Promise((resolve) => { finishRun = resolve; });

window.foldBackend = async (operations, qubits = 8) => {
  try {
    const raw = await verifier.run.callPromising(backend, JSON.stringify(operations), 1024, qubits);
    return JSON.parse(String(raw));
  } finally {
    // Release the run on failure too, so a failed verification does not hang it.
    finishRun();
  }
};

import './game.js';
await verified;
