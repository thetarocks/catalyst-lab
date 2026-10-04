"""
JoSAA Multi-Round Simulation Engine
Models round-by-round dynamics under Freeze, Float, Slide, and Withdrawal actions.
"""
from dataclasses import dataclass, field
from typing import List, Dict, Optional, Literal
from core.deferred_acceptance import Student, Program, run_student_proposing_da

ActionType = Literal["FREEZE", "FLOAT", "SLIDE", "WITHDRAW"]

@dataclass
class JoSAAStudent(Student):
    institute_pref: Dict[str, str] = field(default_factory=dict)  # program_id -> institute_id
    action: ActionType = "FLOAT"
    locked_seat: Optional[str] = None

    def filter_preferences_for_next_round(self, current_seat: str) -> List[str]:
        """
        Truncates preference list according to JoSAA rules before the next round runs.
        """
        if current_seat not in self.preferences:
            return self.preferences

        current_idx = self.preferences.index(current_seat)
        better_choices = self.preferences[:current_idx]

        if self.action == "FREEZE":
            return [current_seat]
        elif self.action == "FLOAT":
            # Upgrades allowed to any higher preference, retaining current seat as safety
            return better_choices + [current_seat]
        elif self.action == "SLIDE":
            # Upgrades only allowed within the same institute
            current_inst = self.institute_pref.get(current_seat)
            slide_choices = [
                p for p in better_choices 
                if self.institute_pref.get(p) == current_inst
            ]
            return slide_choices + [current_seat]
        elif self.action == "WITHDRAW":
            return []
        return self.preferences


def simulate_multi_round_josaa(
    students: List[JoSAAStudent],
    programs: Dict[str, Program],
    student_actions_per_round: Dict[int, Dict[str, ActionType]],
    max_rounds: int = 3
) -> List[Dict[str, List[str]]]:
    """
    Executes sequential JoSAA rounds, carrying over commitments and handling vacancy chains.
    """
    round_history = []

    for round_num in range(1, max_rounds + 1):
        # Reset matched pools for the round calculation
        for p in programs.values():
            p.matched_students = []

        # Reset candidate proposal pointers
        for s in students:
            s.next_proposal_idx = 0
            s.current_match = None

        # Apply action overrides if specified for this round
        if round_num in student_actions_per_round:
            for s_id, act in student_actions_per_round[round_num].items():
                target_s = next((s for s in students if s.id == s_id), None)
                if target_s:
                    target_s.action = act

        # Filter active applicants (exclude candidates who withdrew)
        active_students = [s for s in students if s.action != "WITHDRAW"]

        # Run allocation for current round
        round_allocation = run_student_proposing_da(active_students, programs)
        round_history.append(round_allocation)

        # Update preferences for the next round based on choices
        if round_num < max_rounds:
            for s in active_students:
                matched_seat = s.current_match
                if matched_seat:
                    s.preferences = s.filter_preferences_for_next_round(matched_seat)

    return round_history
