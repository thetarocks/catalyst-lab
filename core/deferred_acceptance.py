"""
Deferred Acceptance Engine (Gale-Shapley Student-Proposing)
Serves as the theoretical baseline for market matching.
"""
from dataclasses import dataclass, field
from typing import List, Dict, Optional

@dataclass
class Student:
    id: str
    rank: int  # Strictly ordered rank (1 is best)
    preferences: List[str]  # Ordered list of program IDs
    category: str = "OPEN"
    current_match: Optional[str] = None
    next_proposal_idx: int = 0

    def get_next_proposal(self) -> Optional[str]:
        if self.next_proposal_idx < len(self.preferences):
            choice = self.preferences[self.next_proposal_idx]
            self.next_proposal_idx += 1
            return choice
        return None

@dataclass
class Program:
    id: str
    capacity: int
    matched_students: List[Student] = field(default_factory=list)

    def accepts(self, applicant: Student) -> Optional[Student]:
        pool = self.matched_students + [applicant]
        pool.sort(key=lambda s: s.rank)

        if len(pool) <= self.capacity:
            self.matched_students = pool
            applicant.current_match = self.id
            return None

        retained = pool[:self.capacity]
        rejected = pool[self.capacity:]
        self.matched_students = retained

        for rej in rejected:
            rej.current_match = None

        return rejected[0]


def run_student_proposing_da(
    students: List[Student], 
    programs: Dict[str, Program]
) -> Dict[str, List[str]]:
    # Use a list queue to maintain deterministic order and avoid set-hashability issues
    free_students: List[Student] = list(students)

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
            free_students.append(rejected)

    return {pid: [s.id for s in prog.matched_students] for pid, prog in programs.items()}
