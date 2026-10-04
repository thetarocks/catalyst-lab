"""
Vertical Reservation Interleaving Engine
Models dual-quota allocation (OPEN merit vs. Reserved categories) adhering to 
the Indra Sawhney principle and Sönmez-Yenmez framework.
"""
from dataclasses import dataclass, field
from typing import List, Dict, Optional, Tuple
from core.deferred_acceptance import Student

@dataclass
class QuotaProgram:
    id: str
    open_capacity: int
    reserved_capacities: Dict[str, int] = field(default_factory=dict) # e.g. {"OBC": 2, "SC": 1}
    
    # Internal state of tentatively held students
    matched_open: List[Student] = field(default_factory=list)
    matched_reserved: Dict[str, List[Student]] = field(default_factory=dict)

    def __post_init__(self):
        for cat in self.reserved_capacities:
            if cat not in self.matched_reserved:
                self.matched_reserved[cat] = []

    def total_capacity(self) -> int:
        return self.open_capacity + sum(self.reserved_capacities.values())

    def accepts(self, student: Student) -> Optional[Student]:
        """
        Attempts to allocate student to OPEN seat first (merit-first rule).
        If rejected from OPEN, attempts category reserved seat if eligible.
        Returns the rejected student if displaced, or the student themselves if rejected.
        """
        # 1. Try OPEN seat first (evaluated strictly by general merit rank)
        open_pool = sorted(self.matched_open + [student], key=lambda s: s.rank)
        retained_open = open_pool[:self.open_capacity]
        rejected_from_open = open_pool[self.open_capacity:]

        if student in retained_open:
            self.matched_open = retained_open
            # If an incumbent student was displaced from OPEN, they must try category quota
            if rejected_from_open:
                displaced = rejected_from_open[0]
                return self._try_reserve_seat(displaced)
            return None
        
        # 2. If rejected from OPEN, try Category seat (if applicable)
        return self._try_reserve_seat(student)

    def _try_reserve_seat(self, student: Student) -> Optional[Student]:
        cat = student.category
        if cat == "OPEN" or cat not in self.reserved_capacities:
            return student  # Not eligible for reserved seats

        cap = self.reserved_capacities[cat]
        res_pool = sorted(self.matched_reserved[cat] + [student], key=lambda s: s.rank)
        retained_res = res_pool[:cap]
        rejected_from_res = res_pool[cap:]

        self.matched_reserved[cat] = retained_res

        if student in retained_res:
            return rejected_from_res[0] if rejected_from_res else None
        else:
            return student


def run_reservation_da(
    students: List[Student],
    programs: Dict[str, QuotaProgram]
) -> Dict[str, Dict[str, List[str]]]:
    """
    Executes Student-Proposing Deferred Acceptance with Quota Interleaving.
    Returns: {program_id: {"OPEN": [ids...], "CATEGORY_NAME": [ids...]}}
    """
    free_students = list(students)

    while free_students:
        student = free_students.pop(0)
        target_program_id = student.get_next_proposal()

        if target_program_id is None:
            continue

        program = programs.get(target_program_id)
        if not program:
            free_students.append(student)
            continue

        rejected = program.accepts(student)

        if rejected is None:
            pass
        elif rejected == student:
            free_students.append(student)
        else:
            rejected.current_match = None
            free_students.append(rejected)

    # Compile final assignments
    results = {}
    for pid, p in programs.items():
        results[pid] = {
            "OPEN": [s.id for s in p.matched_open],
            **{cat: [s.id for s in p.matched_reserved[cat]] for cat in p.reserved_capacities}
        }
    return results
