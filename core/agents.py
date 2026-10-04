"""
Agent Behavior and Strategic Perturbation Layer
Generates student profiles and evaluates welfare deviations under strategic misreporting.
"""
from dataclasses import dataclass
from typing import List, Dict, Tuple
from core.deferred_acceptance import Program
from core.josaa_engine import JoSAAStudent, simulate_multi_round_josaa, ActionType

@dataclass
class AgentProfile:
    id: str
    rank: int
    true_utilities: Dict[str, float]  # Quantitative utility score per program
    category: str = "OPEN"
    institute_map: Dict[str, str] = None

    @property
    def true_order(self) -> List[str]:
        """Strict linear ordering based on true utilities."""
        return sorted(self.true_utilities.keys(), key=lambda p: self.true_utilities[p], reverse=True)


def evaluate_strategic_gain(
    target_student_id: str,
    all_profiles: List[AgentProfile],
    capacities: Dict[str, int],
    strategic_list: List[str],
    strategic_actions: Dict[int, ActionType],
    dropout_actions: Dict[int, Dict[str, ActionType]] = None,
    rounds: int = 3
) -> Dict[str, any]:
    """
    Compares outcome of truthful reporting vs. a strategic deviation for target_student_id.
    Returns: utility delta, final matches under both regimes, and whether deviation was strictly profitable.
    """
    if dropout_actions is None:
        dropout_actions = {}

    target_profile = next(p for p in all_profiles if p.id == target_student_id)

    # 1. Truthful baseline run
    truthful_students = []
    for p in all_profiles:
        inst_map = p.institute_map if p.institute_map else {}
        truthful_students.append(
            JoSAAStudent(
                id=p.id,
                rank=p.rank,
                preferences=list(p.true_order),
                category=p.category,
                institute_pref=inst_map,
                action="FLOAT"
            )
        )

    truthful_programs = {pid: Program(id=pid, capacity=cap) for pid, cap in capacities.items()}
    truthful_history = simulate_multi_round_josaa(
        truthful_students, truthful_programs, dropout_actions, max_rounds=rounds
    )

    final_truthful_match = next((s.current_match for s in truthful_students if s.id == target_student_id), None)
    truthful_utility = target_profile.true_utilities.get(final_truthful_match, 0.0)

    # 2. Counterfactual strategic run
    strategic_students = []
    for p in all_profiles:
        inst_map = p.institute_map if p.institute_map else {}
        if p.id == target_student_id:
            strategic_students.append(
                JoSAAStudent(
                    id=p.id,
                    rank=p.rank,
                    preferences=list(strategic_list),
                    category=p.category,
                    institute_pref=inst_map,
                    action=strategic_actions.get(1, "FLOAT")
                )
            )
        else:
            strategic_students.append(
                JoSAAStudent(
                    id=p.id,
                    rank=p.rank,
                    preferences=list(p.true_order),
                    category=p.category,
                    institute_pref=inst_map,
                    action="FLOAT"
                )
            )

    combined_actions = {}
    for r in range(1, rounds + 1):
        combined_actions[r] = {}
        if r in dropout_actions:
            combined_actions[r].update(dropout_actions[r])
        if r in strategic_actions and target_student_id:
            combined_actions[r][target_student_id] = strategic_actions[r]

    strategic_programs = {pid: Program(id=pid, capacity=cap) for pid, cap in capacities.items()}
    strategic_history = simulate_multi_round_josaa(
        strategic_students, strategic_programs, combined_actions, max_rounds=rounds
    )

    final_strategic_match = next((s.current_match for s in strategic_students if s.id == target_student_id), None)
    strategic_utility = target_profile.true_utilities.get(final_strategic_match, 0.0)

    delta_u = strategic_utility - truthful_utility

    return {
        "truthful_match": final_truthful_match,
        "truthful_utility": truthful_utility,
        "strategic_match": final_strategic_match,
        "strategic_utility": strategic_utility,
        "utility_gain": delta_u,
        "strictly_profitable": delta_u > 1e-9
    }
