import pytest
from core.deferred_acceptance import Student, Program, run_student_proposing_da

def test_hand_solved_three_student_case():
    """
    Standard textbook matching case:
    s1 (rank 1): P1 > P2
    s2 (rank 2): P1 > P2
    s3 (rank 3): P2 > P1
    
    Capacities: P1 = 1, P2 = 1
    Expected: s1 -> P1, s2 -> P2, s3 -> None
    """
    students = [
        Student(id="s1", rank=1, preferences=["P1", "P2"]),
        Student(id="s2", rank=2, preferences=["P1", "P2"]),
        Student(id="s3", rank=3, preferences=["P2", "P1"])
    ]
    programs = {
        "P1": Program(id="P1", capacity=1),
        "P2": Program(id="P2", capacity=1)
    }

    results = run_student_proposing_da(students, programs)

    assert results["P1"] == ["s1"]
    assert results["P2"] == ["s2"]
    assert students[2].current_match is None

def test_absence_of_justified_envy():
    """
    No unmatched or lower-allocated student with better rank should be preferred 
    over someone admitted to a program on their preference list.
    """
    students = [
        Student(id="s1", rank=1, preferences=["P2"]),
        Student(id="s2", rank=2, preferences=["P1"]),
        Student(id="s3", rank=3, preferences=["P1", "P2"])
    ]
    programs = {
        "P1": Program(id="P1", capacity=1),
        "P2": Program(id="P2", capacity=1)
    }

    results = run_student_proposing_da(students, programs)

    assert results["P2"] == ["s1"]
    assert results["P1"] == ["s2"]
    assert results.get("s3") is None
