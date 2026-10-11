"""Independent comparison of the JS simulator and actual Qiskit mathematics."""
import json
import sys
from pathlib import Path
import numpy as np
from qiskit.quantum_info import Statevector, partial_trace, purity

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from quantum.verify import build_circuit, run

cases = json.load(sys.stdin)
for case in cases:
    circuit = build_circuit(json.dumps(case["operations"]), case["qubits"])
    actual = Statevector.from_instruction(circuit)
    pair = partial_trace(actual, [i for i in range(case["qubits"]) if i not in (0, case["qubits"]-1)]).data
    pair_raw = np.array(case["pair"])
    np.testing.assert_allclose(pair.flatten(), pair_raw[::2] + 1j * pair_raw[1::2], atol=1e-12)
    raw = np.array(case["amplitudes"])
    expected = raw[::2] + 1j * raw[1::2]
    np.testing.assert_allclose(actual.data, expected, atol=1e-12)
    for q in range(case["qubits"]):
        reduced = partial_trace(actual, [i for i in range(case["qubits"]) if i != q])
        np.testing.assert_allclose(float(np.real(purity(reduced))), case["purities"][q], atol=1e-12)

# Exercise the bridge adapter's complete one-job path against Qiskit's local backend.
from qiskit.providers.basic_provider import BasicSimulator
result = json.loads(run(BasicSimulator(), json.dumps([
    {"gate": "h", "target": 0}, {"gate": "z", "target": 0}, {"gate": "h", "target": 0}
]), 1024))
assert result["counts"] == {"001": 1024}, result
six = json.loads(run(BasicSimulator(), json.dumps([
    {"gate": "x", "target": 0}, {"gate": "x", "target": 5}
]), 1024, 6))
assert six["counts"] == {"100001": 1024}, six
eight = json.loads(run(BasicSimulator(), json.dumps([
    {"gate": "h", "target": 7}, {"gate": "z", "target": 7}, {"gate": "h", "target": 7}
]), 1024, 8))
assert eight["counts"] == {"10000000": 1024}, eight
print(f"PASS: {len(cases)} circuits / 2,000 gates match Qiskit amplitudes and reduced-state purities to 1e-12.")
print("PASS: Python backend adapter returns 1,024/1,024 expected outcomes with Qiskit BasicSimulator.")
