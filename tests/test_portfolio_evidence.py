"""Keep published scale and timing metadata tied to the archived sources."""
import hashlib
import json
from pathlib import Path


def test_portfolio_metadata_and_runtime_source_fingerprints():
    root = Path(__file__).resolve().parents[1]
    source = root / 'evidence/arbitrum-proposals.json'
    proposals = json.loads(source.read_text())
    summary = json.loads((root / 'site/evidence/arbitrum-manifest-summary.json').read_text())
    assert summary['source_sha256'] == hashlib.sha256(source.read_bytes()).hexdigest()
    assert summary['proposals'] == len(proposals) == 15
    assert summary['reported_vote_count_total'] == sum(p['votes'] for p in proposals) == 866320
    assert summary['proposal_score_min'] == min(p['scores_total'] for p in proposals)
    assert summary['proposal_score_max'] == max(p['scores_total'] for p in proposals)
    timing = json.loads((root / 'evidence/runtime.json').read_text())
    for workload in timing['workloads'].values():
        assert len(workload['samples_ms']) == 5
        for name, digest in workload['source_sha256'].items():
            assert hashlib.sha256((root / name).read_bytes()).hexdigest() == digest
