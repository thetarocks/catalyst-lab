import {mountQuickPreview} from './quick-preview.mjs';
const market=document.querySelector('.landing-market-preview');
if(market) mountQuickPreview(market);
const reduce=matchMedia('(prefers-reduced-motion: reduce)');
const n=x=>Number(x).toLocaleString('en-US',{maximumFractionDigits:2});
const stage=document.querySelector('#da-stage');
if(stage){let action='FLOAT';
 const draw=()=>{const t=Number(stage.value),floats=action==='FLOAT',next=t===2?(floats?'P1':'P2'):'P2';
  document.querySelector('#da-stage-value').textContent=['Round 1','A withdraws','Round 2'][t];
  document.querySelector('#da-insight').textContent=t===0?'A holds the preferred seat P1. B holds P2. Both prefer P1.':t===1?'A withdraws, so P1 becomes vacant. B’s next outcome depends on their earlier decision.':floats?'B floats into the vacated first-choice seat P1. P2 is released.':'B froze P2. P1 is vacant, but B no longer competes for the upgrade.';
  document.querySelector('#da-diagram').innerHTML=`<title>${t===2?'After withdrawal':'Initial allocation'}: B ${t===2&&floats?'upgrades to P1':'holds P2'}</title><defs><marker id="mini-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0L10 5L0 10Z" fill="#92a67e"/></marker></defs><rect x="23" y="28" width="144" height="55" rx="10" fill="${t?'#34483a':'#d7ff3f'}"/><rect x="23" y="123" width="144" height="55" rx="10" fill="#d7ff3f"/><rect x="380" y="28" width="144" height="55" rx="10" fill="${next==='P1'?'#d7ff3f':'#34483a'}"/><rect x="380" y="123" width="144" height="55" rx="10" fill="${next==='P2'?'#d7ff3f':'#34483a'}"/>${!t?'<path d="M168 55H373" stroke="#92a67e" stroke-width="3" marker-end="url(#mini-arrow)"/>':''}<path class="flow-path" d="M168 150 C260 150 290 ${next==='P1'?55:150} 373 ${next==='P1'?55:150}" stroke="#d7ff3f" stroke-width="3" fill="none" marker-end="url(#mini-arrow)"/><g font-family="Arial,sans-serif" font-size="15" text-anchor="middle"><text x="95" y="62" fill="${t?'#c7d4bc':'#172b24'}">A ${t?'· withdrew':'· rank 1'}</text><text x="95" y="157" fill="#172b24">B · rank 2</text><text x="452" y="62" fill="${next==='P1'?'#172b24':'#c7d4bc'}">P1 · first choice</text><text x="452" y="157" fill="${next==='P2'?'#172b24':'#c7d4bc'}">P2 · held seat</text></g>`;
  if(!reduce.matches)document.querySelector('.flow-path')?.animate?.([{opacity:.25},{opacity:1}],{duration:350});
 };
 document.querySelectorAll('[data-action]').forEach(button=>button.addEventListener('click',()=>{action=button.dataset.action;document.querySelectorAll('[data-action]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));draw()}));stage.addEventListener('input',draw);draw();
}
const kInput=document.querySelector('#sybil-k'),gapInput=document.querySelector('#sybil-gap');
if(kInput&&gapInput){const draw=()=>{const k=Number(kInput.value),r=Number(gapInput.value),gain=Math.sqrt(k)-1,kMin=Math.floor((1+r)**2+1e-10)+1,strict=gain-r>1e-10;
 document.querySelector('#sybil-k-value').textContent=`${k} wallets`;
 document.querySelector('#sybil-gap-value').textContent=`${n(r)} × W`;
 document.querySelector('#sybil-insight').textContent=`Weight: ${n(Math.sqrt(k))}× the unsplit weight. Added weight: ${n(gain)} W; opposing lead: ${n(r)} W. ${strict?'Strict reversal in this fixed-tally model.':Math.abs(gain-r)<1e-10?'Exactly on the boundary: a tie is not a strict reversal.':'No strict reversal at this split.'} Minimum strict-reversal split: ${kMin} wallets.`;
 const px=x=>42+(x-1)/63*475,py=y=>179-y/9*150;
 document.querySelector('#sybil-diagram').innerHTML=`<title>Added weight is (sqrt(k) minus 1) W. Current ${k} wallets add ${n(gain)} W against gap ${n(r)} W.</title><path d="M42 20V179H523" fill="none" stroke="#718368"/><path d="${Array.from({length:127},(_,i)=>{const x=1+i*.5;return `${i?'L':'M'}${px(x)},${py(Math.sqrt(x)-1)}`}).join(' ')}" stroke="#d7ff3f" stroke-width="3" fill="none"/><path d="M42 ${py(r)}H523" stroke="#fa9271" stroke-width="2" stroke-dasharray="6 6"/><circle cx="${px(k)}" cy="${py(gain)}" r="7" fill="${strict?'#d7ff3f':'#f4f1e9'}" stroke="#172b24" stroke-width="2"/><g fill="#cad6bf" font-family="Arial,sans-serif" font-size="11"><text x="42" y="200">1 wallet</text><text x="460" y="200">64 wallets</text><text x="50" y="18">Added weight / W</text><text x="380" y="${Math.max(16,py(r)-10)}">Opposing lead ${n(r)} W</text></g>`;
 };kInput.addEventListener('input',draw);gapInput.addEventListener('input',draw);draw();
}
