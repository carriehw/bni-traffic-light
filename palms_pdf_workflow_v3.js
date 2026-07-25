(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.PalmsPdfWorkflow = api;
  if (root && root.document) {
    const start = () => api.install().catch(error => console.error('PALMS PDF setup failed', error));
    if (root.document.readyState === 'loading') root.document.addEventListener('DOMContentLoaded', start);
    else setTimeout(start, 0);
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const PDFJS_VERSION = '6.1.200';
  const PDFJS_URL = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${PDFJS_VERSION}/build/pdf.min.mjs`;
  const PDFJS_WORKER_URL = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${PDFJS_VERSION}/build/pdf.worker.min.mjs`;
  const COLUMN_BOUNDS = [218, 264, 309, 353, 390, 427, 477, 528, 576, 646, 675, 733, 790, 835];
  const RAW_KEYS = [
    'present', 'absence', 'late', 'medical', 'substitute',
    'referral_given_internal', 'referral_given_external',
    'referral_received_internal', 'referral_received_external',
    'visitors', 'one_to_one', 'biz_give', 'training'
  ];
  const SCORE_KEYS = [
    'training_score', 'absence_score', 'lateness_score', 'one_to_one_score',
    'referral_score', 'biz_give_score', 'visitor_score'
  ];
  const EXCLUDED_NAMES = new Set(['來賓', 'BNI', '總數']);

  const clean = value => String(value ?? '').normalize('NFKC').replace(/\s+/g, ' ').trim();
  const nameKey = value => clean(value).toLowerCase().replace(/[\s_\-–—:：()（）/\\.]/g, '');
  const numberText = value => String(value ?? '').replace(/[\s,$]/g, '');
  const number = value => {
    const parsed = Number(numberText(value));
    return Number.isFinite(parsed) ? parsed : null;
  };
  const round = value => Math.round((value + Number.EPSILON) * 100) / 100;
  const officialLight = score => score >= 70 ? 'green' : score >= 50 ? 'yellow' : score >= 30 ? 'red' : 'black';
  const lightName = light => ({ green: '綠燈', yellow: '黃燈', red: '紅燈', black: '黑燈' })[light] || light;
  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[char]);

  function monthPeriod(start, end) {
    const normalizeDate = value => {
      const match = clean(value).match(/(20\d{2})[\/.-](\d{1,2})[\/.-](\d{1,2})/);
      if (!match) return '';
      return `${match[1]}-${String(match[2]).padStart(2, '0')}-${String(match[3]).padStart(2, '0')}`;
    };
    const periodStart = normalizeDate(start);
    const periodEnd = normalizeDate(end);
    if (!periodStart || !periodEnd || periodStart.slice(0, 7) !== periodEnd.slice(0, 7)) {
      throw new Error('PDF「從／至」月份格式不正確。');
    }
    const [year, month] = periodStart.split('-').map(Number);
    const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
    const expectedStart = `${year}-${String(month).padStart(2, '0')}-01`;
    const expectedEnd = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    if (periodStart !== expectedStart || periodEnd !== expectedEnd) {
      throw new Error('PALMS PDF必須涵蓋同一月份第一日至最後一日。');
    }
    return { period_start: periodStart, period_end: periodEnd };
  }

  function groupLines(items) {
    const lines = [];
    for (const item of items || []) {
      const str = String(item.str ?? '');
      if (!str.trim()) continue;
      const transform = item.transform || [];
      const x = Number(transform[4]);
      const y = Number(transform[5]);
      if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
      let line = lines.find(candidate => Math.abs(candidate.y - y) <= 1.5);
      if (!line) {
        line = { y, items: [] };
        lines.push(line);
      }
      line.items.push({ str, x, y, width: Number(item.width) || 0 });
    }
    lines.forEach(line => line.items.sort((a, b) => a.x - b.x));
    return lines.sort((a, b) => b.y - a.y);
  }

  function joined(line, minX = -Infinity, maxX = Infinity) {
    return clean((line?.items || []).filter(item => item.x >= minX && item.x < maxX).map(item => item.str).join(' '));
  }

  function metadataFromPage(lines) {
    const all = lines.map(line => joined(line)).join('\n');
    const chapter = all.match(/Bingo\s*\(Chinese\)/i)?.[0] || '';
    const dates = [...all.matchAll(/20\d{2}[\/.-]\d{1,2}[\/.-]\d{1,2}/g)].map(match => match[0]);
    if (!chapter) throw new Error('呢份PDF唔係 Bingo (Chinese) PALMS報告。');
    if (dates.length < 2) throw new Error('PDF內找不到完整「從／至」日期。');
    return { chapter, ...monthPeriod(dates.at(-2), dates.at(-1)) };
  }

  function columnIndex(x) {
    for (let index = 0; index < COLUMN_BOUNDS.length - 1; index++) {
      if (x >= COLUMN_BOUNDS[index] && x < COLUMN_BOUNDS[index + 1]) return index;
    }
    return -1;
  }

  function itemColumn(item) {
    if (item.x >= 700 && item.x < 790 && item.width > 20) return 11;
    return columnIndex(item.x);
  }

  function rowBaselines(lines) {
    const header = lines.find(line => joined(line, 0, 100) === '姓氏');
    const headerY = header?.y ?? Infinity;
    return lines
      .filter(line => {
        const surname = joined(line, 0, 100);
        const hasNumber = line.items.some(item => itemColumn(item) >= 0);
        return line.y < headerY - 3 && surname && !['姓氏', '分會', '從', '至', '營運使用者', '參數'].includes(surname) && hasNumber;
      })
      .map(line => line.y);
  }

  function continuationFor(lines, baseline, column) {
    const lower = lines.find(line => line.y < baseline - 2 && baseline - line.y <= 16);
    if (!lower) return '';
    return lower.items
      .filter(item => itemColumn(item) === column && /^[\d.,]+$/.test(item.str.trim()))
      .map(item => item.str.trim())
      .join('');
  }

  function numericParts(line, column) {
    const parts = [];
    for (const item of line.items) {
      const value = item.str.trim();
      const joinedBiz = value.match(/^(\d+)\s+([\d.,]+)$/);
      if (joinedBiz && item.x >= 675 && item.x < 733) {
        if (column === 10) parts.push(joinedBiz[1]);
        if (column === 11) parts.push(joinedBiz[2]);
        continue;
      }
      if (itemColumn(item) === column && /^[\d.,]+$/.test(value)) parts.push(value);
    }
    return parts;
  }

  function parseRows(lines) {
    const rows = [];
    const seenBaselines = new Set();
    for (const baseline of rowBaselines(lines)) {
      const marker = baseline.toFixed(1);
      if (seenBaselines.has(marker)) continue;
      seenBaselines.add(marker);
      const line = lines.find(candidate => Math.abs(candidate.y - baseline) <= 1.5);
      const surname = joined(line, 0, 100);
      if (EXCLUDED_NAMES.has(surname)) continue;
      const given = joined(line, 100, 218).replace(/\(Cheeno\)/gi, '').trim();
      if (!given) continue;
      const memberName = clean(`${surname} ${given}`);
      const raw = {};
      for (let column = 0; column < RAW_KEYS.length; column++) {
        const parts = numericParts(line, column);
        let text = parts.join('');
        if (column === 11) text += continuationFor(lines, baseline, column);
        const value = number(text);
        if (value === null) throw new Error(`${memberName}：${RAW_KEYS[column]} 讀取失敗。`);
        raw[RAW_KEYS[column]] = value;
      }
      rows.push({ member_name: memberName, raw });
    }
    return rows;
  }

  function scoreMember(row) {
    const raw = row.raw;
    const weeks = raw.present + raw.absence + raw.late + raw.medical + raw.substitute;
    if (!Number.isInteger(weeks) || weeks < 1) throw new Error(`${row.member_name}：會議週數必須大於0。`);
    const referralCount = raw.referral_given_internal + raw.referral_given_external;
    const referralRate = referralCount / weeks;
    const visitorRate = raw.visitors / weeks;
    const oneToOneRate = raw.one_to_one / weeks;
    const member = {
      member_name: row.member_name,
      weeks,
      training_score: raw.training >= 2 ? 10 : raw.training >= 1 ? 5 : 0,
      absence_score: raw.absence > 2 ? 0 : raw.absence === 2 ? 5 : raw.absence === 1 ? 10 : 15,
      lateness_score: raw.late >= 2 ? 0 : raw.late === 1 ? 5 : 10,
      one_to_one_score: oneToOneRate >= 1 ? 10 : oneToOneRate > 0.5 ? 5 : 0,
      referral_score: referralRate >= 1.5 ? 20 : referralRate >= 1.2 ? 15 : referralRate >= 1 ? 10 : referralRate >= 0.75 ? 5 : 0,
      biz_give_score: raw.biz_give >= 500000 ? 15 : raw.biz_give >= 200000 ? 10 : raw.biz_give >= 100000 ? 5 : 0,
      visitor_score: visitorRate >= 0.75 ? 20 : visitorRate >= 0.5 ? 15 : visitorRate >= 0.25 ? 10 : visitorRate >= 0.1 ? 5 : 0,
      raw_metrics: {
        P: raw.present, A: raw.absence, L: raw.late, M: raw.medical, S: raw.substitute,
        G: referralCount, RGI: raw.referral_given_internal, RGO: raw.referral_given_external,
        RRI: raw.referral_received_internal, RRO: raw.referral_received_external,
        V: raw.visitors, '1-2-1': raw.one_to_one, T: raw.training,
        'Biz Give': raw.biz_give, Week: weeks,
        referral_rate: round(referralRate), visitor_rate: round(visitorRate), one_to_one_rate: round(oneToOneRate)
      }
    };
    member.total_score = SCORE_KEYS.reduce((sum, key) => sum + member[key], 0);
    member.light = officialLight(member.total_score);
    return member;
  }

  function parseTextPages(pages, filename = 'PALMS.pdf') {
    if (!Array.isArray(pages) || pages.length < 1) throw new Error('PDF沒有可讀頁面。');
    const linePages = pages.map(groupLines);
    const metadata = metadataFromPage(linePages[0]);
    const parsedRows = linePages.flatMap(parseRows);
    if (!parsedRows.length) throw new Error('PDF內找不到會員資料。');
    const names = new Set();
    for (const row of parsedRows) {
      const key = nameKey(row.member_name);
      if (names.has(key)) throw new Error(`重複會員姓名：${row.member_name}`);
      names.add(key);
    }
    const members = parsedRows.map(scoreMember);
    return {
      period_start: metadata.period_start,
      period_end: metadata.period_end,
      source_filename: filename,
      members,
      chapter: metadata.chapter
    };
  }

  async function pdfToPages(file) {
    const pdfjs = await import(PDFJS_URL);
    pdfjs.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_URL;
    const task = pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) });
    const document = await task.promise;
    if (document.numPages < 1 || document.numPages > 20) throw new Error('PDF頁數唔符合PALMS月報格式。');
    const pages = [];
    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber++) {
      const page = await document.getPage(pageNumber);
      const content = await page.getTextContent();
      pages.push(content.items.map(item => ({
        str: item.str,
        transform: item.transform,
        width: item.width
      })));
    }
    await task.destroy();
    return pages;
  }

  function audit(report) {
    const errors = [];
    const warnings = [];
    const seen = new Set();
    for (const member of report.members || []) {
      const key = nameKey(member.member_name);
      if (!key) errors.push('發現空白會員姓名。');
      if (seen.has(key)) errors.push(`重複會員姓名：${member.member_name}`);
      seen.add(key);
      const sum = SCORE_KEYS.reduce((total, field) => total + Number(member[field]), 0);
      if (sum !== member.total_score) errors.push(`${member.member_name}：七項合計同總分唔一致。`);
      if (member.light !== officialLight(member.total_score)) errors.push(`${member.member_name}：燈號同總分唔一致。`);
      if (member.raw_metrics['Biz Give'] >= 10000000) {
        warnings.push(`${member.member_name}：交易價值 ${Number(member.raw_metrics['Biz Give']).toLocaleString('en-HK')}，請LT核對大額紀錄。`);
      }
    }
    if ((report.members || []).length < 20) warnings.push('會員數目少於20位，請確認PDF完整。');
    return { errors, warnings };
  }

  function preview(report, warnings) {
    const counts = { green: 0, yellow: 0, red: 0, black: 0 };
    report.members.forEach(member => counts[member.light]++);
    const rows = report.members.map(member => `<tr>
      <td>${escapeHtml(member.member_name)}</td><td>${member.total_score}</td><td>${lightName(member.light)}</td>
      <td>${member.absence_score}</td><td>${member.lateness_score}</td><td>${member.referral_score}</td>
      <td>${member.visitor_score}</td><td>${member.one_to_one_score}</td><td>${member.training_score}</td>
      <td>${member.biz_give_score}</td>
    </tr>`).join('');
    return `<div class="notice ok"><strong>PDF檢查完成</strong><br>
      ${report.period_end.slice(0, 7)} · ${report.members.length}位會員 ·
      綠${counts.green}／黃${counts.yellow}／紅${counts.red}／黑${counts.black}</div>
      ${warnings.length ? `<div class="notice error"><strong>發布前請核對</strong><br>${warnings.map(escapeHtml).join('<br>')}</div>` : ''}
      <div class="table-wrap"><table><thead><tr>
        <th>會員</th><th>總分</th><th>燈號</th><th>出席</th><th>準時</th>
        <th>引薦</th><th>嘉賓</th><th>1-2-1</th><th>培訓</th><th>生意額</th>
      </tr></thead><tbody>${rows}</tbody></table></div>`;
  }

  function csv(report) {
    const headers = ['月份', '會員', '總分', '燈號', '出席分', '準時分', '引薦分', '嘉賓分', '1-2-1分', '培訓分', '生意額分'];
    const lines = report.members.map(member => [
      report.period_end.slice(0, 7), member.member_name, member.total_score, lightName(member.light),
      member.absence_score, member.lateness_score, member.referral_score, member.visitor_score,
      member.one_to_one_score, member.training_score, member.biz_give_score
    ]);
    const quote = value => `"${String(value).replace(/"/g, '""')}"`;
    return '\ufeff' + [headers, ...lines].map(row => row.map(quote).join(',')).join('\n');
  }

  async function install() {
    const $ = id => document.getElementById(id);
    const originalInput = $('file');
    if (!originalInput || originalInput.dataset.palmsPdfInstalled === '1') return;
    const input = originalInput.cloneNode(true);
    input.dataset.palmsPdfInstalled = '1';
    input.accept = '.pdf,application/pdf';
    originalInput.replaceWith(input);
    const heading = input.closest('.card')?.querySelector('h2');
    if (heading) heading.textContent = '上載及檢查 PALMS PDF';
    const hint = input.closest('.drop')?.querySelector('p');
    if (hint) hint.textContent = '請上載每月「分會 - PALMS摘要報告」PDF。正式分數會按已確認規則計算。';
    const firstStep = document.querySelector('.upload-steps span:first-child');
    if (firstStep) firstStep.lastChild.textContent = '選擇 PDF';

    let currentReport = null;
    let replacement = false;
    const oldPublish = $('publishBtn');
    const publishButton = oldPublish.cloneNode(true);
    oldPublish.replaceWith(publishButton);
    const oldReset = $('resetBtn');
    const resetButton = oldReset.cloneNode(true);
    oldReset.replaceWith(resetButton);
    const oldDownload = $('downloadCsvBtn');
    const downloadButton = oldDownload.cloneNode(true);
    oldDownload.replaceWith(downloadButton);

    input.onchange = async event => {
      const file = event.target.files?.[0];
      if (!file) return;
      currentReport = null;
      publishButton.classList.add('hide');
      downloadButton.classList.add('hide');
      resetButton.classList.remove('hide');
      const result = $('checkResult');
      result.innerHTML = '<div class="notice info">正在讀取PALMS PDF及計算分數…</div>';
      try {
        if (!/\.pdf$/i.test(file.name) && file.type !== 'application/pdf') throw new Error('請選擇PALMS PDF檔案。');
        const pages = await pdfToPages(file);
        const report = parseTextPages(pages, file.name);
        const review = audit(report);
        if (review.errors.length) throw new Error(review.errors.join('\n'));
        currentReport = report;
        replacement = Array.isArray(data?.batches) && data.batches.some(batch => batch.period_end === report.period_end);
        result.innerHTML = preview(report, review.warnings);
        const monthInput = $('reportMonthV2');
        if (monthInput) {
          monthInput.value = report.period_end.slice(0, 7);
          monthInput.disabled = true;
        }
        const monthBox = $('monthConfirmV2');
        if (monthBox) monthBox.classList.remove('hide');
        const modeBox = $('publishMode');
        if (modeBox) {
          modeBox.classList.remove('hide');
          modeBox.className = replacement ? 'mode-box notice error' : 'mode-box notice ok';
          modeBox.innerHTML = replacement
            ? `<strong>${report.period_end.slice(0, 7)}已存在</strong><br>發布會取代該月份現有資料，其他月份唔受影響。`
            : `<strong>新增${report.period_end.slice(0, 7)}</strong><br>確認後會寫入${report.members.length}位會員Profile。`;
        }
        publishButton.textContent = replacement ? '確認取代月份資料' : '確認發布';
        publishButton.classList.remove('hide');
        downloadButton.classList.remove('hide');
      } catch (error) {
        result.innerHTML = `<div class="notice error">${escapeHtml(error.message).replace(/\n/g, '<br>')}</div>`;
      }
    };

    publishButton.onclick = async () => {
      if (!currentReport) return;
      if (replacement && !confirm(`確認取代${currentReport.period_end.slice(0, 7)}現有資料？`)) return;
      publishButton.disabled = true;
      publishButton.textContent = '發布中…';
      try {
        await api('publish', { report: currentReport, replace_existing: replacement });
        data = await api('history');
        renderAll();
        $('memberTab')?.click();
        $('checkResult').innerHTML = `<div class="notice ok"><strong>${currentReport.period_end.slice(0, 7)}發布完成</strong><br>${currentReport.members.length}位會員Profile已更新。</div>`;
        publishButton.classList.add('hide');
        downloadButton.classList.add('hide');
        input.value = '';
      } catch (error) {
        $('checkResult').innerHTML = `<div class="notice error">${escapeHtml(error.message)}</div>`;
      } finally {
        publishButton.disabled = false;
        publishButton.textContent = replacement ? '確認取代月份資料' : '確認發布';
      }
    };

    resetButton.onclick = () => location.reload();
    downloadButton.onclick = () => {
      if (!currentReport) return;
      const blob = new Blob([csv(currentReport)], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `PALMS核對_${currentReport.period_end.slice(0, 7)}.csv`;
      anchor.click();
      URL.revokeObjectURL(url);
    };
  }

  return {
    parseTextPages,
    scoreMember,
    audit,
    officialLight,
    nameKey,
    install,
    version: '20260725a'
  };
});
