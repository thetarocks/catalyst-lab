"""
JoSAA Data Parser & Market Calibration Engine
Converts empirical cutoff tables into calibrated synthetic student preference profiles.
"""
import csv
from dataclasses import dataclass
from typing import List, Dict, Tuple
from core.agents import AgentProfile

@dataclass
class ProgramCutoff:
    institute: str
    program: str
    category: str
    round_no: int
    opening_rank: int
    closing_rank: int

    @property
    def full_name(self) -> str:
        return f"{self.institute} - {self.program}"


def load_cutoff_data(csv_path: str) -> List[ProgramCutoff]:
    records = []
    with open(csv_path, mode="r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            records.append(
                ProgramCutoff(
                    institute=row["institute"].strip(),
                    program=row["program"].strip(),
                    category=row["category"].strip(),
                    round_no=int(row["round"]),
                    opening_rank=int(row["opening_rank"]),
                    closing_rank=int(row["closing_rank"])
                )
            )
    return records


def build_calibrated_market(
    cutoffs: List[ProgramCutoff], 
    num_students: int = 50,
    round_no: int = 1,
    category: str = "OPEN"
) -> Tuple[List[AgentProfile], Dict[str, int]]:
    """
    Constructs a synthetic market where program popularity is inferred
    from empirical closing ranks (revealed preference hierarchy).
    """
    filtered = [c for c in cutoffs if c.round_no == round_no and c.category == category]
    if not filtered:
        raise ValueError("No matching cutoff records found for calibration criteria.")

    # Sort programs by closing rank ascending (stricter cutoff = higher consensus utility)
    filtered.sort(key=lambda c: c.closing_rank)

    # Estimate representative seat capacities from cutoff spreads
    capacities: Dict[str, int] = {}
    institute_map: Dict[str, str] = {}
    for p in filtered:
        # Approximate available capacity proportional to rank band, clamped for small test cohorts
        estimated_cap = max(1, (p.closing_rank - p.opening_rank + 1) // 15)
        capacities[p.full_name] = estimated_cap
        institute_map[p.full_name] = p.institute

    # Derive baseline program utility: higher for lower closing rank
    max_rank = max(p.closing_rank for p in filtered)
    program_base_utilities = {
        p.full_name: float(max_rank - p.closing_rank + 50) for p in filtered
    }

    # Generate synthetic applicant profiles across the merit spectrum
    students: List[AgentProfile] = []
    for rank in range(1, num_students + 1):
        s_id = f"applicant_{rank:03d}"
        
        # Base utility with modest random rank perturbation modeling geographic/branch affinity
        student_utilities: Dict[str, float] = {}
        for prog_name, base_u in program_base_utilities.items():
            # Linear penalty for programs whose opening rank is far out of candidate's reach
            cutoff_obj = next(c for c in filtered if c.full_name == prog_name)
            penalty = 0.0
            if rank > cutoff_obj.closing_rank * 1.3:
                penalty = 200.0  # Reach penalty
            student_utilities[prog_name] = max(0.0, base_u - penalty)

        students.append(
            AgentProfile(
                id=s_id,
                rank=rank,
                true_utilities=student_utilities,
                category=category,
                institute_map=institute_map
            )
        )

    return students, capacities
