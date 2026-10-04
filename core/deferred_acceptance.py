"""
Deferred Acceptance Engine (Gale-Shapley Student-Proposing)
Serves as the theoretical baseline for market matching.
"""
from dataclasses import dataclass, field
from typing import List, Dict, Optional, Set

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
        """
        Attempts to insert applicant into matched pool based purely on merit rank.
        Returns the rejected student if applicant displaced someone, None if accepted smoothly,
        or applicant itself if applicant was rejected.
        """
        pool = self.matched_students + [applicant]
        # Rank-ordered (lower number = better rank)
        pool.sort(key=lambda s: s.rank)

        if len(pool) <= self.capacity:
            self.matched_students = pool
            applicant.current_match = self.id
            return None

        # Over capacity: keep top `capacity`, reject the lowest ranked
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
    """
    Executes standard Student-Proposing Deferred Acceptance.
    Returns: Mapping of program_id -> list of matched student_ids.
    """
    free_students: Set[Student] = set(students)

    while free_students:
        student = free_students.pop()
        target_program_id = student.get_next_proposal()

        if target_program_id is None:
            # Student has exhausted their preference list; remains unallocated
            continue

        program = programs.get(target_program_id)
        if not program:
            # Skip invalid program entries
            free_students.add(student)
            continue

        rejected = program.accepts(student)

        if rejected is None:
            # Applicant was accepted without displacing anyone
            pass
        elif rejected == student:
            # Applicant was outright rejected
            free_students.add(student)
        else:
            # Applicant displaced a lower-ranked student
            free_students.add(rejected)

    return {pid: [s.id for s in prog.matched_students] for pid, prog in programs.items()}
