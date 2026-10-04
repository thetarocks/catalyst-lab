import pytest
from core.deferred_acceptance import Student
from core.reservation_engine import QuotaProgram, run_reservation_da

def test_merit_first_open_consumption():
    """
    A high-merit reserved category candidate (OBC rank 1) must consume an OPEN seat,
    leaving the OBC category seat intact for a lower-ranked OBC candidate.
    """
    s1 = Student(id="s1_obc", rank=1, preferences=["IITB_CSE"], category="OBC")
    s2 = Student(id="s2_open", rank=2, preferences=["IITB_CSE"], category="OPEN")
    s3 = Student(id="s3_obc", rank=3, preferences=["IITB_CSE"], category="OBC")

    program = QuotaProgram(
        id="IITB_CSE",
        open_capacity=1,
        reserved_capacities={"OBC": 1}
    )

    results = run_reservation_da([s1, s2, s3], {"IITB_CSE": program})

    # s1 takes OPEN seat by virtue of CRL rank 1
    assert results["IITB_CSE"]["OPEN"] == ["s1_obc"]
    # s3 takes the reserved OBC seat
    assert results["IITB_CSE"]["OBC"] == ["s3_obc"]
    # s2 (OPEN) is rejected because open capacity was exhausted by s1
    assert s2.current_match is None

def test_category_fallback_on_open_displacement():
    """
    If an OBC candidate is pushed out of OPEN seats by a higher rank general candidate,
    they should gracefully fall back into the reserved OBC seat and displace a lower OBC candidate.
    """
    s1 = Student(id="s1_open", rank=1, preferences=["IITB_CSE"], category="OPEN")
    s2 = Student(id="s2_obc", rank=2, preferences=["IITB_CSE"], category="OBC")
    s3 = Student(id="s3_obc", rank=5, preferences=["IITB_CSE"], category="OBC")

    program = QuotaProgram(
        id="IITB_CSE",
        open_capacity=1,
        reserved_capacities={"OBC": 1}
    )

    results = run_reservation_da([s1, s2, s3], {"IITB_CSE": program})

    assert results["IITB_CSE"]["OPEN"] == ["s1_open"]
    assert results["IITB_CSE"]["OBC"] == ["s2_obc"]
