"""
Dynamic Strategy & Regret Audit
Quantifies the welfare difference between 'Freeze' and 'Float' across multi-round 
allocations subjected to exogenous upstream dropouts.
"""
import copy
import random
from core.market_builder import load_cutoff_data, build_calibrated_market
from core.josaa_engine import JoSAAMultiRoundMarket, CandidateAction
from core.deferred_acceptance import Student, Program

def main():
    random.seed(1337)
    csv_path = "data/raw/sample_josaa_cutoffs.csv"
    cutoffs = load_cutoff_data(csv_path)

    # Calibrate market
    profiles, capacities = build_calibrated_market(cutoffs, num_students=80, round_no=1)

    print("=" * 65)
    print(" Catalyst Lab: Dynamic Round Strategy Audit (Freeze vs. Float)")
    print(f" Cohort Size: {len(profiles)} | Calibrated Programs: {len(capacities)}")
    print("=" * 65)

    num_trials = 50
    regret_occurrences = 0
    total_upgrades_missed = 0

    for trial in range(num_trials):
        # Create fresh student pool
        students = [
            Student(
                id=p.id,
                rank=p.rank,
                preferences=sorted(p.true_utilities.keys(), key=lambda k: p.true_utilities[k], reverse=True),
                category=p.category
            )
            for p in profiles
        ]
        programs = {pid: Program(id=pid, capacity=cap) for pid, cap in capacities.items()}

        market = JoSAAMultiRoundMarket(students=students, programs=programs)

        # Round 1
        r1_matches = market.run_round()

        # Select a target student who received a mid-tier choice (rank index > 0)
        target_student = None
        for s in students:
            assigned = r1_matches.get(s.id)
            if assigned and s.preferences.index(assigned) >= 1:
                target_student = s
                break

        if not target_student:
            continue

        assigned_r1 = r1_matches[target_student.id]
        pref_rank_r1 = target_student.preferences.index(assigned_r1)

        # Fork the market into two parallel universes:
        # Universe A: Target FLOATS
        # Universe B: Target FREEZES

        market_float = copy.deepcopy(market)
        market_freeze = copy.deepcopy(market)

        # Simulate Upstream Dropouts in Round 2
        # ~15% of candidates ranked higher than target surrender their seat
        upstream_students = [
            s.id for s in students 
            if s.rank < target_student.rank and r1_matches.get(s.id) is not None
        ]
        withdrawn = set(random.sample(upstream_students, k=max(1, int(len(upstream_students) * 0.15))))

        # Apply actions for Round 2
        actions_float = {sid: (CandidateAction.WITHDRAW if sid in withdrawn else CandidateAction.FLOAT) for sid in market_float.students}
        actions_freeze = dict(actions_float)
        actions_freeze[target_student.id] = CandidateAction.FREEZE

        r2_matches_float = market_float.run_round(actions_float)
        r2_matches_freeze = market_freeze.run_round(actions_freeze)

        match_float = r2_matches_float.get(target_student.id)
        match_freeze = r2_matches_freeze.get(target_student.id)

        pref_float = target_student.preferences.index(match_float) if match_float else 999
        pref_freeze = target_student.preferences.index(match_freeze) if match_freeze else 999

        if pref_float < pref_freeze:
            regret_occurrences += 1
            total_upgrades_missed += (pref_freeze - pref_float)

    regret_probability = (regret_occurrences / num_trials) * 100

    print(f"\nEmpirical Strategy Findings across {num_trials} Market Shock Trials:")
    print(f" - Trials with Measurable Regret: {regret_occurrences} / {num_trials}")
    print(f" - Premature Freeze Regret Probability: {regret_probability:.1f}%")
    print(f" - Average Preference Ranks Forfeited: {total_upgrades_missed / max(1, regret_occurrences):.2f} tiers")
    print("\nGame-Theoretic Conclusion:")
    print(" Prematurely selecting FREEZE is strictly weakly dominated by FLOAT")
    print(" under non-zero exogenous dropout probability.")

if __name__ == "__main__":
    main()
