import pytest
from core.deferred_acceptance import Student, Program, run_student_proposing_da

def test_hand_solved_three_student_case():
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


def test_later_higher_priority_proposal_updates_retained_students_match():
    from core.deferred_acceptance import Student, Program, run_student_proposing_da
    higher = Student(id="higher",rank=1,preferences=["closed","P"])
    lower = Student(id="lower",rank=2,preferences=["P"])
    programs = {"closed":Program(id="closed",capacity=0),"P":Program(id="P",capacity=1)}
    allocation = run_student_proposing_da([higher,lower],programs)
    assert allocation["P"] == ["higher"]
    assert higher.current_match == "P"
    assert lower.current_match is None
