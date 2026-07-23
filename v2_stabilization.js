(function(){
  'use strict';
  const $=id=>document.getElementById(id);
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const safe=n=>Number(n)||0;
  const lightLabel=l=>({green:'綠燈',yellow:'黃燈',red:'紅燈',black:'黑燈'})[l]||l;
  const lightColor=l=>l==='green'?'#27934a':l==='yellow'?'#e1b322':l==='red'?'#e31b36':'#57575f';
  function normalizePasswordToggle(){const input=$('password');if(!input)return;const candidates=[...document.querySelectorAll('#togglePassword,#passwordToggle,.password-toggle')];let keep=candidates.find(x=>x.id==='togglePassword')||candidates[0];candidates.forEach(x=>{if(x!==keep)x.remove()});if(!keep){keep=document.createElement('button');keep.id='togglePassword';keep.type='button';keep.className='password-toggle';input.insertAdjacentElement('afterend',keep)}keep.textContent='顯示';keep.setAttribute('aria-label','顯示密碼');keep.onclick=()=>{const show=input.type==='password';input.type=show?'text':'password';keep.textContent=show?'隱藏':'顯示';keep.setAttribute('aria-label',show?'隱藏密碼':'顯示密碼');input.focus()}}
  function metricRows(m){return[['培訓',m.training_score,10],['出席',m.absence_score,15],['準時',m.lateness_score,10],['1-2-1',m.one_to_one_score,10],['引薦',m.referral_score,20],['生意額',m.biz_give_score,15],['嘉賓',m.visitor_score,20]]}
  function getPlan(m){return typeof window.precisePlan==='function'?window.precisePlan(m):{actions:[],alternatives:[],strengths:[],watchouts:[],gap:Math.max(0,70-safe(m.total_score)),projected:safe(m.total_score)}}
  function wrapText(ctx,text,maxWidth){const out=[];for(const para of String(text||'').split('\n')){let line='';for(const ch of para){const test=line+ch;if(line&&ctx.measureText(test).width>maxWidth){out.push(line);line=ch}else line=test}if(line)out.push(line)}return out}
  function fitText(ctx,text,maxWidth,start=52,min=30){let size=start;while(size>min){ctx.font=`700 ${size}px sans-serif`;if(ctx.measureText(text).width<=maxWidth)break;size-=2}return size}
  function drawLines(ctx,text,x,y,maxWidth,lineHeight,maxLines){const lines=wrapText(ctx,text,maxWidth).slice(0,maxLines);lines.forEach(line=>{ctx.fillText(line,x,y);y+=lineHeight});return{y,count:lines.length}}
  function drawMemberCard(m,canvas){
    const w=1080,h=1440;canvas.width=w;canvas.height=h;const ctx=canvas.getContext('2d'),plan=getPlan(m);
    ctx.fillStyle='#f8f4f6';ctx.fillRect(0,0,w,h);ctx.fillStyle='#fff';ctx.fillRect(48,48,w-96,h-96);ctx.fillStyle='#761538';ctx.fillRect(48,48,w-96,112);
    ctx.fillStyle='#fff';ctx.font='700 38px sans-serif';ctx.fillText('BNI BINGO 會員月度表現',92,117);
    ctx.fillStyle='#211b1e';fitText(ctx,String(m.member_name||''),860);ctx.fillText(String(m.member_name||''),92,235);
    ctx.fillStyle=lightColor(m.light);ctx.beginPath();ctx.arc(190,390,104,0,Math.PI*2);ctx.fill();ctx.fillStyle=m.light==='yellow'?'#514000':'#fff';ctx.textAlign='center';ctx.font='800 78px sans-serif';ctx.fillText(String(safe(m.total_score)),190,418);ctx.font='700 28px sans-serif';ctx.fillText(lightLabel(m.light),190,466);ctx.textAlign='left';
    ctx.fillStyle='#211b1e';ctx.font='700 30px sans-serif';ctx.fillText('Excel 正式分數',360,310);ctx.font='24px sans-serif';metricRows(m).forEach((r,i)=>ctx.fillText(`${r[0]}：${safe(r[1])}／${r[2]}`,360,365+i*48));
    ctx.fillStyle='#761538';ctx.font='700 32px sans-serif';ctx.fillText('綠燈行動建議',92,735);
    ctx.fillStyle=plan.gap?'#725600':'#176b32';ctx.font='700 24px sans-serif';ctx.fillText(plan.gap?`目前 ${safe(m.total_score)} 分｜距離綠燈尚差 ${plan.gap} 分`:`目前已達70分綠燈門檻`,92,780);
    ctx.fillStyle='#211b1e';ctx.font='22px sans-serif';let y=825,lineBudget=5;
    if(plan.actions?.length){for(let i=0;i<Math.min(3,plan.actions.length)&&lineBudget>0;i++){const a=plan.actions[i],maxLines=Math.min(2,lineBudget),r=drawLines(ctx,`${i+1}.【本方案 +${a.gain}分】${a.text}`,92,y,860,31,maxLines);lineBudget-=r.count;y=r.y+9}}else{const r=drawLines(ctx,'保持現有表現，繼續鞏固本月優勢。',92,y,860,31,2);y=r.y+8}
    let sectionY=y+5;
    if(plan.strengths?.length&&sectionY<1090){ctx.fillStyle='#761538';ctx.font='700 26px sans-serif';ctx.fillText('已達滿分',92,sectionY);sectionY+=36;ctx.fillStyle='#211b1e';ctx.font='22px sans-serif';const r=drawLines(ctx,plan.strengths.join('・'),92,sectionY,860,29,2);sectionY=r.y+8}
    if(plan.alternatives?.length&&sectionY<1200){ctx.fillStyle='#761538';ctx.font='700 26px sans-serif';ctx.fillText('其他加分方法（備選）',92,sectionY);sectionY+=36;ctx.fillStyle='#211b1e';ctx.font='20px sans-serif';const maxAlt=sectionY>1120?1:2;for(const a of plan.alternatives.slice(0,maxAlt)){const r=drawLines(ctx,`• ${a.text}`,92,sectionY,860,27,2);sectionY=r.y+5}}
    const recapY=Math.min(1270,Math.max(1235,sectionY+12));ctx.fillStyle='#761538';ctx.font='700 27px sans-serif';ctx.fillText('本月回顧',92,recapY);ctx.fillStyle='#211b1e';ctx.font='20px sans-serif';drawLines(ctx,m.recap_text||`本月總分 ${safe(m.total_score)} 分。`,92,recapY+35,860,27,2);
    ctx.strokeStyle='#e5d9df';ctx.beginPath();ctx.moveTo(92,1370);ctx.lineTo(988,1370);ctx.stroke();ctx.fillStyle='#766d72';ctx.font='20px sans-serif';ctx.fillText('BNI BINGO Chapter · Traffic Light Performance Platform',92,1410);
  }
  window.drawMemberCardV2=drawMemberCard;
  function enhanceMemberDetail(m){
    const detail=$('detail');if(!detail||!m)return;const plan=getPlan(m);const headings=[...detail.querySelectorAll('h3')];const oldHeading=headings.find(h=>h.textContent.trim()==='改善建議');if(!oldHeading)return;const oldList=oldHeading.nextElementSibling;oldHeading.textContent='綠燈行動建議';
    const panel=document.createElement('div');panel.className='performance-plan';
    const summary=plan.gap?`目前 ${safe(m.total_score)} 分｜距離綠燈尚差 ${plan.gap} 分`:`目前已達70分綠燈門檻`;
    const actionHtml=plan.actions?.length?plan.actions.map((a,i)=>`<div class="green-action-card"><span class="green-action-number">${i+1}</span><div><div class="green-action-title"><b>${esc(a.category)}</b><span class="action-target">本方案採用 +${a.gain}分</span></div><p>${esc(a.text.replace(`${a.category}：`,''))}</p></div></div>`).join(''):`<div class="green-complete">已達綠燈，請保持目前表現。</div>`;
    const alternatives=plan.alternatives?.length?`<div class="performance-subsection"><h4>其他加分方法</h4><p class="performance-note">以下屬備選，未計入預計總分。</p>${plan.alternatives.slice(0,3).map(a=>`<div class="alternative-action">${esc(a.text)}</div>`).join('')}</div>`:'';
    const strengths=plan.strengths?.length?`<div class="performance-subsection"><h4>已達滿分</h4><div class="strength-chips">${plan.strengths.map(s=>`<span>${esc(s)}</span>`).join('')}</div></div>`:'';
    const watchouts=plan.watchouts?.length?`<div class="performance-subsection"><h4>需留意</h4>${plan.watchouts.map(s=>`<div class="watchout-item">${esc(s)}</div>`).join('')}</div>`:'';
    panel.innerHTML=`<div class="green-path-summary ${plan.gap?'pending':'complete'}">${esc(summary)}</div><div class="green-actions">${actionHtml}</div>${alternatives}${strengths}${watchouts}`;
    if(oldList&&oldList.tagName==='UL')oldList.replaceWith(panel);else oldHeading.insertAdjacentElement('afterend',panel);
  }
  function addMemberCard(m){const detail=$('detail');if(!detail||!m)return;detail.querySelector('.member-share-section')?.remove();const section=document.createElement('section');section.className='member-share-section';section.innerHTML=`<div class="member-share-heading"><div><h3>會員分享圖</h3><p>Excel分數屬正式資料；行動建議按會員表現及綠燈門檻計算。</p></div><button type="button" class="btn" id="downloadMemberCardV2">下載 PNG</button></div><canvas id="memberCardV2" class="member-card-canvas-v2" aria-label="${esc(m.member_name)} 會員分數圖"></canvas>`;detail.appendChild(section);const canvas=$('memberCardV2');drawMemberCard(m,canvas);$('downloadMemberCardV2').onclick=()=>{const a=document.createElement('a');a.href=canvas.toDataURL('image/png');a.download=String(m.member_name||'member').replace(/[\/:*?"<>|]/g,'_')+'-traffic-light.png';a.click()}}
  function installMemberCardHook(){const old=window.showMember;if(typeof old!=='function'||old.__v2Wrapped)return;const wrapped=function(m){const out=old.apply(this,arguments);setTimeout(()=>{enhanceMemberDetail(m);addMemberCard(m)},0);return out};wrapped.__v2Wrapped=true;window.showMember=wrapped}
  function stabilize(){normalizePasswordToggle();installMemberCardHook();document.documentElement.classList.add('v2-stable')}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',stabilize);else stabilize();setTimeout(stabilize,250);
})();