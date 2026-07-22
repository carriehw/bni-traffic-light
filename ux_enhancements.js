(function(){
'use strict';
const scoreDefs=[
 ['培訓','training_score',10],['出席','absence_score',15],['準時','lateness_score',10],['1-2-1','one_to_one_score',10],['引薦','referral_score',20],['生意額','biz_give_score',15],['嘉賓','visitor_score',20]
];
const safe=n=>Number(n)||0;
const signed=n=>`${n>=0?'+':''}${n}`;
function deltaClass(n){return n>=0?'up':'down'}
function trendData(name){return memberHistory(name)}
window.renderTrend=function(name){
 const host=$('trendView');
 if(!name){host.innerHTML='<p class="muted">請先選擇會員。</p>';return}
 const hist=trendData(name);
 if(!hist.length){host.innerHTML='<p class="muted">找不到紀錄。</p>';return}
 const latest=hist[0].score,prev=hist[1]?.score||null,oldest=hist[hist.length-1].score;
 const monthDelta=prev?safe(latest.total_score)-safe(prev.total_score):null;
 const periodDelta=safe(latest.total_score)-safe(oldest.total_score);
 const months=hist.map(({batch,score},i)=>`<div class="trend-month-card"><small>${esc(batch.period_end.slice(0,7))}</small><div class="month-score">${safe(score.total_score)}</div><span class="pill" style="background:${color(score.light)}">${label(score.light)}</span>${i<hist.length-1?`<div class="compare delta ${deltaClass(safe(score.total_score)-safe(hist[i+1].score.total_score))}">${signed(safe(score.total_score)-safe(hist[i+1].score.total_score))} vs 上月</div>`:''}</div>`).join('');
 const metricCards=scoreDefs.map(([title,key,max])=>{
   const current=safe(latest[key]),before=prev?safe(prev[key]):null,diff=before===null?null:current-before,pct=Math.max(0,Math.min(100,current/max*100));
   return `<div class="trend-metric"><div class="trend-metric-head"><b>${title}</b><strong>${current}<small>／${max}</small></strong></div>${diff===null?'<div class="compare">未有上月資料</div>':`<div class="compare delta ${deltaClass(diff)}">較上月 ${signed(diff)} 分</div>`}<div class="mini-bar"><span style="width:${pct}%"></span></div></div>`;
 }).join('');
 const rows=hist.map(({batch,score})=>`<tr><td>${batch.period_end.slice(0,7)}</td><td><b>${safe(score.total_score)}</b></td><td><span class="pill" style="background:${color(score.light)}">${label(score.light)}</span></td>${scoreDefs.map(([,key])=>`<td>${safe(score[key])}</td>`).join('')}</tr>`).join('');
 host.innerHTML=`
 <div class="trend-hero">
   <div class="trend-hero-card primary"><small>最新表現 · ${esc(hist[0].batch.period_end.slice(0,7))}</small><strong>${safe(latest.total_score)} 分</strong><span>${label(latest.light)}</span></div>
   <div class="trend-hero-card"><small>較上月</small><strong class="delta ${monthDelta===null?'':deltaClass(monthDelta)}">${monthDelta===null?'—':signed(monthDelta)}</strong></div>
   <div class="trend-hero-card"><small>整段期間</small><strong class="delta ${deltaClass(periodDelta)}">${signed(periodDelta)}</strong></div>
   <div class="trend-hero-card"><small>已有紀錄</small><strong>${hist.length} 個月</strong></div>
 </div>
 <h3>月份走勢</h3><div class="trend-months">${months}</div>
 <h3>七項表現</h3><div class="trend-metrics">${metricCards}</div>
 <details class="details-panel"><summary>查看完整月份數據表</summary><div class="scroll-hint">手機可左右滑動；月份及總分會固定顯示。</div><div class="table-wrap"><table class="sticky-table"><tr><th>月份</th><th>總分</th><th>燈號</th>${scoreDefs.map(x=>`<th>${x[0]}</th>`).join('')}</tr>${rows}</table></div></details>`;
};
window.renderBatchHistory=function(){
 const host=$('batchHistory');
 if(!data.batches.length){host.innerHTML='<p class="muted">未有月份紀錄。</p>';return}
 host.innerHTML=`<div class="timeline-list">${data.batches.map((b,i)=>`<div class="timeline-item ${i===0?'latest':''}"><div><b>${b.period_end.slice(0,7)}</b><div class="timeline-meta">${i===0?'最新月份':'歷史紀錄'}</div></div><div><b>${b.member_count} 位會員</b><div class="timeline-meta">${esc(b.source_filename)}</div></div><div class="timeline-meta">${b.published_at?new Date(b.published_at).toLocaleString('zh-HK'):''}</div></div>`).join('')}</div>`;
};
const oldShow=window.showMember;
if(typeof oldShow==='function')window.showMember=function(m){oldShow(m);setTimeout(()=>{
 const list=$('detail')?.querySelector('.tips');
 if(!list)return;
 const items=[...list.querySelectorAll('li')];
 if(!items.length)return;
 list.outerHTML=`<div class="tips-block">${items.map((li,i)=>{const match=li.textContent.match(/\(\+(\d+)分\)/);return `<div class="action-tip"><span class="action-number">${i+1}</span><div>${esc(li.textContent)}</div>${match?`<span class="action-gain">+${match[1]}分</span>`:''}</div>`}).join('')}</div>`;
 },0)};
})();
