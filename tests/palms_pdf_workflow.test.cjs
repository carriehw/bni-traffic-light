const assert = require('node:assert/strict');
const workflow = require('../palms_pdf_workflow_v3.js');

const item = (str, x, y, width = Math.max(6, String(str).length * 5)) => ({
  str, transform: [1, 0, 0, 1, x, y], width
});

const header = [
  item('Bingo (Chinese)', 665, 492, 78),
  item('從:', 20, 436), item('2026/5/1', 423, 436, 42),
  item('至:', 20, 418), item('2026/5/31', 423, 418, 48),
  item('姓氏', 20, 398), item('名字', 110, 398),
  item('出席', 222, 398), item('缺席', 266, 398), item('遲到', 311, 398)
];

function memberItems(surname, given, y, values, options = {}) {
  const xs = [236, 281, 326, 369, 416, 462, 512, 563, 611, 661, 709, 754, 813];
  const result = [item(surname, 20, y), item(given, 110, y)];
  values.forEach((value, index) => {
    if (index === 11 && options.joinLargeBiz) {
      result.push(item(`${values[10]} ${value}.`, 709, y, 64));
      result.push(item('00', 762, y - 13.6, 12));
      result.splice(result.findIndex(entry => entry.str === String(values[10]) && entry.transform[4] === 709), 1);
    } else if (!(index === 10 && options.joinLargeBiz)) {
      result.push(item(String(value), xs[index], y));
    }
  });
  return result;
}

const mingus = memberItems(
  'Mingus 關永明', 'Kwan', 366,
  [4, 0, 0, 0, 0, 10, 3, 2, 3, 2, 9, 35118, 2]
);
const eric = memberItems(
  'Eric', 'Ho', 349,
  [2, 0, 0, 1, 0, 0, 0, 1, 2, 0, 2, 892670126, 1],
  { joinLargeBiz: true }
);

const report = workflow.parseTextPages([[...header, ...mingus, ...eric]], 'PALMS_2026-05.pdf');
assert.equal(report.period_start, '2026-05-01');
assert.equal(report.period_end, '2026-05-31');
assert.equal(report.members.length, 2);

const first = report.members.find(member => member.member_name === 'Mingus 關永明 Kwan');
assert.equal(first.total_score, 80);
assert.equal(first.light, 'green');
assert.deepEqual(
  [
    first.absence_score, first.lateness_score, first.referral_score,
    first.visitor_score, first.one_to_one_score, first.training_score, first.biz_give_score
  ],
  [15, 10, 20, 15, 10, 10, 0]
);

const second = report.members.find(member => member.member_name === 'Eric Ho');
assert.equal(second.raw_metrics['Biz Give'], 892670126);
assert.equal(second.biz_give_score, 15);
assert.equal(workflow.audit(report).errors.length, 0);

console.log('PALMS PDF parser and scoring tests passed.');
