from scripts.benchmark_manipulability import run_audit as static_audit
from scripts.audit_dynamic_strategies import run_audit as dynamic_audit

def test_static_benchmark_counts_actual_deviations():
    result = static_audit()
    assert result['candidates'] == 60
    assert result['deviations_tested'] == 60*((result['programs']-1)+2)
    assert result['deviations_tested'] == 1080
    assert result['profitable_deviations'] == 0

def test_dynamic_benchmark_is_paired_replayable_and_keeps_the_frozen_seat():
    a,b = dynamic_audit(num_trials=8,seed=1337),dynamic_audit(num_trials=8,seed=1337)
    assert a == b
    assert len(a['trials']) == 8
    assert all(t['freeze_match'] == a['initial_match'] for t in a['trials'])
    assert all(t['float_utility_advantage'] >= 0 for t in a['trials'])
    assert a['assignment_runs'] == 33

def test_equal_split_summary_thresholds_are_strict_boundaries():
    import math
    cases=[(4272.48,3992.73,4),(4252.89,16856.83,25),(5192.48,73484.43,230),(3834.53,110816.18,894)]
    for w,g,k in cases:
        assert (math.sqrt(k)-1)*w > g
        assert (math.sqrt(k-1)-1)*w <= g
