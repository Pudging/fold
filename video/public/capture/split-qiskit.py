# Fold: Qollab supplies backend from the selected device.
from qiskit import QuantumCircuit

circuit = QuantumCircuit(8)
circuit.h(0)
circuit.measure_all()
job = backend.run(circuit, shots=1024)
counts = job.result().get_counts()
print(counts)
# Little-endian: rightmost bit is Q1; 0 selects location A, 1 selects B.
