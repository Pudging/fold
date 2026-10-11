"""Qollab entry point. The selected backend is passed in, never hardcoded."""
import json
from qiskit import QuantumCircuit


def build_circuit(operations_json, qubits=3):
    operations = json.loads(operations_json)
    if len(operations) > 4096:
        raise ValueError("Circuit too long")
    if type(qubits) is not int or not 1 <= qubits <= 8:
        raise ValueError("Invalid qubit count")
    circuit = QuantumCircuit(qubits)
    for op in operations:
        gate, target = op["gate"], op["target"]
        if type(target) is not int or not 0 <= target < qubits:
            raise ValueError("Invalid target")
        if gate in ("h", "z", "s", "x"):
            getattr(circuit, gate)(target)
        elif gate in ("cx", "cz"):
            control = op["control"]
            if type(control) is not int or not 0 <= control < qubits or control == target:
                raise ValueError("Invalid control")
            getattr(circuit, gate)(control, target)
        else:
            raise ValueError("Unsupported gate")
    return circuit


def run(backend, operations_json, shots=1024, qubits=3):
    circuit = build_circuit(operations_json, qubits)
    circuit.measure_all()
    job = backend.run(circuit, shots=shots)
    counts = job.result().get_counts()
    # Returning JSON avoids PyProxy/Map conversion differences in the bridge.
    return json.dumps({"counts": counts, "shots": shots})
