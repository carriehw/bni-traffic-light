(function(){
  'use strict';
  const previous=window.drawMemberCardV2;
  const safe=n=>Number(n)||0;
  const lightLabel=l=>({green:'綠燈',yellow:'黃燈',red:'紅燈',black:'黑燈'})[l]||l;
  const lightColor=l=>l==='green'?'#27934a':l==='yellow'?'#e1b322':l==='red'?'#e31b36':'#57575f';
  const rows=m=>[['培訓',m.training_score,10],['出席',m.absence_score,15],['準時',m.lateness_score,10],['1-2-1',m.one_to_one_score,10],['引薦',m.referral_score,20],['生意額',m.biz_give_score,15],['嘉賓',m.visitor_score,20]];
  function wrap(ctx,text,maxWidth){const lines=[];let line='';for(const ch of String(text||'')){const test=line+ch;if(line&&ctx.measureText(test).width>maxWidth){lines.push(line);line=ch}else line=test}if(line)lines.push(line);return lines}
  function drawBlocked(m,canvas,plan){
    const w=1080,h=1320;canvas.width=w;canvas.height=h;const ctx=canvas.getContext('2d');
    ctx.fillStyle='#f8f4f6';ctx.fillRect(0,0,w,h);ctx.fillStyle='#fff';ctx.fillRect(48,48,w-96,h-96);ctx.fillStyle='#761538';ctx.fillRect(48,48,w-96,112);
    ctx.fillStyle='#fff';ctx.font='700 38px sans-serif';ctx.fillText('BNI BINGO 會員月度表現',92,117);
    ctx.fillStyle='#211b1e';ctx.font='700 46px sans-serif';ctx.fillText(String(m.member_name||''),92,230);
    ctx.fillStyle=lightColor(m.light);ctx.beginPath();ctx.arc(190,385,100,0,Math.PI*2);ctx.fill();ctx.fillStyle=m.light==='yellow'?'#514000':'#fff';ctx.textAlign='center';ctx.font='800 74px sans-serif';ctx.fillText(String(safe(m.total_score)),190,410);ctx.font='700 27px sans-serif';ctx.fillText(lightLabel(m.light),190,456);ctx.textAlign='left';
    ctx.fillStyle='#211b1e';ctx.font='700 30px sans-serif';ctx.fillText('Excel 正式分數',360,305);ctx.font='24px sans-serif';rows(m).forEach((r,i)=>ctx.fillText(`${r[0]}：${safe(r[1])}／${r[2]}`,360,360+i*46));
    ctx.fillStyle='#8b1125';ctx.font='700 32px sans-serif';ctx.fillText('資料需核對',92,710);ctx.fillStyle='#fff0f3';ctx.fillRect(82,742,916,260);ctx.fillStyle='#7f1028';ctx.font='700 24px sans-serif';ctx.fillText('暫停顯示加分建議及預計分數',108,792);ctx.font='20px sans-serif';let y=836;const issues=plan.dataIssues?.length?plan.dataIssues:['資料未通過邏輯檢查。'];for(const issue of issues){for(const line of wrap(ctx,`• ${issue}`,820)){ctx.fillText(line,108,y);y+=30}}
    ctx.fillStyle='#211b1e';ctx.font='20px sans-serif';ctx.fillText('請由LT核對原始Excel、七項正式分數及總分後重新發布。',92,1065);
    ctx.strokeStyle='#e5d9df';ctx.beginPath();ctx.moveTo(92,h-70);ctx.lineTo(988,h-70);ctx.stroke();ctx.fillStyle='#766d72';ctx.font='20px sans-serif';ctx.fillText('BNI BINGO Chapter · Traffic Light Performance Platform',92,h-30);
  }
  window.drawMemberCardV2=function(m,canvas){const plan=typeof window.precisePlan==='function'?window.precisePlan(m):null;if(plan?.blocked)return drawBlocked(m,canvas,plan);return previous(m,canvas)};
})();