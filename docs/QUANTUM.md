# Quantum model

Fold encodes a pending settlement's **location**, not its resource inventory, as one qubit. Site A is |0⟩ and site B is |1⟩. One building remains one piece and one victory point. Both locations reserve normal settlement spacing until measurement.

## State and gates

The game holds eight qubits in one normalized pure state:

$$|\psi\rangle=\sum_{x=0}^{255}\alpha_x|x\rangle,\qquad \sum_x|\alpha_x|^2=1.$$

Unused slots are |0⟩. Complex amplitudes use interleaved real/imaginary Float64 values. The least significant bit is qubit zero; displayed bitstrings run Q8…Q1, matching Qiskit's ordering.

A fresh pending settlement applies H to an unused slot, producing |+⟩=(|0⟩+|1⟩)/√2. Players can apply H, Z and CZ; definite buildings at gate ports unlock X and CX. The simulator also supports S for circuit validation, but S is not a gameplay action.

| Action | Mathematical effect | Game meaning |
| --- | --- | --- |
| H | (a,b) → ((a+b)/√2,(a−b)/√2) | Interfere between the two locations |
| Z | (a,b) → (a,−b) | Change relative phase |
| X | (a,b) → (b,a) | Swap location amplitudes |
| CZ | Negate amplitude when both selected bits are 1 | Link phase of joint B/B outcomes |
| CX | Flip target iff control bit is 1 | Controlled location swap |

Owner gets one gate action per turn, before or after rolling, starting on a later turn after construction. Splitting an existing level-one settlement costs one ore and consumes the same allowance. Cities cannot split. A new quantum settlement costs wood, brick, wool, wheat and ore, and must have two legal road-connected locations.

## Why this is not a random-location skin

Two states with identical visible 50/50 odds respond differently to interference:

$$H|+\rangle=|0\rangle,\qquad HZ|+\rangle=|1\rangle.$$

Z changes no immediate location probabilities. It changes the relative phase, and H converts that phase difference into a deterministic location difference. Gameplay gates are on separate turns; a production roll in between can measure the state early.

CZ applied to two independent |+⟩ states creates an entangled pure state while leaving individual Z-basis odds at 50/50. Linking therefore does not automatically change the displayed marginals. Subsequent interference and the shared joint distribution matter.

## Production and measurement

If an unblocked rolled tile touches either candidate site, sample the **entire pending register jointly** using P(x)=|αx|², before awarding any cards. Resolve each settlement to A or B using its sampled bit; release the discarded locations; award resources at surviving sites. Robber contact also triggers joint measurement before theft. Reset the register for the next construction wave.

This is a deliberate game rule: all pending settlements resolve together. Resources, roads, cities, scores and dice remain classical. There is no hidden inventory kept for unrealized branches.

## Correlation versus entanglement

The selected-qubit status uses purity Tr(ρq²). In the globally pure state, a reduced purity below one implies entanglement with the rest.

Board connection indicators compare the actual reduced pair state ρAB with ρA⊗ρB. A nonzero difference indicates correlation, not necessarily pairwise entanglement. GHZ reduced pairs illustrate that distinction. Indicators are recomputed from the state rather than inferred from a history of Link clicks.

## Qiskit correspondence

`src/quantum.js` records operations. `quantum/verify.py` rebuilds them as a QuantumCircuit, measures all qubits and submits to the backend it is passed. The Qollab bridge requests 1,024 shots and compares the sampled counts with the captured ideal distribution.

Live play uses the local exact statevector. The backend verification job does not drive live dice rolls or collapse. These small Clifford circuits are efficiently classically simulable; Fold claims faithful mechanics and a playable interaction design, not computational quantum advantage.
