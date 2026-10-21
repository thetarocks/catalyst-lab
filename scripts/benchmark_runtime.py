"""Measure the actual Python audit workloads, without extrapolating to national scale."""
import argparse
import json
import platform
import statistics
import time
from datetime import datetime, timezone
from pathlib import Path
from scripts.benchmark_manipulability import run_audit as static_audit
from scripts.audit_dynamic_strategies import run_audit as dynamic_audit


def measure(repeats=5):
    result = {
        'measured_at_utc': datetime.now(timezone.utc).isoformat(),
        'environment': {'python': platform.python_version(), 'os': platform.system(), 'architecture': platform.machine()},
        'method': 'One warm-up per workload, then five sequential wall-clock samples with perf_counter; includes market generation and source hashing. Local measurements, not browser timings or service guarantees.',
        'workloads': {},
    }
    for name, audit in [('static', static_audit), ('dynamic', dynamic_audit)]:
        audit()
        samples = []
        for _ in range(repeats):
            start = time.perf_counter()
            evidence = audit()
            samples.append(1000 * (time.perf_counter() - start))
        result['workloads'][name] = {'samples_ms': samples, 'median_ms': statistics.median(samples),
            'assignment_runs': evidence['assignment_runs'], 'source_sha256': evidence['source_sha256']}
    return result


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--json', type=Path, required=True)
    args = parser.parse_args()
    output = measure()
    args.json.parent.mkdir(parents=True, exist_ok=True)
    args.json.write_text(json.dumps(output, indent=2) + '\n')
    for name, value in output['workloads'].items():
        print(f"{name}: {value['assignment_runs']} matching runs; median {value['median_ms']:.1f} ms")
