(function(){
  'use strict';

  const GREEN_TARGET=70;
  const n=v=>{if(v===null||v===undefined||v==='')return null;const x=Number(String(v).replace(/[$,HKD\s]/gi,''));return Number.isFinite(x)?x:null};
  const nk=s=>String(s||'').normalize('NFKC').toLowerCase().replace(/[\s_\-–—:：()（）/\\.]/g,'');
  const rawObject=m=>{let r=m&&m.raw_metrics;if(typeof r==='string'){try{r=JSON.parse(r)}catch{r={}}}return r&&typeof r==='object'?r:{}};
  function rawValue(m,aliases,exactOnly=false){const entries=Object.entries(rawObject(m));for(const a of aliases){const hit=entries.find(([k])=>nk(k)===nk(a));if(hit){const v=n(hit[1]);if(v!==null)return v}}if(exactOnly)return null;for(const a of aliases){const t=nk(a),hit=entries.find(([k])=>!/(得分|score|totalpts|總分)/i.test(String(k))&&(nk(k).startsWith(t)||nk(k).includes(t)));if(hit){const v=n(hit[1]);if(v!==null)return v}}return null}
  function metrics(m){const P=rawValue(m,['P'],true),A=rawValue(m,['A','A缺席','缺席']),L=rawValue(m,['L','L遲到','遲到']),M=rawValue(m,['M'],true),S=rawValue(m,['S'],true),explicitWeek=rawValue(m,['Week','週數','周數']),parts=[P,A,L,M,S];return{P,A,L,M,S,week:explicitWeek!==null?explicitWeek:(parts.every(v=>v!==null)?parts.reduce((a,b)=>a+b,0):null),G:rawValue(m,['G','G引薦','引薦']),V:rawValue(m,['V','V嘉賓','嘉賓']),O:rawValue(m,['1-2-1','121','一對一']),T:rawValue(m,['T','T培訓','培訓']),B:rawValue(m,['Biz Give','BizGive','生意額','生意'])}}
  const ceilThreshold=(rate,week)=>Math.ceil(rate*week-1e-10);
  const money=v=>'HK$'+Math.round(v).toLocaleString('en-HK');
  const fmt=(v,unit)=>unit==='money'?money(v):`${Math.round(v)}${unit}`;

  function buildGroups(m){
    const x=metrics(m),groups=[];
    const add=(category,current,currentScore,unit,verb,levels)=>{const options=levels.map(([target,targetScore])=>({target,targetScore,gain:targetScore-currentScore,need:Math.max(0,target-current)})).filter(o=>o.gain>0&&o.need>0);if(options.length)groups.push({category,current,currentScore,unit,verb,options})};
    if(x.week>0&&x.G!==null)add('引薦',x.G,Number(m.referral_score)||0,'個','增加',[[ceilThreshold(.75,x.week),5],[ceilThreshold(1,x.week),10],[ceilThreshold(1.2,x.week),15],[ceilThreshold(1.5,x.week),20]]);
    if(x.week>0&&x.V!==null)add('嘉賓',x.V,Number(m.visitor_score)||0,'位','增加',[[ceilThreshold(.1,x.week),5],[ceilThreshold(.25,x.week),10],[ceilThreshold(.5,x.week),15],[ceilThreshold(.75,x.week),20]]);
    if(x.week>0&&x.O!==null)add('1-2-1',x.O,Number(m.one_to_one_score)||0,'次','增加',[[Math.floor(.5*x.week)+1,5],[Math.ceil(x.week),10]]);
    if(x.T!==null)add('培訓',x.T,Number(m.training_score)||0,'次','增加',[[1,5],[2,10]]);
    if(x.B!==null)add('生意額',x.B,Number(m.biz_give_score)||0,'money','增加 Biz Give ',[[100000,5],[200000,10],[500000,15]]);
    return{x,groups};
  }

  function optionEffort(group,opt){if(group.unit==='money')return opt.need/100000;return opt.need}
  function greenPath(m){
    const total=Number(m.total_score)||0,gap=Math.max(0,GREEN_TARGET-total),built=buildGroups(m);
    if(!gap)return{...built,total,gap,selected:[],projected:total};
    const candidates=[];
    built.groups.forEach((g,gi)=>g.options.forEach((o,oi)=>candidates.push({g,gi,o,oi,effort:optionEffort(g,o)})));
    let best=null;
    const maxMask=1<<candidates.length;
    if(candidates.length<=18){for(let mask=1;mask<maxMask;mask++){let gain=0,effort=0,count=0,used=new Set(),picked=[];for(let i=0;i<candidates.length;i++)if(mask&(1<<i)){const c=candidates[i];if(used.has(c.gi)){gain=-1;break}used.add(c.gi);gain+=c.o.gain;effort+=c.effort;count++;picked.push(c)}if(gain<gap)continue;const rank=[gain-gap,count,effort];if(!best||rank[0]<best.rank[0]||rank[0]===best.rank[0]&&(rank[1]<best.rank[1]||rank[1]===best.rank[1]&&rank[2]<best.rank[2]))best={rank,picked}}}
    if(!best){const picked=[...candidates].sort((a,b)=>b.o.gain-a.o.gain||a.effort-b.effort);let gain=0;best={picked:[]};for(const c of picked){if(best.picked.some(x=>x.gi===c.gi))continue;best.picked.push(c);gain+=c.o.gain;if(gain>=gap)break}}
    const selected=best.picked.map(c=>({group:c.g,option:c.o}));
    return{...built,total,gap,selected,projected:Math.min(100,total+selected.reduce((s,x)=>s+x.option.gain,0))};
  }

  function groupText(group,gap){
    let opts=group.options.filter(o=>o.gain<=gap);
    const firstEnough=group.options.find(o=>o.gain>=gap);
    if(firstEnough&&!opts.includes(firstEnough))opts.push(firstEnough);
    if(!opts.length)opts=[group.options[0]];
    opts=opts.slice(0,2);
    return `${group.category}：${opts.map(o=>`${group.verb}${fmt(o.need,group.unit)}，可增加${o.gain}分`).join('／')}`;
  }
  function precisePlan(m){
    const p=greenPath(m),selectedCategories=new Set(p.selected.map(x=>x.group.category));
    const ordered=[...p.groups].sort((a,b)=>(selectedCategories.has(b.category)?1:0)-(selectedCategories.has(a.category)?1:0)||Math.max(...b.options.map(o=>o.gain))-Math.max(...a.options.map(o=>o.gain)));
    const actions=ordered.slice(0,3).map(g=>{const chosen=p.selected.find(x=>x.group.category===g.category)?.option||g.options[0];return{category:g.category,gain:chosen.gain,need:chosen.need,current:g.current,target:chosen.target,currentScore:g.currentScore,targetScore:chosen.targetScore,unit:g.unit,verb:g.verb,text:groupText(g,p.gap||5),options:g.options}});
    const missing=[];if(!p.x.week||p.x.G===null)missing.push('引薦');if(!p.x.week||p.x.V===null)missing.push('嘉賓');if(!p.x.week||p.x.O===null)missing.push('1-2-1');if(p.x.T===null)missing.push('培訓');if(p.x.B===null)missing.push('生意額');
    return{actions,metrics:p.x,missing,gap:p.gap,projected:p.projected,selected:p.selected};
  }
  function preciseTips(m){const p=precisePlan(m);if(!p.gap)return['目前已達70分綠燈門檻，請保持現有表現。'];if(!p.actions.length)return[`原始 Excel 欄位不足，未能精準計算綠燈路徑。缺少：${p.missing.join('、')||'可升級項目'}。`];return p.actions.map(a=>a.text)}
  function preciseRecap(m){const p=precisePlan(m),total=Number(m.total_score)||0;if(!p.gap)return `${m.member_name} 本月 ${total} 分，已達綠燈門檻。正式得分及燈號以 Excel 為準。`;if(!p.selected.length)return `${m.member_name} 本月 ${total} 分。原始 Excel 資料不足，暫時無法產生精準綠燈路徑。`;return `${m.member_name} 本月 ${total} 分，需要增加 ${p.gap} 分達到綠燈。完成以上建議組合後，預計可達 ${p.projected} 分。正式結果以之後上載的 Excel 為準。`}
  function refreshMember(m){if(!m)return m;m.improvement_tips=preciseTips(m);m.recap_text=preciseRecap(m);return m}
  window.trafficMetrics=metrics;window.trafficRawObject=rawObject;window.precisePlan=precisePlan;window.makeTips=preciseTips;window.makeRecap=preciseRecap;
  const oldRenderAll=window.renderAll;if(typeof oldRenderAll==='function')window.renderAll=function(){if(window.data&&Array.isArray(data.members))data.members.forEach(refreshMember);return oldRenderAll.apply(this,arguments)};
  const oldShowMember=window.showMember;if(typeof oldShowMember==='function')window.showMember=function(m){return oldShowMember.call(this,refreshMember(m))};
  window.cardSummary=function(m){refreshMember(m);return{tips:(m.improvement_tips||[]).slice(0,3),summary:m.recap_text||preciseRecap(m)}};
  if(window.data&&Array.isArray(data.members))data.members.forEach(refreshMember);
})();