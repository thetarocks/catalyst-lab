"""
Category-Aware Seat Allocation Engine
Reflects Indian affirmative action principles: All applicants compete for OPEN seats first,
unsuccessful category applicants then compete for their reserved sub-quotas.
"""
from dataclasses import dataclass, field
from typing import List, Dict, Optional, Set
from core.deferred_acceptance import Student

@dataclass
class QuotaProgram:
    id: str
    quotas: Dict[str, int]  # e.g., {"OPEN": 2, "OBC-NCL": 1, "SC": 1}
    allocations: Dict[str, List[Student]] = field(default_factory=dict)

    def __post_init__(self):
        for category in self.quotas:
            self.allocations[category] = []

    def try_seat(self, student: Student) -> Optional[Student]:
        """
        Attempts to place student in OPEN pool first; if ineligible or displaced,
        attempts reserved category pool. Returns displaced student or student itself if rejected.
        """
        # Step 1: Attempt OPEN quota first (merit-based across all categories)
        open_pool = self.allocations["OPEN"] + [student]
        open_pool.sort(key=lambda s: s.rank)

        if len(open_pool) <= self.quotas.get("OPEN", 0):
            self.allocations["OPEN"] = open_pool
            student.current_match = self.id
            return None

        # Lowest rank in OPEN pool is candidate for de-allocation from OPEN
        retained_open = open_pool[:self.quotas.get("OPEN", 0)]
        bumped = open_pool[self.quotas.get("OPEN", 0):][0]
        self.allocations["OPEN"] = retained_open

        # If student themselves stayed in OPEN, the bumped student must now find a home
        target_to_cascade = bumped if bumped != student else student
        if bumped != student:
            student.current_match = self.id

        # Step 2: If displaced candidate belongs to a reserved category, test reserved pool
        cat = target_to_cascade.category
        if cat != "OPEN" and cat in self.quotas:
            cat_pool = self.allocations[cat] + [target_to_cascade]
            cat_pool.sort(key=lambda s: s.rank)

            if len(cat_pool) <= self.quotas[cat]:
                self.allocations[cat] = cat_pool
                target_to_cascade.current_match = self.id
                return None
            else:
                retained_cat = cat_pool[:self.quotas[cat]]
                rejected_cat = cat_pool[self.quotas[cat]:][0]
                self.allocations[cat] = retained_cat
                rejected_cat.current_match = None
                return rejected_cat

        # Otherwise rejected from the program entirely
        target_to_cascade.current_match = None
        return target_to_cascade
