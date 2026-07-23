(function(){
  'use strict';
  const GREEN_TARGET=70;
  const n=v=>{if(v===null||v===undefined||v==='')return null;const x=Number(String(v).replace(/[$,HKD\s]/gi,''));return Number.isFinite(x)?x:null};
  const nk=s=>String(s||'').normalize('NFKC').toLowerCase().replace(/[\s_\-–—:：()（）/\\.]/g,'');
  const rawObject=m=>{let r=m&&m.raw_metrics;if(typeof r==='string'){try{r=JSON.parse(r)}catch{r={}}}return r&&typeof r==='object'?r:{}};
  function rawValue(m,aliases,exactOnly=false){const entries=Object.entries(rawObject(m));for(const a of aliases){const hit=entries.find(([k])=>nk(k)===nk(a));if(hit){const v=n(hit[1]);if(v!==null)return v}}if(exactOnly)return null;for(const a of aliases){const t=nk(a),hit=entries.find(([k])=>!/(得分|score|totalpts|總分)/i.test(String(k))&&(nk(k).startsWith(t)||nk(k).includes(t)));if(hit){const v=n(hit[1]);if(v!==null)return v}}return null}
  function metrics(m){const P=rawValue(m,['P'],true),A=rawValue(m,['A','A缺席','缺席']),L=rawValue(m,['L','L遲到','遲到']),M=rawValue(m,['M'],true),S=rawValue(m,['S'],true),explicitWeek=rawValue(m,['Week','週數','周數']),parts=[P,A,L,M,S];return{P,A,L,M,S,week:explicitWeek!==null?explicitWeek:(parts.every(v=>v!==null)?parts.reduce((a,b)=>a+b,0):null),G:rawValue(m,['G','G引薦','引薦']),V:rawValue(m,['V','V嘉賓','嘉賓']),O:rawValue(m,['1-2-1','121','一對一','one_to_one','one to one','O']),T:rawValue(m,['T','T培訓','培訓']),B:rawValue(m,['Biz Give','BizGive','biz_give','生意額','生意'])}}
  const scoreDefinitions=[
    {category:'培訓',key:'training_score',max:10,active:true},
    {category:'出席',key:'absence_score',max:15,active:false},
    {category:'準時',key:'lateness_score',max:10,active:false},
    {category:'1-2-1',key:'one_to_one_score',max:10,active:true},
    {category:'引薦',key:'referral_score',max:20,active:true},
    {category:'生意額',key:'biz_give_score',max:15,active:true},
    {category:'嘉賓',key:'visitor_score',max:20,active:true}
  ];
  const officialScore=(m,key)=>Number(m?.[key])||0;
  const componentSum=m=>scoreDefinitions.reduce((sum,d)=>sum+officialScore(m,d.key),0);
  const ceilThreshold=(rate,week)=>Math.ceil(rate*week-1e-10);
  const money=v=>'HK$'+Math.round(v).toLocaleString('en-HK');
  const fmt=(v,unit)=>unit==='money'?money(v):`${Math.round(v)}${unit}`;
  function referenceScores(x){
    return{
      training:x.T===null?null:(x.T>=2?10:x.T>=1?5:0),
      oneToOne:!(x.week>0)||x.O===null?null:(x.O/x.week>=1?10:x.O/x.week>.5?5:0),
      referral:!(x.week>0)||x.G===null?null:(x.G/x.week>=1.5?20:x.G/x.week>=1.2?15:x.G/x.week>=1?10:x.G/x.week>=.75?5:0),
      visitor:!(x.week>0)||x.V===null?null:(x.V/x.week>=.75?20:x.V/x.week>=.5?15:x.V/x.week>=.25?10:x.V/x.week>=.1?5:0),
      biz:x.B===null?null:(x.B>=500000?15:x.B>=200000?10:x.B>=100000?5:0)
    };
  }
  function buildGroups(m){
    const x=metrics(m),refs=referenceScores(x),groups=[],unavailable=[];
    const add=(category,current,currentScore,maxScore,unit,verb,levels,reference)=>{
      if(currentScore>=maxScore)return;
      if(current===null||current===undefined){unavailable.push({category,reason:'缺少原始數據'});return}
      if(reference===null){unavailable.push({category,reason:'缺少 Week 或必要原始數據'});return}
      if(reference!==currentScore){unavailable.push({category,reason:`原始數據參考分 ${reference} 與 Excel 正式分 ${currentScore} 不一致`});return}
      const options=levels.map(([target,targetScore])=>({target,targetScore,gain:targetScore-currentScore,need:Math.max(0,target-current)})).filter(o=>o.gain>0&&o.need>0);
      if(options.length)groups.push({category,current,currentScore,maxScore,unit,verb,options});else unavailable.push({category,reason:'未能由現有原始數據建立下一級門檻'});
    };
    add('培訓',x.T,officialScore(m,'training_score'),10,'次','增加',[[1,5],[2,10]],refs.training);
    add('1-2-1',x.O,officialScore(m,'one_to_one_score'),10,'次','增加',x.week>0?[[Math.floor(.5*x.week)+1,5],[Math.ceil(x.week),10]]:[],refs.oneToOne);
    add('引薦',x.G,officialScore(m,'referral_score'),20,'個','增加',x.week>0?[[ceilThreshold(.75,x.week),5],[ceilThreshold(1,x.week),10],[ceilThreshold(1.2,x.week),15],[ceilThreshold(1.5,x.week),20]]:[],refs.referral);
    add('生意額',x.B,officialScore(m,'biz_give_score'),15,'money','增加 Biz Give ',[[100000,5],[200000,10],[500000,15]],refs.biz);
    add('嘉賓',x.V,officialScore(m,'visitor_score'),20,'位','增加',x.week>0?[[ceilThreshold(.1,x.week),5],[ceilThreshold(.25,x.week),10],[ceilThreshold(.5,x.week),15],[ceilThreshold(.75,x.week),20]]:[],refs.visitor);
    return{x,refs,groups,unavailable};
  }
  function optionEffort(group,opt){return group.unit==='money'?opt.need/100000:opt.need}
  function lexicographicallyBefore(a,b){for(let i=0;i<a.length;i++){if(a[i]!==b[i])return a[i]<b[i]}return false}
  function greenPath(m){
    const total=Number(m.total_score)||0,sum=componentSum(m),gap=Math.max(0,GREEN_TARGET-total),built=buildGroups(m),dataIssues=[];
    if(sum!==total)dataIssues.push(`七項正式分數合計 ${sum} 分，與 Excel 總分 ${total} 分不一致`);
    if(dataIssues.length)return{...built,total,sum,gap,selected:[],projected:null,blocked:true,dataIssues};
    if(!gap)return{...built,total,sum,gap,selected:[],projected:total,blocked:false,dataIssues};
    const candidates=[];
    built.groups.forEach((g,gi)=>g.options.forEach(o=>candidates.push({g,gi,o,effort:optionEffort(g,o),opportunity:(g.maxScore-g.currentScore)/g.maxScore})));
    let best=null;const maxMask=1<<candidates.length;
    if(candidates.length<=18){for(let mask=1;mask<maxMask;mask++){let gain=0,effort=0,count=0,opportunity=0,used=new Set(),picked=[];for(let i=0;i<candidates.length;i++)if(mask&(1<<i)){const c=candidates[i];if(used.has(c.gi)){gain=-1;break}used.add(c.gi);gain+=c.o.gain;effort+=c.effort;opportunity+=c.opportunity;count++;picked.push(c)}if(gain<gap)continue;const rank=[gain-gap,count,effort,-opportunity];if(!best||lexicographicallyBefore(rank,best.rank))best={rank,picked}}}
    if(!best){const picked=[...candidates].sort((a,b)=>(b.o.gain/(b.effort||.01))-(a.o.gain/(a.effort||.01))||b.opportunity-a.opportunity);let gain=0;best={picked:[]};for(const c of picked){if(best.picked.some(x=>x.gi===c.gi))continue;best.picked.push(c);gain+=c.o.gain;if(gain>=gap)break}}
    const selected=best.picked.map(c=>({group:c.g,option:c.o})),selectedGain=selected.reduce((s,x)=>s+x.option.gain,0),projected=Math.min(100,total+selectedGain);
    if(selected.some(x=>x.option.gain!==x.option.targetScore-x.group.currentScore))dataIssues.push('其中一項加分幅度與正式分數門檻不一致');
    if(projected-total!==selectedGain)dataIssues.push('預計總分增幅與所選行動加分總和不一致');
    return{...built,total,sum,gap,selected,selectedGain,projected,blocked:dataIssues.length>0,dataIssues};
  }
  function optionText(group,opt){return `${group.verb}${fmt(opt.need,group.unit)}，由 ${group.currentScore} 分升至 ${opt.targetScore} 分，可增加 ${opt.gain} 分`}
  function selectedText(group,chosen){const opts=group.options.filter(o=>o.gain<=chosen.gain).slice(-2);return `${group.category}：${opts.map(o=>optionText(group,o)).join('／')}`}
  function alternativeText(group){return `${group.category}：${group.options.slice(0,2).map(o=>optionText(group,o)).join('／')}`}
  function precisePlan(m){
    const p=greenPath(m),selectedNames=new Set(p.selected.map(x=>x.group.category));
    const actions=p.blocked?[]:p.selected.map(({group,option})=>({category:group.category,gain:option.gain,need:option.need,current:group.current,target:option.target,currentScore:group.currentScore,targetScore:option.targetScore,unit:group.unit,verb:group.verb,text:selectedText(group,option),options:group.options}));
    const alternatives=p.groups.filter(g=>!selectedNames.has(g.category)).sort((a,b)=>((b.maxScore-b.currentScore)/b.maxScore)-((a.maxScore-a.currentScore)/a.maxScore)||optionEffort(a,a.options[0])-optionEffort(b,b.options[0])).map(g=>({category:g.category,text:alternativeText(g),currentScore:g.currentScore,maxScore:g.maxScore,options:g.options}));
    const strengths=scoreDefinitions.filter(d=>officialScore(m,d.key)>=d.max).map(d=>d.category);
    const watchouts=[];
    if(officialScore(m,'absence_score')<15)watchouts.push(`出席：現時 ${officialScore(m,'absence_score')}／15；避免新增缺席，分數按六個月滾動紀錄，以 Excel 為準。`);
    if(officialScore(m,'lateness_score')<10)watchouts.push(`準時：現時 ${officialScore(m,'lateness_score')}／10；避免新增遲到，分數按六個月滾動紀錄，以 Excel 為準。`);
    const activeUnderMax=scoreDefinitions.filter(d=>d.active&&officialScore(m,d.key)<d.max).map(d=>d.category),covered=new Set([...actions.map(a=>a.category),...alternatives.map(a=>a.category),...p.unavailable.map(a=>a.category)]),coverageMissing=activeUnderMax.filter(c=>!covered.has(c));
    const dataIssues=[...(p.dataIssues||[])];if(coverageMissing.length)dataIssues.push(`未能交代以下未滿分項目：${coverageMissing.join('、')}`);
    return{actions,alternatives,strengths,watchouts,unavailable:p.unavailable,metrics:p.x,missing:p.unavailable.map(x=>x.category),gap:p.gap,projected:dataIssues.length?null:p.projected,selected:p.selected,selectedGain:p.selectedGain||0,componentSum:p.sum,total:p.total,blocked:p.blocked||dataIssues.length>0,dataIssues};
  }
  function preciseTips(m){const p=precisePlan(m);if(p.blocked)return[`資料需要核對：${p.dataIssues.join('；')}。暫停顯示預計綠燈分數。`];if(!p.gap)return['目前已達70分綠燈門檻，請保持現有表現。'];if(!p.actions.length)return[`原始 Excel 欄位不足，未能精準計算綠燈路徑。缺少或不一致：${p.missing.join('、')||'可升級項目'}。`];return p.actions.map(a=>a.text)}
  function preciseRecap(m){const p=precisePlan(m),total=Number(m.total_score)||0;if(p.blocked)return `${m.member_name} 本月資料需要核對，暫停顯示預計綠燈分數。正式結果以 Excel 為準。`;if(!p.gap)return `${m.member_name} 本月 ${total} 分，已達綠燈門檻。正式得分及燈號以 Excel 為準。`;if(!p.selected.length)return `${m.member_name} 本月 ${total} 分。原始 Excel 資料不足，暫時無法產生精準綠燈路徑。`;return `${m.member_name} 本月 ${total} 分，需要增加 ${p.gap} 分達到綠燈。完成「綠燈行動建議」後，預計可達 ${p.projected} 分；其他加分方法屬備選，未計入此預計總分。正式結果以之後上載的 Excel 為準。`}
  function refreshMember(m){if(!m)return m;m.improvement_tips=preciseTips(m);m.recap_text=preciseRecap(m);m.performance_plan=precisePlan(m);return m}
  window.trafficMetrics=metrics;window.trafficRawObject=rawObject;window.precisePlan=precisePlan;window.makeTips=preciseTips;window.makeRecap=preciseRecap;window.trafficComponentSum=componentSum;
  const oldRenderAll=window.renderAll;if(typeof oldRenderAll==='function')window.renderAll=function(){if(typeof data!=='undefined'&&Array.isArray(data.members))data.members.forEach(refreshMember);return oldRenderAll.apply(this,arguments)};
  const oldShowMember=window.showMember;if(typeof oldShowMember==='function')window.showMember=function(m){return oldShowMember.call(this,refreshMember(m))};
  window.cardSummary=function(m){refreshMember(m);return{tips:m.improvement_tips||[],summary:m.recap_text||preciseRecap(m),plan:m.performance_plan||precisePlan(m)}};
  if(typeof data!=='undefined'&&Array.isArray(data.members))data.members.forEach(refreshMember);
})();