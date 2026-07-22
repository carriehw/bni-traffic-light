(function(){
  'use strict';

  const MAX_SAFE_TARGET = 75;
  const n = v => {
    if (v === null || v === undefined || v === '') return null;
    const x = Number(String(v).replace(/[$,HKD\s]/gi,''));
    return Number.isFinite(x) ? x : null;
  };
  const nk = s => String(s || '').normalize('NFKC').toLowerCase().replace(/[\s_\-–—:：()（）/\\.]/g,'');
  const rawObject = m => {
    let r = m && m.raw_metrics;
    if (typeof r === 'string') { try { r = JSON.parse(r); } catch { r = {}; } }
    return r && typeof r === 'object' ? r : {};
  };
  function rawValue(m, aliases, exactOnly=false){
    const r = rawObject(m), entries = Object.entries(r);
    for (const a of aliases){
      const target=nk(a);
      const hit=entries.find(([k])=>nk(k)===target);
      if(hit){const value=n(hit[1]);if(value!==null)return value;}
    }
    if(exactOnly)return null;
    for(const a of aliases){
      const target=nk(a);
      const hit=entries.find(([k])=>{
        const key=nk(k);
        return !/(得分|score|totalpts|總分)/i.test(String(k)) && (key.startsWith(target)||key.includes(target));
      });
      if(hit){const value=n(hit[1]);if(value!==null)return value;}
    }
    return null;
  }
  function metrics(m){
    const P=rawValue(m,['P'],true),A=rawValue(m,['A','A缺席','缺席']),L=rawValue(m,['L','L遲到','遲到']),M=rawValue(m,['M'],true),S=rawValue(m,['S'],true);
    const explicitWeek=rawValue(m,['Week','週數','周數']);
    const parts=[P,A,L,M,S];
    const week=explicitWeek!==null?explicitWeek:(parts.every(v=>v!==null)?parts.reduce((a,b)=>a+b,0):null);
    return {
      P,A,L,M,S,week,
      G:rawValue(m,['G','G引薦','引薦']),
      V:rawValue(m,['V','V嘉賓','嘉賓']),
      O:rawValue(m,['1-2-1','121','一對一']),
      T:rawValue(m,['T','T培訓','培訓']),
      B:rawValue(m,['Biz Give','BizGive','生意額','生意'])
    };
  }
  const ceilThreshold = (rate,week)=>Math.ceil(rate*week-1e-10);
  const money = v => 'HK$'+Math.round(v).toLocaleString('en-HK');
  function addAction(list,{category,currentScore,targetScore,current,target,unit,verb}){
    const need=Math.max(0,target-current),gain=targetScore-currentScore;
    if(gain<=0||need<=0)return;
    list.push({
      category,gain,need,
      text:`${category}：目前 ${formatValue(current,unit)}（${currentScore}分）；${verb}${formatNeed(need,unit)}，達到 ${formatValue(target,unit)}，可升至 ${targetScore}分（+${gain}分），預計總分 ${Number(this.total||0)+gain}分。`
    });
  }
  function formatValue(v,unit){return unit==='money'?money(v):`${Math.round(v)}${unit}`}
  function formatNeed(v,unit){return unit==='money'?money(v):`${Math.round(v)}${unit}`}

  function precisePlan(m){
    const x=metrics(m), total=Number(m.total_score)||0, actions=[];
    const push=o=>{
      const need=Math.max(0,o.target-o.current),gain=o.targetScore-o.currentScore;
      if(gain<=0||need<=0)return;
      actions.push({category:o.category,gain,need,text:`${o.category}：目前 ${formatValue(o.current,o.unit)}（${o.currentScore}分）；${o.verb}${formatNeed(need,o.unit)}，達到 ${formatValue(o.target,o.unit)}，可升至 ${o.targetScore}分（+${gain}分），預計總分 ${total+gain}分。`});
    };
    if(x.week && x.week>0 && x.G!==null){
      const s=Number(m.referral_score)||0;
      const next=s<5?[.75,5]:s<10?[1,10]:s<15?[1.2,15]:s<20?[1.5,20]:null;
      if(next)push({category:'引薦',currentScore:s,targetScore:next[1],current:x.G,target:ceilThreshold(next[0],x.week),unit:'個',verb:'再提供'});
    }
    if(x.week && x.week>0 && x.V!==null){
      const s=Number(m.visitor_score)||0;
      const next=s<5?[.1,5]:s<10?[.25,10]:s<15?[.5,15]:s<20?[.75,20]:null;
      if(next)push({category:'嘉賓',currentScore:s,targetScore:next[1],current:x.V,target:ceilThreshold(next[0],x.week),unit:'位',verb:'再邀請'});
    }
    if(x.week && x.week>0 && x.O!==null){
      const s=Number(m.one_to_one_score)||0;
      let target=null,targetScore=null;
      if(s<5){target=Math.floor(.5*x.week)+1;targetScore=5;} else if(s<10){target=Math.ceil(x.week);targetScore=10;}
      if(target!==null)push({category:'1-2-1',currentScore:s,targetScore,current:x.O,target,unit:'次',verb:'再完成'});
    }
    if(x.T!==null){
      const s=Number(m.training_score)||0;
      if(s<5)push({category:'培訓',currentScore:s,targetScore:5,current:x.T,target:1,unit:'次',verb:'再完成'});
      else if(s<10)push({category:'培訓',currentScore:s,targetScore:10,current:x.T,target:2,unit:'次',verb:'再完成'});
    }
    if(x.B!==null){
      const s=Number(m.biz_give_score)||0;
      const next=s<5?[100000,5]:s<10?[200000,10]:s<15?[500000,15]:null;
      if(next)push({category:'生意額',currentScore:s,targetScore:next[1],current:x.B,target:next[0],unit:'money',verb:'再增加 Biz Give '});
    }
    actions.sort((a,b)=>b.gain-a.gain||a.need-b.need);
    const missing=[];
    if(!x.week||x.G===null)missing.push('引薦');
    if(!x.week||x.V===null)missing.push('嘉賓');
    if(!x.week||x.O===null)missing.push('1-2-1');
    if(x.T===null)missing.push('培訓');
    if(x.B===null)missing.push('生意額');
    return {actions,metrics:x,missing};
  }

  function preciseTips(m){
    const p=precisePlan(m), tips=p.actions.slice(0,3).map(a=>a.text);
    if(!tips.length){
      if((Number(m.total_score)||0)>=MAX_SAFE_TARGET)return ['目前已達75分安全目標；保持現有表現，正式分數仍以每月 Excel 為準。'];
      return [`原始 Excel 欄位不足，未能精準計算加分方案。缺少：${p.missing.join('、')||'可升級項目'}。`];
    }
    return tips;
  }
  function preciseRecap(m){
    const p=precisePlan(m), total=Number(m.total_score)||0;
    if(total>=MAX_SAFE_TARGET)return `${m.member_name} 本月 ${total} 分，已達75分安全目標。正式得分及燈號以 Excel 為準。`;
    let projected=total, chosen=[];
    for(const a of p.actions){if(chosen.length>=3||projected>=MAX_SAFE_TARGET)break;chosen.push(a.category);projected+=a.gain;}
    if(!chosen.length)return `${m.member_name} 本月 ${total} 分。原始 Excel 資料不足，暫時無法產生精準升分預測。`;
    return `${m.member_name} 本月 ${total} 分。按現有原始數據，優先處理${chosen.join('、')}，逐項達標後預計可到 ${projected} 分。各項建議按門檻獨立計算，正式結果以之後上載的 Excel 為準。`;
  }
  function refreshMember(m){if(!m)return m;m.improvement_tips=preciseTips(m);m.recap_text=preciseRecap(m);return m;}

  window.precisePlan=precisePlan;
  window.makeTips=preciseTips;
  window.makeRecap=preciseRecap;

  const oldRenderAll=window.renderAll;
  if(typeof oldRenderAll==='function')window.renderAll=function(){if(window.data&&Array.isArray(data.members))data.members.forEach(refreshMember);return oldRenderAll.apply(this,arguments)};
  const oldShowMember=window.showMember;
  if(typeof oldShowMember==='function')window.showMember=function(m){return oldShowMember.call(this,refreshMember(m))};
  window.cardSummary=function(m){refreshMember(m);const tips=(m.improvement_tips||[]).slice(0,3);return{tips,summary:m.recap_text||preciseRecap(m)}};

  if(window.data&&Array.isArray(data.members))data.members.forEach(refreshMember);
})();
