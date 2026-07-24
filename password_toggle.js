(function(){
  'use strict';
  function installPasswordToggle(){
    const input=document.getElementById('password');
    if(!input||document.getElementById('togglePassword')||document.getElementById('passwordToggle'))return;

    const wrap=document.createElement('div');
    wrap.className='password-field-wrap';
    input.parentNode.insertBefore(wrap,input);
    wrap.appendChild(input);

    const button=document.createElement('button');
    button.id='passwordToggle';
    button.type='button';
    button.className='password-toggle';
    button.setAttribute('aria-label','顯示密碼');
    button.setAttribute('aria-pressed','false');
    button.innerHTML='<span aria-hidden="true">👁</span><span class="password-toggle-text">顯示</span>';
    wrap.appendChild(button);

    button.addEventListener('click',()=>{
      const showing=input.type==='text';
      input.type=showing?'password':'text';
      button.setAttribute('aria-label',showing?'顯示密碼':'隱藏密碼');
      button.setAttribute('aria-pressed',String(!showing));
      button.querySelector('.password-toggle-text').textContent=showing?'顯示':'隱藏';
      input.focus();
      try{input.setSelectionRange(input.value.length,input.value.length)}catch{}
    });
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',installPasswordToggle);
  else installPasswordToggle();
  setTimeout(installPasswordToggle,0);
})();
