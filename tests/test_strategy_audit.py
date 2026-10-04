import pytest
from core.agents import AgentProfile, evaluate_strategic_gain

def test_static_da_cannot_be_manipulated_by_truncation():
    """
    In standard static student-proposing DA, misreporting by truncating or 
    inverting preferences does not yield a strictly preferred program.
    """
    profiles = [
        AgentProfile(id="s1", rank=1, true_utilities={"IITB_CSE": 100.0, "IITD_CSE": 80.0}),
        AgentProfile(id="s2", rank=2, true_utilities={"IITB_CSE": 90.0, "IITD_CSE": 85.0})
    ]
    capacities = {"IITB_CSE": 1, "IITD_CSE": 1}

    # Student 2 tries to invert preferences: puts IITD_CSE first instead of true top IITB_CSE
    result = evaluate_strategic_gain(
        target_student_id="s2",
        all_profiles=profiles,
        capacities=capacities,
        strategic_list=["IITD_CSE", "IITB_CSE"],
        strategic_actions={1: "FLOAT"},
        rounds=1
    )

    # They should not strictly gain over their truthful allocation (IITD_CSE either way)
    assert not result["strictly_profitable"]
    assert result["utility_gain"] <= 0.0

def test_dynamic_float_allows_upgrading_on_exogenous_dropout():
    """
    Shows that floating strictly benefits candidates when upstream candidates withdraw,
    validating the welfare gain of multi-round iterations.
    """
    profiles = [
        AgentProfile(id="s1", rank=1, true_utilities={"P1": 100.0, "P2": 10.0}),
        AgentProfile(id="s2", rank=2, true_utilities={"P1": 100.0, "P2": 50.0})
    ]
    capacities = {"P1": 1, "P2": 1}

    # If s2 freezes on P2 prematurely in round 1, they miss the vacancy left by s1 withdrawing in round 2
    dropouts = {2: {"s1": "WITHDRAW"}}

    result = evaluate_strategic_gain(
        target_student_id="s2",
        all_profiles=profiles,
        capacities=capacities,
        strategic_list=["P2"],  # Artificially committed only to P2
        strategic_actions={1: "FREEZE"},
        dropout_actions=dropouts,
        rounds=2
    )

    # Truthful floating gives s2 program P1 (utility 100), strategic freeze locks P2 (utility 50)
    assert result["truthful_match"] == "P1"
    assert result["strategic_match"] == "P2"
    assert result["utility_gain"] < 0  # Freezing early strictly harmed the candidate
