"""Finite perturbation audit of the static student-proposing DA reference model."""
import argparse
import copy
import hashlib
import json
from pathlib import Path
from core.market_builder import load_cutoff_data, build_calibrated_market
from core.deferred_acceptance import run_student_proposing_da, Student, Program


def source_hashes():
    paths = ['scripts/benchmark_manipulability.py','scripts/audit_dynamic_strategies.py',
             'core/deferred_acceptance.py','core/josaa_engine.py','core/agents.py',
             'core/market_builder.py','data/raw/sample_josaa_cutoffs.csv']
    return {p: hashlib.sha256(Path(p).read_bytes()).hexdigest() for p in paths}


def run_market_assignment(students, capacities):
    programs = {pid: Program(id=pid, capacity=cap) for pid, cap in capacities.items()}
    cohort = copy.deepcopy(students)
    run_student_proposing_da(cohort, programs)
    return {s.id: s.current_match for s in cohort}


def run_audit(num_students=60):
    profiles, capacities = build_calibrated_market(load_cutoff_data('data/raw/sample_josaa_cutoffs.csv'), num_students=num_students, round_no=1)
    students = [Student(id=p.id, rank=p.rank, preferences=list(p.true_order), category=p.category) for p in profiles]
    baseline = run_market_assignment(students, capacities)
    total = profitable = 0
    for profile, target in zip(profiles, students):
        order = target.preferences
        deviations = [order[:k] for k in range(1,len(order))]
        for i,j in [(0,1),(1,2)]:
            if j < len(order):
                swapped = list(order)
                swapped[i],swapped[j] = swapped[j],swapped[i]
                deviations.append(swapped)
        for order in deviations:
            cohort = copy.deepcopy(students)
            next(s for s in cohort if s.id == target.id).preferences = order
            match = run_market_assignment(cohort, capacities)[target.id]
            gain = profile.true_utilities.get(match,0) - profile.true_utilities.get(baseline[target.id],0)
            profitable += gain > 1e-9
            total += 1
    return {'schema_version':1,'audit':'static_da','candidates':len(students),'programs':len(capacities),
            'deviations_tested':total,'profitable_deviations':profitable,'assignment_runs':total+1,
            'gain_rate_pct':100*profitable/total if total else 0,
            'scope':'One synthetic OPEN-category cohort derived from the repository sample cutoff table; truncations and two adjacent swaps per applicant. A finite check, not a proof of strategy-proofness or an empirical estimate for real admissions.',
            'source_sha256':source_hashes()}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--json',type=Path)
    args = parser.parse_args()
    result = run_audit()
    print(json.dumps(result,indent=2))
    if args.json:
        args.json.parent.mkdir(parents=True,exist_ok=True)
        args.json.write_text(json.dumps(result,indent=2)+'\n')

if __name__ == '__main__':
    main()
