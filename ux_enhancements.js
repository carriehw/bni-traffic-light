(function(){
'use strict';
const scoreDefs=[
 ['培訓','training_score',10],['出席','absence_score',15],['準時','lateness_score',10],['1-2-1','one_to_one_score',10],['引薦','referral_score',20],['生意額','biz_give_score',15],['嘉賓','visitor_score',20]
];
const safe=n=>Number(n)||0;
const signed=n=>`${n>=0?'+':''}${n}`;
const deltaClass=n=>n>0?'up':n<0?'down':'flat';
const trendData=name=>memberHistory(name);
const statusText=score=>score>=75?'已達75分安全目標':score>=70?'已達綠燈門檻':`距離綠燈尚欠 ${70-score} 分`;
const fmt=n=>Number(n).toLocaleString('en-HK',{maximumFractionDigits:3});
const scoreLight=s=>s>=70?'green':s>=50?'yellow':s>=30?'red':'black';
const money=v=>`HK$${Math.round(v||0).toLocaleString('en-HK')}`;
function lineChart(hist){
 const pts=[...hist].reverse(),w=640,h=280,pad=38;
 if(pts.length<2)return '<div class="chart-empty">累積多一個月份後，系統會顯示分數走勢圖。</div>';
 const vals=pts.map(x=>safe(x.score.total_score));
 const min=Math.max(0,Math.min(...vals)-10),max=Math.min(100,Math.max(...vals)+10),range=Math.max(10,max-min);
 const xy=pts.map((x,i)=>({x:pad+i*(w-pad*2)/(pts.length-1),y:h-pad-(safe(x.score.total_score)-min)*(h-pad*2)/range,v:safe(x.score.total_score),m:x.batch.period_end.slice(5,7)}));
 const path=xy.map((p,i)=>`${i?'L':'M'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
 return `<div class="trend-chart" role="img" aria-label="會員月份總分走勢"><svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid meet"><line x1="${pad}" y1="${h-pad}" x2="${w-pad}" y2="${h-pad}" class="chart-axis"/><line x1="${pad}" y1="${pad}" x2="${pad}" y2="${h-pad}" class="chart-axis"/><path d="${path}" class="chart-line"/>${xy.map(p=>`<circle cx="${p.x}" cy="${p.y}" r="5" class="chart-dot"/><text x="${p.x}" y="${Math.max(16,p.y-12)}" text-anchor="middle" class="chart-value">${p.v}</text><text x="${p.x}" y="${h-7}" text-anchor="middle" class="chart-month">${p.m}月</text>`).join('')}</svg></div>`;
}
function referenceScores(m){
 const x=window.trafficMetrics?trafficMetrics(m):{},r={};
 r.training=x.T==null?null:(x.T>=2?10:x.T>=1?5:0);
 r.absence=x.A==null?null:(x.A===0?15:x.A===1?10:x.A===2?5:0);
 r.lateness=x.L==null?null:(x.L===0?10:x.L===1?5:0);
 if(x.week>0&&x.O!=null){r.oneRatio=x.O/x.week;r.one_to_one=r.oneRatio>=1?10:r.oneRatio>.5?5:0}else r.one_to_one=null;
 if(x.week>0&&x.G!=null){r.refRatio=x.G/x.week;r.referral=r.refRatio>=1.5?20:r.refRatio>=1.2?15:r.refRatio>=1?10:r.refRatio>=.75?5:0}else r.referral=null;
 if(x.week>0&&x.V!=null){r.visRatio=x.V/x.week;r.visitor=r.visRatio>=.75?20:r.visRatio>=.5?15:r.visRatio>=.25?10:r.visRatio>=.1?5:0}else r.visitor=null;
 r.biz=x.B==null?null:(x.B>=500000?15:x.B>=200000?10:x.B>=100000?5:0);
 return{x,r};
}
function rawDisplay(title,value,unit){if(value==null)return'未有原始數據';if(title==='生意額')return money(value);return`${fmt(value)}${unit}`}
function auditPanel(m){
 const {x,r}=referenceScores(m);
 const rows=[
  ['培訓',x.T,'次',m.training_score,r.training,'按六個月培訓次數'],
  ['出席',x.A,'次缺席',m.absence_score,r.absence,'按六個月缺席次數'],
  ['準時',x.L,'次遲到',m.lateness_score,r.lateness,'按六個月遲到次數'],
  ['1-2-1',x.O,'次',m.one_to_one_score,r.one_to_one,x.week?`${fmt(x.O||0)} ÷ ${fmt(x.week)} = ${fmt(r.oneRatio||0)}`:'缺少 Week'],
  ['引薦',x.G,'個',m.referral_score,r.referral,x.week?`${fmt(x.G||0)} ÷ ${fmt(x.week)} = ${fmt(r.refRatio||0)}`:'缺少 Week'],
  ['生意額',x.B,'',m.biz_give_score,r.biz,'按六個月 Biz Give'],
  ['嘉賓',x.V,'位',m.visitor_score,r.visitor,x.week?`${fmt(x.V||0)} ÷ ${fmt(x.week)} = ${fmt(r.visRatio||0)}`:'缺少 Week']
 ];
 const mismatch=rows.filter(row=>row[4]!=null&&safe(row[3])!==safe(row[4])).length;
 return `<section class="data-panel audit-panel"><div class="panel-heading"><div><span class="data-badge official">Excel正式數據</span><h3>數據核對模式</h3><p>正式分數以已發布 Excel 為準；參考計算只用作核對，絕不改寫正式紀錄。</p></div><span class="audit-status ${mismatch?'warning':'ok'}">${mismatch?`${mismatch}項需核對`:'計算一致'}</span></div><div class="week-strip"><b>Week</b><strong>${x.week==null?'未能讀取':fmt(x.week)}</strong><span>${x.week==null?'比例項目無法精準核對':`P ${x.P??'—'} + A ${x.A??'—'} + L ${x.L??'—'} + M ${x.M??'—'} + S ${x.S??'—'}`}</span></div><div class="audit-grid">${rows.map(([title,raw,unit,official,reference,formula])=>{const known=reference!=null,match=known&&safe(official)===safe(reference);return `<article class="audit-item ${known&&!match?'mismatch':''}"><div class="audit-title"><b>${title}</b><span class="data-badge official">正式 ${safe(official)}分</span></div><dl><div><dt>原始數據</dt><dd>${rawDisplay(title,raw,unit)}</dd></div><div><dt>計算方式</dt><dd>${esc(formula)}</dd></div><div><dt>參考結果</dt><dd>${known?`${reference}分`:'未能計算'}</dd></div></dl><div class="audit-result ${!known?'unknown':match?'match':'mismatch'}">${!known?'資料不足':match?'與Excel一致':'與Excel不同，請核對'}</div></article>`}).join('')}</div></section>`;
}
function simulatorPanel(m){
 const p=window.precisePlan?precisePlan(m):{actions:[]};
 if(!p.actions.length)return `<section class="data-panel simulator-panel"><div class="panel-heading"><div><span class="data-badge simulation">模擬工具</span><h3>改善模擬器</h3><p>暫時未有可精準模擬嘅下一級行動。正式紀錄不會被修改。</p></div></div></section>`;
 return `<section class="data-panel simulator-panel" data-base-score="${safe(m.total_score)}"><div class="panel-heading"><div><span class="data-badge simulation">模擬結果</span><h3>改善模擬器</h3><p>勾選可行行動，預覽逐項達標後嘅分數。模擬不會修改 Excel 或正式紀錄。</p></div></div><div class="sim-layout"><div class="sim-actions">${p.actions.map(a=>`<label class="sim-action"><input type="checkbox" data-gain="${a.gain}" data-category="${esc(a.category)}"><span><b>${esc(a.category)}</b><small>${esc(a.verb)}${a.unit==='money'?money(a.need):`${fmt(a.need)}${a.unit}`}，由 ${a.currentScore}分升至 ${a.targetScore}分</small></span><strong>+${a.gain}分</strong></label>`).join('')}</div><aside class="sim-result"><small>目前正式分數</small><b>${safe(m.total_score)}分</b><div class="sim-arrow">↓</div><small>模擬預計分數</small><strong class="sim-score">${safe(m.total_score)}分</strong><span class="pill sim-light" style="background:${color(m.light)}">${label(m.light)}</span><p class="sim-selected">尚未選擇行動</p></aside></div></section>`;
}
function bindSimulator(host){
 const panel=host.querySelector('.simulator-panel[data-base-score]');if(!panel)return;
 const boxes=[...panel.querySelectorAll('input[type="checkbox"]')],base=safe(panel.dataset.baseScore),scoreEl=panel.querySelector('.sim-score'),lightEl=panel.querySelector('.sim-light'),selected=panel.querySelector('.sim-selected');
 const update=()=>{const chosen=boxes.filter(x=>x.checked),gain=chosen.reduce((n,x)=>n+safe(x.dataset.gain),0),score=Math.min(100,base+gain),light=scoreLight(score);scoreEl.textContent=`${score}分`;lightEl.textContent=label(light);lightEl.style.background=color(light);selected.textContent=chosen.length?`已選：${chosen.map(x=>x.dataset.category).join('、')}（合共 +${gain}分）`:'尚未選擇行動';};
 boxes.forEach(x=>x.addEventListener('change',update));
}
window.renderTrend=function(name){
 const host=$('trendView');
 if(!name){host.innerHTML='<div class="empty-state"><b>未選擇會員</b><span>請先從上方選單選擇一位會員。</span></div>';return}
 const hist=trendData(name);
 if(!hist.length){host.innerHTML='<div class="empty-state"><b>找不到紀錄</b><span>請檢查會員姓名或月份資料。</span></div>';return}
 const latest=hist[0].score,prev=hist[1]?.score||null,oldest=hist[hist.length-1].score;
 const monthDelta=prev?safe(latest.total_score)-safe(prev.total_score):null;
 const periodDelta=safe(latest.total_score)-safe(oldest.total_score);
 const latestScore=safe(latest.total_score);
 const months=hist.map(({batch,score},i)=>`<article class="trend-month-card" aria-label="${esc(batch.period_end.slice(0,7))} 表現"><small>${esc(batch.period_end.slice(0,7))}</small><div class="month-score">${safe(score.total_score)}</div><span class="pill" style="background:${color(score.light)}">${label(score.light)}</span>${i<hist.length-1?`<div class="compare delta ${deltaClass(safe(score.total_score)-safe(hist[i+1].score.total_score))}">${signed(safe(score.total_score)-safe(hist[i+1].score.total_score))} vs 上月</div>`:'<div class="compare">最早紀錄</div>'}</article>`).join('');
 const metricCards=scoreDefs.map(([title,key,max])=>{const current=safe(latest[key]),before=prev?safe(prev[key]):null,diff=before===null?null:current-before,pct=Math.max(0,Math.min(100,current/max*100));return `<article class="trend-metric"><div class="trend-metric-head"><b>${title}</b><strong>${current}<small>／${max}</small></strong></div>${diff===null?'<div class="compare">未有上月資料</div>':`<div class="compare delta ${deltaClass(diff)}">較上月 ${signed(diff)} 分</div>`}<div class="mini-bar" aria-label="${title} ${current} 分，共 ${max} 分"><span style="width:${pct}%"></span></div></article>`;}).join('');
 const rows=hist.map(({batch,score})=>`<tr><td>${batch.period_end.slice(0,7)}</td><td><b>${safe(score.total_score)}</b></td><td><span class="pill" style="background:${color(score.light)}">${label(score.light)}</span></td>${scoreDefs.map(([,key])=>`<td>${safe(score[key])}</td>`).join('')}</tr>`).join('');
 host.innerHTML=`<div class="source-note"><span class="data-badge official">Excel正式數據</span>以下總分、燈號及七項分數均來自每月已發布 Excel。</div><div class="trend-member-title"><div><small class="muted">正在查看</small><h3>${esc(name)}</h3></div><span class="status-chip ${latestScore>=70?'success':'attention'}">${statusText(latestScore)}</span></div><div class="trend-hero"><div class="trend-hero-card primary"><small>最新表現 · ${esc(hist[0].batch.period_end.slice(0,7))}</small><strong>${latestScore} 分</strong><span>${label(latest.light)}</span></div><div class="trend-hero-card"><small>較上月</small><strong class="delta ${monthDelta===null?'':deltaClass(monthDelta)}">${monthDelta===null?'—':signed(monthDelta)}</strong><span>${monthDelta===null?'未有比較資料':monthDelta>0?'表現上升':monthDelta<0?'需要留意':'保持不變'}</span></div><div class="trend-hero-card"><small>整段期間</small><strong class="delta ${deltaClass(periodDelta)}">${signed(periodDelta)}</strong><span>由最早月份至今</span></div><div class="trend-hero-card"><small>已有紀錄</small><strong>${hist.length} 個月</strong><span>可供趨勢比較</span></div></div><section class="trend-section"><div class="section-heading"><div><h3>總分走勢</h3><p>快速睇清整體係進步、持平，定需要跟進。</p></div></div>${lineChart(hist)}</section><section class="trend-section"><div class="section-heading"><div><h3>月份表現</h3><p>由最新月份開始排列。</p></div></div><div class="trend-months">${months}</div></section><section class="trend-section"><div class="section-heading"><div><h3>七項正式得分</h3><p>比較今月同上月各項得分變化。</p></div></div><div class="trend-metrics">${metricCards}</div></section><details class="details-panel"><summary>查看完整月份核對表</summary><div class="scroll-hint">手機可左右滑動；月份及總分會固定顯示。表內全部為Excel正式分數。</div><div class="table-wrap"><table class="sticky-table"><thead><tr><th>月份</th><th>總分</th><th>燈號</th>${scoreDefs.map(x=>`<th>${x[0]}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table></div></details>`;
};
window.renderBatchHistory=function(){const host=$('batchHistory');if(!data.batches.length){host.innerHTML='<div class="empty-state"><b>未有月份紀錄</b><span>首次發布 Excel 後會顯示喺呢度。</span></div>';return}host.innerHTML=`<div class="timeline-list">${data.batches.map((b,i)=>`<article class="timeline-item ${i===0?'latest':''}"><div class="timeline-month"><b>${b.period_end.slice(0,7)}</b><span class="timeline-badge">${i===0?'最新':'歷史'}</span></div><div><b>${b.member_count} 位會員</b><div class="timeline-meta filename" title="${esc(b.source_filename)}">${esc(b.source_filename)}</div></div><time class="timeline-meta">${b.published_at?new Date(b.published_at).toLocaleString('zh-HK'):''}</time></article>`).join('')}</div>`;};
function enhanceUpload(){const drop=document.querySelector('.drop');if(!drop||drop.previousElementSibling?.classList.contains('upload-steps'))return;drop.insertAdjacentHTML('beforebegin','<div class="upload-steps" aria-label="上載流程"><span class="active"><b>1</b>選擇 Excel</span><span><b>2</b>檢查資料</span><span><b>3</b>確認月份</span><span><b>4</b>發布</span></div>');}
function enhanceSearch(){const input=$('search'),list=$('memberList');if(!input||!list||input.parentElement.querySelector('.search-toolbar'))return;input.insertAdjacentHTML('beforebegin','<div class="search-toolbar"><div><b>搜尋會員</b><span id="memberCountText" class="muted"></span></div><button id="clearSearchBtn" class="btn light compact" type="button">清除</button></div>');const update=()=>{const count=list.querySelectorAll('.member').length;const t=$('memberCountText');if(t)t.textContent=`目前顯示 ${count} 位`;};input.addEventListener('input',()=>setTimeout(update,0));$('clearSearchBtn').onclick=()=>{input.value='';input.dispatchEvent(new Event('input'));input.focus();};setTimeout(update,0);}
const oldShow=window.showMember;
if(typeof oldShow==='function')window.showMember=function(m){oldShow(m);setTimeout(()=>{
 const detail=$('detail');if(!detail)return;
 const list=detail.querySelector('.tips');
 if(list){const items=[...list.querySelectorAll('li')];if(items.length)list.outerHTML=`<div class="tips-block">${items.map((li,i)=>{const match=li.textContent.match(/\(\+(\d+)分\)/);return `<article class="action-tip"><span class="action-number">${i+1}</span><div>${esc(li.textContent)}</div>${match?`<span class="action-gain">+${match[1]}分</span>`:''}</article>`}).join('')}</div>`;}
 const firstHeading=[...detail.querySelectorAll('h3')].find(h=>h.textContent.includes('改善建議'));if(firstHeading)firstHeading.textContent='優先加分行動';
 const canvas=detail.querySelector('#memberCard');if(canvas&&!detail.querySelector('.audit-panel')){canvas.insertAdjacentHTML('beforebegin',auditPanel(m)+simulatorPanel(m));bindSimulator(detail);}
 },0)};
const oldRenderAll=window.renderAll;
if(typeof oldRenderAll==='function')window.renderAll=function(){const out=oldRenderAll.apply(this,arguments);setTimeout(()=>{enhanceUpload();enhanceSearch();},0);return out};
setTimeout(()=>{enhanceUpload();enhanceSearch();},0);
})();