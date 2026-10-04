import pytest
from core.deferred_acceptance import Program
from core.josaa_engine import JoSAAStudent, simulate_multi_round_josaa

def test_vacancy_chain_on_withdrawal():
    """
    Round 1:
      s1 takes P1 (top choice).
      s2 takes P2.
    Round 2:
      s1 withdraws (leaves for external offer).
      s2 should float into P1.
    """
    students = [
        JoSAAStudent(id="s1", rank=1, preferences=["P1", "P2"]),
        JoSAAStudent(id="s2", rank=2, preferences=["P1", "P2"])
    ]
    programs = {
        "P1": Program(id="P1", capacity=1),
        "P2": Program(id="P2", capacity=1)
    }

    actions = {
        2: {"s1": "WITHDRAW"}
    }

    history = simulate_multi_round_josaa(students, programs, actions, max_rounds=2)

    # Round 1 verification
    assert history[0]["P1"] == ["s1"]
    assert history[0]["P2"] == ["s2"]

    # Round 2 verification after vacancy cascade
    assert history[1]["P1"] == ["s2"]
    assert history[1]["P2"] == []

def test_slide_action_restricts_to_same_institute():
    """
    Programs:
      IITB_CSE, IITB_EE (Institute: IITB)
      IITD_CSE (Institute: IITD)
    s1 prefers: IITD_CSE > IITB_CSE > IITB_EE
    If s1 is assigned IITB_EE and chooses SLIDE, they can upgrade to IITB_CSE,
    but NOT IITD_CSE even if IITD_CSE opens up.
    """
    inst_map = {
        "IITD_CSE": "IITD",
        "IITB_CSE": "IITB",
        "IITB_EE": "IITB"
    }
    s = JoSAAStudent(
        id="s1",
        rank=1,
        preferences=["IITD_CSE", "IITB_CSE", "IITB_EE"],
        institute_pref=inst_map,
        action="SLIDE"
    )

    filtered = s.filter_preferences_for_next_round("IITB_EE")
    assert filtered == ["IITB_CSE", "IITB_EE"]
    assert "IITD_CSE" not in filtered
