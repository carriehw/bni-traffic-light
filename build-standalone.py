# -*- coding: utf-8 -*-
"""將 index.html 內嘅 SheetJS 外部引用內嵌,產生單一檔案 bni-traffic-light-standalone.html。
用法:python build-standalone.py"""
import os
os.chdir(os.path.dirname(os.path.abspath(__file__)))

with open('index.html','r',encoding='utf-8') as f:
    html=f.read()
with open('vendor_xlsx.full.min.js','r',encoding='utf-8') as f:
    js=f.read()

needle='<script src="vendor_xlsx.full.min.js"></script>'
assert needle in html, '搵唔到 SheetJS 引用行,index.html 可能改咗結構。'
# 避免 </script> 提早結束
js_safe=js.replace('</script>','<\\/script>')
html2=html.replace(needle, '<script>/* SheetJS inlined */\n'+js_safe+'\n</script>')
# 標題加註「單一檔案版」
html2=html2.replace('· Phase 1</div>','· Phase 1 · 單一檔案版</div>')

out='bni-traffic-light-standalone.html'
with open(out,'w',encoding='utf-8') as f:
    f.write(html2)
print(f'OK -> {out}  ({len(html2)/1024:.0f} KB)')
