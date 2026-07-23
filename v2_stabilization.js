(function(){
  'use strict';

  const $ = id => document.getElementById(id);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const safe = n => Number(n) || 0;
  const lightLabel = l => ({green:'綠燈',yellow:'黃燈',red:'紅燈',black:'黑燈'})[l] || l;
  const lightColor = l => l==='green'?'#27934a':l==='yellow'?'#e1b322':l==='red'?'#e31b36':'#57575f';

  function normalizePasswordToggle(){
    const input = $('password');
    if(!input) return;
    const candidates = [...document.querySelectorAll('#togglePassword,#passwordToggle,.password-toggle')];
    let keep = candidates.find(x => x.id === 'togglePassword') || candidates[0];
    candidates.forEach(x => { if(x !== keep) x.remove(); });
    if(!keep){
      keep = document.createElement('button');
      keep.id='togglePassword'; keep.type='button'; keep.className='password-toggle';
      input.insertAdjacentElement('afterend',keep);
    }
    keep.textContent='顯示';
    keep.setAttribute('aria-label','顯示密碼');
    keep.onclick=()=>{
      const show=input.type==='password';
      input.type=show?'text':'password';
      keep.textContent=show?'隱藏':'顯示';
      keep.setAttribute('aria-label',show?'隱藏密碼':'顯示密碼');
      input.focus();
    };
  }

  function metricRows(m){
    return [
      ['培訓',m.training_score,10],['出席',m.absence_score,15],['準時',m.lateness_score,10],
      ['1-2-1',m.one_to_one_score,10],['引薦',m.referral_score,20],['生意額',m.biz_give_score,15],['嘉賓',m.visitor_score,20]
    ];
  }

  function wrapText(ctx,text,maxWidth){
    const out=[];
    for(const para of String(text||'').split('\n')){
      let line='';
      for(const ch of para){
        const test=line+ch;
        if(line && ctx.measureText(test).width>maxWidth){out.push(line);line=ch}else line=test;
      }
      if(line)out.push(line);
    }
    return out;
  }

  function drawMemberCard(m,canvas){
    const w=1080,h=1440; canvas.width=w; canvas.height=h;
    const ctx=canvas.getContext('2d');
    ctx.fillStyle='#f8f4f6'; ctx.fillRect(0,0,w,h);
    ctx.fillStyle='#fff'; ctx.fillRect(48,48,w-96,h-96);
    ctx.fillStyle='#761538'; ctx.fillRect(48,48,w-96,112);
    ctx.fillStyle='#fff'; ctx.font='700 38px sans-serif'; ctx.fillText('BNI BINGO 會員月度表現',92,117);
    ctx.fillStyle='#211b1e'; ctx.font='700 52px sans-serif'; ctx.fillText(String(m.member_name||''),92,235);
    ctx.fillStyle=lightColor(m.light); ctx.beginPath(); ctx.arc(190,390,104,0,Math.PI*2); ctx.fill();
    ctx.fillStyle=m.light==='yellow'?'#514000':'#fff'; ctx.textAlign='center'; ctx.font='800 78px sans-serif'; ctx.fillText(String(safe(m.total_score)),190,418); ctx.font='700 28px sans-serif'; ctx.fillText(lightLabel(m.light),190,466); ctx.textAlign='left';
    ctx.fillStyle='#211b1e'; ctx.font='700 30px sans-serif'; ctx.fillText('Excel 正式分數',360,310);
    ctx.font='24px sans-serif';
    metricRows(m).forEach((r,i)=>ctx.fillText(`${r[0]}：${safe(r[1])}／${r[2]}`,360,365+i*48));
    const tips=(m.improvement_tips||[]).slice(0,3);
    ctx.fillStyle='#761538'; ctx.font='700 32px sans-serif'; ctx.fillText('優先加分行動',92,760);
    ctx.fillStyle='#211b1e'; ctx.font='25px sans-serif';
    let y=815;
    (tips.length?tips:['保持現有表現，持續建立高質素引薦及合作習慣。']).forEach((t,i)=>{
      const lines=wrapText(ctx,`${i+1}. ${t}`,860);
      lines.forEach(line=>{ctx.fillText(line,92,y);y+=38;}); y+=14;
    });
    ctx.fillStyle='#761538'; ctx.font='700 32px sans-serif'; ctx.fillText('本月回顧',92,1080);
    ctx.fillStyle='#211b1e'; ctx.font='24px sans-serif';
    wrapText(ctx,m.recap_text||`本月總分 ${safe(m.total_score)} 分。`,860).slice(0,5).forEach((line,i)=>ctx.fillText(line,92,1130+i*38));
    ctx.strokeStyle='#e5d9df'; ctx.beginPath(); ctx.moveTo(92,1325); ctx.lineTo(988,1325); ctx.stroke();
    ctx.fillStyle='#766d72'; ctx.font='20px sans-serif'; ctx.fillText('BNI BINGO Chapter · Traffic Light Performance Platform',92,1372);
  }

  function addMemberCard(m){
    const detail=$('detail'); if(!detail||!m) return;
    detail.querySelector('.member-share-section')?.remove();
    const section=document.createElement('section');
    section.className='member-share-section';
    section.innerHTML=`<div class="member-share-heading"><div><h3>會員分享圖</h3><p>內容使用 Excel 正式分數；改善建議屬參考資料。</p></div><button type="button" class="btn" id="downloadMemberCardV2">下載 PNG</button></div><canvas id="memberCardV2" class="member-card-canvas-v2" aria-label="${esc(m.member_name)} 會員分數圖"></canvas>`;
    detail.appendChild(section);
    const canvas=$('memberCardV2'); drawMemberCard(m,canvas);
    $('downloadMemberCardV2').onclick=()=>{
      const a=document.createElement('a');
      a.href=canvas.toDataURL('image/png');
      a.download=String(m.member_name||'member').replace(/[\\/:*?"<>|]/g,'_')+'-traffic-light.png';
      a.click();
    };
  }

  function installMemberCardHook(){
    const old=window.showMember;
    if(typeof old!=='function' || old.__v2Wrapped) return;
    const wrapped=function(m){
      const out=old.apply(this,arguments);
      setTimeout(()=>addMemberCard(m),0);
      return out;
    };
    wrapped.__v2Wrapped=true;
    window.showMember=wrapped;
  }

  function stabilize(){
    normalizePasswordToggle();
    installMemberCardHook();
    document.documentElement.classList.add('v2-stable');
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',stabilize); else stabilize();
  setTimeout(stabilize,250);
})();
