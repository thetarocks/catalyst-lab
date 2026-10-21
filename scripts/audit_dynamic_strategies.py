"""Paired two-round Freeze/Float counterfactuals under sampled upstream withdrawals."""
import argparse
import json
import random
from pathlib import Path
from core.agents import evaluate_strategic_gain
from core.market_builder import load_cutoff_data, build_calibrated_market
from core.deferred_acceptance import Program
from core.josaa_engine import JoSAAStudent, simulate_multi_round_josaa
from scripts.benchmark_manipulability import source_hashes


def run_audit(num_trials=50, seed=1337):
    if num_trials < 1:
        raise ValueError('At least one trial is required')
    rng = random.Random(seed)
    profiles, capacities = build_calibrated_market(load_cutoff_data('data/raw/sample_josaa_cutoffs.csv'),num_students=80,round_no=1)
    students = [JoSAAStudent(id=p.id,rank=p.rank,preferences=list(p.true_order),institute_pref=p.institute_map) for p in profiles]
    programs = {pid: Program(id=pid,capacity=cap) for pid,cap in capacities.items()}
    simulate_multi_round_josaa(students,programs,{},max_rounds=1)
    target = next((s for s in students if s.current_match and s.preferences.index(s.current_match)>0),None)
    if target is None:
        raise ValueError('This cohort has no allocated applicant below their first choice')
    profile = next(p for p in profiles if p.id == target.id)
    upstream = [s.id for s in students if s.rank<target.rank and s.current_match]
    if not upstream:
        raise ValueError('No eligible upstream withdrawals')
    count = min(len(upstream),max(1,int(.15*len(upstream))))
    trials = []
    for index in range(num_trials):
        withdrawn = sorted(rng.sample(upstream,k=count))
        result = evaluate_strategic_gain(target.id,profiles,capacities,list(profile.true_order),
                                        strategic_actions={1:'FREEZE'},dropout_actions={2:{sid:'WITHDRAW' for sid in withdrawn}},rounds=2)
        # FREEZE is selected for the end of round 1. Both worlds share the same
        # initial allocation and identical withdrawals before round 2.
        float_match,freeze_match = result['truthful_match'],result['strategic_match']
        preference = list(profile.true_order)
        float_rank = preference.index(float_match)+1 if float_match else len(preference)+1
        freeze_rank = preference.index(freeze_match)+1 if freeze_match else len(preference)+1
        trials.append({'trial':index+1,'withdrawn':withdrawn,'float_match':float_match,'freeze_match':freeze_match,
                       'float_preference_rank':float_rank,'freeze_preference_rank':freeze_rank,
                       'missed_preference_tiers':max(0,freeze_rank-float_rank),
                       'float_utility_advantage':-result['utility_gain']})
    missed = sum(t['float_utility_advantage']>1e-9 for t in trials)
    return {'schema_version':1,'audit':'dynamic_freeze_float','seed':seed,'candidates':len(profiles),'programs':len(capacities),
            'paired_trials':num_trials,'rounds_per_world':2,'worlds_per_trial':2,'assignment_runs':1+4*num_trials,
            'target_id':target.id,'target_rank':target.rank,'initial_match':target.current_match,
            'eligible_upstream':len(upstream),'withdrawals_per_trial':count,
            'trials_with_missed_upgrade':missed,'conditional_missed_upgrade_pct':100*missed/num_trials,
            'scope':'One selected applicant (the first allocated below their top choice), one synthetic OPEN-category cohort, and fixed-size sampled upstream withdrawals. This conditional two-round counterfactual is not a population regret rate, quota-specific finding, or Round-4 policy recommendation.',
            'source_sha256':source_hashes(),'trials':trials}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--json',type=Path)
    args = parser.parse_args()
    result = run_audit()
    print(json.dumps({k:v for k,v in result.items() if k!='trials'},indent=2))
    if args.json:
        args.json.parent.mkdir(parents=True,exist_ok=True)
        args.json.write_text(json.dumps(result,indent=2)+'\n')

if __name__ == '__main__':
    main()
