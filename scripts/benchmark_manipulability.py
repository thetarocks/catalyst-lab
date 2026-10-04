"""
Strategy Manipulation Benchmark (DSIC Audit)
Systematically evaluates strategic deviations (truncations and pairwise swaps)
across synthetic cohorts to verify the empirical dominant-strategy incentive 
compatibility (DSIC) of truthful reporting under Deferred Acceptance.
"""
import copy
from core.market_builder import load_cutoff_data, build_calibrated_market
from core.deferred_acceptance import run_student_proposing_da, Student, Program

def run_market_assignment(students, capacities):
    """Runs a single Gale-Shapley matching instance and returns match dict."""
    prog_copies = {pid: Program(id=pid, capacity=cap) for pid, cap in capacities.items()}
    stud_copies = [copy.deepcopy(s) for s in students]
    run_student_proposing_da(stud_copies, prog_copies)
    return {s.id: s.current_match for s in stud_copies}

def main():
    csv_path = "data/raw/sample_josaa_cutoffs.csv"
    cutoffs = load_cutoff_data(csv_path)
    
    # Generate 60 applicants across calibrated programs
    profiles, capacities = build_calibrated_market(cutoffs, num_students=60, round_no=1)
    
    base_students = [
        Student(
            id=p.id,
            rank=p.rank,
            preferences=sorted(p.true_utilities.keys(), key=lambda k: p.true_utilities[k], reverse=True),
            category=p.category
        )
        for p in profiles
    ]
    
    # 1. Baseline: Truthful Reporting
    truthful_matches = run_market_assignment(base_students, capacities)
    
    print("=" * 60)
    print(" Catalyst Lab: Strategy Manipulation & DSIC Audit")
    print(f" Total Cohort Size: {len(base_students)} candidates")
    print(f" Evaluated Deviations: Truncations & Top-Preference Swaps")
    print("=" * 60)
    
    profitable_deviations = 0
    total_deviations_tested = 0
    
    for idx, target in enumerate(base_students):
        agent_profile = profiles[idx]
        true_pref = list(target.preferences)
        truthful_match = truthful_matches[target.id]
        
        true_utility = agent_profile.true_utilities.get(truthful_match, 0.0) if truthful_match else 0.0
        
        deviations = []
        
        # Deviation Type A: Truncations
        for k in range(1, len(true_pref)):
            deviations.append(true_pref[:k])
            
        # Deviation Type B: Adjacent rank swaps in top 3 choices
        if len(true_pref) >= 2:
            swapped_1_2 = list(true_pref)
            swapped_1_2[0], swapped_1_2[1] = swapped_1_2[1], swapped_1_2[0]
            deviations.append(swapped_1_2)
            
        if len(true_pref) >= 3:
            swapped_2_3 = list(true_pref)
            swapped_2_3[1], swapped_2_3[2] = swapped_2_3[2], swapped_2_3[1]
            deviations.append(swapped_2_3)
            
        for dev_pref in deviations:
            total_deviations_tested += 1
            
            perturbed_cohort = []
            for s in base_students:
                if s.id == target.id:
                    s_dev = copy.deepcopy(s)
                    s_dev.preferences = list(dev_pref)
                    perturbed_cohort.append(s_dev)
                else:
                    perturbed_cohort.append(copy.deepcopy(s))
                    
            dev_matches = run_market_assignment(perturbed_cohort, capacities)
            dev_match = dev_matches[target.id]
            dev_utility = agent_profile.true_utilities.get(dev_match, 0.0) if dev_match else 0.0
            
            if dev_utility > true_utility:
                profitable_deviations += 1
                print(f"[VIOLATION] Student {target.id} improved from {truthful_match} to {dev_match}!")
                
    manipulation_rate = (profitable_deviations / total_deviations_tested) * 100
    
    print(f"\nAudit Summary:")
    print(f" - Deviations Tested:      {total_deviations_tested}")
    print(f" - Profitable Deviations:  {profitable_deviations}")
    print(f" - Empirical Gain Rate:    {manipulation_rate:.2f}%")
    print(f" - Theoretical Prediction: 0.00% (Weak DSIC)")
    
    if profitable_deviations == 0:
        print("\nAudit Verdict: Gale-Shapley Student-Proposing DA is EMPIRICALLY UNMANIPULABLE.")
    else:
        print("\nAudit Verdict: Manipulability detected. Check quota constraints or implementation invariants.")

if __name__ == "__main__":
    main()
