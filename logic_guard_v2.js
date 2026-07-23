(function(){
  'use strict';
  const $=id=>document.getElementById(id);
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const safe=n=>Number(n)||0;
  const lightLabel=l=>({green:'綠燈',yellow:'黃燈',red:'紅燈',black:'黑燈'})[l]||l;
  const lightColor=l=>l==='green'?'#27934a':l==='yellow'?'#e1b322':l==='red'?'#e31b36':'#57575f';
  const metricRows=m=>[['培訓',m.training_score,10],['出席',m.absence_score,15],['準時',m.lateness_score,10],['1-2-1',m.one_to_one_score,10],['引薦',m.referral_score,20],['生意額',m.biz_give_score,15],['嘉賓',m.visitor_score,20]];
  const getPlan=m=>typeof window.precisePlan==='function'?window.precisePlan(m):{actions:[],alternatives:[],strengths:[],watchouts:[],unavailable:[],dataIssues:['改善引擎未載入'],blocked:true,gap:Math.max(0,70-safe(m.total_score)),projected:null};

  function renderPlan(m){
    const detail=$('detail');if(!detail||!m)return;
    const plan=getPlan(m),headings=[...detail.querySelectorAll('h3')],heading=headings.find(h=>/(改善建議|優先加分行動|綠燈行動建議|資料核對提示)/.test(h.textContent.trim()));
    if(!heading)return;
    const existing=detail.querySelector('.performance-plan'),next=heading.nextElementSibling;
    if(existing)existing.remove();else if(next&&(next.matches('ul.tips,.tips-block')))next.remove();
    heading.textContent=plan.blocked?'資料核對提示':'綠燈行動建議';
    const panel=document.createElement('div');panel.className='performance-plan logic-guard-plan';
    if(plan.blocked){
      const issues=plan.dataIssues?.length?plan.dataIssues:['資料不一致，暫停顯示預計綠燈分數。'];
      panel.innerHTML=`<div class="logic-data-error"><b>暫停顯示預計分數</b><p>以下資料未通過邏輯檢查，請由LT核對Excel及原始數據：</p>${issues.map(x=>`<div>• ${esc(x)}</div>`).join('')}</div>${renderUnavailable(plan)}`;
    }else{
      const summary=plan.gap?`目前 ${safe(m.total_score)} 分｜距離綠燈尚差 ${plan.gap} 分｜完成本方案預計 ${plan.projected} 分`:'目前已達70分綠燈門檻';
      const actions=plan.actions?.length?plan.actions.map((a,i)=>`<article class="green-action-card"><span class="green-action-number">${i+1}</span><div><div class="green-action-title"><b>${esc(a.category)}</b><span class="action-target">本方案採用 +${a.gain}分</span></div><p>${esc(a.text.replace(`${a.category}：`,''))}</p></div></article>`).join(''):'<div class="green-complete">已達綠燈，請保持目前表現。</div>';
      const alternatives=plan.alternatives?.length?`<section class="performance-subsection"><h4>其他加分方法</h4><p class="performance-note">以下全部屬備選，未計入預計總分。</p>${plan.alternatives.map(a=>`<div class="alternative-action"><b>${esc(a.category)}</b><br>${esc(a.text.replace(`${a.category}：`,''))}</div>`).join('')}</section>`:'';
      const strengths=plan.strengths?.length?`<section class="performance-subsection"><h4>已達滿分</h4><div class="strength-chips">${plan.strengths.map(s=>`<span>${esc(s)}</span>`).join('')}</div></section>`:'';
      const watchouts=plan.watchouts?.length?`<section class="performance-subsection"><h4>需留意</h4>${plan.watchouts.map(s=>`<div class="watchout-item">${esc(s)}</div>`).join('')}</section>`:'';
      panel.innerHTML=`<div class="green-path-summary ${plan.gap?'pending':'complete'}">${esc(summary)}</div><div class="green-actions">${actions}</div>${alternatives}${renderUnavailable(plan)}${strengths}${watchouts}`;
    }
    heading.insertAdjacentElement('afterend',panel);
  }
  function renderUnavailable(plan){return plan.unavailable?.length?`<section class="performance-subsection logic-unavailable"><h4>資料需核對</h4><p class="performance-note">以下未滿分項目無法安全計算，平台不會猜測。</p>${plan.unavailable.map(a=>`<div class="watchout-item"><b>${esc(a.category)}</b>：${esc(a.reason)}</div>`).join('')}</section>`:''}

  function wrap(ctx,text,maxWidth){const lines=[];for(const para of String(text||'').split('\n')){let line='';for(const ch of para){const test=line+ch;if(line&&ctx.measureText(test).width>maxWidth){lines.push(line);line=ch}else line=test}if(line)lines.push(line)}return lines}
  function drawLines(ctx,text,x,y,maxWidth,lineHeight,maxLines=99){const lines=wrap(ctx,text,maxWidth).slice(0,maxLines);for(const line of lines){ctx.fillText(line,x,y);y+=lineHeight}return y}
  function fit(ctx,text,maxWidth,start=50,min=28){let size=start;while(size>min){ctx.font=`700 ${size}px sans-serif`;if(ctx.measureText(text).width<=maxWidth)break;size-=2}return size}
  function estimateLines(ctx,text,maxWidth){return Math.max(1,wrap(ctx,text,maxWidth).length)}

  function drawStrictCard(m,canvas){
    const plan=getPlan(m),w=1080,maxWidth=860,measure=document.createElement('canvas').getContext('2d');measure.font='20px sans-serif';
    let contentLines=(plan.actions||[]).reduce((n,a)=>n+Math.min(2,estimateLines(measure,a.text,maxWidth)),0)+(plan.alternatives||[]).reduce((n,a)=>n+Math.min(2,estimateLines(measure,a.text,maxWidth)),0)+(plan.unavailable||[]).reduce((n,a)=>n+Math.min(2,estimateLines(measure,`${a.category}：${a.reason}`,maxWidth)),0)+(plan.dataIssues||[]).reduce((n,a)=>n+Math.min(2,estimateLines(measure,a,maxWidth)),0);
    const h=Math.max(1600,1280+contentLines*31+(plan.strengths?.length?70:0)+(plan.watchouts?.length?90:0));canvas.width=w;canvas.height=h;const ctx=canvas.getContext('2d');
    ctx.fillStyle='#f8f4f6';ctx.fillRect(0,0,w,h);ctx.fillStyle='#fff';ctx.fillRect(48,48,w-96,h-96);ctx.fillStyle='#761538';ctx.fillRect(48,48,w-96,112);ctx.fillStyle='#fff';ctx.font='700 38px sans-serif';ctx.fillText('BNI BINGO 會員月度表現',92,117);
    ctx.fillStyle='#211b1e';ctx.font=`700 ${fit(ctx,String(m.member_name||''),860)}px sans-serif`;ctx.fillText(String(m.member_name||''),92,235);
    ctx.fillStyle=lightColor(m.light);ctx.beginPath();ctx.arc(190,390,104,0,Math.PI*2);ctx.fill();ctx.fillStyle=m.light==='yellow'?'#514000':'#fff';ctx.textAlign='center';ctx.font='800 78px sans-serif';ctx.fillText(String(safe(m.total_score)),190,418);ctx.font='700 28px sans-serif';ctx.fillText(lightLabel(m.light),190,466);ctx.textAlign='left';
    ctx.fillStyle='#211b1e';ctx.font='700 30px sans-serif';ctx.fillText('Excel 正式分數',360,310);ctx.font='24px sans-serif';metricRows(m).forEach((r,i)=>ctx.fillText(`${r[0]}：${safe(r[1])}／${r[2]}`,360,365+i*48));
    let y=735;ctx.fillStyle='#761538';ctx.font='700 32px sans-serif';ctx.fillText(plan.blocked?'資料核對提示':'綠燈行動建議',92,y);y+=45;
    if(plan.blocked){ctx.fillStyle='#8b1125';ctx.font='700 23px sans-serif';ctx.fillText('資料未通過邏輯檢查，暫停顯示預計分數。',92,y);y+=38;ctx.fillStyle='#211b1e';ctx.font='19px sans-serif';for(const issue of plan.dataIssues||[]){y=drawLines(ctx,`• ${issue}`,92,y,maxWidth,27,2)+6}}
    else{ctx.fillStyle=plan.gap?'#725600':'#176b32';ctx.font='700 23px sans-serif';ctx.fillText(plan.gap?`目前 ${safe(m.total_score)} 分｜尚差 ${plan.gap} 分｜本方案預計 ${plan.projected} 分`:'目前已達70分綠燈門檻',92,y);y+=42;ctx.fillStyle='#211b1e';ctx.font='19px sans-serif';if(plan.actions?.length){for(let i=0;i<plan.actions.length;i++){const a=plan.actions[i];y=drawLines(ctx,`${i+1}.【本方案 +${a.gain}分】${a.text}`,92,y,maxWidth,27,2)+7}}else{ctx.fillText('保持現有表現，繼續鞏固本月優勢。',92,y);y+=36}}
    if(plan.alternatives?.length){ctx.fillStyle='#761538';ctx.font='700 24px sans-serif';ctx.fillText('其他加分方法（備選）',92,y+8);y+=43;ctx.fillStyle='#211b1e';ctx.font='18px sans-serif';for(const a of plan.alternatives){y=drawLines(ctx,`• ${a.text}`,92,y,maxWidth,25,2)+5}}
    if(plan.unavailable?.length){ctx.fillStyle='#8b1125';ctx.font='700 24px sans-serif';ctx.fillText('資料需核對',92,y+8);y+=43;ctx.fillStyle='#6f2437';ctx.font='18px sans-serif';for(const a of plan.unavailable){y=drawLines(ctx,`• ${a.category}：${a.reason}`,92,y,maxWidth,25,2)+5}}
    if(plan.strengths?.length){ctx.fillStyle='#761538';ctx.font='700 24px sans-serif';ctx.fillText('已達滿分',92,y+8);y+=42;ctx.fillStyle='#211b1e';ctx.font='20px sans-serif';y=drawLines(ctx,plan.strengths.join('・'),92,y,maxWidth,28,2)+6}
    if(plan.watchouts?.length){ctx.fillStyle='#761538';ctx.font='700 24px sans-serif';ctx.fillText('需留意',92,y+8);y+=42;ctx.fillStyle='#725600';ctx.font='18px sans-serif';for(const item of plan.watchouts){y=drawLines(ctx,`• ${item}`,92,y,maxWidth,25,2)+5}}
    const recapY=Math.max(y+20,h-220);ctx.fillStyle='#761538';ctx.font='700 26px sans-serif';ctx.fillText('本月回顧',92,recapY);ctx.fillStyle='#211b1e';ctx.font='19px sans-serif';drawLines(ctx,m.recap_text||`本月總分 ${safe(m.total_score)} 分。`,92,recapY+34,maxWidth,26,3);
    ctx.strokeStyle='#e5d9df';ctx.beginPath();ctx.moveTo(92,h-70);ctx.lineTo(988,h-70);ctx.stroke();ctx.fillStyle='#766d72';ctx.font='20px sans-serif';ctx.fillText('BNI BINGO Chapter · Traffic Light Performance Platform',92,h-30);
  }
  window.drawMemberCardV2=drawStrictCard;

  function install(){const old=window.showMember;if(typeof old==='function'&&!old.__logicGuardWrapped){const wrapped=function(m){const out=old.apply(this,arguments);setTimeout(()=>renderPlan(m),20);return out};wrapped.__logicGuardWrapped=true;window.showMember=wrapped}if(window.currentMember)setTimeout(()=>renderPlan(window.currentMember),20)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();setTimeout(install,500);
})();