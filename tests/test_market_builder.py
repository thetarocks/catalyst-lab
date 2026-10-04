import os
import pytest
from core.market_builder import load_cutoff_data, build_calibrated_market
from core.deferred_acceptance import Program, run_student_proposing_da
from core.josaa_engine import JoSAAStudent

def test_data_loader_and_market_generation():
    csv_path = "data/raw/sample_josaa_cutoffs.csv"
    assert os.path.exists(csv_path), "Sample CSV file must exist."

    cutoffs = load_cutoff_data(csv_path)
    assert len(cutoffs) >= 10

    profiles, capacities = build_calibrated_market(cutoffs, num_students=20, round_no=1)
    assert len(profiles) == 20
    assert len(capacities) > 0
    assert all(cap >= 1 for cap in capacities.values())

    # Verify revealed preference hierarchy: IIT Bombay CSE utility > IIT Delhi EE utility
    p1 = "IIT Bombay - Computer Science and Engineering"
    p2 = "IIT Delhi - Electrical Engineering"
    assert profiles[0].true_utilities[p1] > profiles[0].true_utilities[p2]

def test_end_to_end_matching_with_calibrated_data():
    csv_path = "data/raw/sample_josaa_cutoffs.csv"
    cutoffs = load_cutoff_data(csv_path)
    profiles, capacities = build_calibrated_market(cutoffs, num_students=30, round_no=1)

    programs = {pid: Program(id=pid, capacity=cap) for pid, cap in capacities.items()}
    students = [
        JoSAAStudent(
            id=p.id,
            rank=p.rank,
            preferences=p.true_order,
            category=p.category,
            institute_pref=p.institute_map
        )
        for p in profiles
    ]

    allocations = run_student_proposing_da(students, programs)
    total_matched = sum(len(matches) for matches in allocations.values())
    
    assert total_matched > 0
    assert total_matched <= sum(capacities.values())
